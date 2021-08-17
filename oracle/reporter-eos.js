#!/usr/bin/env node

/*
Lists all incomplete teleports from eos -> eth
 */

const config_file = process.env['CONFIG'] || './config';
process.title = `reporter-eos ${config_file}`;

const {Api, JsonRpc, Serialize} = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const { TextDecoder, TextEncoder } = require('text-encoding');

const hyperion_endpoint = 'https://testnet.telos.caleos.io';

const config = require(config_file);

// const signatureProvider = new JsSignatureProvider([config.eos.privateKey]);
const rpc = new JsonRpc(config.eos.endpoint, {fetch});
// const eos_api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });


const run = async () => {
    let lower_bound = 1;
    const rows = [];
    console.log("Fetching all rows form teleports table");
    while (true){
        const res = await rpc.get_table_rows({
            code: config.eos.teleportContract,
            scope: config.eos.teleportContract,
            table: 'teleports',
            lower_bound,
            limit: 100
        });

        // console.log(res);

        res.rows.forEach(r => {
            if (r.signatures.length < 3){
                rows.push(r);
            }
        });


        if (res.more){
            lower_bound = res.next_key;
        }
        else {
            break;
        }
    }

    console.log("Teleports: ", rows);

    for (const teleport of rows){
        if (!teleport.claimed && !teleport.oracles.includes(config.oracleAccount)){
            console.log(`Reporting ${teleport.account} - ${teleport.id}, oracles : ${JSON.stringify(teleport.oracles)}, amount : ${teleport.quantity}`)
        }
    }
    console.log("Done");
}

run()
