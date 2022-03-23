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
        console.log("tokenAddress:", tokenAddress);
        console.log("useraddress:", addr1.address);

        let receipt2 = await teleporttokenfactory
            .connect(addr1)
            .create("TSQRL", "TSquirrels", 18, "100000000000000000000000", 1, 2, {
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

    // TODO generate the data and sig
    it("Can claim token", async function () {
        let threw = false;
        try {
            let sigData =
                "0x40010000000000008ac83a6290d5cc5865ffbf5e204e000000000000044445574945000003fb81bc1a4a2d82f8bf0496abae8f1fe1e1be614500000000000000000000000000395a6021430e6f724c9e7382cf2693cb3a07bbe604";
            let signatures = [
                "0x0ba9df8874d3e332619baab7c01189274c4029f1953262f1bf8fcf736fbf64f13b6490e66fd4366f5cb4585b48521bd2be8653d00007cf90e099290db2450a521c",
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
                "0x40010000000000008ac83a6290d5cc5865ffbf5e204e000000000000044445574945000003fb81bc1a4a2d82f8bf0496abae8f1fe1e1be614500000000000000000000000000395a6021430e6f724c9e7382cf2693cb3a07bbe604";
            let signatures = [
                "0x0ba9df8874d3e332619baab7c01189274c4029f1953262f1bf8fcf736fbf64f13b6490e66fd4366f5cb4585b48521bd2be8653d00007cf90e099290db2450a521c",
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
