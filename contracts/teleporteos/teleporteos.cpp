#include <teleporteos.hpp>

using namespace tstarter;

teleporteos::teleporteos(name s, name code, datastream<const char *> ds) : contract(s, code, ds),
//                                                                           _deposits(get_self(), get_self().value),
                                                                           _oracles(get_self(), get_self().value),
                                                                           _receipts(get_self(), get_self().value),
                                                                           _teleports(get_self(), get_self().value),
                                                                           _cancels(get_self(), get_self().value) {}

void teleporteos::init( name admin_account, uint32_t threshold ) {
    settings_singleton _settings_table( get_self(), get_self().value );

    require_auth(get_self());

    bool settings_exists = _settings_table.exists();

    check( !settings_exists, "settings already defined" );
    check( is_account( admin_account ), "admin account does not exist");
    check( threshold > 0, "threshold must be positive" );

    _settings_table.set(
        settings{
            .admin_account = admin_account,
            .threshold = threshold,
            .enabled = false,
            },
            get_self());
}

void teleporteos::enable() {
    settings_singleton settings_table(get_self(), get_self().value);
    check(settings_table.exists(), "contract not initialised");
    auto settings = settings_table.get();

    require_auth( settings.admin_account );

    settings.enabled = true;
    settings_table.set(settings, get_self());
}

void teleporteos::disable() {
    settings_singleton settings_table(get_self(), get_self().value);
    check(settings_table.exists(), "contract not initialised");
    auto settings = settings_table.get();

    require_auth( settings.admin_account );

    settings.enabled = false;
    settings_table.set(settings, get_self());
}

void teleporteos::setthreshold( uint32_t threshold ) {
    settings_singleton settings_table(get_self(), get_self().value);
    check(settings_table.exists(), "contract not initialised");
    auto settings = settings_table.get();

    require_auth( settings.admin_account );

    settings.threshold = threshold;
    settings_table.set(settings, get_self());
}

/* Notifications for START transfer */
void teleporteos::transfer(name from, name to, asset quantity, string memo) {
    auto settings = get_settings();

    // allow maintenance when bridge disabled
    if (from == get_self() || from == "eosio.ram"_n || from == "eosio.stake"_n || from == "eosio.rex"_n) return;

    // check bridge
    check( settings.enabled, "bridge disabled");

    // check token
    tokens_table _tokens_table( get_self(), get_self().value );

    auto token_contract = get_first_receiver();
    auto _token = _tokens_table.get( quantity.symbol.code().raw(), "token not found" );
    check(to == get_self(), "contract not involved in transfer");
    check(token_contract == _token.token.get_contract(),"incorrect token contract");
    check(quantity.symbol == _token.token.get_symbol(), "correct token contract, but wrong symbol");
    check(quantity >= _token.min_quantity, "sent quantity is less than required min quantity");

    deposits_table _deposits(get_self(), from.value);
    auto deposit = _deposits.find(quantity.symbol.code().raw());
    if (deposit == _deposits.end()){
        _deposits.emplace(get_self(), [&](auto &d){
            d.token_contract = token_contract;
            d.balance = quantity;
        });
    }
    else {
        _deposits.modify(deposit, get_self(), [&](auto &d){
            d.balance += quantity;
        });
    }
}

void teleporteos::withdraw(name account, asset quantity) {
    require_auth(account);

    deposits_table _deposits(get_self(), account.value);
    auto deposit = _deposits.find(quantity.symbol.code().raw());
    check(deposit != _deposits.end(), "Deposit not found, please transfer the tokens first");
    check(deposit->balance >= quantity, "Withdraw amount exceeds deposit");

    auto token_contract = deposit->token_contract;

    if (deposit->balance == quantity){
        _deposits.erase(deposit);
    }
    else {
        _deposits.modify(*deposit, same_payer, [&](auto &d){
            d.balance -= quantity;
        });
    }

    string memo = "Return of deposit";
    action(
        permission_level{get_self(), "active"_n},
        token_contract, "transfer"_n,
        make_tuple(get_self(), account, quantity, memo)
    ).send();
}

void teleporteos::teleport(name from, asset quantity, uint8_t chain_id, checksum256 eth_address) {
    settings_singleton settings_table(get_self(), get_self().value);
    check(settings_table.exists(), "contract not initialised");
    auto settings = settings_table.get();

    require_auth(from);

    check(quantity.is_valid(), "Amount is not valid");
    check(quantity.amount > 0, "Amount cannot be negative");
    check(quantity.symbol.is_valid(), "Invalid symbol name");
    check(quantity.amount >= 100'0000, "Transfer is below minimum of 100 START"); // TODO get minimum from table

    deposits_table _deposits(get_self(), from.value);
    auto deposit = _deposits.find(quantity.symbol.code().raw());
    check(deposit != _deposits.end(), "Deposit not found, please transfer the tokens first");
    check(deposit->balance >= quantity, "Not enough deposited");

    // tokens owned by this contract are inaccessible so just remove the deposit record
    if (deposit->balance == quantity){
        _deposits.erase(deposit);
    }
    else {
        _deposits.modify(*deposit, same_payer, [&](auto &d){
            d.balance -= quantity;
        });
    }

    auto token_contract = deposit->token_contract;
    settings.last_teleport_id += 1;
    uint64_t next_teleport_id = settings.last_teleport_id;
    settings_table.set(settings, get_self());
    uint32_t now = current_time_point().sec_since_epoch();
    _teleports.emplace(from, [&](auto &t){
        t.id = next_teleport_id;
        t.time = now;
        t.account = from;
        t.token_contract = token_contract;
        t.quantity = quantity;
        t.chain_id = chain_id;
        t.eth_address = eth_address;
        t.claimed = false;
    });

    action(
        permission_level{get_self(), "active"_n},
        get_self(), "logteleport"_n,
        make_tuple(next_teleport_id, now, from, quantity, chain_id, eth_address)
    ).send();
}

/* Cancels a teleport after 30 days and no claim */
void teleporteos::cancel(uint64_t id) {
    auto teleport = _teleports.find(id);
    check(teleport != _teleports.end(), "Teleport not found");

    require_auth(teleport->account);
    check(!teleport->claimed, "Teleport is already claimed");

    /* wait 32 days to give time to mark as claimed */
    uint32_t thirty_two_days = 60 * 60 * 24 * 32;
    uint32_t now = current_time_point().sec_since_epoch();
    check((teleport->time + thirty_two_days) < now, "Teleport has not expired");

    // Refund the teleport and mark it as cancelled
    auto existing = _cancels.find(id);
    check(existing == _cancels.end(), "Teleport has already been cancelled");

    _cancels.emplace(teleport->account, [&](auto &c){
        c.teleport_id = id;
    });

    string memo = "Cancel teleport";
    action(
        permission_level{get_self(), "active"_n},
        teleport->token_contract, "transfer"_n,
        make_tuple(get_self(), teleport->account, teleport->quantity, memo)
    ).send();
}

void teleporteos::logteleport(uint64_t id, uint32_t timestamp, name from, asset quantity, uint8_t chain_id, checksum256 eth_address) {
    // Logs the teleport id for the oracle to listen to
    require_auth(get_self());
}

void teleporteos::sign(name oracle_name, uint64_t id, string signature) {
    // Signs receipt of tokens, these signatures must be passed to the eth blockchain
    // in the claim function on the eth contract
    require_oracle(oracle_name);

    auto teleport = _teleports.find(id);
    check(teleport != _teleports.end(), "Teleport not found");

    auto find_res = std::find(teleport->oracles.begin(), teleport->oracles.end(), oracle_name);
    check(find_res == teleport->oracles.end(), "Oracle has already signed");

    _teleports.modify(*teleport, get_self(), [&](auto &t){
        t.oracles.push_back(oracle_name);
        t.signatures.push_back(signature);
    });
}

void teleporteos::received(name oracle_name, name to, checksum256 ref, asset quantity, uint8_t chain_id, bool confirmed) {
    auto settings = get_settings();

    require_oracle(oracle_name);

    auto ref_ind = _receipts.get_index<"byref"_n>();
    auto receipt = ref_ind.find(ref);

    check(quantity.amount > 0, "Quantity cannot be negative");
    check(quantity.is_valid(), "Asset not valid");

    if (receipt == ref_ind.end()) {

        tokens_table _tokens( get_self(), get_self().value );
        auto token = _tokens.find( quantity.symbol.code().raw() );
        check( token != _tokens.end(), "token not found");
        auto token_contract = token->token.get_contract();

        _receipts.emplace(get_self(), [&](auto &r){
            r.id = _receipts.available_primary_key();
            r.date = current_time_point();
            r.ref = ref;
            r.chain_id = chain_id;
            r.to = to;
            r.token_contract = token_contract;
            r.quantity = quantity;

            vector<name> approvers;
            if (confirmed){
                r.confirmations = 1;
                approvers.push_back(oracle_name);
            }
            r.approvers = approvers;

        });
    }
    else {
        if (confirmed){
            check(!receipt->completed, "This teleport has already completed");

            check(receipt->quantity == quantity, "Quantity mismatch");
            check(receipt->to == to, "Account mismatch");
            auto existing = find (receipt->approvers.begin(), receipt->approvers.end(), oracle_name);
            check (existing == receipt->approvers.end(), "Oracle has already approved");
            bool completed = false;

            if (receipt->confirmations >= settings.threshold - 1) { // check for one less because of this confirmation
                string memo = "Teleport";
                action(
                    permission_level{get_self(), "active"_n},
                    receipt->token_contract, "transfer"_n,
                    make_tuple(get_self(), to, quantity, memo)
                ).send();

                completed = true;
            }

            _receipts.modify(*receipt, get_self(), [&](auto &r){
                r.confirmations = receipt->confirmations + 1;
                r.approvers.push_back(oracle_name);
                r.completed = completed;
            });
        }
        else {
            check(false, "Another oracle has already registered teleport");
        }
    }
}

/*
 * Marks a teleport as claimed
 */
void teleporteos::claimed(name oracle_name, uint64_t id, checksum256 to_eth, asset quantity) {
    require_oracle(oracle_name);

    auto teleport = _teleports.find(id);
    check(teleport != _teleports.end(), "Teleport not found");

    check(teleport->quantity == quantity, "Quantity mismatch");
    check(teleport->eth_address == to_eth, "Account mismatch");
    check(!teleport->claimed, "Already marked as claimed");

    _teleports.modify(*teleport, same_payer, [&](auto &t){
        t.claimed = true;
    });
}

void teleporteos::regoracle(name oracle_name) {
    auto settings = get_settings();
    require_auth( settings.admin_account );

    check(is_account(oracle_name), "Oracle account does not exist");

    _oracles.emplace(get_self(), [&](auto &o){
        o.account = oracle_name;
    });
}

void teleporteos::unregoracle(name oracle_name) {
    auto settings = get_settings();
    require_auth( settings.admin_account );

    auto oracle = _oracles.find(oracle_name.value);
    check(oracle != _oracles.end(), "Oracle does not exist");

    _oracles.erase(oracle);
}


void teleporteos::delreceipts() {
    auto settings = get_settings();
    require_auth( settings.admin_account );

    auto receipt = _receipts.begin();
    while (receipt != _receipts.end()) {
       receipt = _receipts.erase(receipt);
    }
}

void teleporteos::delteles() {
    auto settings = get_settings();
    require_auth( settings.admin_account );

    auto tp = _teleports.begin();
    while (tp != _teleports.end()) {
        tp = _teleports.erase(tp);
    }
}

/* Private */

void teleporteos::require_oracle(name account) {
    require_auth(account);
    _oracles.get(account.value, "Account is not an oracle");
}


teleporteos::settings teleporteos::get_settings() {
    settings_singleton settings_table(get_self(), get_self().value);
    check(settings_table.exists(), "contract not initialised");
    return settings_table.get();
}

void teleporteos::addtoken( const extended_symbol &token_symbol, const asset &min_quantity, bool enabled ) {
    auto settings = get_settings();
    require_auth( settings.admin_account );

    // check token not already added
    tokens_table _tokens( get_self(), get_self().value );
    check( _tokens.find( token_symbol.get_symbol().raw() ) == _tokens.end(), "token already exists");

    _tokens.emplace( get_self(), [&]( auto& row ) {
        row.token = token_symbol;
        row.min_quantity = min_quantity;
        row.enabled = enabled;
    });
}

void teleporteos::updatetoken( const extended_symbol &token_symbol, const asset &min_quantity, const bool &enabled ) {
    auto settings = get_settings();
    require_auth( settings.admin_account );

    // find token entry
    tokens_table _tokens( get_self(), get_self().value );
    auto token = _tokens.find( token_symbol.get_symbol().code().raw() );
    check( token != _tokens.end(), "token not found");

    _tokens.modify(token, get_self(), [&](auto &s) {
        s.enabled = enabled;
        s.min_quantity = min_quantity;
    });
}

void teleporteos::addremote( const extended_symbol &token_symbol, const uint32_t &chain_id, const string &token_contract ) {
    auto settings = get_settings();
    require_auth( settings.admin_account );

    // find token entry
    tokens_table _tokens( get_self(), get_self().value );
    auto token = _tokens.find( token_symbol.get_symbol().code().raw() );
    check( token != _tokens.end(), "token not found");

    _tokens.modify(token, get_self(), [&](auto &s) {
        s.remote_contracts[chain_id] = token_contract;
    });
}
