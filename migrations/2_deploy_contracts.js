const {
  WETH_ADDRESS,
  TOKENS_TO_SUPPORT,
  REPORTERS
} = require('../config')
const { singletons } = require('@openzeppelin/test-helpers')
require('@openzeppelin/test-helpers/configure')({
  environment: 'truffle',
  provider: web3.currentProvider,
})

const TeleportTokenFactory = artifacts.require('TeleportTokenFactory')

module.exports = async (_deployer, _network, _accounts) => {
  await _deployer.deploy(TeleportTokenFactory)
  TeleportTokenFactoryInstance = await TeleportTokenFactory.deployed()
  for (const reporter of REPORTERS) {
    await TeleportTokenFactoryInstance.regOracle(reporter)
  }
  // _deployer.deploy(artifacts.require('TeleportToken'), "DEWIE", "Dewald", 4, "1000000000000000000000", 1, 1)
}
