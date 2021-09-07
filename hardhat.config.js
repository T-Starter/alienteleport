require("@nomiclabs/hardhat-waffle");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    telos: {
      url: "http://testnet.telos.net/evm",
      accounts: [
        "0x0016804a0bef993891e6c1bde45897134f53137a403b359691785b3350eb36f7",
        "0x87ef69a835f8cd0c44ab99b7609a20b2ca7f1c8470af4f0e5b44db927d542084",
        "0xe014b35c1921894db39c21dbb33462927ff19d9a43a6e226d2a8c8733cc72c6e"
      ],
      chainId: 41,
      gas: 10000000,
      gasPrice: 100000000000,
    },
  },
  solidity: "0.8.7",
};
