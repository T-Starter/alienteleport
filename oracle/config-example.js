module.exports = {
    network: 'BSC', // ETH, TELOS, BSC
    pollingInterval: 30000,
    eos: {
        id: '0', // 0 TELOS, 1 WAX, 2 EOS
        wsEndpoint: 'ws://178.63.44.179:8082',
        chainId: "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12",
        endpoint: 'https://testnet.eos.miami',
        teleportContract: 'tport.start',
        oracleAccount: '',
        privateKey: '5C234dc...'
    },
    eth: {
        id: '1', // 1 ETH, 2 BSC, 3 TEVM
        wsEndpoint: 'wss://ropsten.infura.io/ws/v3',
        endpoint: 'https://ropsten.infura.io/v3',
        oracleAccount: '0x111111111111111111111111111111111111111',
        privateKey: 'ABC434DCF...'
    }
}
