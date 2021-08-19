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
      let sigData = "0x0100000000000000cf591e6190d5cc5865ffbf5e50690f000000000004535441525400000126b0ab0963ddf1aff3d545ff5849af2b2d84f9c5000000000000000000000000"
      let signatures = ["0x682affdb96803b7477fefcbc4458780c9a495204cc8926419ed069e4464c00ab060001c488dcef9eb6703d6f1ec390a0a80d0eee78bc331b4585fca854a209181b"]
      await teleporttoken.claim(sigData, signatures);
    } catch (error) {
      threw = true;
      console.log(error);
    }
    expect(threw).to.be.false;

  });
});