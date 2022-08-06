const MailERC721 = artifacts.require("MailERC721");
const MailERC721Attack_1 = artifacts.require("MailERC721Attack_1");
const BN = web3.utils.BN;

contract("MailERC721Attack_1", accounts => {
    it("No reentrancy", async () => {
        const attack = await MailERC721Attack_1.deployed();
        const ETHER_DECIMALS = 1000000000000000000;

        return MailERC721.deployed().then(async contract => {
            const sender = accounts[0];
            const receiver = accounts[1];
            const attacker = accounts[2];

            const attackBeforeBalance = (parseInt(await web3.eth.getBalance(attack.address)) / ETHER_DECIMALS);
            console.log("before transfer Attack balance "+attackBeforeBalance);

            //a receiver creates hers/his mailbox
            await contract.methods['sendMail(address,string,string)'](receiver, "mailBoxUri", "mailUri", {from: receiver});

            //a sender creates hers/his mailbox
            await contract.methods['sendMail(address,string,string)'](sender, "mailBoxUri", "mailUri", {from: sender});

            //the sender sends a mail to the receiver, sending 5 ethers to the contract
            await contract.methods['sendMail(address,string)'](receiver, "mailUri", {from: sender, value: web3.utils.toWei("5", "ether")});

            //the attacker tries to steal the 5 ethers from the contract
            return await attack.attack({from: attacker, value: web3.utils.toWei("1", "ether")});

        }).then(async () => {
            const attackAfterBalance = (parseInt(await web3.eth.getBalance(attack.address)) / ETHER_DECIMALS);
            console.log("after hack Attack balance "+attackAfterBalance);
            assert.equal(attackAfterBalance, 0, "ERROR: REENTRANCY!");
        }, async e => {
            const attackAfterBalance = (parseInt(await web3.eth.getBalance(attack.address)) / ETHER_DECIMALS);
            console.log("after hack Attack balance "+attackAfterBalance);
            assert.ok(true);
            console.log(e.reason);
        });
    });
});