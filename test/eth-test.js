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
                "0x42000000000000003055376190d5cc5865ffbf5e50690f00000000000453544152540000032b8958a4965f7f02aeb112f656cb56d5b157ed35000000000000000000000000";
            let signatures = [
                "0x5abf0732e3e66574e28a5c5e5b478778f95ea55e46aa3f55ef674bf0cbcaefdb5cb3ce9f2a47aac8e59a3ae61a976882aeb1e5ef234b76d9019161927cf0d5861b",
                "0x677f82e302adb33eef647f4513714b4d7faf7defe11dd783861ded215eb0b280614738f8189c9a4759111182c6f2d3c7465aad9c51c074a63ea9970f097f74421b",
                "0x3b763a49a0807d41ae81fe5e511b6c446480de29436da9cedb8174fce02c487f3859b308117b1d1ef7fe0362cd73c5089977f70eae5b9af92deb9320a8e348661c"
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

    it("Register oracles in Factory", async function () {
        // register oracles
        await teleporttokenfactory.connect(owner).regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8");
        let isOracle = await teleporttokenfactory.connect(owner).oracles(
            "0x59023f49315113deb856106d05699a3a2dc78bb8"
        );
        expect(isOracle).to.be.true;
        await teleporttokenfactory.connect(owner).regOracle("0xbc25948d1dd62a5777ab33ffe3cc0e61107043be");
        isOracle = await teleporttokenfactory.connect(owner).oracles(
            "0xbc25948d1dd62a5777ab33ffe3cc0e61107043be"
        );
        expect(isOracle).to.be.true;
        await teleporttokenfactory.connect(owner).regOracle("0xfb18e6e108987aeb4f5f2b17a2b18790ffa8ba8b");
        isOracle = await teleporttokenfactory.connect(owner).oracles(
            "0xfb18e6e108987aeb4f5f2b17a2b18790ffa8ba8b"
        );
        expect(isOracle).to.be.true;
    });

    it("Create token with fee", async function () {
        // let balance = await ethers.provider.getBalance(addr1.address);
        // console.log(balance.toString());
        // console.log(addr1.address);
        let receipt = await teleporttokenfactory
            .connect(addr1)
            .create("DEWIE", "dewaldtokens", 18, "100000000000000000000", 1, 2, {
                from: addr1.address,
                value: ethers.utils.parseEther("0.01"),
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

    it("Oracles already registered", async function () {
        // register oracles
        // await newToken
        //   .connect(addr1)
        //   .regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8", {
        //     from: addr1.address,
        //   });
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
                "0x0301000000000000feef146290d5cc5865ffbf5e08520000000000000444455749450000020426b0ab0963ddf1aff3d545ff5849af2b2d84f9c500000000000000000000000000";
            let signatures = [
                "0xac83be8e7df8b6f5a9270e7cac5276cef83b701c1691de3af77f28acc0ade1822c3357e978e5eb84f02786c57e9aeea75efaa30c7ebc7dd316b997cdb7327b811b",
                "0xd5fe45373737a318819b0f716fcaa7a1bc180e77554bfb98ab9710edffe78593747ae0326e56aa580285d6df406bddce2db66e25e87f959fa8b795ffa34953241c",
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
