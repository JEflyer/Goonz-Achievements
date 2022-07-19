const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Achievements", function() {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshopt in every test.
    // async function deployOneYearLockFixture() {
    //   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    //   const ONE_GWEI = 1_000_000_000;

    //   const lockedAmount = ONE_GWEI;
    //   const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    //   // Contracts are deployed using the first signer/account by default
    //   const [owner, otherAccount] = await ethers.getSigners();

    //   const Lock = await ethers.getContractFactory("Lock");
    //   const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    //   return { lock, unlockTime, lockedAmount, owner, otherAccount };
    // }

    async function setup() {


        const _strings = [
            "1",
            "2",
            "3",
            "4",
            "5"
        ]

        const [deployer, addr1, addr2] = await ethers.getSigners()

        const achievements = await ethers.getContractFactory("Acheivements", deployer)

        const Acheivements = await achievements.deploy(
            "Name",
            "Sym",
            _strings,
            "Base",
            addr1.address
        )

        await Acheivements.deployed()

        return { _strings, deployer, addr1, addr2, Acheivements }
    }

    describe("Testing", function() {
        it("Should allow a user to get an achievement if they have permission", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            let payload = ethers.utils.defaultAbiCoder.encode(["string", "address"], [_strings[0], addr2.address]);

            let payloadHash = ethers.utils.keccak256(payload);

            let signature = await addr1.signMessage(ethers.utils.arrayify(payloadHash));
            let sig = ethers.utils.splitSignature(signature);

            expect(await Acheivements.connect(addr2).unlockAcheivement(
                0,
                payloadHash,
                sig.v,
                sig.r,
                sig.s
            ))
        });

        it("Should give the correct Acheivement string for a minted NFT ", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            let payload = ethers.utils.defaultAbiCoder.encode(["string", "address"], [_strings[0], addr2.address]);

            let payloadHash = ethers.utils.keccak256(payload);

            let signature = await addr1.signMessage(ethers.utils.arrayify(payloadHash));
            let sig = ethers.utils.splitSignature(signature);

            await Acheivements.connect(addr2).unlockAcheivement(
                0,
                payloadHash,
                sig.v,
                sig.r,
                sig.s
            )

            expect(await Acheivements.getAchievement(1)).to.be.equal(_strings[0])
        });

        it("Should not allow a user to get an achievement if they don't have permission", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            let payload = ethers.utils.defaultAbiCoder.encode(["string", "address"], [_strings[0], addr1.address]);

            let payloadHash = ethers.utils.keccak256(payload);

            let signature = await addr1.signMessage(ethers.utils.arrayify(payloadHash));
            let sig = ethers.utils.splitSignature(signature);

            // DAO.connect(deployer).updateSig(payloadHash, sig.v, sig.r, sig.s)

            expect(Acheivements.connect(addr2).unlockAcheivement(
                0,
                payloadHash,
                sig.v,
                sig.r,
                sig.s
            )).to.be.revertedWith("ERR:WM")
        });

        it("Should allow the admin to change the admin on the contract", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            expect(await Acheivements.connect(deployer).changeAdmin(addr1.address))
        });

        it("Should not allow an address other than the admin to change the admin on the contract", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            expect(Acheivements.connect(addr1).changeAdmin(addr1.address)).to.be.revertedWith("ERR:NA")
        });

        it("Should allow the admin to change the permission giver on the contract", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            expect(await Acheivements.connect(deployer).changePermissionGiver(addr1.address))
        });

        it("Should not allow an address other than the admin to change the permission giver on the contract", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            expect(Acheivements.connect(addr1).changePermissionGiver(addr1.address)).to.be.revertedWith("ERR:NA")
        });

        it("Should allow the admin to add a new achievement", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            expect(await Acheivements.connect(deployer).addNewAcheivement("6"))
        });

        it("Should allow the admin to add a new achievement & then unlock it", async function() {
            const { _strings, deployer, addr1, addr2, Acheivements } = await loadFixture(setup);

            await Acheivements.connect(deployer).addNewAcheivement("6")

            let payload = ethers.utils.defaultAbiCoder.encode(["string", "address"], ["6", addr2.address]);

            let payloadHash = ethers.utils.keccak256(payload);

            let signature = await addr1.signMessage(ethers.utils.arrayify(payloadHash));
            let sig = ethers.utils.splitSignature(signature);

            expect(await Acheivements.connect(addr2).unlockAcheivement(
                5,
                payloadHash,
                sig.v,
                sig.r,
                sig.s
            ))
        });
    });
});