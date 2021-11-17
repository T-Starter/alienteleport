# Alien Teleport

Contracts and tools to create a bridge between WAX tokens and an ERC-20 counterpart.

## Contracts

There are contracts available for both EOSIO chains and Ethereum, both should be deployed 
on their respective chains.

### Deployment guide
After cloning the repository, first install the dependencies:

```
❍ npm i
```

Next, you need to fill in the the following information in the __`config.json`__

Finally, deploy the vault to your chose network via the command:

```
❍ npx truffle migrate --network <network> --reset
```

Currently, there exists in the __`./truffle-config.js`__ configurations for the following __`<network>s`__

```
xDai
rinkeby
ropsten
ethMainnet
bscMainnet
bscTestnet
polygonMaticMainnet
```

Should you need to deploy to a different chain, inspect the existing configurations and make your own with values pertinent to that new chain.

Finally, to verify the deployed contract run:

```
❍ npx truffle run verify TeleportTokenFactory --network <network>
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

