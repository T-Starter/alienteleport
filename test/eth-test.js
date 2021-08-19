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
      let sigData = "0x000000000000000013651e6190d5cc5865ffbf5e40420f000000000004535441525400000126b0ab0963ddf1aff3d545ff5849af2b2d84f9c5000000000000000000000000"
      let signatures = ["0x7c2ecd5201f358de38931c27e8bc06d5b6a7edf53e0564e0e6525fc20a8b6da230e7f7ad76f9ed65290b40e3f777ec5860621a84482a8aec8545ad78d0c5ba071c"]
      await teleporttoken.claim(sigData, signatures);
    } catch (error) {
      threw = true;
      console.log(error);
    }
    expect(threw).to.be.false;

  });
});