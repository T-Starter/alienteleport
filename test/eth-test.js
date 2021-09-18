const { expect } = require("chai");

describe("TeleportToken", function () {
  let TeleportToken;
  let teleporttoken;

  beforeEach(async function () {
    // Deploy contract
    TeleportToken = await ethers.getContractFactory("TeleportToken");
    teleporttoken = await TeleportToken.deploy();
    await teleporttoken.deployed();
    // console.log(teleporttoken.address);
    // Register oracles
    await teleporttoken.regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8");
    // update threshold to one
    await teleporttoken.updateThreshold(1);

  });

  it("Oracle is registered", async function () {
    let isOracle = await teleporttoken.oracles("0x59023f49315113deb856106d05699a3a2dc78bb8");
    expect(isOracle).to.be.true;
  });

  it("Threshold is updated", async function () {
    let threshold = await teleporttoken.threshold();
    expect(threshold).to.be.equal(1);
  });

  it("Can claim", async function () {
    let threw = false;
    try {
      let sigData = "0x0b00000000000000193f266190d5cc5865ffbf5e50690f000000000004535441525400000126b0ab0963ddf1aff3d545ff5849af2b2d84f9c5000000000000000000000000"
      let signatures = ["0x490c499eae001173c1b1f4755136465c34488ef51e1c11dd701bb7ed068cd09d32c4167b5bfff49e8eac30aaff700dbfc9f4fbc87ffa56f0ece849ce3cd63abb1b","0x3aeae80d6d8847e179367b0bf74d6cc12a4b53697000b8a5f0db2483fce269902ca1727caddf4cc368c96d2f785f7b19cb30d77e015fb8c359d251166e86e9831b"]
      await teleporttoken.claim(sigData, signatures);
    } catch (error) {
      threw = true;
      console.log(error);
    }
    expect(threw).to.be.false;

  });
});