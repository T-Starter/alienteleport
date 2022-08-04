#!/usr/bin/env node

/*
This oracle listens to the ethereum blockchain for `Teleport` events.

When an event is received, it will call the `received` action on the EOS chain
 */
require('newrelic');

process.title = `oracle-eth ${process.env['CONFIG']}`;

const { Api, JsonRpc } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const fs = require('fs');
const ethers = require('ethers');

const { logger } = require('./logger');
logger.info(`is_production = ${process.env.NODE_ENV}`);

const config = require(process.env['CONFIG'] || './config');

const provider = new ethers.providers.JsonRpcProvider(config.eth.endpoint);

const signatureProvider = new JsSignatureProvider([config.eos.privateKey]);
const rpc = new JsonRpc(config.eos.endpoint, { fetch });
const eos_api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

const network = config.network || 'ETH'
const blocks_file = `.oracle_${config.network}_block-${config.eth.oracleAccount}`;
const POLL_INTERVAL = config.pollingInterval || 30000;
const DEFAULT_BLOCKS_TO_WAIT = 5;
const claimed_topic = '0x94af4c5d270a63723e4dd7b1ae4a8de3734098f6677d9f170af24fec77603b37';
const teleport_topic = '0x622824274e0937ee319b036740cd0887131781bc2032b47eac3e88a1be17f5d5';

const tokenABI = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (bool)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];

const sleep = async (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    })
}

const await_confirmation = async (txid) => {
    return new Promise(async resolve => {
        let resolved = false;
        while (!resolved) {
            provider.getTransactionReceipt(txid).then(receipt => {
                if (receipt && receipt.confirmations > DEFAULT_BLOCKS_TO_WAIT) {
                    console.log(`TX ${txid} has ${receipt.confirmations} confirmations`);
                    resolve(receipt);
                    resolved = true;
                }
            });
            await sleep(10000);
        }
    });
}

const load_block = async () => {
    let block_number = 'latest';
    if (fs.existsSync(blocks_file)) {
        const file_contents = await fs.readFileSync(blocks_file);
        if (file_contents) {
            block_number = parseInt(file_contents);
            if (isNaN(block_number)) {
                block_number = 'latest';
            }
            else {
                // for fresh start go back 50 blocks
                block_number -= 50;
            }
        }
    }

    return block_number;
}
const save_block = async (block_num) => {
    await fs.writeFileSync(blocks_file, block_num.toString());
}

// Gets decimal from base token asset { "sym": "4,START", "contract": "token.start" }
const getDecimalFromAsset = function (asset) {
    let idx = asset.sym.indexOf(",");
    let decimal = asset.sym.slice(0, idx);
    return decimal;
};

// Gets symbol from base token asset { "sym": "4,START", "contract": "token.start" }
const getSymFromAsset = function (asset) {
    let idx = asset.sym.indexOf(",") + 1;
    let sym = asset.sym.slice(idx);
    return sym;
};

// process logs for all topics
const process_logs = async (from_block, to_block) => {
    return new Promise(async (resolve, reject) => {
        try {

            const query = {
                fromBlock: from_block,
                toBlock: to_block,
                topics: [[claimed_topic, teleport_topic]],
            };
            // console.log(query);
            const res = await provider.getLogs(query);
            // console.log(res);
            if (res.length) {
                let teleport_events = res.filter((log) => {
                    return log.topics[0] === teleport_topic;
                });
                let claimed_events = res.filter((log) => {
                    return log.topics[0] === claimed_topic;
                });
                await process_teleported(teleport_events);
                await process_claimed(claimed_events);
            }

            resolve();
        } catch (e) {
            reject(e);
        }
    });
}

const process_claimed = async (events) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Fetching all rows from tokens table");
            const tokensTable = await rpc.get_table_rows({
                code: config.eos.teleportContract,
                scope: config.eos.teleportContract,
                table: "tokens",
                limit: 1000,
                reverse: true,
            });

            let tokensList = tokensTable.rows.filter(token => token.enabled == 1);
            let tokenAddrList = [...new Set(tokensList.map(r => r.remote_contracts).flat().filter(t => t.key == config.eth.id).map(r => r.value.toLowerCase()))];             

            if (events.length) {
                for (let r = 0; r < events.length; r++) {
                    if (!tokenAddrList.includes(events[r].address.toLowerCase())) {
                        console.log(`Token ${events[r].address.toLowerCase()} not found in tokens table`);
                        continue;
                    }

                    // find token from tokenAddress in tokensList
                    const token = tokensList.find(token => token.remote_contracts.find(remote => remote.value.toLowerCase() == events[r].address.toLowerCase()));
                    const tokenNativePrecision = getDecimalFromAsset(token.token);
                    const tokenSymbol = getSymFromAsset(token.token);

                    let data;
                    if (events[r].topics[0] == claimed_topic) {
                        data = await ethers.utils.defaultAbiCoder.decode(['uint64', 'address', 'address', 'uint'], events[r].data);
                    } else {
                        continue;
                    }

                    // get remote contract decimals
                    let remoteContractAddres = events[r].address.toLowerCase()
                    const erc20 = new ethers.Contract(remoteContractAddres, tokenABI, provider);
                    let remoteContractPrecision = await erc20.decimals();

                    const id = data[0].toNumber();
                    const to_eth = data[1].replace('0x', '') + '000000000000000000000000';
                    const ethAmount = parseFloat(ethers.utils.formatUnits(data[3].toString(), remoteContractPrecision)).toFixed(tokenNativePrecision);
                    const quantity = `${ethAmount} ${tokenSymbol}`;
                    const actions = [];
                    actions.push({
                        account: config.eos.teleportContract,
                        name: 'claimed',
                        authorization: [{
                            actor: config.eos.oracleAccount,
                            permission: config.eos.oraclePermission || 'active'
                        }],
                        data: {
                            oracle_name: config.eos.oracleAccount,
                            id,
                            to_eth,
                            quantity
                        }
                    });

                    await_confirmation(events[r].transactionHash).then(async () => {
                        try {
                            const eos_res = await eos_api.transact({ actions }, {
                                blocksBehind: 3,
                                expireSeconds: 180,
                            });
                            logger.info(`Sent notification of claim with txid ${eos_res.transaction_id}, for ID ${id}, account 0x${to_eth.substr(0, 40)}, quantity ${quantity}`);
                            // resolve();
                        }
                        catch (e) {
                            if (e.message.indexOf('Already marked as claimed') > -1) {
                                logger.error(`ID ${id} is already claimed, account 0x${to_eth.substr(0, 40)}, quantity ${quantity}`);
                            }
                            else {
                                logger.error(`Error sending confirm ${e.message}`);
                                // reject(e);
                            }
                        }
                    });
                    await sleep(500);
                }
            }
            resolve();
        }
        catch (e) {
            reject(e);
        }
    });
}

const process_teleported = async (events) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Fetching all rows from tokens table");
            const tokensTable = await rpc.get_table_rows({
                code: config.eos.teleportContract,
                scope: config.eos.teleportContract,
                table: "tokens",
                limit: 1000,
                reverse: true,
            });

            let tokensList = tokensTable.rows.filter(token => token.enabled == 1);
            let tokenAddrList = [...new Set(tokensList.map(r => r.remote_contracts).flat().filter(t => t.key == config.eth.id).map(r => r.value.toLowerCase()))];

            if (events.length) {
                for (let r = 0; r < events.length; r++) {
                    if (!tokenAddrList.includes(events[r].address.toLowerCase())) {
                        console.log(`Token ${events[r].address.toLowerCase()} not found in tokens table`);
                        continue;
                    }

                    // find token from tokenAddress in tokensList
                    const token = tokensList.find(token => token.remote_contracts.find(remote => remote.value.toLowerCase() == events[r].address.toLowerCase()));
                    const tokenNativePrecision = getDecimalFromAsset(token.token);
                    const tokenSymbol = getSymFromAsset(token.token);

                    let data;
                    if (events[r].topics[0] == teleport_topic) {
                        data = await ethers.utils.defaultAbiCoder.decode(['string', 'uint', 'uint'], events[r].data);
                    } else {
                        continue;
                    }

                    const amountBN = data[1];
                    if (amountBN.lte(0)) {
                        logger.error('Tokens are less than or equal to 0');
                        continue;
                    }

                    // get remote contract decimals
                    let remoteContractAddres = events[r].address.toLowerCase()
                    const erc20 = new ethers.Contract(remoteContractAddres, tokenABI, provider);
                    let remoteContractPrecision = await erc20.decimals();

                    const to = data[0];
                    const from_chain_id = config.eth.id;
                    const to_chain_id = data[2].toNumber();
                    const amount = parseFloat(
                        ethers.utils.formatUnits(amountBN, remoteContractPrecision)
                    ).toFixed(tokenNativePrecision);
                    const quantity = `${amount} ${tokenSymbol}`
                    const txid = events[r].transactionHash.replace(/^0x/, '');

                    if (to_chain_id != config.eos.id) {
                        continue;
                    }

                    const actions = [];
                    actions.push({
                        account: config.eos.teleportContract,
                        name: 'received',
                        authorization: [{
                            actor: config.eos.oracleAccount,
                            permission: config.eos.oraclePermission || 'active'
                        }],
                        data: {
                            oracle_name: config.eos.oracleAccount,
                            to,
                            ref: txid,
                            quantity,
                            from_chain_id,
                            to_chain_id,
                            confirmed: true
                        }
                    });

                    await_confirmation(events[r].transactionHash).then(async () => {
                        try {
                            const eos_res = await eos_api.transact({ actions }, {
                                blocksBehind: 3,
                                expireSeconds: 180,
                            });
                            logger.info(`Sent notification of teleport with txid ${eos_res.transaction_id}`);
                            // resolve();
                        }
                        catch (e) {
                            if (e.message.indexOf('Oracle has already approved') > -1) {
                                logger.error('Oracle has already approved');
                            }
                            else {
                                logger.error(`Error sending teleport ${e.message}`);
                                // reject(e);
                            }
                        }
                    });
                    await sleep(500);
                }
            }
            resolve();
        }
        catch (e) {
            reject(e);
        }
    })
}

const run = async (from_block = 'latest') => {
    while (true) {
        try {
            const block = await provider.getBlock('latest');
            const latest_block = block.number;

            if (from_block === 'latest') {
                // load last seen block from file
                from_block = await load_block();
                if (from_block !== 'latest') {
                    console.log(`Starting from save block of ${from_block}`)
                }
            }
            if (from_block === 'latest') {
                // could not get block from file and it wasn't specified (go back 100 blocks)
                from_block = latest_block - 100;
            }
            let to_block = from_block + 100;
            if (to_block > latest_block) {
                to_block = latest_block;
            }

            if (from_block >= latest_block) {
                console.log(`Up to date at block ${to_block}`);
                await sleep(POLL_INTERVAL);
            }
            console.log(`Getting events from block ${from_block} to ${to_block}`)

            await process_logs(from_block, to_block);

            from_block = to_block;

            // save last block received
            await save_block(to_block);

            if (latest_block - from_block <= 1000) {
                console.log('Waiting...');
                await sleep(POLL_INTERVAL);
            }
            else {
                console.log(`Not waiting... ${latest_block - from_block} ...behind head block`);
            }
        }
        catch (e) {
            logger.error(e.message);
        }
    }
}

let start_block = 'latest';
if (process.argv[2]) {
    const lb = parseInt(process.argv[2]);
    if (isNaN(lb)) {
        console.error(`You must supply start block as an integer on command line`);
        process.exit(1);
    }
    start_block = lb;
}
else if (process.env['START_BLOCK']) {
    const lb = parseInt(process.env['START_BLOCK']);
    if (isNaN(lb)) {
        console.error(`You must supply start block as an integer in env`);
        process.exit(1);
    }
    start_block = lb;
}

run(start_block);
