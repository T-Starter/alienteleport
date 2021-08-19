module.exports = {
    precision: 4,
    symbol: 'START',
    network: 'BSC',
    eos: {
        wsEndpoint: 'ws://178.63.44.179:8082',
        chainId: "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12",
        endpoint: 'https://testnet.eos.miami',
        teleportContract: 'tport.start',
        oracleAccount: '',
        privateKey: '5C234dc...'
    },
    eth: {
        wsEndpoint: 'wss://ropsten.infura.io/ws/v3/070239498bd64e588d26301a8c2ef6e6',
        endpoint: 'https://ropsten.infura.io/v3/070239498bd64e588d26301a8c2ef6e6',
        teleportContract: '0x5b6a8e651c4083177851d34409685977ae21e4ca',
        oracleAccount: '0x111111111111111111111111111111111111111',
        privateKey: 'ABC434DCF...'
    }
}
