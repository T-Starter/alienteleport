const {
  WETH_ADDRESS,
  TOKENS_TO_SUPPORT,
} = require('../config')
const { singletons } = require('@openzeppelin/test-helpers')
require('@openzeppelin/test-helpers/configure')({
  environment: 'truffle',
  provider: web3.currentProvider,
})

module.exports = async (_deployer, _network, _accounts) => {
  // if (_network.includes('develop')) await singletons.ERC1820Registry(_accounts[0])
  _deployer.deploy(artifacts.require('TeleportTokenFactory'))
  // _deployer.deploy(artifacts.require('TeleportToken'), "DEWIE", "Dewald", 4, "1000000000000000000000", 1, 1)
}
