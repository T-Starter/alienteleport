module.exports = {
    telosEndpoint: 'https://testnet.telos.africa',
    telosChainId: '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
    tlmContract: 'token.start',
    teleportContract: 'evm.start',
    ipfsRoot: 'https://ipfs.io/ipfs/',
    networks: {
        '3': {
            name: 'Ropsten Testnet',
            tlmContract: '0x5b6a8e651c4083177851d34409685977ae21e4ca',
            destinationChainId: 1,
            className: 'ethereum'
        },
        '97': {
            name: 'BSC',
            tlmContract: '0x5b6a8e651c4083177851d34409685977ae21e4ca',
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
