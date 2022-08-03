#!/usr/bin/env node

/*
Lists all incomplete teleports from eos -> eth
 */
require('newrelic');

const config_file = process.env["CONFIG"] || "./config";
process.title = `reporter-eos ${config_file}`;
const config = require(config_file);

const v1TokenList = require("./v1-token-list.json");

const { Api, JsonRpc, Serialize } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig");
const fetch = require("node-fetch");
const { TextDecoder, TextEncoder } = require("text-encoding");

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(config.eth.endpoint));
const ethUtil = require("ethereumjs-util");
const ethers = require('ethers');

const signatureProvider = new JsSignatureProvider([config.eos.privateKey]);
const rpc = new JsonRpc(config.eos.endpoint, { fetch });
const eos_api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
});

const fromHexString = (hexString) =>
    new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const toHexString = (bytes) =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

const asToDeci = (str) => {
    if (str.length > 0) {
        let commaidx = str.indexOf(".") + 1;
        let spaceidx = str.indexOf(" ");
        const precision = str.slice(commaidx, spaceidx).length;
        return precision;
    } else return 0;
}

const sleep = (time = 0, throwError = false) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (throwError) {
                reject();
            } else {
                resolve();
            }
        }, time);
    });
};

const run = async () => {
    while (true) {
        try {
            const rows = [];
            console.log("Fetching all rows form teleports table");
            const res = await rpc.get_table_rows({
                code: config.eos.teleportContract,
                scope: config.eos.teleportContract,
                table: "teleports",
                limit: 25,
                reverse: true,
            });

            // console.log(res);

            res.rows.forEach((r) => {
                if (r.signatures.length < 100) {
                    rows.push(r);
                }
            });

            // console.log("Teleports: ", rows);


            for (const teleport of rows) {
                if (
                    !teleport.claimed &&
                    !teleport.oracles.includes(config.eos.oracleAccount)
                ) {
                    console.log(
                        `Reporting ${teleport.account} - ${teleport.id
                        }, oracles : ${JSON.stringify(teleport.oracles)}, amount : ${teleport.quantity
                        }`
                    );

                    // eth signing
                    // sign the transaction and send to the eos chain

                    const sb = new Serialize.SerialBuffer({
                        textEncoder: new TextEncoder(),
                        textDecoder: new TextDecoder(),
                    });
                    sb.pushNumberAsUint64(teleport.id);
                    sb.pushUint32(teleport.time);
                    sb.pushName(teleport.account);
                    sb.pushAsset(teleport.quantity);
                    sb.push(teleport.chain_id);
                    sb.pushArray(fromHexString(teleport.eth_address));

                    // Backwards compatibility with v1
                    // ==============================
                    const tokensTable = await rpc.get_table_rows({
                        code: config.eos.teleportContract,
                        scope: config.eos.teleportContract,
                        table: "tokens",
                        limit: 1000,
                        reverse: true,
                    });

                    let tokensList = tokensTable.rows.filter(token => token.enabled == 1);
                    const token = tokensList.find(token => token.token.contract == teleport.token_contract);
                    let remoteContractAddress = "";
                    try {
                        remoteContractAddress = token.remote_contracts.find(t => t.key == teleport.chain_id).value.toLowerCase()
                    } catch (error) {
                        console.error(error)
                        continue;
                    }
                    let data_buf = "";
                    if (
                        v1TokenList.some(
                            (addr) => addr.toLowerCase() == remoteContractAddress.toLowerCase()
                        )
                    ) {
                        console.log("Found v1 token");
                        data_buf = Buffer.from(sb.array.slice(0, 69));
                    } else {
                        sb.pushArray(fromHexString(remoteContractAddress));
                        sb.push(asToDeci(teleport.quantity));
                        data_buf = Buffer.from(sb.array.slice(0, 91));
                    }
                    // ==========================
                    // console.log("signData:", "0x" + toHexString(sb.array.slice(0, 91)));

                    const msg_hash = ethUtil.keccak(data_buf);
                    // console.log(msg_hash.toString("hex"));
                    // console.log(config.eth.privateKey);
                    const pk = Buffer.from(config.eth.privateKey, "hex");
                    const sig = ethUtil.ecsign(msg_hash, pk);
                    // console.log(pk, sig);

                    const signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
                    console.log(`Created signature ${signature}`);

                    // sign eos transaction
                    const actions = [
                        {
                            account: config.eos.teleportContract,
                            name: "sign",
                            authorization: [
                                {
                                    actor: config.eos.oracleAccount,
                                    permission: config.eos.oraclePermission || "active",
                                },
                            ],
                            data: {
                                oracle_name: config.eos.oracleAccount,
                                id: teleport.id,
                                signature: signature,
                            },
                        },
                    ];

                    // console.log(actions);
                    const res = eos_api.transact(
                        { actions },
                        {
                            blocksBehind: 3,
                            expireSeconds: 180,
                        }
                    );
                    // console.log(res);
                }
            }
            console.log("Done");
        } catch (error) {
            console.error(error);
        } finally {
            await sleep(10000);
        }
    }
};

run();
