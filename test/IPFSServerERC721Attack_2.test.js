const IPFSServerERC721 = artifacts.require("IPFSServerERC721");
const IPFSServerERC721Attack_2 = artifacts.require("IPFSServerERC721Attack_2");
const BN = web3.utils.BN;

contract("IPFSServerERC721Attack_2", accounts => {
    /*it("block", async () => {
        const attack = await IPFSServerERC721Attack_2.deployed();

        return IPFSServerERC721.deployed().then(async () => {
            const attacker = accounts[0];

            //the attacker blocks the contract when he/she sends ether to the contract
            return await attack.attack({from: attacker, value: web3.utils.toWei("1", "ether")});

        }).then(async () => {}, async () => {});
    });*/
});