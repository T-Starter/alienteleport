#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <eosio/transaction.hpp>
#include <eosio/singleton.hpp>
#include <math.h>

using namespace eosio;
using namespace std;

namespace tstarter {
    class [[eosio::contract("teleporteos")]] teleporteos : public contract {
      private:

        /* bridge settings */
        struct [[eosio::table("settings")]] settings {
            name admin_account;
            bool enabled = false;
            uint32_t threshold = 3;
            uint64_t last_teleport_id;
            uint64_t last_receipts_id;
        };
        typedef eosio::singleton<"settings"_n, settings> settings_singleton;

        struct [[eosio::table("settings2")]] settings2 {
            name admin_account;
            bool enabled = false;
            uint32_t threshold = 3;
            uint64_t last_teleport_id;
            uint64_t last_receipts_id;
        };
        typedef eosio::singleton<"settings2"_n, settings2> settings2_singleton;

        /* supported tokens */
        struct [[eosio::table("tokens")]] tokens_item {
            extended_symbol token;
            asset min_quantity;
            bool enabled;
            map <uint32_t, string> remote_contracts;

            uint64_t primary_key() const { return token.get_symbol().code().raw(); }
        };
        typedef eosio::multi_index<"tokens"_n, tokens_item> tokens_table;

        /* Represents a user deposit before teleporting */
        struct [[eosio::table("deposits")]] deposit_item {
            name token_contract;
            asset balance;

            uint64_t primary_key()const { return balance.symbol.code().raw(); }
        };
        typedef multi_index<"deposits"_n, deposit_item> deposits_table;


        /* Represents a teleport in progress */
        struct [[eosio::table("teleports")]] teleport_item {
            uint64_t       id;
            uint32_t       time;
            name           account;
            name           token_contract;
            asset          quantity;
            int8_t         chain_id;
            checksum256    eth_address;
            vector<name>   oracles;
            vector<string> signatures;
            bool           claimed;

            uint64_t primary_key() const { return id; }
            uint64_t by_account() const { return account.value; }
        };
        typedef multi_index<"teleports"_n, teleport_item,
            indexed_by<"byaccount"_n, const_mem_fun<teleport_item, uint64_t, &teleport_item::by_account>>> teleports_table;


        struct [[eosio::table("cancels")]] cancel_item {
            uint64_t       teleport_id;

            uint64_t primary_key() const { return teleport_id; }
        };
        typedef multi_index<"cancels"_n, cancel_item> cancels_table;


        /* Oracles authorised to send receipts */
        struct [[eosio::table("oracles")]] oracle_item {
          name  account;

          uint64_t primary_key() const { return account.value; }
        };
        typedef multi_index<"oracles"_n, oracle_item> oracles_table;


        /* Oracles authorised to send receipts */
        struct [[eosio::table("receipts")]] receipt_item {
          uint64_t       id;
          time_point_sec date;
          checksum256    ref;
          name           to;
          uint8_t        chain_id;
          uint8_t        confirmations;
          name           token_contract;
          asset          quantity;
          vector<name>   approvers;
          bool           completed;

          uint64_t    primary_key() const { return id; }
          uint64_t    by_to() const { return to.value; }
          checksum256 by_ref() const { return ref; }
        };
        typedef multi_index<"receipts"_n, receipt_item,
            indexed_by<"byref"_n, const_mem_fun<receipt_item, checksum256, &receipt_item::by_ref>>,
            indexed_by<"byto"_n, const_mem_fun<receipt_item, uint64_t, &receipt_item::by_to>>
        > receipts_table;

//        deposits_table    _deposits;
        oracles_table     _oracles;
        receipts_table    _receipts;
        teleports_table   _teleports;
        cancels_table     _cancels;

        void require_oracle(name account);

        settings get_settings();

      public:
        using contract::contract;

        teleporteos(name s, name code, datastream<const char *> ds);

        /* Fungible token transfer (only START) */
//        [[eosio::on_notify(TOKEN_CONTRACT_STR "::transfer")]] void transfer(name from, name to, asset quantity, string memo);
        [[eosio::on_notify("*::transfer")]] void transfer(name from, name to, asset quantity, string memo);

        [[eosio::action]] void init( name admin_account, uint32_t threshold );
        [[eosio::action]] void enable();
        [[eosio::action]] void disable();
        [[eosio::action]] void setthreshold( uint32_t threshold );

        [[eosio::action]] void teleport(name from, asset quantity, uint8_t chain_id, checksum256 eth_address);
        [[eosio::action]] void logteleport(uint64_t id, uint32_t timestamp, name from, asset quantity, uint8_t chain_id, checksum256 eth_address);
        [[eosio::action]] void sign(name oracle_name, uint64_t id, string signature);
        [[eosio::action]] void withdraw(name from, asset quantity);
        [[eosio::action]] void cancel(uint64_t id);
        [[eosio::action]] void received(name oracle_name, name to, checksum256 ref, asset quantity, uint8_t chain_id, bool confirmed);
        [[eosio::action]] void claimed(name oracle_name, uint64_t id, checksum256 to_eth, asset quantity);
        [[eosio::action]] void regoracle(name oracle_name);
        [[eosio::action]] void unregoracle(name oracle_name);
        [[eosio::action]] void sign(string signature);
        [[eosio::action]] void delreceipts();
        [[eosio::action]] void delteles();

        [[eosio::action]] void addtoken( const extended_symbol &token_symbol, const asset &min_quantity, bool enabled );
        [[eosio::action]] void updatetoken( const extended_symbol &token_symbol, const asset &min_quantity, const bool &enabled );
        [[eosio::action]] void addremote( const extended_symbol &token_symbol, const uint32_t &chain_id, const string &token_contract );

        [[eosio::action]] void m1();
        [[eosio::action]] void m2();

    };
} // namespace tstarter
