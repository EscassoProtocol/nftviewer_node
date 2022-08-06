const IPFSServerERC721 = artifacts.require("IPFSServerERC721");
const BN = web3.utils.BN;

contract("IPFSServerERC721", accounts => {
    it("mintServer 1", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[0]);

        const receipt = await contract.mintServer("http:///127.0.0.1:3000/ipfs", web3.utils.toWei("1", "ether"), {from: accounts[0]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[0]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '1', 'id is correct');
        assert.equal(event.from, accounts[0].toString(), 'from is correct');
        assert.equal(event.to, accounts[0].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');

        const uri = await contract.tokenURI(1);
        assert.equal(uri, "http:///127.0.0.1:3000/ipfs", "uri is correct");
    });

    it("getServerSettings 1", async () => {
        const contract = await IPFSServerERC721.deployed();

        const settings = await contract.getServerSettings(1, 0);
        const owner = settings[0];
        const tax = settings[1];
        const userId = settings[2];
        const isPremium = settings[3];
        const minimumFee = settings[5];

        assert.equal(owner, accounts[0], 'owner is correct');
        assert.equal(tax, web3.utils.toWei("1", "ether").toString(), "tax is correct");
        assert.equal(userId, 0, 'userId is correct');
        assert.equal(isPremium, false, 'isPremium is correct');
        assert.equal(minimumFee, web3.utils.toWei("0.001", "ether").toString(), 'minimumFee is correct');
    });

    it("leaseServer 1", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[1]);
        const beforeToBalance = await web3.eth.getBalance(accounts[0]);

        const receipt = await contract.leaseServer(1, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
            {from: accounts[1], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[1]);
        const afterToBalance = await web3.eth.getBalance(accounts[0]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(web3.utils.toWei("1", "ether")))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add((new BN(web3.utils.toWei("1", "ether")))).toString(), 'toBalance is correct');

        const settings = await contract.getServerSettings(1, 1);
        const userAddress = settings[2];
        const isPremium = settings[3];
        assert.equal(userAddress, accounts[1], 'userAddress is correct');
        assert.equal(isPremium, false, "isPremium is correct");

        const serverId = await contract.getServerId(accounts[1]);
        assert.equal(serverId, 1, 'serverId is correct');
    });

    it("cannot leaseServer 1", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.leaseServer(1, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
                {from: accounts[1], value: web3.utils.toWei("1", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("checkProof 1", async () => {
        const contract = await IPFSServerERC721.deployed();

        const isValid = await contract.checkProof(1, 1, ["0x044852b2a670ade5407e78fb2863c51de9fcb96542a07186fe3aeda6bb8a116d","0xa2599cd4778e8cd8b3e83ee85b7aa6cf95199ae73cf30fc78b2e56bf4185dce2"]);

        assert.equal(isValid, false, 'isValid is correct');
    });

    it("checkProof 2", async () => {
        const contract = await IPFSServerERC721.deployed();

        const isValid = await contract.checkProof(2, 1, ["0x044852b2a670ade5407e78fb2863c51de9fcb96542a07186fe3aeda6bb8a116d","0xa2599cd4778e8cd8b3e83ee85b7aa6cf95199ae73cf30fc78b2e56bf4185dce2"]);

        assert.equal(isValid, false, 'isValid is correct');
    });

    it("checkProof 3", async () => {
        const contract = await IPFSServerERC721.deployed();

        const isValid = await contract.checkProof(1, 2, ["0x044852b2a670ade5407e78fb2863c51de9fcb96542a07186fe3aeda6bb8a116d","0xa2599cd4778e8cd8b3e83ee85b7aa6cf95199ae73cf30fc78b2e56bf4185dce2"]);

        assert.equal(isValid, false, 'isValid is correct');
    });

    it("checkProof 4", async () => {
        const contract = await IPFSServerERC721.deployed();

        const isValid = await contract.checkProof(1, 1, ["0x144852b2a670ade5407e78fb2863c51de9fcb96542a07186fe3aeda6bb8a116d","0xa2599cd4778e8cd8b3e83ee85b7aa6cf95199ae73cf30fc78b2e56bf4185dce2"]);

        assert.equal(isValid, false, 'isValid is correct');
    });

    it("cannot mintServer 1", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.mintServer("", web3.utils.toWei("1", "ether"), {from: accounts[0]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot setServerSettings 1", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.setServerSettings(2, "server.com", web3.utils.toWei("1", "ether"), {from: accounts[1]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot setServerSettings 2", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.setServerSettings(1, "", web3.utils.toWei("1", "ether"), {from: accounts[0]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot leaseServer 2", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.leaseServer(1, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
                {from: accounts[2], value: web3.utils.toWei("0", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("safeTransferFrom 1", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[0]);
        const beforeToBalance = await web3.eth.getBalance(accounts[2]);

        const receipt = await contract.methods['safeTransferFrom(address,address,uint256,bytes)'](accounts[0], accounts[2], 1, [], {from: accounts[0]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[0]);
        const afterToBalance = await web3.eth.getBalance(accounts[2]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).toString(), 'toBalance is correct');

        const ownerOf = await contract.ownerOf(1);
        assert.equal(ownerOf, accounts[2].toString(), 'ownerOf is correct');
    });

    it("safeTransferFrom 2", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[2]);
        const beforeToBalance = await web3.eth.getBalance(accounts[3]);

        const receipt = await contract.methods['safeTransferFrom(address,address,uint256)'](accounts[2], accounts[3], 1, {from: accounts[2]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[2]);
        const afterToBalance = await web3.eth.getBalance(accounts[3]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).toString(), 'toBalance is correct');

        const ownerOf = await contract.ownerOf(1);
        assert.equal(ownerOf, accounts[3].toString(), 'ownerOf is correct');
    });

    it("transferFrom", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[3]);
        const beforeToBalance = await web3.eth.getBalance(accounts[4]);

        const receipt = await contract.transferFrom(accounts[3], accounts[4], 1, {from: accounts[3]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[3]);
        const afterToBalance = await web3.eth.getBalance(accounts[4]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).toString(), 'toBalance is correct');

        const ownerOf = await contract.ownerOf(1);
        assert.equal(ownerOf, accounts[4].toString(), 'ownerOf is correct');
    });

    it("burn", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await contract.balanceOf(accounts[4]);

        const receipt = await contract.burn(1, {from: accounts[4]});

        const afterFromBalance = await contract.balanceOf(accounts[4]);

        const event = receipt.logs[0].args;
        assert.equal(event.tokenId, '1', 'id is correct');
        assert.equal(event.from, accounts[4].toString(), 'from is correct');
        assert.equal(event.to, '0x0000000000000000000000000000000000000000', 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(1))).toString(), 'fromBalance is correct');
    });

    it("getServerSettings 2", async () => {
        const contract = await IPFSServerERC721.deployed();

        const settings = await contract.getServerSettings(1, 0);
        const owner = settings[0];
        const tax = settings[1];

        assert.equal(owner, "0x0000000000000000000000000000000000000000", 'owner is correct');
        assert.equal(tax, web3.utils.toWei("0", "ether").toString(), "tax is correct");
    });

    it("cannot leaseServer 3", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.leaseServer(1, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
                {from: accounts[4], value: web3.utils.toWei("1", "ether")});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot safeTransferFrom 1", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.methods['safeTransferFrom(address,address,uint256,bytes)'](accounts[4], accounts[5], 1, [], {from: accounts[4]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot safeTransferFrom 2", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.methods['safeTransferFrom(address,address,uint256)'](accounts[4], accounts[5], 1, {from: accounts[4]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot transferFrom", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.methods['transferFrom(address,address,uint256)'](accounts[4], accounts[5], 1, {from: accounts[4]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("mintServer 2", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[5]);

        const receipt = await contract.mintServer("http:///127.0.0.2:3000/ipfs", web3.utils.toWei("1", "ether"), {from: accounts[5]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[5]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '2', 'id is correct');
        assert.equal(event.from, accounts[5].toString(), 'from is correct');
        assert.equal(event.to, accounts[5].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');

        const uri = await contract.tokenURI(2);
        assert.equal(uri, "http:///127.0.0.2:3000/ipfs", "uri is correct");
    });

    it("leaseServer 2", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[6]);
        const beforeToBalance = await web3.eth.getBalance(accounts[5]);

        const receipt = await contract.leaseServer(2, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
            {from: accounts[6],value: web3.utils.toWei("10", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[6]);
        const afterToBalance = await web3.eth.getBalance(accounts[5]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(web3.utils.toWei("10", "ether")))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add((new BN(web3.utils.toWei("10", "ether")))).toString(), 'toBalance is correct');

        const settings = await contract.getServerSettings(2, 1);
        const userAddress = settings[2];
        const isPremium = settings[3];
        assert.equal(userAddress, accounts[6], 'userAddress is correct');
        assert.equal(isPremium, true, "isPremium is correct");

        const userId = await contract.getUserId(2, accounts[6]);
        assert.equal(userId, 1, 'userId is correct');

        const serverId = await contract.getServerId(accounts[6]);
        assert.equal(serverId, 2, 'serverId is correct');
    });

    it("cannot mintServer 2", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.mintServer("http:///127.0.0.2:3000/ipfs", web3.utils.toWei("0", "ether"), {from: accounts[6]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot setServerSettings 3", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.setServerSettings(2, "http:///127.0.0.2:3000/ipfs", web3.utils.toWei("0", "ether"), {from: accounts[5]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("leaseServer 3", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[7]);
        const beforeToBalance = await web3.eth.getBalance(accounts[5]);

        const receipt = await contract.leaseServer(2, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
            {from: accounts[7], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[7]);
        const afterToBalance = await web3.eth.getBalance(accounts[5]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(web3.utils.toWei("1", "ether")))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add((new BN(web3.utils.toWei("1", "ether")))).toString(), 'toBalance is correct');

        const settings = await contract.getServerSettings(2, 2);
        const userAddress = settings[2];
        const isPremium = settings[3];
        assert.equal(userAddress, accounts[7], 'userAddress is correct');
        assert.equal(isPremium, false, "isPremium is correct");

        const userId = await contract.getUserId(2, accounts[7]);
        assert.equal(userId, 2, 'userId is correct');

        const serverId = await contract.getServerId(accounts[7]);
        assert.equal(serverId, 2, 'serverId is correct');
    });

    it("getServerSettings 3", async () => {
        const contract = await IPFSServerERC721.deployed();

        const settings = await contract.getServerSettings(1, 0);
        const totalServers = settings[4];
        const totalUsers1 = await contract.getTotalUsers(1);
        const totalUsers2 = await contract.getTotalUsers(2);

        assert.equal(totalServers, 2, 'totalServers is correct');
        assert.equal(totalUsers1, 1, "totalUsers1 is correct");
        assert.equal(totalUsers2, 2, "totalUsers2 is correct");
    });

    it("setServerRating 1", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[6]);

        const receipt = await contract.setServerRating(2, 10, {from: accounts[6]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[6]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');

        const rating = await contract.getServerRating(2, accounts[6]);
        const serverRating = rating[0];
        const userRating = rating[1];
        assert.equal(serverRating, 10, 'serverRating is correct');
        assert.equal(userRating, 10, 'userRating is correct');
    });

    it("setServerRating 2", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[7]);

        const receipt = await contract.setServerRating(2, 5, {from: accounts[7]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[7]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');

        const rating = await contract.getServerRating(2, accounts[7]);
        const serverRating = rating[0];
        const userRating = rating[1];
        assert.equal(serverRating, 7, 'serverRating is correct');
        assert.equal(userRating, 5, 'userRating is correct');
    });

    it("cannot setServerRating 1", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.setServerRating(1, 5, {from: accounts[7]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot setServerRating 2", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.setServerRating(2, 11, {from: accounts[7]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("mintServer 3", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[8]);

        const receipt = await contract.mintServer("http:///127.0.0.1:3000/ipfs", web3.utils.toWei("1", "ether"), {from: accounts[8]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[8]);

        const event = receipt.logs[1].args;
        assert.equal(event.tokenId, '3', 'id is correct');
        assert.equal(event.from, accounts[8].toString(), 'from is correct');
        assert.equal(event.to, accounts[8].toString(), 'to is correct');
        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
    });

    it("leaseServer 4", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[9]);
        const beforeToBalance = await web3.eth.getBalance(accounts[8]);

        const receipt = await contract.leaseServer(3, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
            {from: accounts[9], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[9]);
        const afterToBalance = await web3.eth.getBalance(accounts[8]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(web3.utils.toWei("1", "ether")))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance, (new BN(beforeToBalance)).add((new BN(web3.utils.toWei("0.7", "ether")))).add((new BN(web3.utils.toWei("0.2", "ether")))).toString(), 'toBalance is correct');

        const serverId = await contract.getServerId(accounts[9]);
        assert.equal(serverId, 3, 'serverId is correct');
    });

    it("setServerRating 3", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[9]);

        const receipt = await contract.setServerRating(3, 6, {from: accounts[9]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[9]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');

        const rating = await contract.getServerRating(3, accounts[9]);
        const serverRating = rating[0];
        const userRating = rating[1];
        assert.equal(serverRating, 6, 'serverRating is correct');
        assert.equal(userRating, 6, 'userRating is correct');
    });

    it("leaseServer 5", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[1]);
        const beforeToBalance1 = await web3.eth.getBalance(accounts[5]);
        const beforeToBalance2 = await web3.eth.getBalance(accounts[8]);

        const receipt = await contract.leaseServer(3, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
            {from: accounts[1], value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[1]);
        const afterToBalance1 = await web3.eth.getBalance(accounts[5]);
        const afterToBalance2 = await web3.eth.getBalance(accounts[8]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(web3.utils.toWei("1", "ether")))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance1, (new BN(beforeToBalance1)).add((new BN(web3.utils.toWei("0.1", "ether")))).toString(), 'toBalance is correct');
        assert.equal(afterToBalance2, (new BN(beforeToBalance2)).add((new BN(web3.utils.toWei("0.7", "ether")))).add((new BN(web3.utils.toWei("0.2", "ether")))).toString(), 'toBalance is correct');

        const serverId = await contract.getServerId(accounts[1]);
        assert.equal(serverId, 3, 'serverId is correct');
    });

    it("setRoot", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[1]);

        const receipt = await contract.setRoot(3, "0xda0afbca3f106095f9cae9f159e82445ed3a995e04db9853faa202790c2ac15d",
            {from: accounts[1]});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[1]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(totalGas))).toString(), 'fromBalance is correct');

        const root = await contract.getRoot(3, 2);
        assert.equal(root, "0xda0afbca3f106095f9cae9f159e82445ed3a995e04db9853faa202790c2ac15d", 'root is correct');
    });

    it("cannot setRoot", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.setRoot(3, "0xda0afbca3f106095f9cae9f159e82445ed3a995e04db9853faa202790c2ac15d", {from: accounts[2]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("cannot setServerRating 3", async () => {
        return IPFSServerERC721.deployed().then(async contract => {
            return contract.setServerRating(3, 10, {from: accounts[9]});
        }).then(() => {
            assert.ok(false);
        }, e => {
            assert.ok(true);
            console.log(e.reason);
        });
    });

    it("leaseServer 6", async () => {
        const contract = await IPFSServerERC721.deployed();

        const beforeFromBalance = await web3.eth.getBalance(accounts[6]);
        const beforeToBalance1 = await web3.eth.getBalance(accounts[5]);
        const beforeToBalance2 = await web3.eth.getBalance(accounts[8]);

        const receipt = await contract.leaseServer(3, "0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e",
            {from: accounts[6],value: web3.utils.toWei("1", "ether")});
        let tx = await web3.eth.getTransaction(receipt.tx);
        let totalGas = (new BN(receipt.receipt.gasUsed)).mul(new BN(tx.gasPrice));

        const afterFromBalance = await web3.eth.getBalance(accounts[6]);
        const afterToBalance1 = await web3.eth.getBalance(accounts[5]);
        const afterToBalance2 = await web3.eth.getBalance(accounts[8]);

        assert.equal(afterFromBalance, (new BN(beforeFromBalance)).sub((new BN(web3.utils.toWei("1", "ether")))).sub((new BN(totalGas))).toString(), 'fromBalance is correct');
        assert.equal(afterToBalance1, (new BN(beforeToBalance1)).add((new BN(web3.utils.toWei("0.1", "ether")))).toString(), 'toBalance is correct');
        assert.equal(afterToBalance2, (new BN(beforeToBalance2)).add((new BN(web3.utils.toWei("0.7", "ether")))).add((new BN(web3.utils.toWei("0.2", "ether")))).toString(), 'toBalance is correct');

        const settings = await contract.getServerSettings(3, 3);
        const userAddress = settings[2];
        const isPremium = settings[3];
        assert.equal(userAddress, accounts[6], 'userAddress is correct');
        assert.equal(isPremium, true, "isPremium is correct");

        const userId = await contract.getUserId(3, accounts[6]);
        assert.equal(userId, 3, 'userId is correct');

        const serverId = await contract.getServerId(accounts[6]);
        assert.equal(serverId, 3, 'serverId is correct');
    });
});