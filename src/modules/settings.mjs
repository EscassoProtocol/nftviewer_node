"use strict";

class Settings{
    async getUtils(){
        !localStorage.getItem("ipfsGateway") ? localStorage.setItem("ipfsGateway", "") : undefined;
        const {utils} = await import(localStorage.getItem("ipfsGateway")+"./utils/utils.mjs");
        return utils;
    }

    async getAES(){
        const {aes} = await import(localStorage.getItem("ipfsGateway")+"./utils/aes.mjs");
        return aes;
    }

    async getPasswordDialog(){
        const {passwordDialog} = await import(localStorage.getItem("ipfsGateway")+"./utils/password_dialog.mjs");
        return passwordDialog;
    }

    constructor() {
        this.utils = null;
        this.address = "";
        this.ipfsServerId = "";
        this.ipfsServerFee = "";
        this.passwordDialog = null;
        this.Constants = null;
        this.serverId = "";
        this.userId = "";
        this.pinned = false;
        this.mailBox = "";
        this.serverUrl = "";
        this.proof = null;

        this.listenEvents();
    }

    listenEvents() {
        const self = this;
        document.addEventListener("DOMContentLoaded", async () => {
            self.utils = await self.getUtils();
            self.shared = await self.utils.getShared();
            self.Constants = await self.shared.getConstants();
            self.aes = await self.getAES();
            self.passwordDialog = await self.getPasswordDialog();
            self.address = Web3.utils.toChecksumAddress(await self.utils.getSelectedAddress(self));
            self.ipfsContract = await self.utils.getContract(self.Constants.IPFS_CONTRACT_ADDRESS);
            if(!self.ipfsContract){return;}
            self.mailContract = await self.utils.getContract(self.Constants.MAIL_CONTRACT_ADDRESS);
            if(!self.mailContract){return;}
            if(self.utils.isMobileBrowser()) {
                self.shared.showWarning();
            }
            else{
                self.onUpdated();
            }
            self.utils.unsavedChanges().catch(e => self.utils.showAlert(e));
        });
    }

    onUpdated() {
        this.shared.hideLoading();
        this.utils.listenMetaMaskEvents()
            .then(() => this.onDOMContentLoaded())
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

    onNotConnected(){
        this.onDOMContentLoaded();
    }

    onDOMContentLoaded(){
        this.clicks();
        this.initViews();
        this.shared.setConnected(this.address, this.Constants.ADDRESS_MAX_LENGTH);
    }

    clicks(){
        document.getElementsByClassName('save')[0].addEventListener('click', () => this.onSaveClicked(true));
        document.getElementsByClassName('reset')[0].addEventListener('click', this.onResetClicked);
        document.getElementsByClassName('export')[0].addEventListener('click', this.onExportClicked);
        document.getElementsByClassName('change-pk')[0].addEventListener('click', this.onChangePKClicked);
        document.getElementsByClassName('change-proof')[0].addEventListener('click', this.onChangeProofClicked);
        document.getElementsByClassName('lease-server')[0].addEventListener('click', this.onLeaseServerClicked);
        document.getElementsByClassName('update-proof-btn')[0].addEventListener('click', this.onUpdateProofClicked);
        document.getElementsByClassName('update-mailbox')[0].addEventListener('click', this.onUpdateMailBoxClicked);
        document.getElementsByClassName('copy-mail')[0].addEventListener('click', this.onCopyMailClicked);
        document.getElementsByClassName('create-proof-btn')[0].addEventListener('click', this.onCreateProofClicked);
        this.utils.setEnterClick(document.getElementsByClassName("old-password-pk")[0], this.onEnterPKClick);
        this.utils.setEnterClick(document.getElementsByClassName("new-password-pk")[0], this.onEnterPKClick);
        this.utils.setEnterClick(document.getElementsByClassName("repeat-password-pk")[0], this.onEnterPKClick);
        this.utils.setEnterClick(document.getElementsByClassName("old-password-proof")[0], this.onEnterProofClick);
        this.utils.setEnterClick(document.getElementsByClassName("new-password-proof")[0], this.onEnterProofClick);
        this.utils.setEnterClick(document.getElementsByClassName("repeat-password-proof")[0], this.onEnterProofClick);
        this.shared.clicks();
    }

    initViews(){
        this.getValue("rpc-provider-url", "providerLink");
        this.getValue("max-blocks", "maxBlocks");
        this.getValue("ipfs-gateway", "ipfsGateway");
        this.getValue("explorer", "explorer");
        this.getValue("ipfs-server-url", this.address + "_ipfsServerUrl");
        this.getStatus("use-own-ipfs-server", this.address + "_useOwnIPFSServerUrl");
        this.getStatus("disable-check-updates", "disableCheckUpdates");
        this.getValue("servers-list", this.address + "_serversList");
        this.getStatus("copy-always", this.address + "_copyAlways");
        this.passwordDialog.initViews("Set the password to unlock your proof:", null);
    }

    onOKClicked(resolve){
        settings.passwordDialog.onBackClicked();
        resolve(settings.passwordDialog.getPassword());
    }

    onBackClicked(resolve){
        resolve(null);
    }

    onEnterPKClick(){
        settings.loadPK("pk-file").catch(e => settings.utils.showAlert(e));
    }

    onEnterProofClick(){
        settings.loadProof('proof-file').catch(e => settings.utils.showAlert(e));
    }

    onSaveClicked(showToast){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            settings.saveValue("rpc-provider-url", "providerLink");
            settings.saveValue("max-blocks", "maxBlocks");
            settings.saveValue("ipfs-gateway", "ipfsGateway");
            settings.saveValue("explorer", "explorer");
            settings.saveValue("ipfs-server-url", settings.address + "_ipfsServerUrl");
            settings.saveStatus('use-own-ipfs-server', settings.address + "_useOwnIPFSServerUrl");
            settings.saveStatus('disable-check-updates', "disableCheckUpdates");
            settings.saveValue("servers-list", settings.address + "_serversList");
            settings.saveStatus("copy-always", settings.address + "_copyAlways");
            document.getElementById('settings-file').value = "";
            if(showToast){
                settings.shared.showToast("The changes have been saved!");
            }
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async onResetClicked(){
        if(!await settings.utils.showConfirm("Your settings will be reset to default values. All changes made will be lost." +
            "\n\nAre you sure?")){
            return;
        }

        document.getElementsByClassName("rpc-provider-url")[0].value = settings.Constants.DEFAULT_RPC_PROVIDER;
        document.getElementsByClassName("max-blocks")[0].value = settings.Constants.DEFAULT_MAX_BLOCKS;
        document.getElementsByClassName("ipfs-gateway")[0].value = settings.Constants.DEFAULT_IPFS_GATEWAY_PREFIX;
        document.getElementsByClassName("explorer")[0].value = settings.Constants.DEFAULT_EXPLORER;
        document.getElementsByClassName("ipfs-server-url")[0].value = settings.Constants.DEFAULT_IPFS_SERVER_URL;
        document.getElementById("use-own-ipfs-server").checked = settings.Constants.DEFAULT_USE_OWN_IPFS_SERVER;
        document.getElementById("disable-check-updates").checked = settings.Constants.DEFAULT_DISABLE_CHECK_UPDATES;
        document.getElementsByClassName("servers-list")[0].value = settings.Constants.DEFAULT_SERVERS_LIST;
        document.getElementById("copy-always").checked = settings.Constants.DEFAULT_COPY_ALWAYS;
        localStorage.setItem("showedPermission", "false");
        localStorage.setItem("showedDisclaimer", "false");
        settings.onSaveClicked(false);
    }

    onExportClicked(){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            const filename = settings.address + "_stg.dat";

            settings.onSaveClicked(false);
            const data = {
                rpc_provider_url: document.getElementsByClassName("rpc-provider-url")[0].value,
                max_blocks: document.getElementsByClassName("max-blocks")[0].value,
                ipfs_gateway: document.getElementsByClassName("ipfs-gateway")[0].value,
                explorer: document.getElementsByClassName("explorer")[0].value,
                use_own_ipfs_server: document.getElementById("use-own-ipfs-server").checked,
                ipfs_server_url: document.getElementsByClassName("ipfs-server-url")[0].value,
                disable_check_updates: document.getElementById("disable-check-updates").checked,
                servers_list: document.getElementsByClassName("servers-list")[0].value.replaceAll(' ','').split(','),
                copy_always: document.getElementById("copy-always").checked,
                showed_permission: localStorage.getItem("showedPermission") === "true",
                showed_disclaimer: localStorage.getItem("showedDisclaimer") === "true",
            }

            settings.utils.saveFile(JSON.stringify(data), filename, "text/plain");
            settings.utils.showAlert("The settings file has been created and exported with the name:" +
                "\n" + filename + ".");
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    onChangePKClicked(){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            settings.loadPK("pk-file").catch(e => settings.utils.showAlert(e));
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    onChangeProofClicked(){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            settings.loadProof("proof-file").catch(e => settings.utils.showAlert(e));
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async onLeaseServerClicked(){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            const web3 = await settings.utils.getWeb3();
            if(!web3){return;}

            settings.ipfsServerId = document.getElementsByClassName("server-id")[0].value;
            if(isNaN(parseInt(settings.ipfsServerId)) || !settings.ipfsServerId || settings.ipfsServerId === ""){
                settings.utils.showAlert("Error: the server id is not a number.");
                return;
            }

            settings.loadProof('proof-file-lease', true)
                .then(async data => {
                    settings.shared.showLoading();

                    settings.root = data.root;
                    const serverSettings = await settings.ipfsContract.methods.getServerSettings(settings.ipfsServerId, 0).call();
                    const defaultFee = parseInt(serverSettings[1]);
                    const userId = await settings.ipfsContract.methods.getUserId(settings.ipfsServerId, settings.address).call();
                    const ipfsServerUrl = await settings.ipfsContract.methods.tokenURI(settings.ipfsServerId).call();

                    if(ipfsServerUrl){
                        if(userId === "0"){
                            const fee = await settings.utils.showPrompt("Your chosen IPFS server was: " + ipfsServerUrl +
                                '\n\nSet the value to lease:', web3.utils.fromWei(defaultFee.toString()));
                            if(!fee){
                                return;
                            }
                            else if(isNaN(parseFloat(fee))){
                                settings.utils.showAlert("Error: the value is not a number.");
                                return;
                            }

                            settings.ipfsServerFee = await settings.utils.getBigNumber(web3.utils.toWei(fee).toString());
                            const txValues = await settings.utils.getTxValues();

                            const tx = {
                                to: settings.Constants.IPFS_CONTRACT_ADDRESS,
                                value: settings.ipfsServerFee,
                                data: txValues.iface.encodeFunctionData("leaseServer(uint256,bytes32)", [
                                    settings.ipfsServerId, settings.root
                                ])
                            };

                            txValues.signer.sendTransaction(tx)
                                .then(() => settings.shared.hideLoading())
                                .catch(e => settings.utils.showAlert(e));
                        }
                        else{
                            settings.utils.showAlert("Error: the user already leased this server before.");
                        }
                    }
                    else{
                        settings.utils.showAlert("Error: the server doesn't exist.");
                    }
                })
                .catch(e => settings.utils.showAlert(e));
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async onUpdateProofClicked(){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            settings.shared.showLoading();
            settings.ipfsServerId = await settings.ipfsContract.methods.getServerId(settings.address).call();
            const userId = await settings.ipfsContract.methods.getUserId(settings.ipfsServerId, settings.address).call();
            if(userId === "0"){
                settings.utils.showAlert("Error: the user didn't lease a server.");
                return;
            }

            settings.shared.hideLoading();
            settings.passwordDialog.initViews("Set the password to lock your proof",
                "(if you don't want to lock, let it blank):");
            const password = await settings.passwordDialog.showPasswordDialog(settings, true);
            if(password === null){
                return;
            }

            settings.createProof(password, true).catch(e => settings.utils.showAlert(e));
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    onUpdateMailBoxClicked(){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            settings.loadPK("pk-file-update", true)
                .then(async data => {
                    const jwk = {
                        "n": data.n,
                        "e": data.e,
                    }

                    settings.shared.showLoading();
                    settings.serverId = await settings.ipfsContract.methods.getServerId(settings.address).call();
                    settings.userId = await settings.ipfsContract.methods.getUserId(settings.serverId, settings.address).call();
                    const serverSettings = await settings.ipfsContract.methods.getServerSettings(settings.serverId, settings.userId).call();
                    settings.pinned = serverSettings[3];
                    const useOwnIPFSServerUrl = localStorage.getItem(settings.address + "_useOwnIPFSServerUrl") === "true";
                    settings.mailBox = JSON.stringify(jwk);

                    if(useOwnIPFSServerUrl){
                        settings.serverUrl = localStorage.getItem(settings.address + "_ipfsServerUrl");
                        if(settings.serverUrl === "" || settings.serverUrl === "null" || settings.serverUrl === "undefined"){
                            settings.utils.showAlert("Error: the server url is blank or has an invalid value.");
                            return;
                        }
                        settings.updateMailBox();
                    }
                    else{
                        const serverIdChosen = await settings.utils.showPrompt('Set the IPFS Server ID:', "1");
                        if(!serverIdChosen){
                            return;
                        }
                        else if(isNaN(parseInt(serverIdChosen))){
                            settings.utils.showAlert("Error: the value is not a number.");
                            return;
                        }

                        settings.serverUrl = await settings.ipfsContract.methods.tokenURI(serverIdChosen).call();
                        settings.loadProof("proof-file-update", true)
                            .then(data => {
                                settings.proof = data.proof;
                                settings.updateMailBox();
                            })
                            .catch(e => settings.utils.showAlert(e));
                    }
                }).catch(e => settings.utils.showAlert(e));
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async onCopyMailClicked(){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            const toServers = document.getElementsByClassName("to-servers")[0].value;
            if(toServers === ""){
                settings.utils.showAlert("Error: the 'to servers' field cannot be empty.");
                return;
            }
            const serversList = toServers.replaceAll(' ','').split(',');

            settings.loadProof('proof-file-copy', true)
                .then(async data => {
                    settings.proof = data.proof;

                    settings.shared.showLoading();
                    const mailId = document.getElementsByClassName("mail-id")[0].value;
                    const mailCid = await settings.mailContract.methods.getMail(settings.address, mailId).call();
                    if(!mailCid){
                        settings.utils.showAlert("Error: nonexistent mail ID.");
                        return;
                    }

                    const fromServer = document.getElementsByClassName("from-server")[0].value;
                    settings.serverId = await settings.ipfsContract.methods.getServerId(settings.address).call();
                    settings.userId = await settings.ipfsContract.methods.getUserId(settings.serverId, settings.address).call();
                    const serverSettings = await settings.ipfsContract.methods.getServerSettings(settings.serverId, settings.userId).call();
                    settings.pinned = serverSettings[3];

                    settings.copyMail(mailCid, fromServer, settings.serverId, settings.userId, settings.proof,
                        settings.pinned, serversList)
                        .then(() => {
                            settings.shared.showToast("Mail Copied Successfully!");
                            settings.shared.hideLoading();
                        })
                        .catch(e => settings.utils.showAlert(e));
                })
                .catch(e => settings.utils.showAlert(e));
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async onCreateProofClicked(){
        if(settings.utils.accounts && settings.utils.accounts.length > 0){
            settings.passwordDialog.initViews("Set the password to lock your proof",
                "(if you don't want to lock, let it blank):");
            const password = await settings.passwordDialog.showPasswordDialog(settings, true);
            if(password === null){
                return;
            }

            settings.createProof(password, false).catch(e => settings.utils.showAlert(e));
        }
        else{
            settings.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    updateMailBox(){
        this.shared.showLoading();

        let serversList = [];
        if(localStorage.getItem(this.address + "_copyAlways") === "true"){
            serversList = document.getElementsByClassName("servers-list")[0].value.replaceAll(' ','').split(',');
        }

        this.sendMailBox(this.mailBox, this.serverUrl, this.serverId, this.userId, this.proof, this.pinned, serversList)
            .then(data => {
                if(data && data.path){
                    const endMailBox = data.path.substring(data.path.length - this.Constants.MAX_CHARACTERS_END_MAILBOX, data.path.length);
                    const mailBox = this.utils.getEllipsis(data.path, this.Constants.MAX_CHARACTERS_MAILBOX, endMailBox);
                    this.shared.hideLoading();
                    this.shared.showToast("MailBox "+mailBox+" Updated!");
                }
                else{
                    this.utils.showAlert(data);
                }
            })
            .catch(e => this.utils.showAlert(e));
    }

    async loadSettings(){
        if(!await this.utils.showConfirm("Your settings will be reset to imported values. All changes made will be lost." +
            "\n\nAre you sure?")){
            return;
        }

        const file = document.getElementById('settings-file').files[0];
        const reader = new FileReader();

        const self = this;
        reader.onload = async function(){
            const data = reader.result.toString();
            if(self.utils.isJson(data)){
                const obj = JSON.parse(data);
                document.getElementsByClassName("rpc-provider-url")[0].value = obj.rpc_provider_url;
                document.getElementsByClassName("max-blocks")[0].value = obj.max_blocks;
                document.getElementsByClassName("ipfs-gateway")[0].value = obj.ipfs_gateway;
                document.getElementsByClassName("explorer")[0].value = obj.explorer;
                document.getElementById("use-own-ipfs-server").checked = obj.use_own_ipfs_server;
                document.getElementsByClassName("ipfs-server-url")[0].value = obj.ipfs_server_url;
                document.getElementById("disable-check-updates").checked = obj.disable_check_updates;
                document.getElementsByClassName("servers-list")[0].value = obj.servers_list;
                document.getElementById("copy-always").checked = obj.copy_always;
                localStorage.setItem("showedPermission", obj.showed_permission);
                localStorage.setItem("showedDisclaimer", obj.showed_disclaimer);

                self.onSaveClicked(false);
                self.shared.showToast("The settings were imported successfully!");
            }
            else{
                self.utils.showAlert("Error: invalid settings file.");
            }
        };
        file ? reader.readAsText(file, 'UTF-8') : undefined;
    }

    async loadPK(id, onlyLoad){
        return new Promise(function(resolve, reject) {
            try{
                const file = document.getElementById(id).files[0];
                const reader = new FileReader();

                reader.onload = async function(){
                    const data = reader.result.toString();
                    if(onlyLoad){
                        if(!data.includes("\"n\"") && !data.includes("\"e\"")){
                            try{
                                settings.passwordDialog.initViews("Set the password to unlock your private key:", null);
                                const password = await settings.passwordDialog.showPasswordDialog(settings, false);
                                if(password === null){
                                    return;
                                }

                                const privateKey = settings.utils.get32BytesPassword(password, settings.address);
                                let obj = await settings.aes.decryptData(data, privateKey);
                                obj = JSON.parse(obj);

                                resolve(obj);
                            }
                            catch (e) {
                                reject("Error: incorrect password");
                            }
                        }
                        else{
                            const obj = JSON.parse(data);
                            resolve(obj);
                        }
                    }
                    else{
                        if(!data.includes("\"n\"") && !data.includes("\"e\"")){
                            await settings.unlockPK(data, reject);
                        }
                        else{
                            const continue_ = await settings.utils.showConfirm("The file is not encrypted.\n\nDo you want to encrypt it?");
                            if(continue_){
                                settings.checkPasswordsPK(JSON.parse(data), reject);
                            }
                            else{
                                settings.restartPKPasswords();
                                resolve(false);
                            }
                        }
                        resolve(true);
                    }
                };
                file ? reader.readAsText(file, 'UTF-8') : settings.utils.showAlert("Error: you need to select your private key file.");
            }
            catch (e) {
                reject(e);
            }
        });
    }

    async unlockPK(data, reject){
        try{
            const oldPassword = document.getElementsByClassName("old-password-pk")[0].value;
            const privateKey = this.utils.get32BytesPassword(oldPassword, this.address);
            let obj = await this.aes.decryptData(data, privateKey);
            obj = JSON.parse(obj);

            if(!obj.n && !obj.e){
                reject("Error: incorrect password.");
            }
            else{
                this.checkPasswordsPK(obj, reject);
            }
        }
        catch (e) {
            reject("Error: incorrect password.");
        }
    }

    async loadProof(id, onlyLoad){
        return new Promise(function(resolve, reject) {
            try{
                const file = document.getElementById(id).files[0];
                const reader = new FileReader();

                reader.onload = async function(){
                    const data = reader.result.toString();
                    if(onlyLoad){
                        if(!data.includes("root") && !data.includes("proof")){
                            try{
                                const aes = settings.aes;
                                const passwordDialog = settings.passwordDialog;

                                passwordDialog.initViews("Set the password to unlock your proof:", null);
                                const password = await passwordDialog.showPasswordDialog(settings, false);
                                if(password === null){
                                    return;
                                }

                                const privateKey = settings.utils.get32BytesPassword(password, settings.address);
                                let obj = await aes.decryptData(data, privateKey);
                                obj = JSON.parse(obj);

                                if(!obj.root && !obj.proof){
                                    reject("Error: incorrect password.");
                                }
                                else{
                                    resolve(obj);
                                }
                            }
                            catch (e) {
                                reject("Error: incorrect password.");
                            }
                        }
                        else{
                            const obj = JSON.parse(data);
                            resolve(obj);
                        }
                    }
                    else{
                        if(!data.includes("root") && !data.includes("proof")){
                            await settings.unlockProof(data, reject);
                        }
                        else{
                            const continue_ = await settings.utils.showConfirm("The file is not encrypted.\n\nDo you want to encrypt it?");
                            if(continue_){
                                settings.checkPasswordsProof(JSON.parse(data), reject);
                            }
                            else{
                                settings.restartProofPasswords();
                                resolve(false);
                            }
                        }
                    }
                    resolve(true);
                };
                file ? reader.readAsText(file, 'UTF-8') : settings.utils.showAlert("Error: you need to select your proof file.");
            }
            catch (e) {
                reject(e);
            }
        });
    }

    async unlockProof(data, reject){
        try{
            const oldPassword = document.getElementsByClassName("old-password-proof")[0].value;
            const privateKey = this.utils.get32BytesPassword(oldPassword, this.address);
            let obj = await this.aes.decryptData(data, privateKey);
            obj = JSON.parse(obj);

            if(!obj.root && !obj.proof){
                reject("Error: incorrect password.");
            }
            else{
                this.checkPasswordsProof(obj, reject);
            }
        }
        catch (e) {
            reject("Error: incorrect password.");
        }
    }

    restartProofPasswords(){
        document.getElementsByClassName("old-password-proof")[0].value = "";
        document.getElementsByClassName("new-password-proof")[0].value = "";
        document.getElementsByClassName("repeat-password-proof")[0].value = "";
    }

    restartPKPasswords(){
        document.getElementsByClassName("old-password-pk")[0].value = "";
        document.getElementsByClassName("new-password-pk")[0].value = "";
        document.getElementsByClassName("repeat-password-pk")[0].value = "";
    }

    saveStatus(id, itemKey){
        const value = document.getElementById(id).checked;
        localStorage.setItem(itemKey, value.toString());
    }

    saveValue(className, itemKey){
        const value = document.getElementsByClassName(className)[0].value;
        localStorage.setItem(itemKey, value);
    }

    getValue(className, itemKey){
        document.getElementsByClassName(className)[0].value = localStorage.getItem(itemKey);
    }

    getStatus(id, itemKey){
        document.getElementById(id).checked = localStorage.getItem(itemKey) === "true";
    }

    checkPasswordsPK(obj, reject){
        const newPassword = document.getElementsByClassName("new-password-pk")[0].value;
        const repeatPassword = document.getElementsByClassName("repeat-password-pk")[0].value;
        if(!newPassword || !repeatPassword){
            reject("Error: the password cannot be empty.");
        }
        else if(newPassword === repeatPassword){
            settings.createNewPK(newPassword, obj).catch(e => reject(e));
        }
        else{
            reject("Error: the passwords are not equal.");
        }
    }

    async createNewPK(newPassword, data){
        const privateKey = this.utils.get32BytesPassword(newPassword, this.address);
        data = await this.aes.encryptData(JSON.stringify(data), privateKey);

        const filename = this.address + "_pk.dat";
        this.utils.saveFile(data, filename, "text/plain");
        this.restartPKPasswords();
        this.utils.showAlert("ATTENTION:" +
            "\n\nThe new private key has been created and downloaded with the name:" +
            "\n" + filename + "." +
            "\n\nDo not lose this file. Keep it safe on an offline hard drive or print its content." +
            "\n\nThis file is the ONLY way to decrypt your messages.");
    }

    checkPasswordsProof(obj, reject){
        const newPassword = document.getElementsByClassName("new-password-proof")[0].value;
        const repeatPassword = document.getElementsByClassName("repeat-password-proof")[0].value;
        if(!newPassword || !repeatPassword){
            reject("Error: the password cannot be empty.");
        }
        else if(newPassword === repeatPassword){
            this.encryptProof(newPassword, obj).catch(e => reject(e));
        }
        else{
            reject("Error: the passwords are not equal.");
        }
    }

    async encryptProof(newPassword, data){
        const privateKey = this.utils.get32BytesPassword(newPassword, this.address);
        data = await this.aes.encryptData(JSON.stringify(data), privateKey);

        const filename = this.address + "_proof.dat";
        this.utils.saveFile(data, filename, "text/plain");
        this.restartProofPasswords();
        this.utils.showAlert("ATTENTION:" +
            "\n\nThe new proof has been created and downloaded with the name:" +
            "\n" + filename + "." +
            "\n\nThis file is used to prove that you already leased a server." +
            "\n\nDo not lose this file. If you lose it, you'll need to pay a transaction to renew your proof.");
    }

    async createProof(password, sendRoot){
        const merkleTree = this.utils.getMerkleTree(this.address);
        this.root = merkleTree.root;
        this.proof = merkleTree.proof;

        let data = {
            root: settings.root,
            proof: settings.proof
        }

        if(password){
            const privateKey = this.utils.get32BytesPassword(password, this.address);
            data = await this.aes.encryptData(JSON.stringify(data), privateKey);
        }
        else{
            data = JSON.stringify(data);
        }

        const filename = this.address + "_proof.dat";
        this.utils.saveFile(data, filename, "text/plain");
        this.utils.showAlert("ATTENTION:" +
            "\n\nThe proof has been created and exported with the name:" +
            "\n" + filename + "." +
            "\n\nThis file is used to prove that you already leased a server." +
            "\n\nDo not lose this file. If you lose it, you'll need to pay a transaction to renew your proof.");

        if(sendRoot){
            this.shared.showLoading();
            this.sendNewProof().catch(e => this.utils.showAlert(e));
        }
    }

    async sendNewProof(){
        const txValues = await this.utils.getTxValues();

        const tx = {
            to: this.Constants.IPFS_CONTRACT_ADDRESS,
            data: txValues.iface.encodeFunctionData("setRoot(uint256,bytes32)", [
                this.ipfsServerId, this.root
            ])
        };

        txValues.signer.sendTransaction(tx)
            .then(() => this.shared.hideLoading())
            .catch(e => this.utils.showAlert(e));
    }

    async sendMailBox(text, serverUrl, serverId, userId, proof, pinned, serverUrls){
        const url = serverUrl + "add";
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
            return await settings.utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async copyMail(cid, serverUrl, serverId, userId, proof, pinned, serverUrlsTo){
        const url = serverUrl + "copy";
        return fetch(url, {
            body: JSON.stringify({
                cid: cid,
                serverId: serverId,
                userId: userId,
                proof: proof,
                pinned: pinned,
                serverUrls: serverUrlsTo
            }),
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async function(response) {
            return await settings.utils.returnResponse(response);
        }).catch(error => {
            return Promise.reject(error);
        });
    }
}
const settings = new Settings();
window.settings = settings;
export {settings};