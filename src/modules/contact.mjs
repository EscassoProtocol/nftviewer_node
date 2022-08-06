"use strict";

class Contact{
    async getUtils(){
        !localStorage.getItem("ipfsGateway") ? localStorage.setItem("ipfsGateway", "") : undefined;
        const {utils} = await import(localStorage.getItem("ipfsGateway")+"./utils/utils.mjs");
        return utils;
    }

    async getRSA(){
        const {rsa} = await import(localStorage.getItem("ipfsGateway")+"./utils/rsa.mjs");
        return rsa;
    }

    async getPasswordDialog(){
        const {passwordDialog} = await import(localStorage.getItem("ipfsGateway")+"./utils/password_dialog.mjs");
        return passwordDialog;
    }

    async getAES(){
        const {aes} = await import(localStorage.getItem("ipfsGateway")+"./utils/aes.mjs");
        return aes;
    }

    constructor() {
        this.utils = null;
        this.Constants = null;
        this.senderAddress = "";
        this.ipfsServerId = 0;
        this.ipfsServerUrl = "";
        this.ipfsUserId = 0;
        this.root = "";
        this.proof = null;
        this.subject = "";
        this.message = "";
        this.pinned = false;
        this.passwordDialog = null;
        this.serverUrls = null;
        this.fee = 0;
        this.isPaid = false;
        this.shared = null;
        this.rsa = null;
        this.aes = null;
        this.ipfsContract = null;
        this.mailContract = null;

        this.listenEvents();
    }

    listenEvents() {
        const self = this;
        document.addEventListener("DOMContentLoaded", async function() {
            self.utils = await self.getUtils();
            self.utils.setInstance(self);
            self.shared = await self.utils.getShared();
            self.Constants = await self.shared.getConstants();
            self.passwordDialog = await self.getPasswordDialog();
            self.rsa = await self.getRSA();
            self.aes = await self.getAES();
            self.utils.checkIfMetaMaskIsInstalled()
                .then(async () => {
                    self.senderAddress = Web3.utils.toChecksumAddress(await self.utils.getSelectedAddress(self));
                    self.ipfsContract = await self.utils.getContract(self.Constants.IPFS_CONTRACT_ADDRESS);
                    if(!self.ipfsContract){return;}
                    self.mailContract = await self.utils.getContract(self.Constants.MAIL_CONTRACT_ADDRESS);
                    if(!self.mailContract){return;}
                    if(self.utils.isMobileBrowser()) {
                        self.shared.showWarning();
                    }
                    else{
                        if(localStorage.getItem("disableCheckUpdates") === "true"){
                            self.onUpdated();
                        }
                        else{
                            self.utils.checkUpdates(self, self.Constants.VERSION_CONTRACT_ADDRESS, self.Constants.LATEST_URI).catch(e => self.utils.showAlert(e));
                        }
                    }
                    self.utils.unsavedChanges().catch(e => self.utils.showAlert(e));
                })
                .catch(e => {
                    if(e.title && e.text && e.lastText && e.link){
                        self.shared.showWarning(e.title, e.text, e.lastText, e.link);
                    }
                    else{
                        self.utils.showAlert(e);
                    }
                });
        });
    }

    onUpdated(){
        this.shared.hideLoading();
        this.utils.listenMetaMaskEvents(this)
            .then(() => {
                this.onDOMContentLoaded();
            })
            .catch(e => {
                if(e.title && e.text && e.lastText && e.link){
                    this.shared.showWarning(e.title, e.text, e.lastText, e.link);
                }
                else{
                    this.utils.showAlert(e);
                }
            });
    }

    onNotUpdated(data){
        this.shared.showWarning(data.title, data.text, data.lastText, data.link, data.button);
        if(data.button){
            this.onUpdated();
        }
    }

    async onAccountsChanged(){
        document.getElementById('file').value = "";
        document.getElementById('pinned').checked = false;
        localStorage.setItem(this.senderAddress + "_ipfsServerUrl", "");
        localStorage.setItem(this.senderAddress + "_pinned", "false");
        this.senderAddress = Web3.utils.toChecksumAddress(await this.utils.getSelectedAddress());
    }

    onNotConnected(){
        this.onDOMContentLoaded();
    }

    onDOMContentLoaded(){
        this.clicks();
        this.initViews();
        this.loadProof();
        this.checkPendingTx();
        this.showMailDisclaimer();
        this.shared.setConnected(this.senderAddress, this.Constants.ADDRESS_MAX_LENGTH);
    }

    clicks(){
        document.getElementsByClassName('password-dialog-back')[0].addEventListener('click', this.onPasswordBackClicked);
        document.getElementsByClassName('back')[0].addEventListener('click', this.back);
        document.getElementsByClassName('send')[0].addEventListener('click', this.onSendClicked);
        document.getElementsByClassName('pinned')[0].addEventListener('click', this.onPinnedClicked);
        this.shared.clicks();
    }

    initViews(){
        if(localStorage.getItem(this.senderAddress + "_pinned") === "true"){
            document.getElementById('pinned').checked = true;
            this.pinned = true;
        }

        this.passwordDialog.initViews("Set the password to lock your proof",
            "(if you don't want to lock, let it blank):");

        document.getElementsByClassName('subject')[0].value = "";
        document.getElementsByClassName('message')[0].value = "";
    }

    onSendClicked(){
        contact.checkServer().catch(e => contact.utils.showAlert(e));
    }

    onPinnedClicked(){
        contact.pinned = document.getElementById('pinned').checked;
        localStorage.setItem(contact.senderAddress + "_pinned", contact.pinned.toString());
    }

    onPasswordBackClicked(){
        contact.passwordDialog.onBackClicked();
    }

    onOKClicked(resolve){
        const password = contact.passwordDialog.getPassword();
        const confirmationPassword = contact.passwordDialog.getConfirmationPassword();
        if(contact.passwordDialog.hasConfirmation()){
            if(password === confirmationPassword){
                contact.onPasswordBackClicked();
                contact.shared.showLoading();
                resolve(password);
            }
            else{
                contact.utils.showAlert("Error: the passwords are not equal.");
            }
        }
        else{
            resolve(password);
        }
    }

    onBackClicked(resolve){
        resolve(null);
    }

    onRejectTx(text){
        this.shared.removePendingTx(this.senderAddress);
        this.utils.showAlert("Error: "+text.message);
    }

    back(){
        history.back();
    }

    async checkServer(){
        if(this.utils.accounts && this.utils.accounts.length > 0){
            this.shared.showLoading();
            this.ipfsServerId = await this.ipfsContract.methods.getServerId(this.senderAddress).call();
            const ipfsServerUrlKey = this.senderAddress + "_ipfsServerUrl";
            const useOwnIPFSServerUrl = localStorage.getItem(this.senderAddress + "_useOwnIPFSServerUrl") === "true";
            this.ipfsUserId = await this.ipfsContract.methods.getUserId(this.ipfsServerId, this.senderAddress).call();

            if(useOwnIPFSServerUrl){
                if(localStorage.getItem(ipfsServerUrlKey) && localStorage.getItem(ipfsServerUrlKey) !== "null" && localStorage.getItem(ipfsServerUrlKey) !== "undefined"){
                    this.ipfsServerUrl = localStorage.getItem(ipfsServerUrlKey);
                    this.checkReceiverMailBox().catch(e => this.utils.showAlert(e));
                }
                else{
                    this.utils.showAlert("Error: no IPFS server url found.\n\nTry to add your own IPFS server url on the Settings.");
                }
            }
            else{
                if(parseInt(this.ipfsServerId) > 0){
                    if(this.proof){
                        this.ipfsServerUrl = await this.ipfsContract.methods.tokenURI(this.ipfsServerId).call();
                        this.checkReceiverMailBox().catch(e => this.utils.showAlert(e));
                    }
                    else{
                        this.utils.showAlert("Error: no proof found.");
                        return undefined;
                    }
                }
                else{
                    this.shared.hideLoading();
                    this.showIPFSServerOptions().catch(e => this.utils.showAlert(e));
                }
            }
        }
        else{
            this.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async showIPFSServerOptions(){
        if (await this.utils.showConfirm("You don't have an IPFS server yet." + "\nClick 'OK' to lease a server or 'Cancel' to use your own server")) {
            this.leaseServer().catch(e => this.utils.showAlert(e));
        } else {
            this.setOwnServer().catch(e => this.utils.showAlert(e));
        }
    }

    async leaseServer(){
        const web3 = await this.utils.getWeb3();
        if(!web3){return;}
        const passwordDialog = this.passwordDialog;

        this.ipfsServerId = await this.utils.showPrompt('Set the IPFS Server ID:', "1");
        if(!this.ipfsServerId){
            return;
        }
        else if(isNaN(this.ipfsServerId)){
            this.utils.showAlert("Error: the value is not a number.");
            return;
        }

        this.shared.showLoading();
        const settings = await this.ipfsContract.methods.getServerSettings(this.ipfsServerId, 0).call();
        const defaultFee = parseInt(settings[1]);
        this.ipfsServerUrl = await this.ipfsContract.methods.tokenURI(this.ipfsServerId).call();
        const userId = await this.ipfsContract.methods.getUserId(this.ipfsServerId, this.senderAddress).call();

        if(!this.ipfsServerUrl){
            this.utils.showAlert("Error: the server doesn't exist.");
            return;
        }

        if(userId === "0"){
            const fee = await this.utils.showPrompt("Your chosen IPFS server was: " + this.ipfsServerUrl +
                '\n\nSet the value to lease:', web3.utils.fromWei(defaultFee.toString()));
            if(!fee){
                return;
            }
            else if(isNaN(parseFloat(fee))){
                this.utils.showAlert("Error: the value is not a number.");
                return;
            }

            passwordDialog.cleanInputs();
            passwordDialog.initViews("Set the password to lock your proof",
                "(if you don't want to lock, let it blank):");
            const password = await passwordDialog.showPasswordDialog(this, true);
            if(password === null){
                return;
            }

            this.shared.showLoading();
            this.createProof(password)
                .then(async () => {
                    this.shared.showLoading();
                    const ipfsServerFee = await this.utils.getBigNumber(web3.utils.toWei(fee).toString());
                    const txValues = await this.utils.getTxValues();

                    const tx = {
                        to: this.Constants.IPFS_CONTRACT_ADDRESS,
                        value: ipfsServerFee,
                        data: txValues.iface.encodeFunctionData("leaseServer(uint256,bytes32)", [
                            this.ipfsServerId, this.root
                        ])
                    };

                    const pendingTx = {
                        contract: this.Constants.IPFS_CONTRACT_ADDRESS,
                        id: null,
                        address: this.senderAddress,
                    }
                    const block = await this.utils.getLastBlock();
                    const network = await this.utils.getNetwork();
                    this.shared.savePendingTx(pendingTx, block, network).catch(e => this.utils.showAlert(e));

                    txValues.signer.sendTransaction(tx)
                        .then(() => {
                            localStorage.setItem(this.senderAddress + "_ipfsServerUrl", this.ipfsServerUrl);
                            this.checkPendingTx();
                        }).catch(e => {
                            this.shared.removePendingTx(this.senderAddress);
                            this.utils.showAlert(e);
                        });
                })
                .catch(e => this.utils.showAlert(e));
        }
        else{
            this.utils.showAlert("Error: the user already leased a server.");
        }
    }

    checkPendingTx(){
        const pendingTx = this.shared.getPendingTx(this.senderAddress);
        if(pendingTx){
            this.utils.waitVerifyingTx(pendingTx.contract, pendingTx.address, pendingTx.block, pendingTx.nonce, this.Constants.TX_TIMEOUT)
                .then(async hash => {
                    const status = await this.utils.getStatusTx(hash);
                    if(status){
                        this.utils.showAlert("The transaction was sent successfully!\n\nNow you can send your mail.");
                    }
                    else{
                        this.utils.showAlert("Error: transaction failed.\n\nCheck your MetaMask wallet to see the details.");
                    }
                    this.shared.removePendingTx(pendingTx.address);
                    this.shared.hideWarning();
                })
                .catch(e => this.utils.showAlert(e));

            this.shared.showWarning("ATTENTION:", "The transaction to lease the IPFS server has been sent.<br>"+
                "You need to wait the transaction finishes before to send your mail.<br><br>" +
                "If the transaction has already been mined,<br>" +
                "click on the button below:",
                "The transaction has already been mined.", null, this.senderAddress);
        }
    }

    async createProof(password){
        const merkleTree = this.utils.getMerkleTree(this.senderAddress);
        this.root = merkleTree.root;
        this.proof = merkleTree.proof;

        let data = {
            root: this.root,
            proof: this.proof
        }

        if(password){
            const privateKey = this.utils.get32BytesPassword(password, this.senderAddress);
            data = await this.aes.encryptData(JSON.stringify(data), privateKey);
        }
        else{
            data = JSON.stringify(data);
        }

        const filename = this.senderAddress + "_proof.dat";
        this.utils.saveFile(data, filename, "text/plain");
        this.utils.showAlert("ATTENTION:" +
            "\n\nThe proof has been created and exported with the name:" +
            "\n" + filename + "." +
            "\n\nThis file is used to prove that you already leased a server." +
            "\n\nDo not lose this file. If you lose it, you'll need to pay a transaction to renew your proof.");
    }

    async setOwnServer(){
        this.ipfsServerUrl = await this.utils.showPrompt('Set your IPFS Server Url:');
        if(!this.ipfsServerUrl){
            return;
        }

        this.shared.showLoading();
        localStorage.setItem(this.senderAddress + "_ipfsServerUrl", this.ipfsServerUrl);
        this.checkReceiverMailBox().catch(e => this.utils.showAlert(e));
    }

    async checkReceiverMailBox(){
        const receiverMailBoxInfo = await this.mailContract.methods.getMailBoxInfo(this.Constants.RECEIVER_ADDRESS).call();
        const receiverMailBoxUri = receiverMailBoxInfo[1];
        this.fee = receiverMailBoxInfo[4];
        this.isPaid = receiverMailBoxInfo[5];

        //the user sends a message to herself/himself in the first time to create hers/his mailbox
        if(receiverMailBoxUri || this.senderAddress === this.Constants.RECEIVER_ADDRESS){
            this.sendMail(receiverMailBoxUri).catch(e => this.utils.showAlert(e));
        }
        else{
            this.utils.showAlert("Error: the receiver hasn't a mailbox.");
        }
    }

    async sendMail(receiverMailBoxUri){
        this.subject = document.getElementsByClassName('subject')[0].value;
        this.message = document.getElementsByClassName('message')[0].value;
        if(this.subject === "" && this.message !== ""){
            if(!await this.utils.showConfirm("Send mail without subject?")){
                return;
            }
        }
        else if(this.subject !== "" && this.message === ""){
            if(!await this.utils.showConfirm("Send mail without message?")){
                return;
            }
        }
        else if(this.subject === "" && this.message === ""){
            if(!await this.utils.showConfirm("Send mail without subject and message?")){
                return;
            }
        }

        this.shared.showLoading();
        this.serverUrls = [];
        if(localStorage.getItem(this.senderAddress + "_copyAlways") === "true"){
            if(localStorage.getItem(this.senderAddress + "_serversList") !== ""){
                this.serverUrls = localStorage.getItem(this.senderAddress + "_serversList").replaceAll(' ','').split(',');
            }
        }

        const settings = await this.ipfsContract.methods.getServerSettings(this.ipfsServerId, this.ipfsUserId).call();
        const isPremium = settings[3];
        if(this.pinned && !isPremium){
            this.utils.showAlert("Error: the user is not premium. Try to add content without the 'Pinned' option checked.");
            return;
        }

        const senderMailBoxInfo = await this.mailContract.methods.getMailBoxInfo(this.senderAddress).call();
        const senderMailBoxUri = senderMailBoxInfo[1];
        if(senderMailBoxUri){
            this.getText(senderMailBoxUri, this.ipfsServerId, this.ipfsUserId, this.proof)
                .then(data => {
                    const senderJwk = JSON.parse(data.text);

                    this.getText(receiverMailBoxUri, this.ipfsServerId, this.ipfsUserId, this.proof)
                        .then(data => {
                            const receiverJwk = JSON.parse(data.text);
                            this.sendEncryptedMail(senderJwk, receiverJwk, null).catch(e => this.utils.showAlert(e));
                        }).catch(e => this.utils.showAlert(e));

                }).catch(e => this.utils.showAlert(e));
        }
        else{
            const filename = this.senderAddress + "_pk.dat";
            this.createPrivateKey(filename)
                .then(senderJwk => {
                    if(senderJwk){
                        this.utils.showAlert("ATTENTION:" +
                            "\n\nThe private key has been created and exported with the name:" +
                            "\n" + filename + "." +
                            "\n\nDo not lose this file. Keep it safe on an offline hard drive or print its content." +
                            "\n\nThis file is the ONLY way to decrypt your messages.");

                        this.shared.showLoading();
                        this.createMailBox(senderJwk, receiverMailBoxUri).catch(e => this.utils.showAlert(e));
                    }
                }).catch(e => this.utils.showAlert(e));
        }
    }

    async createPrivateKey(filename){
        const keys = await this.rsa.generateKey();

        const jwk = {
            "n": keys.jwk.n,
            "e": keys.jwk.e,
        }

        this.shared.hideLoading();
        this.passwordDialog.initViews("Set the password to lock your private key",
            "(if you don't want to lock, let it blank):");
        const password = await this.passwordDialog.showPasswordDialog(this, true);
        if(password === null){
            return undefined;
        }

        let data = keys.jwk;
        if(password){
            const privateKey = this.utils.get32BytesPassword(password, this.senderAddress);
            data = await this.aes.encryptData(JSON.stringify(data), privateKey);
        }
        else{
            data = JSON.stringify(data);
        }

        this.utils.saveFile(data, filename, "text/plain");
        return jwk;
    }

    async createMailBox(senderJwk, receiverMailBoxUri){
        const senderMailBoxUri = JSON.stringify(senderJwk);

        this.sendText(senderMailBoxUri, this.ipfsServerId, this.ipfsUserId, this.proof, this.pinned, this.serverUrls)
            .then(senderMailBoxCid => {
                if(receiverMailBoxUri){
                    this.getText(receiverMailBoxUri, this.ipfsServerId, this.ipfsUserId, this.proof)
                        .then(data => {
                            const receiverJwk = JSON.parse(data.text);
                            this.sendEncryptedMail(senderJwk, receiverJwk, senderMailBoxCid).catch(e => this.utils.showAlert(e));
                        }).catch(e => this.utils.showAlert(e));
                }
                else{
                    //the user is sending a message to herself/himself
                    this.sendEncryptedMail(senderJwk, senderJwk, senderMailBoxCid).catch(e => this.utils.showAlert(e));
                }
            }).catch(e => this.utils.showAlert(e));
    }

    async sendEncryptedMail(senderJwk, receiverJwk, senderMailBoxCid){
        let randomKey = this.utils.getRandomValues();
        const senderEncryptedKey = await this.rsa.encrypt(randomKey, null, senderJwk);
        const senderEncryptedSubject = await this.aes.encryptData(this.subject, randomKey);
        const senderEncryptedMsg = await this.aes.encryptData(this.message, randomKey);
        randomKey = this.utils.getRandomValues();
        const receiverEncryptedKey = await this.rsa.encrypt(randomKey, null, receiverJwk);
        const receiverEncryptedSubject = await this.aes.encryptData(this.subject, randomKey);
        const receiverEncryptedMsg = await this.aes.encryptData(this.message, randomKey);

        const data = {
            alg_key: this.Constants.ALG_KEY,
            alg_msg: this.Constants.ALG_MSG,
            sender: this.senderAddress,
            receiver: this.Constants.RECEIVER_ADDRESS,
            sender_key: senderEncryptedKey,
            sender_subject: senderEncryptedSubject,
            sender_msg: senderEncryptedMsg,
            receiver_key: receiverEncryptedKey,
            receiver_subject: receiverEncryptedSubject,
            receiver_msg: receiverEncryptedMsg
        };

        const text = JSON.stringify(data);
        this.sendText(text, this.ipfsServerId, this.ipfsUserId, this.proof, this.pinned, this.serverUrls)
            .then(async senderMailCid => {
                const txValues = await this.utils.getTxValues();

                let tx;
                if(senderMailBoxCid){
                    tx = {
                        to: this.Constants.MAIL_CONTRACT_ADDRESS,
                        value: await this.utils.getBigNumber(this.fee.toString()),
                        data: txValues.iface.encodeFunctionData("sendMail(address,string,string)", [
                            this.Constants.RECEIVER_ADDRESS, senderMailBoxCid.path, senderMailCid.path
                        ])
                    };
                }
                else{
                    tx = {
                        to: this.Constants.MAIL_CONTRACT_ADDRESS,
                        value: this.isPaid ? parseInt(this.fee) : 0,
                        data: txValues.iface.encodeFunctionData("sendMail(address,string)", [
                            this.Constants.RECEIVER_ADDRESS, senderMailCid.path
                        ])
                    };
                }

                txValues.signer.sendTransaction(tx)
                    .then(() => this.shared.hideLoading())
                    .catch(e => this.utils.showAlert(e));

            }).catch(e => this.utils.showAlert(e));
    }

    loadProof(){
        const file = document.getElementById('file').files[0];
        const reader = new FileReader();

        const self = this;
        reader.onload = async function(){
            const data = reader.result.toString();
            if(!data.includes("root") && !data.includes("proof")){
                await self.unlockProof(data);
            }
            else{
                const obj = JSON.parse(data);
                if(obj){
                    self.root = obj.root;
                    self.proof = obj.proof;
                }
            }
        };
        file ? reader.readAsText(file, 'UTF-8') : undefined;
    }

    async unlockProof(data){
        try{
            this.passwordDialog.initViews("Set the password to unlock your proof:", null);
            const password = await this.passwordDialog.showPasswordDialog(this, false);
            if(password === null){
                return undefined;
            }

            const privateKey = this.utils.get32BytesPassword(password, this.senderAddress);
            let obj = await this.aes.decryptData(data, privateKey);
            obj = JSON.parse(obj);

            if(!obj.root && !obj.proof){
                this.utils.showAlert("Error: incorrect password.");
                await this.unlockProof(data);
            }
            else{
                this.root = obj.root;
                this.proof = obj.proof;
                this.onPasswordBackClicked();
                this.shared.showToast("Proof Unlocked!");
            }
        }
        catch (e) {
            this.utils.showAlert("Error: incorrect password.");
            await this.unlockProof(data);
        }
    }

    showMailDisclaimer(){
        if(localStorage.getItem("showedDisclaimer") !== "true"){
            this.shared.hideLoading();
            this.utils.showAlert("By clicking the 'OK' button, you confirm that the recipient is not obliged " +
                "to refund the amount you paid to send the message or the amount you paid to " +
                "communicate with him/her.");
            localStorage.setItem("showedDisclaimer", "true");
        }
    }

    async sendText(text, serverId, userId, proof, pinned, serverUrls){
        const url = this.ipfsServerUrl + "add";
        return fetch(url, {
            body: JSON.stringify({
                text: text,
                serverId: serverId,
                userId: userId,
                proof: proof,
                pinned: pinned,
                serverUrls: serverUrls
            }),
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async function(response) {
            return await contact.utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async getText(cid, serverId, userId, proof){
        const url = this.ipfsServerUrl + "cat" + "?";
        return fetch(url + new URLSearchParams({
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
            return await contact.utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }
}
const contact = new Contact();
window.contact = contact;
export {contact};