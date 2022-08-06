"use strict";

class Mail{
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
        this.ipfsServerId = 0;
        this.ipfsServerUrl = "";
        this.ipfsUserId = 0;
        this.address = "";
        this.proof = null;
        this.utils = null;
        this.mailId = 0;
        this.jwk = null;
        this.ipfsContract = null;
        this.mailContract = null;
        this.Constants = null;
        this.shared = null;
        this.passwordDialog = null;
        this.rsa = null;
        this.aes = null;

        this.listenEvents();
    }

    listenEvents() {
        const self = this;
        document.addEventListener("DOMContentLoaded", async function() {
            self.utils = await self.getUtils();
            self.shared = await self.utils.getShared();
            self.Constants = await self.shared.getConstants();
            self.passwordDialog = await self.getPasswordDialog();
            self.rsa = await self.getRSA();
            self.aes = await self.getAES();
            self.utils.checkIfMetaMaskIsInstalled()
                .then(async () => {
                    self.address = self.utils.checkAddress(await self.utils.getSelectedAddress(self));
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

    onUpdated() {
        this.shared.hideLoading();
        this.utils.listenMetaMaskEvents(this)
            .then(() => {
                this.onDOMContentLoaded().catch(e => this.utils.showAlert(e));
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
        document.getElementById('proof-file').value = "";
        document.getElementById('pk-file').value = "";
        document.getElementsByClassName("mail-id")[0].value = "";
        document.getElementsByClassName("ipfs-server-url")[0].value = "";
        this.cleanMail();
        this.address = this.utils.checkAddress(await this.utils.getSelectedAddress());
        this.getMailInfo().catch(e => this.utils.showAlert(e));
    }

    onNotConnected(){
        this.onDOMContentLoaded().catch(e => this.utils.showAlert(e));
    }

    async onDOMContentLoaded(){
        this.clicks();
        this.initViews();
        await this.loadPK();
        await this.loadProof();
    }

    clicks(){
        document.getElementsByClassName('get-mail')[0].addEventListener('click', this.onGetMailClicked);
        this.utils.setEnterClick(document.getElementsByClassName("mail-id")[0], this.onGetMailClicked);
        this.utils.setEnterClick(document.getElementsByClassName("ipfs-server-url")[0], this.onGetMailClicked);
    }

    initViews(){
        document.getElementsByClassName("ipfs-server-url")[0].value = localStorage.getItem(this.address + "_useOwnIPFSServerUrl") === "true" ?
            localStorage.getItem(this.address + "_ipfsServerUrl") : "";
        this.passwordDialog.initViews(null, null);
        this.getMailInfo().catch(e => this.utils.showAlert(e));
    }

    onOKClicked(resolve){
        mail.passwordDialog.onBackClicked();
        resolve(mail.passwordDialog.getPassword());
    }

    onBackClicked(resolve){
        resolve(null);
    }

    async onGetMailClicked(){
        mail.mailId = document.getElementsByClassName("mail-id")[0].value;
        mail.ipfsServerUrl = document.getElementsByClassName("ipfs-server-url")[0].value;

        if(!mail.jwk){
            mail.utils.showAlert("Error: you need to select your private key file.");
            return;
        }
        if(mail.ipfsServerUrl === ""){
            mail.utils.showAlert("Error: you need to set the IPFS server url.");
            return;
        }
        if(localStorage.getItem(mail.address + "_useOwnIPFSServer") === "true" && !mail.proof){
            mail.utils.showAlert("Error: you need to select your proof file.");
            return;
        }
        if(mail.mailId === "" || isNaN(parseInt(mail.mailId))){
            mail.utils.showAlert("Error: the mail ID is not a number.");
            return;
        }
        mail.readMail().catch(e => mail.utils.showAlert(e));
    }

    async readMail(){
        if(this.utils.accounts && this.utils.accounts.length > 0){
            this.cleanMail();
            this.shared.showLoading();
            const mailCid = await this.mailContract.methods.getMail(this.address, this.mailId).call();
            if(mailCid){
                if(localStorage.getItem(this.address + "_useOwnIPFSServerUrl") === "true"){
                    this.getText(mailCid, 0, 0, null)
                        .then(data => {
                            this.getMail(data, mailCid).catch(e => this.utils.showAlert(e));
                        })
                        .catch(e => this.utils.showAlert(e));
                }
                else{
                    this.getIPFSServerIds()
                        .then(() => {
                            this.getText(mailCid, this.ipfsServerId, this.ipfsUserId, this.proof)
                                .then(data => {
                                    this.getMail(data, mailCid).catch(e => this.utils.showAlert(e));
                                })
                                .catch(e => this.utils.showAlert(e));
                        })
                        .catch(e => this.utils.showAlert(e));
                }
            }
            else{
                this.utils.showAlert("Error: nonexistent mail ID.");
            }
        }
        else{
            this.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async getMail(data, mailCid){
        const rsa = this.rsa;
        const aes = this.aes;
        const obj = JSON.parse(data.text);

        let encryptedKey = obj.receiver_key;
        let encryptedSubject = obj.receiver_subject;
        let encryptedMsg = obj.receiver_msg;
        let from = obj.sender;
        if(obj.sender.toString().toLowerCase() === this.address.toString().toLowerCase()){
            encryptedKey = obj.sender_key;
            encryptedSubject = obj.sender_subject;
            encryptedMsg = obj.sender_msg;
        }

        const decryptedKey = await rsa.decrypt(encryptedKey, null, this.jwk);
        const subject = await aes.decryptData(encryptedSubject, decryptedKey);
        const msg = await aes.decryptData(encryptedMsg, decryptedKey);

        const mailInfo = await this.mailContract.methods.getMailInfo(this.address, this.mailId).call();
        const block = mailInfo[3];
        const time = await this.utils.getBlockDate(block);
        const paid = await this.getHowMuchPaid(this.Constants.MAIL_CONTRACT_ADDRESS, from, this.address, this.mailId);

        document.getElementsByClassName('mail-cid')[0].innerHTML = mailCid;
        document.getElementsByClassName('mail-time')[0].innerHTML = time;
        document.getElementsByClassName('mail-from')[0].innerHTML = from;
        document.getElementsByClassName('mail-paid')[0].innerHTML = paid ? (paid + " ETH") : "Not Found";
        document.getElementsByClassName('subject')[0].innerHTML = subject;
        document.getElementsByClassName('message')[0].innerHTML = msg;
        this.shared.hideLoading();
    }

    async loadPK(){
        return new Promise(function(resolve, reject) {
            try{
                const file = document.getElementById('pk-file').files[0];
                const reader = new FileReader();
                mail.jwk = null;

                reader.onload = async function(){
                    const data = reader.result.toString();
                    if(!data.includes("\"n\"") && !data.includes("\"e\"")){
                        await mail.unlockPK(data);
                    }
                    else{
                        const obj = JSON.parse(data);
                        if(obj){
                            mail.jwk = obj;
                        }
                    }
                    resolve(true);
                };
                file ? reader.readAsText(file, 'UTF-8') : undefined;
            }
            catch (e) {
                reject(e);
            }
        });
    }

    async unlockPK(data){
        try{
            const passwordDialog = this.passwordDialog;
            const aes = this.aes;
            passwordDialog.initViews("Set the password to unlock your private key:", null);
            const password = await passwordDialog.showPasswordDialog(this, false);
            if(password === null){
                return;
            }

            const privateKey = this.utils.get32BytesPassword(password, this.address);
            let obj = await aes.decryptData(data, privateKey);
            obj = JSON.parse(obj);

            if(!obj.n && !obj.e){
                this.utils.showAlert("Error: incorrect password.");
                await this.unlockPK(data);
            }
            else{
                this.jwk = obj;
                passwordDialog.onBackClicked();
                this.shared.showToast("Private Key Unlocked!");
            }
        }
        catch (e) {
            this.utils.showAlert("Error: incorrect password.");
            await this.unlockPK(data);
        }
    }

    async loadProof(){
        return new Promise(function(resolve, reject) {
            try{
                const file = document.getElementById('proof-file').files[0];
                const reader = new FileReader();
                mail.root = null;
                mail.proof = null;

                reader.onload = async function(){
                    const data = reader.result.toString();
                    if(!data.includes("root") && !data.includes("proof")){
                        await mail.unlockProof(data);
                    }
                    else{
                        const obj = JSON.parse(data);
                        if(obj){
                            mail.root = obj.root;
                            mail.proof = obj.proof;
                        }
                    }
                    resolve(true)
                };
                file ? reader.readAsText(file, 'UTF-8') : undefined;
            }
            catch (e) {
                reject(e);
            }
        });
    }

    async unlockProof(data){
        try{
            const aes = this.aes;
            const passwordDialog = this.passwordDialog;
            passwordDialog.initViews("Set the password to unlock your proof:", null);
            const password = await passwordDialog.showPasswordDialog(this, false);
            if(password === null){
                return;
            }

            const privateKey = this.utils.get32BytesPassword(password, this.address);
            let obj = await aes.decryptData(data, privateKey);
            obj = JSON.parse(obj);

            if(!obj.root && !obj.proof){
                this.utils.showAlert("Error: incorrect password.");
                await this.unlockProof(data);
            }
            else{
                this.root = obj.root;
                this.proof = obj.proof;
                passwordDialog.onBackClicked();
                this.shared.showToast("Proof Unlocked!");
            }
        }
        catch (e) {
            this.utils.showAlert("Error: incorrect password.");
            await this.unlockProof(data);
        }
    }

    async getMailInfo(){
        if(this.utils.accounts && this.utils.accounts.length > 0){
            this.shared.showLoading();
            const mailInfo = await this.mailContract.methods.getMailInfo(this.address, 0).call();
            document.getElementsByClassName('total')[0].innerHTML = mailInfo[0];
            const mailBoxInfo = await this.mailContract.methods.getMailBoxInfo(this.address).call();
            document.getElementsByClassName('mailbox-cid')[0].innerHTML = mailBoxInfo[1];
            this.shared.hideLoading();
        }
        else{
            this.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async getIPFSServerIds(){
        this.ipfsServerId = await this.ipfsContract.methods.getServerId(this.address).call();
        this.ipfsUserId = await this.ipfsContract.methods.getUserId(this.ipfsServerId, this.address).call();
    }

    async getHowMuchPaid(contractAddress, from, to, id){
        return new Promise(async function(resolve, reject) {
            try {
                const mailContract = mail.mailContract;
                const mailInfo = await mailContract.methods.getMailInfo(to, id).call();
                const block = mailInfo[3];
                const mailId = mailInfo[4];
                let tx = null;

                const web3 = await mail.utils.getWeb3();
                if(!web3){return;}
                const txs = await web3.eth.getPastLogs({
                    filter: {tokenId: mailId},
                    fromBlock: block,
                    toBlock: block,
                    address: contractAddress
                });

                if(txs){
                    for(let i=0;i<txs.length;i++){
                        const tx_ = await web3.eth.getTransaction(txs[i].transactionHash);
                        if(tx_ && tx_.from === from){
                            tx = tx_;
                            break;
                        }
                    }
                }
                if(tx && tx.value){
                    resolve(web3.utils.fromWei(tx.value));
                }
                else{
                    resolve(null);
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    cleanMail(){
        document.getElementsByClassName('mail-cid')[0].innerHTML = "";
        document.getElementsByClassName('mail-time')[0].innerHTML = "";
        document.getElementsByClassName('mail-from')[0].innerHTML = "";
        document.getElementsByClassName('mail-paid')[0].innerHTML = "";
        document.getElementsByClassName('message')[0].innerHTML = "";
        document.getElementsByClassName('subject')[0].innerHTML = "";
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
            return await mail.utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }
}
const mail = new Mail();
window.mail = mail;
export {mail};