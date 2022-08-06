"use strict";

class Server{
    async getUtils(){
        !localStorage.getItem("ipfsGateway") ? localStorage.setItem("ipfsGateway", "") : undefined;
        const {utils} = await import(localStorage.getItem("ipfsGateway")+"./utils/utils.mjs");
        return utils;
    }

    constructor() {
        this.utils = null;
        this.shared = null;
        this.Constants = null;
        this.address = "";
        this.ipfsServerId = 0;
        this.owner = "";
        this.minimumFee = "";

        this.listenEvents();
    }

    listenEvents() {
        const self = this;
        document.addEventListener("DOMContentLoaded", async function() {
            self.utils = await self.getUtils();
            self.shared = await self.utils.getShared();
            self.Constants = await self.shared.getConstants();
            self.utils.checkIfMetaMaskIsInstalled()
                .then(async () => {
                    self.address = self.utils.checkAddress(await self.utils.getSelectedAddress(self));
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
        this.utils.listenMetaMaskEvents()
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
        this.initViews();
    }

    onNotConnected(){
        this.onDOMContentLoaded();
    }

    onDOMContentLoaded(){
        this.clicks();
        this.initViews();
    }

    clicks(){
        document.getElementsByClassName('mint-server')[0].addEventListener('click', this.onMintServerClicked);
        document.getElementsByClassName('get-settings')[0].addEventListener('click', this.onGetSettingsClicked);
        document.getElementsByClassName('get-settings')[0].addEventListener('click', this.onGetSettingsClicked);
        document.getElementsByClassName('update-server')[0].addEventListener('click', this.onUpdateServerClicked);
        this.utils.setEnterClick(document.getElementsByClassName("server-fee")[0], this.onMintServerClicked);
        this.utils.setEnterClick(document.getElementsByClassName("ipfs-server-url")[0], this.onMintServerClicked);
        this.utils.setEnterClick(document.getElementsByClassName("server-id")[0], this.onGetSettingsClicked);
    }

    initViews(){
        this.getMinimumFee()
            .then(() => {
                document.getElementsByClassName("server-fee")[0].value = this.minimumFee;
                document.getElementsByClassName("ipfs-server-url")[0].value = "";
            })
            .catch(e => this.utils.showAlert(e));
    }

    async onMintServerClicked(){
        if(server.utils.accounts && server.utils.accounts.length > 0){
            const web3 = await server.utils.getWeb3();
            if(!web3){return;}

            server.shared.showLoading();
            const ipfsServerUrl = document.getElementsByClassName("ipfs-server-url")[0].value;
            if(!ipfsServerUrl || ipfsServerUrl === ""){
                server.utils.showAlert("Error: the server url is blank.");
                return;
            }

            let fee = document.getElementsByClassName("server-fee")[0].value;
            if(isNaN(parseFloat(fee.toString())) || !fee || fee === ""){
                server.utils.showAlert("Error: the fee value is not a number.");
                return;
            }
            else if(web3.utils.toWei(fee) < web3.utils.toWei(server.minimumFee)){
                server.utils.showAlert("Error: the fee value is below of the minimum.");
                return;
            }
            fee = web3.utils.toWei(fee, "ether");

            const txValues = await server.utils.getTxValues();
            const tx = {
                to: server.Constants.IPFS_CONTRACT_ADDRESS,
                data: txValues.iface.encodeFunctionData("mintServer(string,uint256)", [
                    ipfsServerUrl, fee
                ])
            };

            txValues.signer.sendTransaction(tx)
                .then(() => server.shared.hideLoading())
                .catch(e => server.utils.showAlert(e));
        }
        else{
            server.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async onGetSettingsClicked(){
        const web3 = await server.utils.getWeb3();
        if(!web3){return;}

        server.shared.showLoading();
        server.shared.hideClassName("update", 0);
        const contract = await server.utils.getContract(server.Constants.IPFS_CONTRACT_ADDRESS);
        if(!contract){return;}
        server.ipfsServerId = document.getElementsByClassName("server-id")[0].value;

        if(isNaN(parseInt(server.ipfsServerId))){
            server.utils.showAlert("Error: the server ID is not a number.");
            return;
        }

        const settings = await contract.methods.getServerSettings(server.ipfsServerId, 0).call();
        server.owner = settings[0];
        document.getElementsByClassName("update-server-fee")[0].value = web3.utils.fromWei(settings[1]);
        document.getElementsByClassName("update-ipfs-server-url")[0].value = await contract.methods.tokenURI(server.ipfsServerId).call();
        server.shared.showClassName("update", 0);
        server.shared.hideLoading();
    }

    async onUpdateServerClicked(){
        if(server.utils.accounts && server.utils.accounts.length > 0){
            if(server.address !== server.owner){
                server.utils.showAlert("Error: the account is not the owner of the server.");
                return;
            }

            const web3 = await server.utils.getWeb3();
            if(!web3){return;}

            server.shared.showLoading();
            const fee = web3.utils.toWei(document.getElementsByClassName("update-server-fee")[0].value);
            const uri = document.getElementsByClassName("update-ipfs-server-url")[0].value;

            const txValues = await server.utils.getTxValues();
            const tx = {
                to: server.Constants.IPFS_CONTRACT_ADDRESS,
                data: txValues.iface.encodeFunctionData("setServerSettings(uint256,string,uint256)", [
                    server.ipfsServerId, uri, fee
                ])
            };

            txValues.signer.sendTransaction(tx)
                .then(() => {
                    server.shared.hideClassName("update", 0);
                    server.shared.hideLoading();
                })
                .catch(e => server.utils.showAlert(e));
        }
        else{
            server.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    async getMinimumFee(){
        const web3 = await this.utils.getWeb3();
        if(!web3){return;}

        const contract = await this.utils.getContract(this.Constants.IPFS_CONTRACT_ADDRESS);
        const settings = await contract.methods.getServerSettings(this.ipfsServerId, 0).call();
        this.minimumFee = web3.utils.fromWei(settings[5]);
    }
}
const server = new Server();
export {server};