# Alien Teleport

Contracts and tools to create a bridge between WAX tokens and an ERC-20 counterpart.

## Contracts

There are contracts available for both EOSIO chains and Ethereum, both should be deployed
on their respective chains.

**Mainnet**
Ethereum:
BSC:
Telos EVM: 0x7a82dE1B2159C33C8d93cd9Dbb06350820458E4f

**Testnet Factory**
Goerli: 0xB4067e220966a41dd1694abAC422d6ca9cd2EC7D
BSC: 0xb945Dc9F48895F296eE30447A4dD603eaa2f3E72
Telos EVM: 0x6F174B0a2c6B6807CcCc18b6643dbf755E31400c

### Deployment guide

After cloning the repository, first install the dependencies:

```
❍ npm i
```

Next, you need to fill in the the following information in the **`config.json`**

Finally, deploy the vault to your chose network via the command:

```
❍ npx truffle migrate --network <network> --reset
```

add `--compile-none` if getting timeouts

Currently, there exists in the **`./truffle-config.js`** configurations for the following **`<network>s`**

```
xDai
rinkeby
ropsten
ethMainnet
bscMainnet
bscTestnet
polygonMaticMainnet
telosMainnet
telosTestnet
```

Should you need to deploy to a different chain, inspect the existing configurations and make your own with values pertinent to that new chain.

Finally, to verify the deployed contract run:

```
❍ npx truffle run verify TeleportTokenFactory --network <network>
```

To verify the teleport token repeat the above process also editing the 2_deploy_contracts script to deploy and verify the contract

## Tests

You can run the tests via the command:

```
npx hardhat test
```

## Process

Transferring from EOSIO -> ETH requires depositing the tokens to the EOSIO contract with a standard transfer (no memo required),
then teleporting the tokens using the `teleport` action.

Transferring from ETH -> EOSIO simply requires callint the `teleport` function on the Ethereum contract.

## Oracles

Oracle accounts must be registered using the `regoracle` (EOSIO) or `regOracle` (Ethereum) functions.

Oracles can then call the received function on each contract when they see a transaction on the opposing chain.

### Setup and running

1. Create `oracle/config` directory, copy config-example.js to config/config1.js (for reporter 1).
2. Change the configuration settings to match your tokens.
3. Start the containers by running `run.sh`.

## Adding a token

1. Go to the teleport contract on the chain you want to add a token to. e.g. <https://testnet.bscscan.com/address/0x578e49D8e33168c74a150B8D12d8C2E8B78cE9a4#writeContract>
2. Call the create action with the desired token information.
3. Go to the created token contract and call the `acceptOwnership` action.
4. Go to the tport.start contract on Telos and call the `addtoken` action with the required info.
5. Next add the remote with the `addremote` action along with the token contract address from step 3
6. Your token should now be available for use.

## Stats

Tokenfactory gas cost: 0.025 ETH @ 10 Gwei

## New relic monitoring

Copy the .env.newrelic file to .env with
`cp .env.newrelic .env`

Place your new relic license key in the `NEW_RELIC_LICENSE_KEY` variable

You will see the data coming through is there are errors in the APM.

Currently logs are not being sent to New Relic. Might need to look at winston logging.
