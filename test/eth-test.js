const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TeleportToken", function () {
  let TeleportToken;
  let teleporttoken;

  before(async function () {
    // Deploy contract
    TeleportToken = await ethers.getContractFactory("TeleportToken");
    teleporttoken = await TeleportToken.deploy(
      "START",
      "T-starter START",
      4,
      1000000000000,
      2,
      1
    );
    await teleporttoken.deployed();
    // console.log(teleporttoken.address);
  });

  it("Oracle is registered", async function () {
    // Register oracles
    await teleporttoken.regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8");
    let isOracle = await teleporttoken.oracles(
      "0x59023f49315113deb856106d05699a3a2dc78bb8"
    );
    expect(isOracle).to.be.true;
  });

  it("Threshold is updated", async function () {
    // update threshold to one
    await teleporttoken.updateThreshold(1);
    let threshold = await teleporttoken.threshold();
    expect(threshold).to.be.equal(1);
  });

  it("Can claim", async function () {
    let threw = false;
    try {
      let sigData =
        "0x0b00000000000000193f266190d5cc5865ffbf5e50690f000000000004535441525400000126b0ab0963ddf1aff3d545ff5849af2b2d84f9c5000000000000000000000000";
      let signatures = [
        "0x490c499eae001173c1b1f4755136465c34488ef51e1c11dd701bb7ed068cd09d32c4167b5bfff49e8eac30aaff700dbfc9f4fbc87ffa56f0ece849ce3cd63abb1b",
        "0x3aeae80d6d8847e179367b0bf74d6cc12a4b53697000b8a5f0db2483fce269902ca1727caddf4cc368c96d2f785f7b19cb30d77e015fb8c359d251166e86e9831b",
      ];
      await teleporttoken.claim(sigData, signatures);
    } catch (error) {
      threw = true;
      console.log(error);
    }
    expect(threw).to.be.false;
  });
});

describe("TeleportTokenFactory", function () {
  let TeleportTokenFactory;
  let teleporttokenfactory;
  let owner, addr1, newowner;
  let newToken;

  before(async function () {
    // Deploy contract
    [owner, addr1, newowner] = await ethers.getSigners();
    TeleportTokenFactory = await ethers.getContractFactory(
      "TeleportTokenFactory"
    );
    teleporttokenfactory = await TeleportTokenFactory.deploy();
    await teleporttokenfactory.connect(owner).deployed({ from: owner.address });
    console.log(teleporttokenfactory.address);
    // console.log(owner.address);
    // console.log(await teleporttokenfactory.owner());
  });

  it("Create token with fee", async function () {
    let receipt = await teleporttokenfactory
      .connect(addr1)
      .create("DEWIE", "dewaldtokens", 4, 1000000000000, 1, 1, {
        from: addr1.address,
        value: ethers.utils.parseEther("0.1"),
      });
    let tokenAddress = await teleporttokenfactory.getTokenAddress(0);
    const TT = await ethers.getContractFactory("TeleportToken");
    newToken = await TT.attach(tokenAddress);
    // expect(isOracle).to.be.true;
    // console.log(isOracle);
  });

  it("Has correct ownership", async function () {
    await newToken.connect(addr1).acceptOwnership({ from: addr1.address });
    let contractOwner = await newToken.owner();
    expect(contractOwner).to.be.equal(addr1.address);
  });

  it("Register oracles", async function () {
    // register oracles
    await newToken.connect(addr1).regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8", {from: addr1.address});
    let isOracle = await newToken.oracles(
      "0x59023f49315113deb856106d05699a3a2dc78bb8"
    );
    expect(isOracle).to.be.true;
  });

  it("Set factory fee", async function () {
    let receipt = await teleporttokenfactory
      .connect(owner)
      .setFee(ethers.utils.parseEther("0.5"), { from: owner.address });
    // console.log(receipt);
    // console.log((await teleporttokenfactory.creationFee()).toString());
    expect(await teleporttokenfactory.creationFee()).to.be.equal(
      ethers.utils.parseEther("0.5")
    );
  });

  it("Can claim another token", async function () {
    let threw = false;
    try {
      let sigData =
        "0x0d00000000000000e2a62c6190d5cc5865ffbf5e60900f000000000004444557494500000126b0ab0963ddf1aff3d545ff5849af2b2d84f9c5000000000000000000000000";
      let signatures = [
        "0xd9e89fda3ce80c1b0f27ed53fae80ebfbc6041d4159de932aa1a9c8365f7221a668dcbba108adb7ea3a7fc15daac72a198d8cbafe7472bb188a31e95d53959891b",
        "0xb57a08a981770869345f1239ff3fddd51ef978cde6f742ad36fa6f9c69cdf07333f52ccb3ed59a2c0ab8b02fbd03212e924a0f9c8c84635272eac0f211ead1541b",
      ];
      await newToken.claim(sigData, signatures);
    } catch (error) {
      threw = true;
      console.log(error);
    }
    expect(threw).to.be.false;
  });

  // TODO Test receive and send ether

  it("Transfer factory ownership", async function () {
    let receipt = await teleporttokenfactory
      .connect(owner)
      .transferOwnership(newowner.address, { from: owner.address });
    // console.log(receipt);
    await teleporttokenfactory
      .connect(newowner)
      .acceptOwnership({ from: newowner.address });

    expect(await teleporttokenfactory.owner()).to.be.equal(newowner.address);
  });
});
