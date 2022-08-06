const IPFSServerERC721 = artifacts.require("IPFSServerERC721");
const IPFSServerERC721Attack_3 = artifacts.require("IPFSServerERC721Attack_3");
const BN = web3.utils.BN;

contract("IPFSServerERC721Attack_3", accounts => {
    it("Contract being the owner of a server", async () => {
        const contractAsServer = await IPFSServerERC721Attack_3.deployed();
        const server2 = accounts[1];
        const leaser = accounts[2];
        const contract = await IPFSServerERC721.deployed();

        //the contract mints the server 1
        await contractAsServer.mintServer({from: accounts[0]});
        //the address mints the server 2
        await contract.mintServer("uri2", web3.utils.toWei("1", "ether"), {from: server2});
        //the address leases the server 2
        await contract.leaseServer(2, "0x6cc26f47a5f21a9669d57976dbdd6aa5d4159f7ca76984e44764266e3063999f", {from: server2, value: web3.utils.toWei("1", "ether")});
        //the address rates the server 2
        await contract.setServerRating(2, 10, {from: server2});

        const beforeContractAsServerBalance = await web3.eth.getBalance(contractAsServer.address);
        const beforeServer2Balance = await web3.eth.getBalance(server2);

        //after a user leases the server 1:
        //the owner of the server 1 (contract) will not receive ethers
        //the owner of the server 2 (address) will receive all the ethers
        await contract.leaseServer(1, "0x6cc26f47a5f21a9669d57976dbdd6aa5d4159f7ca76984e44764266e3063999f", {from: leaser, value: web3.utils.toWei("1", "ether")});

        const afterContractAsServerBalance = await web3.eth.getBalance(contractAsServer.address);
        const afterServer2Balance = await web3.eth.getBalance(server2);
        const totalServers = (await contract.getServerSettings(0, 0))[4];
        const serverRating1 = (await contract.getServerRating(1, contractAsServer.address))[0];
        const serverRating2 = (await contract.getServerRating(2, server2))[0];

        assert.equal(totalServers, 2, 'totalServers is correct');
        assert.equal(serverRating1, 0, 'serverRating1 is correct');
        assert.equal(serverRating2, 10, 'serverRating2 is correct');
        assert.equal(afterContractAsServerBalance, (new BN(beforeContractAsServerBalance)).add((new BN(web3.utils.toWei("0", "ether")))).toString(), 'afterServerContractBalance is correct');
        assert.equal(afterServer2Balance, (new BN(beforeServer2Balance)).add((new BN(web3.utils.toWei("1", "ether"))).div(new BN(totalServers))).toString(), 'afterServer2Balance is correct');
    });

    it("Address being the owner of a server", async () => {
        const contractAsServer = await IPFSServerERC721Attack_3.deployed();
        const server2 = accounts[1];
        const addressAsServer = accounts[3];
        const server4 = accounts[4];
        const leaser = accounts[5];
        const contract = await IPFSServerERC721.deployed();

        //the address accounts[3] mints the server 3
        await contract.mintServer("uri3", web3.utils.toWei("1", "ether"), {from: addressAsServer});
        //the address accounts[4] mints the server 4
        await contract.mintServer("uri4", web3.utils.toWei("1", "ether"), {from: server4});
        //the address accounts[4] leases the server 4
        await contract.leaseServer(4, "0x6cc26f47a5f21a9669d57976dbdd6aa5d4159f7ca76984e44764266e3063999f", {from: server4, value: web3.utils.toWei("1", "ether")});
        //the address accounts[4] rates the server 4
        await contract.setServerRating(4, 10, {from: server4});

        const beforeContractAsServerBalance = await web3.eth.getBalance(contractAsServer.address);
        const beforeServer2Balance = await web3.eth.getBalance(server2);
        const beforeAddressAsServerBalance = await web3.eth.getBalance(addressAsServer);
        const beforeServer4Balance = await web3.eth.getBalance(server4);

        //after a user leases the server 3:
        //the owner of the server 3 (accounts[3]) will receive 70% of the ethers
        //the owner of the server 4 (accounts[4]) will receive 7.5% (30% / 4 servers) of all the ethers
        //the owner of the server 2 (accounts[1]) will receive 7.5% (30% / 4 servers) of all the ethers
        //the owner of the server 1 (contract) will not receive ethers
        //the owner of the server 3 (accounts[3]) will receive the remaining of the ethers (15%)
        await contract.leaseServer(3, "0x6cc26f47a5f21a9669d57976dbdd6aa5d4159f7ca76984e44764266e3063999f", {from: leaser, value: web3.utils.toWei("1", "ether")});

        const afterContractAsServerBalance = await web3.eth.getBalance(contractAsServer.address);
        const afterServer2Balance = await web3.eth.getBalance(server2);
        const afterAddressAsServerBalance = await web3.eth.getBalance(addressAsServer);
        const afterServer4Balance = await web3.eth.getBalance(server4);

        const totalServers = (await contract.getServerSettings(0, 0))[4];
        const serverRating1 = (await contract.getServerRating(3, addressAsServer))[0];
        const serverRating2 = (await contract.getServerRating(4, server4))[0];
        let serversToReceiveIncentives = 0;
        for(let i=1;i<totalServers+1;i++){
            const rating = (await contract.getServerRating(i, accounts[0]))[0];
            if(rating > 5){
                serversToReceiveIncentives++;
            }
        }
        const remaining = ((new BN(web3.utils.toWei("0.3", "ether"))).div(new BN(totalServers))).mul(new BN(serversToReceiveIncentives));

        assert.equal(totalServers, 4, 'totalServers is correct');
        assert.equal(serverRating1, 0, 'serverRating1 is correct');
        assert.equal(serverRating2, 10, 'serverRating2 is correct');
        assert.equal(afterContractAsServerBalance, (new BN(beforeContractAsServerBalance)).add((new BN(web3.utils.toWei("0", "ether")))).toString(), 'afterServerContractBalance is correct');
        assert.equal(afterServer2Balance, (new BN(beforeServer2Balance)).add((new BN(web3.utils.toWei("0.3", "ether"))).div(new BN(totalServers))).toString(), 'afterServer2Balance is correct');
        assert.equal(afterAddressAsServerBalance, (new BN(beforeAddressAsServerBalance)).add((new BN(web3.utils.toWei("0.7", "ether")))).add(remaining).toString(), 'afterAddressAsServerBalance is correct');
        assert.equal(afterServer4Balance, (new BN(beforeServer4Balance)).add((new BN(web3.utils.toWei("0.3", "ether"))).div(new BN(totalServers))).toString(), 'afterServer4Balance is correct');
    });
});