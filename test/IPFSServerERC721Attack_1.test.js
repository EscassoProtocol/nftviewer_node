const IPFSServerERC721 = artifacts.require("IPFSServerERC721");
const IPFSServerERC721Attack_1 = artifacts.require("IPFSServerERC721Attack_1");
const BN = web3.utils.BN;

contract("IPFSServerERC721Attack_1", accounts => {
    it("No reentrancy", async () => {
        const attack = await IPFSServerERC721Attack_1.deployed();
        const ETHER_DECIMALS = 1000000000000000000;

        return IPFSServerERC721.deployed().then(async contract => {
            const server = accounts[0];
            const leaser = accounts[1];
            const attacker = accounts[2];

            const attackBeforeBalance = (parseInt(await web3.eth.getBalance(attack.address)) / ETHER_DECIMALS);
            console.log("before transfer Attack balance "+attackBeforeBalance);

            //an user mints a server
            await contract.mintServer("uri", web3.utils.toWei("1", "ether"), {from: server});

            //an user leases a server sending 5 ethers to the contract
            await contract.leaseServer(1, "0x6cc26f47a5f21a9669d57976dbdd6aa5d4159f7ca76984e44764266e3063999f", {from: leaser, value: web3.utils.toWei("5", "ether")});

            //the attacker tries to steal the 5 ethers from the contract
            return await attack.attack({from: attacker, value: web3.utils.toWei("1", "ether")});

        }).then(async () => {
            const attackAfterBalance = (parseInt(await web3.eth.getBalance(attack.address)) / ETHER_DECIMALS);
            console.log("after hack Attack balance "+attackAfterBalance);
            assert.equal(attackAfterBalance, 1, "ERROR: REENTRANCY!");
        }, async e => {
            const attackAfterBalance = (parseInt(await web3.eth.getBalance(attack.address)) / ETHER_DECIMALS);
            console.log("after hack Attack balance "+attackAfterBalance);
            assert.ok(true);
            console.log(e.reason);
        });
    });
});