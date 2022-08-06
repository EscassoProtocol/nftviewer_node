"use strict";

class Shared{
    getWeb3(){
        !localStorage.getItem("providerLink") ? localStorage.setItem("providerLink", "https://goerli.infura.io/v3/f3e2ba954dd6423b8c163a5640ae5c21") : undefined;
        return new Web3(localStorage.getItem("providerLink"));
    }

    async getEthers(){
        const {ethers} = await import(localStorage.getItem("ipfsGateway")+"../../imports/ethers-5.6.9.esm.min.js");
        return ethers;
    }

    async getConstants(){
        return (await import(localStorage.getItem("ipfsGateway")+"../utils/constants.mjs")).Constants;
    }

    constructor() {
        this.showedAlert = false;
        this.ConstantsPremise = this.getConstants();
    }

    showToast(message, index){
        index = index ? index : 0;
        if(document.getElementsByClassName('toast-body')[index]){
            document.getElementsByClassName("toast")[index].classList.remove("d-none");
            document.getElementsByClassName("toast")[index].classList.remove("none");
            document.getElementsByClassName('toast-body')[index].innerHTML = message;
            Array.from(document.querySelectorAll('.custom-toast'))
                .forEach(toastNode => new bootstrap.Toast(toastNode).show());
        }
    }

    showWarning(title, text, lastText, link, address) {
        if(title && text && lastText){
            document.getElementsByClassName("custom-title-warning")[0].innerHTML = title;
            document.getElementsByClassName("custom-text-warning")[0].innerHTML = text;
            document.getElementsByClassName("custom-text-warning")[1].innerHTML = lastText;
        }
        if(link){
            document.getElementsByClassName("custom-text-warning")[1].href = link;
        }
        else if(!link && !address){
            document.getElementsByClassName("custom-text-warning")[1].style.textDecoration = "none";
            document.getElementsByClassName("custom-text-warning")[1].style.pointerEvents = "none";
        }
        else{
            this.hideClassName("custom-text-warning", 1);
            this.showClassName("custom-btn-warning", 0);
            document.getElementsByClassName("custom-btn-warning")[0].innerHTML = lastText;
            document.getElementsByClassName('custom-btn-warning')[0].addEventListener('click', () => {
                this.removePendingTx(address);
                this.hideWarning();
            });
        }
        this.showClassName("dialog-background", 0);
        this.showClassName("custom-dialog-warning", 0);
        this.hideLoading();
    }

    hideWarning(){
        this.hideClassName("dialog-background", 0);
        this.hideClassName("custom-dialog-warning", 0);
    }

    showClassName(className, index){
        document.getElementsByClassName(className)[index].classList.remove("d-none");
        document.getElementsByClassName(className)[index].style.display = "d-block";
        document.getElementsByClassName(className)[index].classList.remove("none");
        document.getElementsByClassName(className)[index].style.display = "block";
        document.getElementsByClassName(className)[index].classList.remove("invisible");
    }

    hideClassName(className, index){
        document.getElementsByClassName(className)[index].classList.remove("d-block");
        document.getElementsByClassName(className)[index].style.display = "d-none";
        document.getElementsByClassName(className)[index].classList.remove("block");
        document.getElementsByClassName(className)[index].style.display = "none";
        document.getElementsByClassName(className)[index].classList.add("invisible");
    }

    showId(id){
        document.getElementById(id).classList.remove("d-none");
        document.getElementById(id).style.display = "d-block";
        document.getElementById(id).classList.remove("none");
        document.getElementById(id).style.display = "block";
        document.getElementById(id).classList.remove("invisible");
    }

    hideId(id){
        document.getElementById(id).classList.remove("d-block");
        document.getElementById(id).style.display = "d-none";
        document.getElementById(id).classList.remove("block");
        document.getElementById(id).style.display = "none";
        document.getElementById(id).classList.add("invisible");
    }

    async savePendingTx(info, block, network){
        const web3 = this.getWeb3();
        const data = {
            contract: info.contract,
            id: info.id,
            address: info.address,
            nonce: await web3.eth.getTransactionCount(info.address),
            block: block,
            network: network,
        }
        localStorage.setItem("pendingTx_"+info.address, JSON.stringify(data));
    }

    getPendingTx(address){
        const info = localStorage.getItem("pendingTx_"+address);
        return info ? JSON.parse(info) : null;
    }

    removePendingTx(address){
        localStorage.removeItem("pendingTx_"+address);
    }

    showViewerPermission(){
        if(localStorage.getItem("showedPermission") !== "true"){
            this.hideLoading();
            this.showAlert("DISCLAIMER\n\n" +
                "By clicking the 'OK' button, you confirm that you are of age and " +
                "you have permission to use this software in your country. " +
                "You also consent the creator of this software is not responsible for " +
                "content created by users and that such content may be sensitive.");
            localStorage.setItem("showedPermission", "true");
        }
    }

    showLoading(){
        if(document.getElementsByClassName("custom-spinner").length > 0){
            document.getElementsByClassName("custom-spinner")[0].style.display = "block";
            document.getElementById("spinner-back").classList.add("show");
            document.getElementById("spinner-front").classList.add("show");
        }
    }

    hideLoading(){
        if(document.getElementsByClassName("custom-spinner").length > 0){
            document.getElementsByClassName("custom-spinner")[0].style.display = "none";
            document.getElementById("spinner-back").classList.remove("show");
            document.getElementById("spinner-front").classList.remove("show");
        }
    }

    clicks(){
        document.getElementsByClassName('menu')[0].addEventListener('click', this.showMenu);
        document.getElementsByClassName('background-menu')[0].addEventListener('click', this.hideMenu);
        document.getElementsByClassName('menu-list')[0].addEventListener('click', this.hideMenu);
        document.getElementsByClassName('a-about')[0].addEventListener('click', this.onAbout);
        document.getElementsByClassName('a-thanks')[0].addEventListener('click', this.onThanks);
    }

    showMenu(){
        document.getElementsByClassName("menu-nav")[0].classList.remove("invisible");
        document.getElementsByClassName("menu-nav-background")[0].classList.remove("invisible");
    }

    hideMenu(){
        document.getElementsByClassName("menu-nav")[0].classList.add("invisible");
        document.getElementsByClassName("menu-nav-background")[0].classList.add("invisible");
    }

    async onAbout(){
        shared.hideMenu();
        const Constants = await shared.ConstantsPremise;
        shared.showAlert("Idealized and developed by Silvio Guedes.\n\n" +
            "The MIT License (MIT)\n" +
            "Copyright (c) 2022 SILVIO GUEDES SANTANA\n" +
            "\n" +
            "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n" +
            "\n" +
            "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n" +
            "\n" +
            "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n" +
            "Version: "+Constants.LATEST_URI);
    }

    async onThanks(){
        shared.hideMenu();
        const web3 = await shared.getWeb3();
        const Constants = await shared.ConstantsPremise;

        const donation = await shared.showPrompt("You can help with the development of the 100% DECENTRALIZED WEB3 donating some ethers to me:\n\nThanks!\n\n", Constants.MINIMUM_DONATION);
        if(!donation){
            return;
        }
        else if(isNaN(parseFloat(donation))){
            this.showAlert("Error: the value is not a number.");
            return;
        }

        shared.showLoading();
        const ethers = await shared.getEthers();
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = provider.getSigner();

        const tx = {
            to: Constants.RECEIVER_ADDRESS,
            value: parseInt(web3.utils.toWei(donation, "ether"))
        };

        signer.sendTransaction(tx)
            .then(() => shared.hideLoading())
            .catch(e => shared.showAlert(e));
    }

    setConnected(address, addressMaxLength, hide){
        const headerMenu = document.getElementById("header-menu");
        if(hide){
            this.hideId("header-menu");
        }
        else{
            const addressWithEllipsis = this.getEllipsis(address, addressMaxLength);
            if(address){
                headerMenu.style.color = "#00e676"
                headerMenu.innerHTML = "Connected as \n"+addressWithEllipsis;
            }
            else{
                headerMenu.style.color = "#ff1744"
                headerMenu.innerHTML  = "User not Connected";
            }
        }
    }

    getEllipsis(text, maxLength, textEnd){
        const end = (textEnd !== null && textEnd !== undefined) ? textEnd : "";
        if(text && (text.length + end.length) > maxLength){
            const ellipsis = "...";
            return text.substring(0, maxLength - ellipsis.length - end.length) + ellipsis + end;
        }
        return text + end;
    }

    async showPrompt(message, _default){
        try{
            this.showedAlert = true;
            await this.hideLoading();
            const r = prompt(message, _default);
            this.showedAlert = false;
            return r;
        }
        catch (e) {
            this.showAlert(e);
        }
        return undefined;
    }

    showAlert(text){
        this.showedAlert = true;
        this.hideLoading();
        if(text.code === 4001 && text.message) {
            this.alert(text.message);
        }
        else if(text.status && text.response && text.message){
            this.alert("Error "+text.status+" - "+text.message+"\n\nMore Info:\n\n"+text.response);
        }
        else if(text.message){
            this.alert(text.message);
        }
        else{
            this.alert(text);
        }
    }

    alert(text){
        alert(text);
        this.showedAlert = false;
    }
}
const shared = new Shared();
export {shared};