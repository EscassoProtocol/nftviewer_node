const MailERC721 = artifacts.require("MailERC721");
const BN = web3.utils.BN;

contract("MailERC721", accounts => {
    it("creation block", async () => {
        const contract = await MailERC721.deployed();
        const abi = [{"constant":true,"inputs":[{"internalType":"address","name":"userAddress","type":"address"}],
            "name":"getMailBoxInfo",
            "outputs":[{"internalType":"uint256","name":"","type":"uint256"},
                {"internalType":"string","name":"","type":"uint256"},
                {"internalType":"uint256","name":"","type":"uint256"},
                {"internalType":"uint256","name":"","type":"uint256"},
                {"internalType":"uint256","name":"","type":"uint256"},
                {"internalType":"uint256","name":"","type":"uint256"},
                {"internalType":"uint256","name":"","type":"uint256"}],
            "payable":undefined,"stateMutability":"view","type":"function"}];

        const c = new web3.eth.Contract(abi, contract.address);
        const mailBoxInfo = await c.methods.getMailBoxInfo(accounts[0]).call();
        console.log("creationBlock "+mailBoxInfo[2]);
    });

    it("name and symbol", async () => {
        const contract = await MailERC721.deployed();
        assert.equal(await contract.name(), "Mail", 'name is correct');
        assert.equal(await contract.symbol(), "MAIL", 'symbol is correct');
    });

    it("getMailBoxInfo 1", async () => {
        const contract = await MailERC721.deployed();
        const mailBoxInfo = await contract.getMailBoxInfo(accounts[0]);
        const id = mailBoxInfo[0];
        const uri = mailBoxInfo[1];
        const price = mailBoxInfo[4];

        assert.equal(id, "0", "id is correct");
        assert.equal(uri, "", "uri is correct");
        assert.equal(price, web3.utils.toWei("0", "ether"), "price is correct");
    });

    it("getMailInfo 1", async () => {
        const contract = await MailERC721.deployed();
        const mailInfo = await contract.getMailInfo(accounts[0], 1);
        const totalIds = mailInfo[0];
        const uri = mailInfo[1];

        assert.equal(totalIds, "0", "totalIds is correct");
        assert.equal(uri, "", "uri is correct");
    });

    it("setFee 1", async () => {
        const contract = await MailERC721.deployed();

        await contract.setFee(web3.utils.toWei("1", "ether"), {from: accounts[0]});

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[0]);
        const price = mailBoxInfo[4];
        assert.equal(price, web3.utils.toWei("1", "ether").toString(), "price is correct");
    });

    it("setFee 2", async () => {
        const contract = await MailERC721.deployed();

        await contract.setFee(web3.utils.toWei("1", "ether"), {from: accounts[1]});

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[1]);
        const price = mailBoxInfo[4];
        assert.equal(price, web3.utils.toWei("1", "ether").toString(), "price is correct");
    });

    it("setFee 3", async () => {
        const contract = await MailERC721.deployed();

        await contract.setFee(web3.utils.toWei("1", "ether"), {from: accounts[2]});

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[2]);
        const price = mailBoxInfo[4];
        assert.equal(price, web3.utils.toWei("1", "ether").toString(), "price is correct");
    });

    it("setFee 4", async () => {
        const contract = await MailERC721.deployed();

        await contract.setFee(web3.utils.toWei("0", "ether"), {from: accounts[4]});

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[4]);
        const price = mailBoxInfo[4];
        assert.equal(price, web3.utils.toWei("0", "ether").toString(), "price is correct");
    });

    it("setFee 5", async () => {
        const contract = await MailERC721.deployed();

        await contract.setFee(web3.utils.toWei("1.5", "ether"), {from: accounts[5]});

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[5]);
        const price = mailBoxInfo[4];
        assert.equal(price, web3.utils.toWei("1.5", "ether").toString(), "price is correct");
    });

    it("cannot sendMail 1", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.methods['sendMail(address,string)'](accounts[2], "mail.com", {from: accounts[1], value: web3.utils.toWei("1", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot sendMail 2", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.methods['sendMail(address,string,string)'](accounts[1],
                "", "mail.com", {from: accounts[0], value: web3.utils.toWei("1", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot sendMail 3", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.methods['sendMail(address,string,string)'](accounts[1],
                "mailbox.com", "", {from: accounts[0], value: web3.utils.toWei("1", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("sendMail 1", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[0]);
        const beforeToBalance = await web3.eth.getBalance(accounts[1]);

        const receipt = await contract.methods['sendMail(address,string,string)'](accounts[1],
            "mailbox.com", "mail.com", {from: accounts[0], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[0]);
        const afterToBalance = await web3.eth.getBalance(accounts[1]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '1', 'id is correct');
        assert.equal(event.from, accounts[0].toString(), 'from is correct');
        assert.equal(event.to, accounts[1].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub(new BN(web3.utils.toWei("1", "ether"))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add(new BN(web3.utils.toWei("1", "ether"))).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[0], 1);
        assert.equal(mail, "mail.com", "mail from is correct");
        mail = await contract.getMail(accounts[1], 1);
        assert.equal(mail, "mail.com", "mail to is correct");

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[0]);
        const price = mailBoxInfo[4];
        assert.equal(price, web3.utils.toWei("1", "ether").toString(), "price is correct");
    });

    it("cannot sendMail 4", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.methods['sendMail(address,string,string)'](accounts[1],
                "mailbox.com", "mail.com", {from: accounts[0], value: web3.utils.toWei("1", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("getMailBoxInfo 2", async () => {
        const contract = await MailERC721.deployed();
        const mailBoxInfo = await contract.getMailBoxInfo(accounts[0]);
        const id = mailBoxInfo[0];
        const uri = mailBoxInfo[1];
        const price = mailBoxInfo[4];

        assert.equal(id, "1", "id is correct");
        assert.equal(uri, "mailbox.com", "uri is correct");
        assert.equal(price, web3.utils.toWei("1", "ether"), "price is correct");
    });

    it("getMailInfo 2", async () => {
        const contract = await MailERC721.deployed();
        const mailInfo = await contract.getMailInfo(accounts[1], 1);
        const totalIds = mailInfo[0];
        const uri = mailInfo[1];

        assert.equal(totalIds, "1", "totalIds is correct");
        assert.equal(uri, "mail.com", "uri is correct");
    });

    it("sendMail 2", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[0]);
        const beforeToBalance = await web3.eth.getBalance(accounts[1]);

        const receipt = await contract.methods['sendMail(address,string)'](accounts[1], "mail2.com", {from: accounts[0]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[0]);
        const afterToBalance = await web3.eth.getBalance(accounts[1]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '2', 'id is correct');
        assert.equal(event.from, accounts[0].toString(), 'from is correct');
        assert.equal(event.to, accounts[1].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[0], 2);
        assert.equal(mail, "mail2.com", "mail from is correct");
        mail = await contract.getMail(accounts[1], 2);
        assert.equal(mail, "mail2.com", "mail to is correct");
    });

    it("filterMail 1", async () => {
        const contract = await MailERC721.deployed();
        let filter = await contract.filterMail(accounts[0], accounts[1], 1);
        const totalSent = filter[0];
        const id1 = filter[1];
        filter = await contract.filterMail(accounts[0], accounts[1], 2);
        const id2 = filter[1];

        assert.equal(totalSent, "2", "totalSent is correct");
        assert.equal(id1, "1", "id1 is correct");
        assert.equal(id2, "2", "id2 is correct");
    });

    it("filterMail 2", async () => {
        const contract = await MailERC721.deployed();
        const filter = await contract.filterMail(accounts[1], accounts[0], 1);
        const totalSent = filter[0];
        const id = filter[1];

        assert.equal(totalSent, "0", "totalSent is correct");
        assert.equal(id, "0", "id is correct");
    });

    it("sendMail 3", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[1]);
        const beforeToBalance = await web3.eth.getBalance(accounts[0]);

        const receipt = await contract.methods['sendMail(address,string,string)'](accounts[0],
            "mailbox2.com", "mail3.com", {from: accounts[1]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[1]);
        const afterToBalance = await web3.eth.getBalance(accounts[0]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '3', 'id is correct');
        assert.equal(event.from, accounts[1].toString(), 'from is correct');
        assert.equal(event.to, accounts[0].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[1], 3);
        assert.equal(mail, "mail3.com", "mail from is correct");
        mail = await contract.getMail(accounts[0], 3);
        assert.equal(mail, "mail3.com", "mail to is correct");

        const mailBoxUri = await contract.tokenURI(2);
        assert.equal(mailBoxUri, "mailbox2.com", "mailBoxUri is correct");
    });

    it("filterMail 3", async () => {
        const contract = await MailERC721.deployed();
        let filter = await contract.filterMail(accounts[0], accounts[1], 1);
        const totalSent = filter[0];
        const id1 = filter[1];
        filter = await contract.filterMail(accounts[0], accounts[1], 2);
        const id2 = filter[1];

        assert.equal(totalSent, "2", "totalSent is correct");
        assert.equal(id1, "1", "id1 is correct");
        assert.equal(id2, "2", "id2 is correct");
    });

    it("filterMail 4", async () => {
        const contract = await MailERC721.deployed();
        const filter = await contract.filterMail(accounts[1], accounts[0], 1);
        const totalSent = filter[0];
        const id = filter[1];

        assert.equal(totalSent, "1", "totalSent is correct");
        assert.equal(id, "3", "id is correct");
    });

    it("cannot transfer 1", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.methods['safeTransferFrom(address,address,uint256,bytes)'](accounts[0], accounts[1], 2, [], {from: accounts[0]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(Object.values(e.data)[0].reason);
        });
    });

    it("cannot transfer 2", async () => {
         return MailERC721.deployed().then(async contract => {
             return contract.methods['safeTransferFrom(address,address,uint256)'](accounts[1], accounts[0], 2, {from: accounts[1]});
         }).then(() => {
             assert.ok(false);
         }, e => {
             assert.ok(true);
             console.log(Object.values(e.data)[0].reason);
         });
     });

    it("cannot transfer 3", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.transferFrom(accounts[0], accounts[1], 2, {from: accounts[0]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(Object.values(e.data)[0].reason);
        });
    });

     it("burnMail", async () => {
         const contract = await MailERC721.deployed();

         const beforeFromBalance = await contract.balanceOf(accounts[1]);

         const receipt = await contract.burnMail(1, {from: accounts[1]});

         const afterFromBalance = await contract.balanceOf(accounts[1]);

         const event = receipt.logs[0].args;
         assert.equal(event.tokenId, '1', 'id is correct');
         assert.equal(event.from, accounts[1].toString(), 'from is correct');
         assert.equal(event.to, '0x0000000000000000000000000000000000000000', 'to is correct');
         assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(1))).toString(), 'fromBalance is correct');
     });

    it("getMailInfo 3", async () => {
        const contract = await MailERC721.deployed();
        const mailInfo = await contract.getMailInfo(accounts[1], 1);
        const totalIds = mailInfo[0];
        const uri = mailInfo[1];

        assert.equal(totalIds, "3", "totalIds is correct");
        assert.equal(uri, "", "uri is correct");
    });

    it("sendMail 4", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[2]);
        const beforeToBalance = await web3.eth.getBalance(accounts[1]);

        const receipt = await contract.methods['sendMail(address,string,string)'](accounts[1],
            "mailbox3.com", "mail4.com", {from: accounts[2], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[2]);
        const afterToBalance = await web3.eth.getBalance(accounts[1]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '4', 'id is correct');
        assert.equal(event.from, accounts[2].toString(), 'from is correct');
        assert.equal(event.to, accounts[1].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub(new BN(web3.utils.toWei("1", "ether"))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add(new BN(web3.utils.toWei("1", "ether"))).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[2], 1);
        assert.equal(mail, "mail4.com", "mail from is correct");
        mail = await contract.getMail(accounts[1], 4);
        assert.equal(mail, "mail4.com", "mail to is correct");

        const mailBoxUri = await contract.tokenURI(3);
        assert.equal(mailBoxUri, "mailbox3.com", "mailBoxUri is correct");
    });

    it("cannot burnMailBox", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.burnMailBox({from: accounts[3]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("burnMailBox", async () => {
        const contract = await MailERC721.deployed();

        await contract.burnMailBox({from: accounts[1]});

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[1]);
        const id = mailBoxInfo[0];
        const uriMailBox = mailBoxInfo[1];
        const price = mailBoxInfo[4];

        assert.equal(id, "0", "id is correct");
        assert.equal(uriMailBox, "", "uriMailBox is correct");
        assert.equal(price, web3.utils.toWei("0", "ether"), "price is correct");

        const mailInfo = await contract.getMailInfo(accounts[1], 2);
        const totalIds = mailInfo[0];
        const uriMail = mailInfo[1];

        assert.equal(totalIds, "0", "totalIds is correct");
        assert.equal(uriMail, "", "uriMail is correct");
    });

    it("sendMail 5", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[3]);
        const beforeToBalance = await web3.eth.getBalance(accounts[4]);

        const receipt = await contract.methods['sendMail(address,string,string)'](accounts[4],
            "mailbox.com", "mail.com", {from: accounts[3]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[3]);
        const afterToBalance = await web3.eth.getBalance(accounts[4]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '5', 'id is correct');
        assert.equal(event.from, accounts[3].toString(), 'from is correct');
        assert.equal(event.to, accounts[4].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub(new BN(web3.utils.toWei("0", "ether"))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add(new BN(web3.utils.toWei("0", "ether"))).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[3], 1);
        assert.equal(mail, "mail.com", "mail from is correct");
        mail = await contract.getMail(accounts[4], 1);
        assert.equal(mail, "mail.com", "mail to is correct");

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[4]);
        const price = mailBoxInfo[4];
        assert.equal(price, web3.utils.toWei("0", "ether").toString(), "price is correct");
    });

    it("setWhiteListAddress 1", async () => {
        const contract = await MailERC721.deployed();

        await contract.setWhiteListAddress(accounts[3], false, {from: accounts[4]});

        const status = await contract.getWhiteListAddress(accounts[3], accounts[4]);
        assert.equal(status, false, "status is correct");
    });

    it("cannot sendMail 5", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.methods['sendMail(address,string)'](accounts[4], "mail.com", {from: accounts[3], value: web3.utils.toWei("1", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("setWhiteListAddress 2", async () => {
        const contract = await MailERC721.deployed();

        await contract.setWhiteListAddress(accounts[3], true, {from: accounts[4]});

        const status = await contract.getWhiteListAddress(accounts[3], accounts[4]);
        assert.equal(status, true, "status is correct");
    });

    it("sendMail 6", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[3]);
        const beforeToBalance = await web3.eth.getBalance(accounts[4]);

        const receipt = await contract.methods['sendMail(address,string)'](accounts[4], "mail.com", {from: accounts[3]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[3]);
        const afterToBalance = await web3.eth.getBalance(accounts[4]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '6', 'id is correct');
        assert.equal(event.from, accounts[3].toString(), 'from is correct');
        assert.equal(event.to, accounts[4].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub(new BN(web3.utils.toWei("0", "ether"))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add(new BN(web3.utils.toWei("0", "ether"))).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[3], 1);
        assert.equal(mail, "mail.com", "mail from is correct");
        mail = await contract.getMail(accounts[4], 2);
        assert.equal(mail, "mail.com", "mail to is correct");
    });

    it("cannot sendMail 6", async () => {
        return MailERC721.deployed().then(async contract => {
            return contract.methods['sendMail(address,string)'](accounts[5], "mail.com", {from: accounts[0], value: web3.utils.toWei("1", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("getMailInfo 4", async () => {
        const contract = await MailERC721.deployed();
        const mailInfo = await contract.getMailInfo(accounts[9], 0);
        const totalMails = mailInfo[4];
        assert.equal(totalMails, (new BN("6")).toString(), "totalMails is correct");
    });

    it("setFee 6", async () => {
        const contract = await MailERC721.deployed();

        await contract.setFee(web3.utils.toWei("1", "ether"), {from: accounts[4]});

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[4]);
        const price = mailBoxInfo[4];
        assert.equal(price, web3.utils.toWei("1", "ether").toString(), "price is correct");
    });

    it("sendMail 7", async () => {
        const contract = await MailERC721.deployed();

        const beforeBalance = await web3.eth.getBalance(accounts[4]);

        const receipt = await contract.methods['sendMail(address,string,string)'](accounts[4],
            "mailbox.com", "mail.com", {from: accounts[4], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterBalance = await web3.eth.getBalance(accounts[4]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '7', 'id is correct');
        assert.equal(event.from, accounts[4].toString(), 'from is correct');
        assert.equal(event.to, accounts[4].toString(), 'to is correct');
        assert.equal(afterBalance, (new BN(beforeBalance)).sub((new BN(totalGas))).toString(), 'balance is correct');

        const mail = await contract.getMail(accounts[4], 3);
        assert.equal(mail, "mail.com", "mail from is correct");
    });

    it("getMailBoxInfo 3", async () => {
        const contract = await MailERC721.deployed();
        const mailBoxInfo = await contract.getMailBoxInfo(accounts[4]);
        const id = mailBoxInfo[0];
        const uri = mailBoxInfo[1];
        const price = mailBoxInfo[4];
        const isPaid = mailBoxInfo[5];
        const totalMailBoxes = mailBoxInfo[6];

        assert.equal(id, "5", "id is correct");
        assert.equal(uri, "mailbox.com", "uri is correct");
        assert.equal(price, web3.utils.toWei("1", "ether"), "price is correct");
        assert.equal(isPaid, false, "isPaid is correct");
        assert.equal(totalMailBoxes, 5, "totalMailBoxes is correct");
    });

    it("setIsPaid", async () => {
        const contract = await MailERC721.deployed();

        await contract.setIsPaid(true, {from: accounts[4]});

        const mailBoxInfo = await contract.getMailBoxInfo(accounts[4]);
        const isPaid = mailBoxInfo[5];
        assert.equal(isPaid, true, "isPaid is correct");
    });

    it("sendMail 8", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[3]);
        const beforeToBalance = await web3.eth.getBalance(accounts[4]);

        const receipt = await contract.methods['sendMail(address,string)'](accounts[4], "mail.com",
            {from: accounts[3], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[3]);
        const afterToBalance = await web3.eth.getBalance(accounts[4]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '8', 'id is correct');
        assert.equal(event.from, accounts[3].toString(), 'from is correct');
        assert.equal(event.to, accounts[4].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub(new BN(web3.utils.toWei("1", "ether"))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add(new BN(web3.utils.toWei("1", "ether"))).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[3], 2);
        assert.equal(mail, "mail.com", "mail from is correct");
        mail = await contract.getMail(accounts[4], 4);
        assert.equal(mail, "mail.com", "mail to is correct");
    });

    it("setFreeMail 1", async () => {
        const contract = await MailERC721.deployed();

        await contract.setFreeMail(accounts[3], true, {from: accounts[4]});

        const isFree = await contract.isFreeMail(accounts[3], accounts[4]);
        assert.equal(isFree, true, "isFree is correct");
    });

    it("sendMail 9", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[3]);
        const beforeToBalance = await web3.eth.getBalance(accounts[4]);

        const receipt = await contract.methods['sendMail(address,string)'](accounts[4], "mail.com", {from: accounts[3]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[3]);
        const afterToBalance = await web3.eth.getBalance(accounts[4]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '9', 'id is correct');
        assert.equal(event.from, accounts[3].toString(), 'from is correct');
        assert.equal(event.to, accounts[4].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[3], 3);
        assert.equal(mail, "mail.com", "mail from is correct");
        mail = await contract.getMail(accounts[4], 5);
        assert.equal(mail, "mail.com", "mail to is correct");
    });

    it("setFreeMail 2", async () => {
        const contract = await MailERC721.deployed();

        await contract.setFreeMail(accounts[3], false, {from: accounts[4]});

        const isFree = await contract.isFreeMail(accounts[3], accounts[4]);
        assert.equal(isFree, false, "isFree is correct");
    });

    it("sendMail 10", async () => {
        const contract = await MailERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[3]);
        const beforeToBalance = await web3.eth.getBalance(accounts[4]);

        const receipt = await contract.methods['sendMail(address,string)'](accounts[4], "mail.com",
            {from: accounts[3], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[3]);
        const afterToBalance = await web3.eth.getBalance(accounts[4]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '10', 'id is correct');
        assert.equal(event.from, accounts[3].toString(), 'from is correct');
        assert.equal(event.to, accounts[4].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub(new BN(web3.utils.toWei("1", "ether"))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add(new BN(web3.utils.toWei("1", "ether"))).toString(), 'toBalance is correct');

        let mail = await contract.getMail(accounts[3], 4);
        assert.equal(mail, "mail.com", "mail from is correct");
        mail = await contract.getMail(accounts[4], 6);
        assert.equal(mail, "mail.com", "mail to is correct");
    });
});