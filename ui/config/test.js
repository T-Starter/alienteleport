module.exports = {
    telosEndpoint: 'https://testnet.telos.caleos.io',
    telosChainId: '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
    tlmContract: 'token.start',
    teleportContract: 'tport.start',
    ipfsRoot: 'https://ipfs.io/ipfs/',
    networks: {
        '1': {
            name: 'Ethereum',
            tlmContract: '0x888888848b652b3e3a0f34c96e00eec0f3a23f72',
            destinationChainId: 1,
            className: 'ethereum'
        },
        '3': {
            name: 'Ropsten Testnet',
            tlmContract: '0x5b6A8e651c4083177851D34409685977aE21e4ca',
            destinationChainId: 1,
            className: 'ethereum'
        },
        '56': {
            name: 'BSC',
            tlmContract: '0x5b6A8e651c4083177851D34409685977aE21e4ca',
            destinationChainId: 2,
            className: 'binance'
        },
        '41': {
            name: 'Telos',
            tlmContract: '0x5b6A8e651c4083177851D34409685977aE21e4ca',
            destinationChainId: 3,
            className: 'telos'
        }
    }
}
