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
      3
    );
    await teleporttoken.deployed();
    // teleporttoken = await TeleportToken.attach("0xde2EEea2a7F9E9489C01aaF0530afd08Cfae45a7");
    console.log(teleporttoken.address);
  });

  it("Oracle is registered", async function () {
    // Register oracles
    await teleporttoken.regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8");
    let isOracle = await teleporttoken.oracles(
      "0x59023f49315113deb856106d05699a3a2dc78bb8"
    );
    expect(isOracle).to.be.true;
    await teleporttoken.regOracle("0xbc25948d1dd62a5777ab33ffe3cc0e61107043be");
    isOracle = await teleporttoken.oracles(
      "0xbc25948d1dd62a5777ab33ffe3cc0e61107043be"
    );
    expect(isOracle).to.be.true;
    await teleporttoken.regOracle("0xfb18e6e108987aeb4f5f2b17a2b18790ffa8ba8b");
    isOracle = await teleporttoken.oracles(
      "0xfb18e6e108987aeb4f5f2b17a2b18790ffa8ba8b"
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
        "0x3d00000000000000cf08376190d5cc5865ffbf5e40420f00000000000453544152540000032b8958a4965f7f02aeb112f656cb56d5b157ed35000000000000000000000000";
      let signatures = [
        "0x59d80914d424e53300c886cbf89a1ccfc47d6d98bc38a5a04e2b239231946f7e52157d7ac479a750402f4d62aa90998e861056db6eb293f61aea831f68b060791c",
        "0xbd260149e2d3c1ebfbbfc90d72a4688f3f1a8114977a276bea3dcc165c4123654d280ba5f59d0dc5b2a34ef23dc3120a4fd3134e9b9e07519df6d36e711fdb151b",
        "0x4f4895de8111a71ec3b704b08d0e70a4f7a20a2cd412016fa5802bc5ca611fdd324b2755ff962a50cb343af02fbbe44bb1e01e98b3f2edead99c7586fc7ea9851b"
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
    // teleporttokenfactory = await TeleportTokenFactory.attach("0x24DE774a0685497fe8A5908Ef2F352C5bA14223C");
    console.log(teleporttokenfactory.address);
    // console.log(owner.address);
    // console.log(await teleporttokenfactory.owner());
  });

  it("Create token with fee", async function () {
    // let balance = await ethers.provider.getBalance(addr1.address);
    // console.log(balance.toString());
    // console.log(addr1.address);
    let receipt = await teleporttokenfactory
      .connect(addr1)
      .create("DEWIE", "dewaldtokens", 4, 1000000000000, 1, 3, {
        from: addr1.address,
        value: ethers.utils.parseEther("0.5"),
      });
    let tokenAddress = await teleporttokenfactory.getTokenAddress(0);
    const TT = await ethers.getContractFactory("TeleportToken");
    newToken = await TT.attach(tokenAddress);
    // balance = await ethers.provider.getBalance(addr1.address);
    // console.log(balance.toString());
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
    await newToken
      .connect(addr1)
      .regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8", {
        from: addr1.address,
      });
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
  it("Can withdraw ether", async function () {
    let threw = false;
    // let balance = await ethers.provider.getBalance(owner.address);
    // console.log(balance.toString());
    try {
      let receipt = await teleporttokenfactory
        .connect(owner)
        .withdraw({ from: owner.address });
      // console.log(receipt);
    } catch (error) {
      threw = true;
      console.log(error);
    }
    // balance = await ethers.provider.getBalance(owner.address);
    // console.log(balance.toString());
    expect(threw).to.be.false;
  });

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
