"use strict";

class Viewer {
    async getUtils(){
        !localStorage.getItem("ipfsGateway") ? localStorage.setItem("ipfsGateway", "") : undefined;
        const {utils} = await import(localStorage.getItem("ipfsGateway")+"./utils/utils.mjs");
        return utils;
    }

    constructor() {
        this.contractAddress = "";
        this.id = 0;
        this.utils = null;
        this.Constants = null;
        this.owner = "";
        this.image = "";
        this.currentAddress = "";

        this.listenEvents();
    }

    listenEvents() {
        const self = this;
        document.addEventListener("DOMContentLoaded", async function() {
            self.utils = await self.getUtils();
            self.shared = await self.utils.getShared();
            self.Constants = await self.shared.getConstants();
            self.utils.checkIfMetaMaskIsInstalled()
                .then(() => {
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

    onAccountsChanged(){
        this.initViews();
    }

    onNotConnected(){
        this.onDOMContentLoaded();
        this.shared.setConnected(null, this.Constants.ADDRESS_MAX_LENGTH);
    }

    onDOMContentLoaded(){
        this.shared.showViewerPermission();
        this.shared.showLoading();
        this.clicks();
        this.initViews();
    }

    clicks(){
        document.getElementsByClassName('minted-button')[0].addEventListener('click', this.onMintDateClicked);
        document.getElementsByClassName('creator-button')[0].addEventListener('click', this.onCreatorClicked);
        document.getElementsByClassName('owner-button')[0].addEventListener('click', this.onOwnerClicked);
        document.getElementsByClassName('view')[0].addEventListener('click', this.onViewClicked);
        document.getElementsByClassName('close-viewer')[0].addEventListener('click', this.closeViewer);
        document.getElementsByClassName('send')[0].addEventListener('click', this.onSendClicked);
        document.getElementsByClassName('burn')[0].addEventListener('click', this.onBurnClicked);
        this.shared.clicks();
    }

    initViews(){
        this.utils.disableButton("send", 0);
        this.utils.disableButton("burn", 0);
        const searches = window.location.search.split('/').filter(function(v){return v;});
        if(searches && searches.length > 1){
            this.searched(searches);
            this.checkCurrentAddressIsOwner();
        }
        else{
            this.utils.showAlert("Error: wrong contract address and/or token id. \n\nTry to add a '?', the contract address, a '/' and the token id.\n\nExample: ?0xab5801a7d398351b8be11c439e05c5b3259aec9b/1");
        }
    }

    onMintDateClicked(){
        viewer.shared.showLoading();
        viewer.utils.getTokenMintBlock(viewer.contract, viewer.contractAddress, viewer.id)
            .then(async data => {
                const block = data.block;
                if(block >= 0) {
                    viewer.shared.hideClassName("minted-button", 0);
                    viewer.shared.showClassName("minted-label", 0);
                    document.getElementsByClassName("minted-label")[0].innerHTML = "(Minted on: " + await viewer.utils.getBlockDate(block) + ")";
                    viewer.shared.hideLoading();
                }
                else{
                    viewer.utils.showAlert("Error: invalid block. Check your settings for max blocks.");
                }
            })
            .catch(e => viewer.utils.showAlert(e));
    }

    onCreatorClicked(){
        viewer.shared.showLoading();
        viewer.utils.getTokenMintBlock(viewer.contract, viewer.contractAddress, viewer.id)
            .then(async data => {
                const address = data.address;
                if(address) {
                    const network = await viewer.utils.getNetwork(true);
                    const explorer = await viewer.utils.getExplorer();
                    viewer.shared.hideClassName("creator-button", 0);
                    viewer.shared.showClassName("creator-link", 0);
                    document.getElementsByClassName("creator-link")[0].innerHTML = address;
                    document.getElementsByClassName("creator-link")[0].href = "https://" + (network === "" ? network : network + ".") + explorer + "address/" + address;
                    viewer.shared.hideLoading();
                }
                else{
                    viewer.utils.showAlert("Error: invalid address. Check your settings for max blocks.");
                }
            })
            .catch(e => viewer.utils.showAlert(e));
    }

    onOwnerClicked(){
        viewer.shared.showLoading();
        viewer.utils.getTokenOwner(viewer.contract, viewer.contractAddress, viewer.id)
            .then(async data => {
                if(data.address) {
                    viewer.owner = data.address;
                    await viewer.setOwner();
                    viewer.shared.hideLoading();
                }
                else{
                    viewer.utils.showAlert("Error: invalid address. Check your settings for max blocks.");
                }
            })
            .catch(e => viewer.utils.showAlert(e));
    }

    async onViewClicked(){
        const zoom = await viewer.utils.getZoom();
        zoom.startZoom("id-canvas", viewer.image);
        viewer.showViewer();
    }

    async onSendClicked(){
        let to = await viewer.utils.showPrompt("Set the address to send the token:");
        if(!viewer.utils.checkAddress(to)){
            viewer.utils.showAlert("Error: invalid address.");
            return;
        }

        const txValues = await viewer.utils.getTxValues();
        const tx = {
            to: viewer.contractAddress,
            data: txValues.iface.encodeFunctionData("transferFrom(address,address,uint256)", [
                viewer.currentAddress, to, viewer.id
            ])
        };

        txValues.signer.sendTransaction(tx)
            .then(() => viewer.shared.hideLoading())
            .catch(e => viewer.utils.showAlert(e));
    }

    async onBurnClicked(){
        const txValues = await viewer.utils.getTxValues();
        const tx = {
            to: viewer.contractAddress,
            data: txValues.iface.encodeFunctionData("burn(uint256)", [
                viewer.id
            ])
        };

        txValues.signer.sendTransaction(tx)
            .then(() => viewer.shared.hideLoading())
            .catch(e => viewer.utils.showAlert(e));
    }

    searched(searches){
        const contract = this.utils.checkAddress(searches[0].replace("?",""));
        const id = searches[1];
        this.contractAddress = contract;
        this.id = id;
        this.utils.getTokenInfo(this.contractAddress, this.id)
            .then(info => {
                this.setTokenInfo(info).catch(e => this.utils.showAlert(e));
            })
            .catch(e => this.utils.showAlert(e));
    }

    async setTokenInfo(info){
        if(info && info.result){
            await this.setBasicInfo(info);
            await this.setMoreInfo(info);
        }
        else{
            this.utils.showAlert("Error: no result for this token.");
        }
    }

    async setBasicInfo(info){
        const network = await this.utils.getNetwork(true);
        const explorer = await this.utils.getExplorer();
        this.contract = info.contract;
        const ercType = info.ercType;
        const uri = info.uri;
        const name = info.result.name ? info.result.name : "Not Found";
        let image = info.result.image ? info.result.image :
            (info.result.img ? info.result.img : (info.result.img_url ? info.result.img_url :
                (info.result.image_url ? info.result.image_url : (info.result.img_uri ? info.result.img_uri :
                    (info.result.image_uri ? info.result.image_uri : "")))));
        image = await this.utils.setProtocol(image);
        this.image = image;
        const description = info.result.description ? info.result.description : "Not Found";

        document.getElementsByClassName("info")[0].innerHTML = "NFT INFORMATION:";
        document.getElementsByClassName("image")[0].src = image;
        document.getElementsByClassName("contract")[0].innerHTML = "Contract Address: ";
        document.getElementsByClassName("contract-link")[0].innerHTML = this.contractAddress;
        document.getElementsByClassName("contract-link")[0].href = "https://" + (network === "" ? network : network + ".") + explorer + "address/" + this.contractAddress;
        document.getElementsByClassName("id")[0].innerHTML = "Token ID: ";
        document.getElementsByClassName("id-link")[0].innerHTML = this.id;
        document.getElementsByClassName("id-link")[0].href = "https://" + (network === "" ? network : network + ".") + explorer + "token/" + this.contractAddress + "?a=" + this.id;
        document.getElementsByClassName("ercType")[0].innerHTML = "Type: "+ercType;
        document.getElementsByClassName("creator")[0].innerHTML = "Creator: ";
        document.getElementsByClassName("owner")[0].innerHTML = "Current Owner: ";
        document.getElementsByClassName("name")[0].innerHTML = "Name: "+name;
        document.getElementsByClassName("description")[0].innerHTML = "Description:<br>" +
            (description === "" ? "Empty" : description);
        document.getElementsByClassName("uri-link")[0].innerHTML = uri;
        document.getElementsByClassName("uri-link")[0].href = uri;
    }

    async setMoreInfo(info){
        const keys = Object.keys(info.result);
        const values = Object.values(info.result);
        const linksKeys = [];
        const linksValues = [];

        for(let i=0;i<keys.length;i++){
            if(keys[i].toString() !== "name" && keys[i].toString() !== "image" &&
                keys[i].toString() !== "img" && keys[i].toString() !== "img_url" &&
                keys[i].toString() !== "image_url" && keys[i].toString() !== "img_uri" &&
                keys[i].toString() !== "image_uri" && keys[i].toString() !== "description"){

                const cid = await this.utils.getCIDByURI(values[i]);
                const isCID = await this.utils.isCID(cid);

                if (!Array.isArray(values[i]) && this.utils.isString(values[i]) &&
                    values[i].toString().startsWith(this.Constants.HTTP_PROTOCOL) ||
                    values[i].toString().startsWith(this.Constants.HTTPS_PROTOCOL) ||
                    values[i].toString().startsWith(this.Constants.IPFS_PROTOCOL) || isCID) {

                    linksKeys.push(keys[i].toString());
                    linksValues.push(values[i]);
                }
                else if(!Array.isArray(values[i]) && values[i] !== ""){
                    linksKeys.push(keys[i].toString() + ": " + values[i]);
                    linksValues.push("");
                }
                else if(Array.isArray(values[i])){
                    const keysAttr = Object.keys(values[i]);
                    const valuesAttr = Object.values(values[i]);

                    for(let j=0;j<keysAttr.length;j++){
                        const properties = valuesAttr[j];
                        if(!Array.isArray(properties)){
                            const keyAttr = Object.keys(properties);
                            const valueAttr = Object.values(properties);

                            //to break line
                            if(linksKeys.length > 0 && linksKeys[linksKeys.length-1] !== ""){
                                linksKeys.push("");
                                linksValues.push("");
                            }
                            for(let k=0;k<keyAttr.length;k++){
                                linksKeys.push(keyAttr[k] + ": " + valueAttr[k]);
                                linksValues.push("");
                            }
                            //to break line
                            linksKeys.push("");
                            linksValues.push("");
                        }
                        else{
                            linksKeys.push(JSON.stringify(keysAttr[j]) + ": " + JSON.stringify(valuesAttr[j]));
                            linksValues.push("");
                        }
                    }
                }
            }
        }

        document.getElementsByClassName("links")[0].innerHTML = "More Info:";
        document.getElementsByClassName("uri")[0].innerHTML = "Uri:";
        this.shared.showClassName("minted-button",0);
        this.shared.showClassName("creator-button",0);
        this.shared.showClassName("owner-button",0);

        if(linksKeys.length === 0){
            document.getElementsByClassName("links")[0].innerHTML = "More Info:<br>Empty";
        }
        else{
            let htmlStr = '';
            for(let i=0;i<linksKeys.length;i++){
                if(linksValues[i] !== ""){
                    htmlStr +=
                        "<li class=\"custom-text-info custom-width-list list-group-item border-0 d-flex flex-wrap justify-content-start align-items-center\" style='background-color: transparent;'>" +
                        "<a href='" + linksValues[i] + "'>" + linksKeys[i] + "</a>" +
                        "</li>";
                }
                else{
                    htmlStr +=
                        "<li class=\"custom-text-info custom-width-list list-group-item border-0 d-flex flex-wrap justify-content-start align-items-center\" style='background-color: transparent;'>" +
                        "<a>" + linksKeys[i] + "</a>" +
                        "</li>";
                }
            }
            document.getElementsByClassName("custom-list")[0].innerHTML = htmlStr;
        }

        this.shared.showClassName("custom-btn-row", 0);
        this.shared.showClassName("send", 0);
        this.shared.showClassName("view", 0);
        this.shared.showClassName("burn", 0);
        this.utils.hideLoading();
    }

    async setOwner(){
        const network = await this.utils.getNetwork(true);
        const explorer = await this.utils.getExplorer();
        this.shared.hideClassName("owner-button", 0);
        this.shared.showClassName("owner-link", 0);
        document.getElementsByClassName("owner-link")[0].innerHTML = this.owner;
        document.getElementsByClassName("owner-link")[0].href = "https://" + (network === "" ? network : network + ".") + explorer + "address/" + this.owner;
    }

    checkCurrentAddressIsOwner(){
        if(this.utils.accounts && this.utils.accounts.length > 0){
            this.utils.getSelectedAddress()
                .then(currentAddress => {
                    this.currentAddress = currentAddress;
                    this.utils.isOwner(this.contractAddress, this.id, currentAddress)
                        .then(async isOwner => {
                            if(isOwner){
                                this.utils.enableButton("send", 0);
                                this.utils.enableButton("burn", 0);
                                this.owner = currentAddress;
                                await this.setOwner();
                            }
                            this.shared.setConnected(this.currentAddress, this.Constants.ADDRESS_MAX_LENGTH);
                            this.shared.hideLoading();
                        })
                        .catch(e => this.utils.showAlert(e));
                })
                .catch(async e => {
                    this.shared.setConnected(this.currentAddress, this.Constants.ADDRESS_MAX_LENGTH);
                    this.utils.showAlert(e);
                });
        }
        else{
            this.utils.showAlert("Error: you need to connect to MetaMask first.");
        }
    }

    showViewer(){
        document.getElementsByClassName("background-viewer")[0].classList.remove("invisible");
        document.getElementsByClassName("close-viewer")[0].classList.remove("invisible");
        document.getElementById("div-canvas").classList.remove("invisible");
    }

    closeViewer(){
        document.getElementsByClassName("background-viewer")[0].classList.add("invisible");
        document.getElementsByClassName("close-viewer")[0].classList.add("invisible");
        document.getElementById("div-canvas").classList.add("invisible");
    }
}
const viewer = new Viewer();
export {viewer};