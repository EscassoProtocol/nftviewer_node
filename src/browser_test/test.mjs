"use strict";

import {rsa} from "../modules/utils/rsa.mjs";
import {aes} from "../modules/utils/aes.mjs";
import {utils} from "../modules/utils/utils.mjs";

class Test {
    constructor() {
        this.textToEncrypt = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        this.uri = {
            "public_key": {
                "n":"zVeOyX7EAVBkP55DgfYvYbK9VkYHiIJm38Bnsys5ByLTi2qNMQBrQ8MUvcj7O_Nm9kM_GgRk4c8jI9XfJgMum6WYUc1aW0HA8ID-L62YvFwMcIGctEAetMBmzwu_sXQ3hPZJSEM8R368tFVVCXI5-ybgQ8g9kwQbawNv0lqQkwU",
                "e":"AQAB",
            }
        }
        this.jwk = {"alg":"RSA-OAEP-256","d":"Ep3XO9y6p8_XtuOCBVICNl5Tx3Lukz7CAD6GaE-z349rFHRi5p1oxtT0mBw_mCOCIzOHkLPzSCb_wuuh9o_1SqIaflcbTJj7OIYpQV5Vfm-L0g2Pn1Wmwo5R1ttcwA7flXoRpbWDFqEHWzVC9Q8mMSPjsKYmnMdIwTACu2Y55cU",
            "dp":"RTlZgXVyV2_dc6QY1x1i21LCiTWl9jRyZnFnJYEaSsBwHuU_WfWGPZJxFzubYqRdF1uR1x2tgQsrNftvk5NK7Q",
            "dq":"uAdr3zq1kWFR2cDswp6wpzKBkegc0M2Hq-dV6SkFTFL2rZVlRhqV1GH1t_gEoJkrmoV50_2JvhojqWL_2b0nuw",
            "e":"AQAB","ext":true,"key_ops":["decrypt"],"kty":"RSA","n":"zVeOyX7EAVBkP55DgfYvYbK9VkYHiIJm38Bnsys5ByLTi2qNMQBrQ8MUvcj7O_Nm9kM_GgRk4c8jI9XfJgMum6WYUc1aW0HA8ID-L62YvFwMcIGctEAetMBmzwu_sXQ3hPZJSEM8R368tFVVCXI5-ybgQ8g9kwQbawNv0lqQkwU",
            "p":"_TG68lrdS2H-vFQwDR51y3IgAM1_LvuFve7Dfe6RCu0J9ohj4rHojk-0Pnldf-zLRp4I5YEjNtgkXQUF1_q4iw",
            "q":"z54UJq-nI9zY640UZb5cWZ1VV02joIWnZtAA_UR2f4KBXKeq-vQYwxm0rWRTQems9tfFaaAs91lJZz4sXObErw",
            "qi":"KeXClGDC57uhpARTDevr6BlR3SRuvNhGdzwnFZrrE2Q7EuwuzgEI6pHis-nKxb62X5soB_4NzBiE4EWAVQvO8Q"}
        this.serverId = 2;
        this.serverId2 = 3;
        this.userId = 1;
        this.userId2 = 1;
        this.proofArray = ["0x044852b2a670ade5407e78fb2863c51de9fcb96542a07186fe3aeda6bb8a116d","0xa2599cd4778e8cd8b3e83ee85b7aa6cf95199ae73cf30fc78b2e56bf4185dce2"];
        this.proofArray2 = ["0xceebf77a833b30520287ddd9478ff51abbdffa30aa90a8d655dba0e8a79ce0c1","0x1219c99b22ee9acd905b8b7805a91b29ace6c3866372231fa7a965b580278968"];
        this.address = "0x5e557f7d2E8e7685c11B562c655C9cFf91FfB5e5";
        this.cid = "QmQzCQn4puG4qu8PVysxZmscmQ5vT1ZXpqo7f58Uh9QfyY";
        this.ext = "txt";
        this.text = 'Hello world!';
        this.downloadTimeout = 5000;
        this.longMessage = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
        this.rpcLink = "https://rinkeby.infura.io/v3/f3e2ba954dd6423b8c163a5640ae5c21";
        this.mailContractAddress = "0x2F007d4A01Fe7BB3d09F39d4Fd44E6EC6F2D4116";
        this.mailBoxUri = "QmQ6JSHcw2xeJxNVAevixnzPehunzTKNnXfk39Cffnj2PC";
        this.mailId = 5;
        this.RAM = 8000;

        document.addEventListener("DOMContentLoaded", async function() {
            test.main().catch(e => console.log(e));
        });
    }

    async testGeneratingKeys(){
        const keys = await rsa.generateKey();
        const publicKey = keys.jwk.n + keys.jwk.e;
        //console.log("publicKey: "+publicKey);

        const encrypted = await rsa.encrypt(this.textToEncrypt, keys.publicKey);
        //console.log("encrypted: "+encrypted);

        const decrypted = await rsa.decrypt(encrypted, keys.privateKey);
        //console.log("decrypted: "+decrypted);

        decrypted === this.textToEncrypt ? console.log("%c decrypted is correct", "color: #009900") : console.log("%c decrypted is wrong", "color: #FF0000");
    }

    async testEncryptingWithGeneratedKey(){
        const jwk = this.uri.public_key;
        const publicKey = jwk.n + jwk.e;
        //console.log("publicKey: "+publicKey);

        const encrypted = await rsa.encrypt(this.textToEncrypt, null, jwk);
        //console.log("encrypted: "+encrypted);

        await this.testDecryptingWithGeneratedKey(encrypted, this.textToEncrypt);
    }

    async testDecryptingWithGeneratedKey(encrypted, text){
        const jwk = this.jwk;

        const decrypted = await rsa.decrypt(encrypted, null, jwk);
        //console.log("decrypted: "+decrypted);

        decrypted === text ? console.log("%c decrypted is correct", "color: #009900") : console.log("%c decrypted is wrong", "color: #FF0000");
    }

    async testGeneratingProof(){
        let leaves = ['0x5e557f7d2E8e7685c11B562c655C9cFf91FfB5e5', '0', "1", "2"].map(v => keccak256(v));
        let tree = new MerkleTree(leaves, keccak256,{sort: true});
        let root = tree.getHexRoot();
        //console.log("root:")
        //console.log(root)//0x9f1e39ca24c59e8571cc9edcea948cef593f819929fdcffe4fd34e3f07354a8e

        let leaf = keccak256('0x5e557f7d2E8e7685c11B562c655C9cFf91FfB5e5');
        let proof = tree.getHexProof(leaf);
        //console.log("true proof:");
        //console.log(proof);
        tree.verify(proof, leaf, root) ? console.log("%c true proof1 is correct", "color: #009900") : console.log("%c true proof1 is wrong", "color: #FF0000");

        leaf = keccak256('x');
        proof = tree.getHexProof(leaf);
        //console.log("false proof:");
        //console.log(proof);
        tree.verify(proof, leaf, root) ? console.log("%c false proof1 is wrong", "color: #FF0000") : console.log("%c false proof1 is correct", "color: #009900");

        leaves = ['0x39e81278c865709223554728331A4eF5942D0eA4', '3', "4", "5"].map(v => keccak256(v));
        tree = new MerkleTree(leaves, keccak256,{sort: true});
        root = tree.getHexRoot();
        //console.log("root:")
        //console.log(root)

        leaf = keccak256('0x39e81278c865709223554728331A4eF5942D0eA4');
        proof = tree.getHexProof(leaf);
        //console.log("true proof:");
        //console.log(proof);
        tree.verify(proof, leaf, root) ? console.log("%c true proof2 is correct", "color: #009900") : console.log("%c true proof2 is wrong", "color: #FF0000");

        leaf = keccak256('x');
        proof = tree.getHexProof(leaf);
        //console.log("false proof:");
        //console.log(proof);
        tree.verify(proof, leaf, root) ? console.log("%c false proof2 is wrong", "color: #FF0000") : console.log("%c false proof2 is correct", "color: #009900");
    }

    async testProof(){
        this.proof(this.serverId, this.userId, this.proofArray)
            .then(data => {
                data.isValid ? console.log("%c proof1 is correct", "color: #009900") : console.log("%c proof1 is wrong", "color: #FF0000");
            }).catch(() => console.log("%c proof1 is wrong", "color: #FF0000"));

        this.proof(this.serverId2, this.userId2, this.proofArray2)
            .then(data => {
                data.isValid ? console.log("%c proof2 is correct", "color: #009900") : console.log("%c proof2 is wrong", "color: #FF0000");
            }).catch(() => console.log("%c proof2 is wrong", "color: #FF0000"));
    }

    async testCheckIPFSAdd(){
        this.sendText(this.text, this.serverId, this.userId, this.proofArray, true)
            .then(cid => {
                cid.path === this.cid ? console.log("%c IPFS add is correct", "color: #009900") : console.log("%c IPFS add is wrong", "color: #FF0000");
            }).catch(() => console.log("%c IPFS add is wrong", "color: #FF0000"));
    }

    async testCheckIPFSPin(){
        this.isPinned(this.cid, this.serverId, this.userId, this.proofArray)
            .then(data => {
                data.isPinned ? console.log("%c IPFS pin is correct", "color: #009900") : console.log("%c IPFS pin is wrong", "color: #FF0000");
            }).catch(() => console.log("%c IPFS pin is wrong", "color: #FF0000"));
    }

    async testCheckIPFSCat(){
        this.getText(this.cid, this.serverId, this.userId, this.proofArray)
            .then(data => {
                if(data.text === this.text){
                    console.log("%c IPFS cat is correct", "color: #009900");
                }
            }).catch(() => console.log("%c IPFS cat is wrong", "color: #FF0000"));
    }

    async testCheckIPFSFile(){
        this.getFile(this.cid, this.serverId,  this.userId, this.proofArray, this.ext)
            .then(data => {
                if(data.link){
                    console.log("%c IPFS file is correct", "color: #009900");
                    //utils.downloadFile(data.link, this.cid, this.ext, this.downloadTimeout);
                }
                else {
                    console.log("%c IPFS file is wrong", "color: #FF0000");
                }
            }).catch(() => console.log("%c IPFS file is wrong", "color: #FF0000"));
    }

    async testEncryptingLongMsg(){
        const ciphertext = await aes.encryptData(this.longMessage, 'secret key 123');
        const decryptedLongMsg = await aes.decryptData(ciphertext, 'secret key 123');

        decryptedLongMsg === this.longMessage ? console.log("%c decrypted is correct", "color: #009900") : console.log("%c decrypted is wrong", "color: #FF0000");
    }

    async testEncryptingMsg(){
        const randomValue = utils.getRandomValues();
        const randomKey = utils.get32BytesPassword(randomValue, this.address);
        const jwk = this.uri.public_key;
        const encryptedKey = await rsa.encrypt(randomKey, null, jwk);
        const encryptedMsg = await aes.encryptData(this.longMessage, randomKey);

        const data = {
            key: encryptedKey,
            msg: encryptedMsg
        };

        const text = JSON.stringify(data);
        this.sendText(text, this.serverId, this.userId, this.proofArray, true)
            .then(cid => {
                this.testDecryptingMsg(cid.path);
            }).catch(() => console.log("%c IPFS add is wrong", "color: #FF0000"));
    }

    async testDecryptingMsg(cid){
        this.getText(cid, this.serverId, this.userId, this.proofArray)
            .then(async data => {
                const text = data.text;
                const json = JSON.parse(text);
                const encryptedKey = json.key;
                const encryptedMsg = json.msg;
                const jwk = this.jwk;
                const decryptedKey = await rsa.decrypt(encryptedKey, null, jwk);
                const decryptedMsg = await aes.decryptData(encryptedMsg, decryptedKey);

                decryptedMsg === this.longMessage ? console.log("%c decryptedMsg is correct", "color: #009900") : console.log("%c decryptedMsg is wrong", "color: #FF0000");
            }).catch(() => console.log("%c IPFS file is wrong", "color: #FF0000"));
    }

    async checkMetamask(){
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            const provider = await detectEthereumProvider();
            provider ? console.log("%c provider is correct", "color: #009900") : console.log("%c provider is wrong", "color: #FF0000");

            window.ethereum
                .request({ method: 'eth_requestAccounts'})
                .then(accounts => {
                    accounts.length > 0 ? console.log("%c request is correct", "color: #009900") : console.log("%c request is wrong", "color: #FF0000");
                })
                .catch((err) => {
                    if (err.code === 4001) {
                        console.log("%c request was rejected", "color: #FFFF00");
                    } else {
                        console.log("%c request is wrong", "color: #FF0000");
                    }
                });
        }
        else{
            console.log("%c metamask is not installed", "color: #FF0000");
        }
    }

    async testCreatingMailBox(){
        const contract = await utils.getContract(this.mailContractAddress, this.rpcLink);
        const mailBoxInfo = await contract.methods.getMailBoxInfo(this.address).call();
        const mailBoxUri = mailBoxInfo[1];
        if(mailBoxUri){
            await this.testSendingEncryptedMail({path: mailBoxUri});
        }
        else{
            await this.testSendingEncryptedMailBox();
        }
    }

    async testSendingEncryptedMailBox(){
        const text = JSON.stringify(this.uri);
        this.sendText(text, this.serverId, this.userId, this.proofArray, true)
            .then(async cidMailBox => {
                await this.testSendingEncryptedMail(cidMailBox);
            }).catch(() => console.log("%c IPFS add is wrong", "color: #FF0000"));
    }

    async testSendingEncryptedMail(cidMailBox){
        const randomValue = utils.getRandomValues();
        const randomKey = utils.get32BytesPassword(randomValue, this.address);
        const jwk = this.uri.public_key;
        const encryptedKey = await rsa.encrypt(randomKey, null, jwk);
        const encryptedMsg = await aes.encryptData(this.longMessage, randomKey);

        const data = {
            key: encryptedKey,
            msg: encryptedMsg
        };

        const text = JSON.stringify(data);
        this.sendText(text, this.serverId, this.userId, this.proofArray, true)
            .then(async cidMail => {
                const txValues = await utils.getTxValues();

                let tx;
                if(cidMailBox){
                    tx = {
                        to: this.mailContractAddress,
                        data: txValues.iface.encodeFunctionData("sendMail(address,string)", [
                            this.address, cidMail.path
                        ])
                    };
                }
                else{
                    tx = {
                        to: this.mailContractAddress,
                        data: txValues.iface.encodeFunctionData("sendMail(address,string,string)", [
                            this.address, cidMailBox.path, cidMail.path
                        ])
                    };
                }

                txValues.signer.sendTransaction(tx)
                    .then(() => console.log("%c tx was sent", "color: #009900"))
                    .catch(() => console.log("%c tx is wrong", "color: #FF0000"));

            }).catch(() => console.log("%c IPFS add is wrong", "color: #FF0000"));
    }

    async testGettingEncryptedMail(){
        //if the cid is not available (it has been garbage collected), create another mail and update the mailId
        const contract = await utils.getContract(this.mailContractAddress, this.rpcLink);
        const email = await contract.methods.getMail(this.address, this.mailId).call();

        this.getText(email, this.serverId, this.userId, this.proofArray)
            .then(async data => {
                const text = data.text;
                const json = JSON.parse(text);
                const encryptedKey = json.key;
                const encryptedMsg = json.msg;
                const jwk = this.jwk;
                const decryptedKey = await rsa.decrypt(encryptedKey, null, jwk);
                const decryptedMsg = await aes.decryptData(encryptedMsg, decryptedKey);

                decryptedMsg === this.longMessage ? console.log("%c decrypted mail is correct", "color: #009900") : console.log("%c decrypted mail is wrong", "color: #FF0000");
            }).catch(() => console.log("%c IPFS file is wrong", "color: #FF0000"));
    }

    async testRAM(){
        this.getRAM(this.serverId, this.userId, this.proofArray)
            .then(async data => {
                const total = data.total;
                total > this.RAM ? console.log("%c RAM size is correct", "color: #009900") : console.log("%c RAM size is wrong", "color: #FF0000");
            }).catch(() => console.log("%c RAM size is wrong", "color: #FF0000"));
    }

    async proof(serverId, userId, proof){
        return fetch("http:///127.0.0.1:3001/proof" + "?" + new URLSearchParams({
            serverId: serverId,
            userId: userId,
            proof: proof,
        }), {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async function(response) {
            return await utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async sendText(text, serverId, userId, proof, pinned){
        return fetch("http:///127.0.0.1:3001/add", {
            body: JSON.stringify({
                text: text,
                serverId: serverId,
                userId: userId,
                proof: proof,
                pinned: pinned,
                serverUrls: []
            }),
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async function(response) {
            return await utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async isPinned(cid, serverId, userId, proof){
        return fetch("http:///127.0.0.1:3001/pinned" + "?" + new URLSearchParams({
            cid: cid,
            serverId: serverId,
            userId: userId,
            proof: proof,
        }), {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async function(response) {
            return await utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async getText(cid, serverId, userId, proof){
        return fetch("http:///127.0.0.1:3001/cat" + "?" + new URLSearchParams({
            cid: cid,
            serverId: serverId,
            userId: userId,
            proof: proof,
        }), {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async function(response) {
            return await utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async getFile(cid, serverId, userId, proof, ext){
        return fetch("http:///127.0.0.1:3001/file" + "?" + new URLSearchParams({
            cid: cid,
            serverId: serverId,
            userId: userId,
            proof: proof,
            ext: ext,
        }), {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async function(response) {
            return await utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async getRAM(serverId, userId, proof){
        return fetch("http:///127.0.0.1:3001/ram" + "?" + new URLSearchParams({
            serverId: serverId,
            userId: userId,
            proof: proof,
        }), {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async function(response) {
            return await utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async main(){
        await this.testGeneratingKeys();
        await this.testEncryptingWithGeneratedKey();
        await this.testGeneratingProof();
        await this.testProof();
        await this.testCheckIPFSAdd();
        await this.testCheckIPFSPin();
        await this.testCheckIPFSCat();
        await this.testCheckIPFSFile();
        await this.testEncryptingLongMsg();
        await this.testEncryptingMsg();
        await this.checkMetamask();
        await this.testCreatingMailBox();
        await this.testGettingEncryptedMail();
        await this.testRAM();
    }
}
const test = new Test();
export {test};