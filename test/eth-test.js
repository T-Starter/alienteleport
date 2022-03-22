const { expect } = require("chai");
const { ethers } = require("hardhat");

// describe("TeleportToken", function () {
//     let TeleportToken;
//     let teleporttoken;

//     before(async function () {
//         // Deploy contract
//         TeleportToken = await ethers.getContractFactory("TeleportToken");
//         teleporttoken = await TeleportToken.deploy(
//             "START",
//             "T-starter START",
//             4,
//             1000000000000,
//             2,
//             3
//         );
//         await teleporttoken.deployed();
//         // teleporttoken = await TeleportToken.attach("0xde2EEea2a7F9E9489C01aaF0530afd08Cfae45a7");
//         console.log(teleporttoken.address);
//     });

//     it("Oracle is registered", async function () {
//         // Register oracles
//         await teleporttoken.regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8");
//         let isOracle = await teleporttoken.oracles(
//             "0x59023f49315113deb856106d05699a3a2dc78bb8"
//         );
//         expect(isOracle).to.be.true;
//         await teleporttoken.regOracle("0xbc25948d1dd62a5777ab33ffe3cc0e61107043be");
//         isOracle = await teleporttoken.oracles(
//             "0xbc25948d1dd62a5777ab33ffe3cc0e61107043be"
//         );
//         expect(isOracle).to.be.true;
//         await teleporttoken.regOracle("0xfb18e6e108987aeb4f5f2b17a2b18790ffa8ba8b");
//         isOracle = await teleporttoken.oracles(
//             "0xfb18e6e108987aeb4f5f2b17a2b18790ffa8ba8b"
//         );
//         expect(isOracle).to.be.true;
//     });

//     it("Threshold is updated", async function () {
//         // update threshold to one
//         await teleporttoken.updateThreshold(1);
//         let threshold = await teleporttoken.threshold();
//         expect(threshold).to.be.equal(1);
//     });

//     it("Can claim", async function () {
//         let threw = false;
//         try {
//             let sigData =
//                 "0x04010000000000008ff3146290d5cc5865ffbf5e40420f00000000000444455749450000021226b0ab0963ddf1aff3d545ff5849af2b2d84f9c500000000000000000000000000";
//             let signatures = [
//                 "0xa9dd8299f6c84401536a0510a4f970669b9113eea7b2ce0ddb284567127d91be11b5d6c43eae735efa09d896241b80ab2f2f2379baec287c6424da14b2a413af1c",
//                 "0xa8fae3188f92292a772deb26721e79d76c004d260a1bd218ba8de80f9ef327a85806d4640d704d12a7c47fc4fe90040eeb4c611a09b58c15f6b5314c47c7e91e1c",
//             ];
//             await teleporttoken.claim(sigData, signatures);
//         } catch (error) {
//             threw = true;
//             console.log(error);
//         }
//         expect(threw).to.be.false;
//     });
// });

describe("TeleportTokenFactory", function () {
    let TeleportTokenFactory;
    let teleporttokenfactory;
    let owner, addr1, newowner;
    let newToken;
    let wrongSymbolToken;

    before(async function () {
        // Deploy contract
        [owner, addr1, newowner] = await ethers.getSigners();
        TeleportTokenFactory = await ethers.getContractFactory(
            "TeleportTokenFactory"
        );
        teleporttokenfactory = await TeleportTokenFactory.deploy();
        await teleporttokenfactory.connect(owner).deployed({ from: owner.address });
        // teleporttokenfactory = await TeleportTokenFactory.attach("0x24DE774a0685497fe8A5908Ef2F352C5bA14223C");
        // console.log("factory: ", teleporttokenfactory.address);
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

        let receipt2 = await teleporttokenfactory
            .connect(addr1)
            .create("TSQRL", "TSquirrels", 18, "100000000000000000000000", 1, 3, {
                from: addr1.address,
                value: ethers.utils.parseEther("0.01"),
            });
        let tokenAddress2 = await teleporttokenfactory.getTokenAddress(1);
        const TT2 = await ethers.getContractFactory("TeleportToken");
        wrongSymbolToken = await TT2.attach(tokenAddress2);

    });

    it("Has correct ownership", async function () {
        await newToken.connect(addr1).acceptOwnership({ from: addr1.address });
        let contractOwner = await newToken.owner();
        expect(contractOwner).to.be.equal(addr1.address);
    });

    // it("Oracles already registered", async function () {
    //     // register oracles
    //     // await newToken
    //     //   .connect(addr1)
    //     //   .regOracle("0x59023f49315113deb856106d05699a3a2dc78bb8", {
    //     //     from: addr1.address,
    //     //   });
    //     let isOracle = await newToken.oracles(
    //         "0x59023f49315113deb856106d05699a3a2dc78bb8"
    //     );
    //     expect(isOracle).to.be.true;
    // });

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

    it("Can claim token", async function () {
        let threw = false;
        try {
            let sigData =
                "0x1101000000000000dc2e166290d5cc5865ffbf5e085200000000000004444557494500000226b0ab0963ddf1aff3d545ff5849af2b2d84f9c50000000000000000000000000400";
            let signatures = [
                "0xff33facc708d4b03df94b06f70a62ff26e280f0327eebb6ef5bb4559bb23279d493e103576a9e26d574bc539693006e30c1b7f419861095e3e44b8a61984affb1c",
                "0xcacafc23521522dab523545acf9afd22a8e3f0c01dafe5f05e3f257883e1ca240f3fa3e783175c0dafda4290c63e3a4b004c1c11465ffac59e3d8569fc3436691c",
            ];
            await newToken.claim(sigData, signatures);
        } catch (error) {
            threw = true;
            console.log(error);
        }
        expect(threw).to.be.false;
    });

    it("Can't claim different token (symbols test)", async function () {
        let threw = false;
        try {
            let sigData =
                "0x3601000000000000f763396290d5cc5865ffbf5e102700000000000004424f4f4d00000003fb81bc1a4a2d82f8bf0496abae8f1fe1e1be61450000000000000000000000000400";
            let signatures = [
                "0x637eb8a8a5abac9386c09e5cbff0cc15084b865832c7242ce74af1fce2ab55a41a5d97045aa653543c38dd7bb2f1cbea5217c4fe94af204e3bc1c75aba1e4db61b",
                "0xd5e06b73b47e3d0932e9f2247d4a5073e0a0e04d8dc76699cddfb20e36eb334f5e3a0fe85af76b78308e43bea03b7ad538dcdb3719749cb0b9b97c6a824d12fa1c",
            ];
            await wrongSymbolToken.claim(sigData, signatures);
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
