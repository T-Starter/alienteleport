module.exports = {
    precision: 4,
    symbol: 'START',
    eos: {
        wsEndpoint: 'ws://178.63.44.179:8082',
        chainId: "1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f",
        endpoint: 'https://testnet.telos.africa',
        teleportContract: 'evm.start',
        oracleAccount: 'r1.start',
        privateKey: '5C234dc...'
    },
    eth: {
        wsEndpoint: 'wss://ropsten.infura.io/ws/v3/883...',
        endpoint: 'https://ropsten.infura.io/v3/883...',
        teleportContract: '0x5b6A8e651c4083177851D34409685977aE21e4ca',
        oracleAccount: '0x590...',
        privateKey: 'bbb...'
    }
}
