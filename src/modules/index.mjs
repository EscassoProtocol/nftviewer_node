"use strict";

class Index {
    async getUtils(){
        !localStorage.getItem("ipfsGateway") ? localStorage.setItem("ipfsGateway", "") : undefined;
        const {utils} = await import(localStorage.getItem("ipfsGateway")+"./utils/utils.mjs");
        return utils;
    }

    constructor() {
        this.utils = null;
        this.shared = null;
        this.Constants = null;

        this.listenEvents();
    }

    listenEvents() {
        const self = this;
        document.addEventListener("DOMContentLoaded", async function() {
            self.utils = await self.getUtils();
            self.shared = await self.utils.getShared();
            self.Constants = await self.shared.getConstants();
            if(self.utils.isMobileBrowser()) {
                self.shared.showWarning();
            }
            else{
                self.onDOMContentLoaded();
            }
        });
    }

    onNotUpdated(){
        this.shared.hideLoading();
    }

    onDOMContentLoaded(){
        this.clicks();
        this.initViews();
        this.shared.setConnected(null, 0, true);
    }

    clicks(){
        document.getElementsByClassName('btn-search')[0].addEventListener('click', this.onSearchClicked);
        this.utils.setEnterClick(document.getElementsByClassName("contract")[0], this.onSearchClicked);
        this.utils.setEnterClick(document.getElementsByClassName("token-id")[0], this.onSearchClicked);
        this.shared.clicks();
    }

    initViews(){
        this.shared.showLoading();
        this.utils.checkUpdates(this, this.Constants.VERSION_CONTRACT_ADDRESS, null, true)
            .then(() => this.shared.hideLoading())
            .catch(e => this.utils.showAlert(e));
    }

    onSearchClicked(){
        const contract = document.getElementsByClassName('contract')[0].value;
        const tokenId = document.getElementsByClassName('token-id')[0].value;
        if(contract === "" || tokenId === ""){
            index.utils.showAlert("Error: contract address and/or token ID is blank.");
            return;
        }
        if(!index.utils.checkAddress(contract)){
            index.utils.showAlert("Error: contract address is invalid.");
            return;
        }

        window.location.href = "viewer.html?" + contract + "/" + tokenId;
    }
}
const index = new Index();
export {index};