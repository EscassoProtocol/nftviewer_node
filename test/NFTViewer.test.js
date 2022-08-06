const NFTViewer = artifacts.require("NFTViewer");
const BN = web3.utils.BN;

contract("NFTViewer", accounts => {
    it("cannot setVersionURI 1", async () => {
        return NFTViewer.deployed().then(async contract => {
            return contract.setVersionURI("", {from: accounts[0]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot setVersionURI 2", async () => {
        return NFTViewer.deployed().then(async contract => {
            return contract.setVersionURI("test", {from: accounts[1]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("setVersionURI", async () => {
        const contract = await NFTViewer.deployed();

        await contract.setVersionURI("version.com");

        const versionURI = await contract.getVersionURI();
        assert.equal(versionURI, "version.com", "version is correct");
    });
});