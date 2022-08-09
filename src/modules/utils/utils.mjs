"use strict";

class Utils{
    async getCID(){
        return await import(localStorage.getItem("ipfsGateway")+"../../imports/cid/cid_min-9.7.0.js");
    }

    async getExplorer(){
        !localStorage.getItem("explorer") ? localStorage.setItem("explorer", "etherscan.io/") : undefined;
        return localStorage.getItem("explorer");
    }

    async getZoom(){
        const {zoom} = await import(localStorage.getItem("ipfsGateway")+"../../imports/zoom/zoom.js");
        return zoom;
    }

    async getShared(){
        const {shared} = await import(localStorage.getItem("ipfsGateway")+"../shared/shared.mjs");
        return shared;
    }

    async getWeb3(){
        !localStorage.getItem("providerLink") ? localStorage.setItem("providerLink", "https://goerli.infura.io/v3/f3e2ba954dd6423b8c163a5640ae5c21") : undefined;

        try{
            const web3 = new Web3(localStorage.getItem("providerLink"));
            const result = await this.checkNetwork(web3);
            if(result){
                return web3;
            }
        }
        catch (e) {}
    }

    constructor() {
        this.cidPromise = this.getCID();
        this.sharedPromise = this.getShared();
        this.buttonStyle = [];
        this.instance = null;
        this.showedAlert = false;
        this.accounts = [];
    }

    setInstance(instance){
        this.instance = instance;
    }

    checkNetwork(web3){
        return new Promise(function(resolve, reject) {
            try{
                window.ethereum.request({method: 'net_version'})
                    .then(version => {
                        web3.eth.net.getId()
                            .then(async id => {
                                if(version.toString() !== id.toString()){
                                    const Constants = await (await utils.sharedPromise).getConstants();
                                    const rpcProvider = localStorage.getItem("rpcProvider");
                                    const name = utils.getNetworkName(version, rpcProvider, false, Constants, null, null);
                                    reject("Error: the wallet network is different from the RPC provider." +
                                        "\n\nTip: Try to change the network type of the RPC Provider on the Settings page to the "+name+" network.");
                                }
                                else{
                                    resolve(true);
                                }
                            }).catch(e => reject(e));
                    }).catch(e => reject(e));
            }
            catch (e) {
                reject(e);
            }
        });
    }

    getABI(){
        return [
            //for ERC-721
            {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],
                "name":"tokenURI",
                "outputs":[{"internalType":"string","name":"","type":"string"}],
                "stateMutability":"view","type":"function"},
            {"anonymous":false,"inputs":[
                    {"indexed":true,"internalType":"address","name":"from","type":"address"},
                    {"indexed":true,"internalType":"address","name":"to","type":"address"},
                    {"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],
                "name":"Transfer",
                "type":"event"},
            {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],
                "name":"ownerOf",
                "outputs":[{"internalType":"address","name":"","type":"address"}],
                "stateMutability":"view","type":"function"},
            {"inputs":[
                    {"internalType":"address","name":"from","type":"address"},
                    {"internalType":"address","name":"to","type":"address"},
                    {"internalType":"uint256","name":"tokenId","type":"uint256"},
                    {"internalType":"bytes","name":"_data","type":"bytes"}],
                "name":"safeTransferFrom",
                "outputs":[],
                "stateMutability":"nonpayable","type":"function"},
            {"inputs":[
                    {"internalType":"address","name":"from","type":"address"},
                    {"internalType":"address","name":"to","type":"address"},
                    {"internalType":"uint256","name":"tokenId","type":"uint256"}],
                "name":"transferFrom",
                "outputs":[],
                "stateMutability":"nonpayable","type":"function"},
            {"inputs": [
                    {"internalType":"uint256","name": "","type": "uint256"}],
                "name": "burn",
                "outputs":[],
                "stateMutability":"nonpayable","type": "function"},

            //for ERC-1155
            {"anonymous":false,"inputs":[
                    {"indexed":true,"internalType":"address","name":"operator","type":"address"},
                    {"indexed":true,"internalType":"address","name":"from","type":"address"},
                    {"indexed":true,"internalType":"address","name":"to","type":"address"},
                    {"internalType":"uint256[]","name":"ids","type":"uint256[]"},
                    {"internalType":"uint256[]","name":"values","type":"uint256[]"}],
                "name":"TransferBatch",
                "type":"event"},
            {"anonymous":false,"inputs":[
                    {"indexed":true,"internalType":"address","name":"operator","type":"address"},
                    {"indexed":true,"internalType":"address","name":"from","type":"address"},
                    {"indexed":true,"internalType":"address","name":"to","type":"address"},
                    {"internalType":"uint256","name":"ids","type":"uint256"},
                    {"internalType":"uint256","name":"values","type":"uint256"}],
                "name":"TransferSingle",
                "type":"event"},
            {"inputs":[
                    {"internalType":"address","name":"account","type":"address"},
                    {"internalType":"uint256","name":"id","type":"uint256"}],
                "name":"balanceOf",
                "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
                "stateMutability":"view","type":"function"},
            {"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],
                "name":"uri",
                "outputs":[{"internalType":"string","name":"","type":"string"}],
                "stateMutability":"view","type":"function"},
            {"inputs":[
                    {"internalType":"address","name":"from","type":"address"},
                    {"internalType":"address","name":"to","type":"address"},
                    {"internalType":"uint256","name":"id","type":"uint256"},
                    {"internalType":"uint256","name":"amount","type":"uint256"},
                    {"internalType":"bytes","name":"data","type":"bytes"}],
                "name":"safeTransferFrom",
                "outputs":[],
                "stateMutability":"nonpayable","type":"function"},

            //for both
            {"inputs": [
                    {"internalType":"bytes4","name": "","type": "bytes4"}],
                "name": "supportsInterface",
                "outputs": [{"internalType":"bool","name": "","type": "bool"}],
                "stateMutability":"view","type": "function"},

            //custom
            {"inputs": [
                    {"internalType": "address","name": "userAddress","type": "address"},
                    {"internalType": "uint256","name": "id","type": "uint256"}],
                "name": "getMail",
                "outputs": [{"internalType": "string","name": "","type": "string"}],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "address","name": "to","type": "address"},
                    {"internalType": "string","name": "mailBoxUri","type": "string"},
                    {"internalType": "string","name": "mailUri","type": "string"}],
                "name": "sendMail",
                "outputs": [],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "address","name": "to","type": "address"},
                    {"internalType": "string","name": "mailBoxUri","type": "string"}],
                "name": "sendMail",
                "outputs": [],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "address","name": "userAddress","type": "address"}],
                "name": "getMailBoxInfo",
                "outputs": [
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "string","name": "","type": "string"},
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "bool","name": "","type": "bool"},
                    {"internalType": "uint256","name": "","type": "uint256"}],
                "stateMutability": "view","type": "function"},
            {"inputs": [{"internalType": "address","name": "userAddress","type": "address"}],
                "name": "getServerId",
                "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "uint256","name": "serverId","type": "uint256"},
                    {"internalType": "address","name": "userAddress","type": "address"}],
                "name": "getUserId",
                "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "uint256","name": "serverId","type": "uint256"},
                    {"internalType": "bytes32","name": "root","type": "bytes32"}],
                "name": "leaseServer",
                "outputs": [],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "uint256","name": "serverId","type": "uint256"},
                    {"internalType": "uint256","name": "userId","type": "uint256"}],
                "name": "getServerSettings",
                "outputs": [
                    {"internalType": "address","name": "","type": "address"},
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "address","name": "","type": "address"},
                    {"internalType": "bool","name": "","type": "bool"},
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "uint64","name": "","type": "uint64"}
                ],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "string","name": "uri","type": "string"},
                    {"internalType": "uint256","name": "fee","type": "uint256"}],
                "name": "mintServer",
                "outputs": [],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "uint256","name": "serverId","type": "uint256"},
                    {"internalType": "bytes32","name": "root","type": "bytes32"}],
                "name": "setRoot",
                "outputs": [],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "address","name": "userAddress","type": "address"},
                    {"internalType": "uint256","name": "id","type": "uint256"}],
                "name": "getMailInfo",
                "outputs": [
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "string","name": "","type": "string"},
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "uint256","name": "","type": "uint256"}
                ],
                "stateMutability": "view","type": "function"},
            {"inputs": [
                    {"internalType": "uint256","name": "serverId","type": "uint256"},
                    {"internalType": "string","name": "uri","type": "string"},
                    {"internalType": "uint256","name": "fee","type": "uint256"}],
                "name": "setServerSettings",
                "outputs": [],
                "stateMutability": "view","type": "function"},
            {"inputs": [],
                "name": "getVersionURI",
                "outputs": [
                    {"internalType": "string","name": "","type": "string"}],
                "stateMutability": "view","type": "function"}
        ];
    }

    async getContract(smartContractAddress, rpcLink){
        let web3;
        if(rpcLink){
            web3 = new Web3(rpcLink);
        }
        else{
            web3 = await this.getWeb3();
            if(!web3){return;}
        }
        return new web3.eth.Contract(this.getABI(), smartContractAddress);
    }

    async getERCType(contract){
        try{
            const is721 = await contract.methods.supportsInterface('0x80ac58cd').call();
            if(is721){
                return "ERC-721";
            }
            const is1155 = await contract.methods.supportsInterface('0xd9b67a26').call();
            if(is1155){
                return "ERC-1155";
            }
        }
        catch (e) {
            return "ERC-721";
        }
    }

    getTokenInfo(contractAddress, id){
        return new Promise(async function(resolve, reject) {
            try{
                await utils.loadToken(contractAddress, id, resolve, reject);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    async loadToken(contractAddress, id, resolve, reject){
        let uri = "";
        let originalUri = "";
        const contract = await this.getContract(contractAddress);
        if(!contract){return;}
        const ercType = await this.getERCType(contract);
        const Constants = await (await this.sharedPromise).getConstants();

        if(ercType.toString() === Constants.ERC_721.toString()){
            uri = await contract.methods.tokenURI(id).call();
            originalUri = uri;
        }
        else if(ercType.toString() === Constants.ERC_1155.toString()){
            uri = await contract.methods.uri(id).call();
            originalUri = uri;
            if(uri.toString().includes("{id}")){
                uri = uri.toString().replace("{id}", this.getHexId(id).toString());
            }
        }
        if(uri.toString().startsWith(Constants.IPFS_PROTOCOL)){
            uri = uri.toString().replace(Constants.IPFS_PROTOCOL, localStorage.getItem("ipfsGateway"));
        }
        uri = await this.setProtocol(uri);

        //verifies uri to fix error after burn the token or for nonexistent token:
        //the base uri is empty and the uri has only the token id
        if(uri !== "" && isNaN(uri)){
            this.loadUri(uri)
                .then(result => {
                    const data = {
                        contract: contract,
                        ercType: ercType,
                        uri: originalUri,
                        result: result
                    }
                    resolve(data);
                })
                .catch(e => reject(e));
        }
        else{
            const data = {
                contract: contract,
                ercType: ercType,
                uri: originalUri,
                result: null
            }
            resolve(data);
        }
    }

    getHexId(id){
        let hexId = "0";
        try{
            hexId = parseInt(id).toString(16);
        }
        catch (e) {
            return "";
        }
        return Web3.utils.padLeft(hexId, 64);
    }

    async loadUri(uri){
        return fetch(uri, {
            method: 'get',
        }).then(async function(response) {
            if(response.status === 200){
                return response.json();
            }
            else{
                const error = {
                    status: response.status,
                    message: "Uri not found or nonexistent token.",
                    response: await response.text()
                }
                return Promise.reject(error);
            }
        }).catch(error => {
            return Promise.reject(error);
        });
    }

    async getNetwork(isForLink){
        return new Promise(async function(resolve, reject) {
            try{
                const Constants = await (await utils.sharedPromise).getConstants();
                !localStorage.getItem("rpcProvider") ? localStorage.setItem("rpcProvider", Constants.TYPE_POLYGON) : undefined;
                const rpcProvider = localStorage.getItem("rpcProvider");
                window.ethereum.request({ method: 'net_version' })
                    .then(version => {
                        utils.getNetworkName(version, rpcProvider, isForLink, Constants, resolve, reject);
                    })
                    .catch(e => reject(e));
            }
            catch (e) {
                reject(e);
            }
        });
    }

    getNetworkName(version, rpcProvider, isForLink, Constants, resolve, reject){
        switch (version) {
            case '1': {
                resolve ? resolve("") : undefined;//mainnet
                return "Ethereum";
            }
            case '3': {
                resolve ? resolve("ropsten") : undefined;
                return "Ropsten";
            }
            case '4': {
                resolve ? resolve("rinkeby") : undefined;
                return "Rinkeby";
            }
            case '5': {
                resolve ? resolve("goerli") : undefined;
                return "Goerli";
            }
            case '42': {
                resolve ? resolve("kovan") : undefined;
                return "Kovan";
            }
            case '56': {
                if(rpcProvider === Constants.TYPE_BINANCE){
                    if(isForLink){
                        resolve ? resolve("") : undefined;//BSC mainnet
                    }
                    else{
                        resolve ? resolve("bsc-dataseed") : undefined;//BSC mainnet
                    }
                }
                else if(rpcProvider === Constants.TYPE_GETBLOCK){
                    if(isForLink){
                        resolve ? resolve("") : undefined;//BSC mainnet
                    }
                    else{
                        resolve ? resolve("bsc") : undefined;//BSC mainnet
                    }
                }
                return "BSC";
            }
            case '97': {
                if(rpcProvider === Constants.TYPE_BINANCE){
                    if(isForLink){
                        resolve ? resolve("testnet") : undefined;//BSC testnet
                    }
                    else{
                        resolve ? resolve("data-seed-prebsc-1-s1") : undefined;//BSC testnet
                    }
                }
                else if(rpcProvider === Constants.TYPE_GETBLOCK){
                    if(isForLink){
                        resolve ? resolve("testnet") : undefined;//BSC testnet
                    }
                    else{
                        resolve ? resolve("bsc") : undefined;//BSC testnet
                    }
                }
                return "BSC Testnet";
            }
            case '137': {
                resolve ? resolve("") : undefined;
                return "MATIC";
            }
            case '80001': {
                resolve ? resolve("mumbai") : undefined;
                return "Mumbai";
            }
            default: {
                reject ? reject(undefined) : undefined;
                return undefined;
            }
        }
    }

    checkAddress(address){
        try{
            return Web3.utils.toChecksumAddress(address);
        }
        catch (e) {
            return false;
        }
    }

    async hideLoading() {
        const shared = await this.sharedPromise;
        shared.hideLoading();
    }

    showAlert(text){
        console.log(text)
        this.showedAlert = true;
        this.hideLoading()
            .then(() => {
                if(text.code === 4001) {
                    if(this.instance){
                        this.showedAlert = false;
                        this.instance.onRejectTx(text);
                    }
                    else if(text.message){
                        this.alert(text.message);
                    }
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
            }).catch(e => this.alert(e));
    }

    alert(text){
        alert(text);
        this.showedAlert = false;
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

    async showConfirm(message){
        try{
            this.showedAlert = true;
            await this.hideLoading();
            const r = confirm(message);
            this.showedAlert = false;
            return r;
        }
        catch (e) {
            this.showAlert(e);
        }
        return undefined;
    }

    async getCIDByURI(uri){
        const words = this.getWords(uri);
        let cidFound = "";

        for(let j=0;j<words.length;j++){
            if(await this.isCID(words[j])){
                cidFound = words[j];
                break;
            }
        }

        return cidFound;
    }

    getWords(url){
        let start = 0;
        let end = -1;
        const words = [];

        if(url){
            const word = url.toString();
            while(end < word.length){
                start = end + 1;
                end = word.indexOf("/", start);

                if(end > -1){
                    const slash = word.substring(start, end);
                    if(!words.includes(slash) && slash !== ""){
                        words.push(slash);
                    }
                }
                else{
                    end = word.length;
                    const blank = word.substring(start, end);
                    if(!words.includes(blank) && blank !== ""){
                        words.push(blank);
                    }
                }
            }
        }

        return words;
    }

    async isCID(word){
        const {CID} = await this.cidPromise;
        try{
            const cid = CID.parse(word);
            if(CID.asCID(cid)){
                return true;
            }
        }
        catch (e) {
            return false;
        }
    }

    async setProtocol(uri){
        //verifies if the uri has IPFS CID but not the protocol (http, https or ipfs)
        //if it hasn't -> insert the protocol
        //if it has -> change the protocol based on the stored value
        const cid = await this.getCIDByURI(uri);
        const Constants = await (await this.sharedPromise).getConstants();
        if(cid && (!uri.toString().startsWith(Constants.HTTPS_PROTOCOL) || !uri.toString().startsWith(Constants.HTTP_PROTOCOL)
            || !uri.toString().startsWith(Constants.IPFS_PROTOCOL))){
            const suffix = uri.substring(uri.indexOf(cid) + cid.length);
            return /*todo localStorage.getItem("ipfsGateway")*/"https://ipfs.io/ipfs/" + cid + suffix;
        }
        else if(cid && uri.toString().startsWith(Constants.IPFS_PROTOCOL)){
            return uri.replace(Constants.IPFS_PROTOCOL, /*todo localStorage.getItem("ipfsGateway")*/"https://ipfs.io/ipfs/");
        }
        return uri;
    }

    async getTokenMintBlock(contract, contractAddress, tokenId){
        const ercType = await this.getERCType(contract);
        const Constants = await (await this.sharedPromise).getConstants();
        const MAX_BLOCKS = await this.getMaxBlocks();
        let toBlock = await this.getLastBlock();
        let fromBlock = toBlock - MAX_BLOCKS;
        let data = {block: -1};
        if(fromBlock < 0){
            fromBlock = toBlock;
        }

        if(ercType.toString() === Constants.ERC_721.toString()){
            while(fromBlock >= 0 && data.block < 0){
                data = await this.getFirstTransfer721(contract, fromBlock, toBlock, contractAddress, tokenId);
                toBlock = fromBlock - 1;
                fromBlock = toBlock - MAX_BLOCKS;
            }
        }
        else if(ercType.toString() === Constants.ERC_1155.toString()){
            while(fromBlock >= 0 && data.block < 0){
                const dataSingle = await this.getFirstTransfer1155("TransferSingle", contract, fromBlock, toBlock, tokenId);
                const dataBatch = await this.getFirstTransfer1155("TransferBatch", contract, fromBlock, toBlock, tokenId);
                if(dataSingle.block > dataBatch.block){
                    data = dataSingle;
                }
                else{
                    data = dataBatch;
                }
                toBlock = fromBlock - 1;
                fromBlock = toBlock - MAX_BLOCKS;
            }
        }

        return data;
    }

    async getFirstTransfer721(contract, fromBlock, toBlock, contractAddress, tokenId){
        return new Promise(async function(resolve, reject) {
            try {
                const Constants = await (await utils.sharedPromise).getConstants();
                await contract.getPastEvents('Transfer', {
                    filter: {tokenId: tokenId},
                    fromBlock: fromBlock,
                    toBlock: toBlock
                }, function(e, events){
                    if(!e){
                        for(let i=0;i<events.length;i++) {
                            if (events[i].returnValues.from.toString().toLowerCase() === Constants.BURN_ADDRESS.toLowerCase()) {
                                const data = {
                                    address: events[i].returnValues.to,
                                    block: events[i].blockNumber
                                }
                                resolve(data);
                                break;
                            }
                        }
                        resolve({block: -1});
                    }
                    reject(e);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async getFirstTransfer1155(type, contract, fromBlock, toBlock, tokenId){
        return new Promise(async function(resolve, reject) {
            try {
                const Constants = await (await utils.sharedPromise).getConstants();
                await contract.getPastEvents(type, {
                    fromBlock: fromBlock,
                    toBlock: toBlock
                }, function(e, events){
                    if(!e){
                        for(let i=0;i<events.length;i++) {
                            if (events[i].returnValues.ids.includes(tokenId) &&
                                events[i].returnValues.from.toString().toLowerCase() === Constants.BURN_ADDRESS.toLowerCase()) {
                                const data = {
                                    address: events[i].returnValues.to,
                                    block: events[i].blockNumber
                                }
                                resolve(data);
                                break;
                            }
                        }
                        resolve({block: -1});
                    }
                    reject(e);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async getLastBlock(){
        const web3 = await this.getWeb3();
        if(!web3){return;}
        return await web3.eth.getBlockNumber();
    }

    async getMaxBlocks(){
        !localStorage.getItem("maxBlocks") ? localStorage.setItem("maxBlocks", "2000") : undefined;
        try{
            return parseInt(localStorage.getItem("maxBlocks"));
        }
        catch (e) {
            return await this.getLastBlock();
        }
    }

    async getBlockDate(block){
        const web3 = await this.getWeb3();
        if(!web3){return;}
        const dateTimeStamp = (await web3.eth.getBlock(block)).timestamp;
        const d = new Date(dateTimeStamp * 1000);
        return d.toUTCString();
    }

    async getTokenOwner(contract, contractAddress, tokenId){
        const ercType = await this.getERCType(contract);
        const Constants = await (await this.sharedPromise).getConstants();
        const MAX_BLOCKS = await this.getMaxBlocks();
        let toBlock = await this.getLastBlock();
        let fromBlock = toBlock - MAX_BLOCKS;
        let data = {block: -1};
        if(fromBlock < 0){
            fromBlock = toBlock;
        }

        if(ercType.toString() === Constants.ERC_721.toString()){
            while(fromBlock >= 0 && data.block < 0){
                data = await this.getLastTransfer721(contract, fromBlock, toBlock, contractAddress, tokenId);
                toBlock = fromBlock - 1;
                fromBlock = toBlock - MAX_BLOCKS;
            }
        }
        else if(ercType.toString() === Constants.ERC_1155.toString()){
            while(fromBlock >= 0 && data.block < 0){
                const dataSingle = await this.getLastTransfer1155("TransferSingle", contract, fromBlock, toBlock, tokenId);
                const dataBatch = await this.getLastTransfer1155("TransferBatch", contract, fromBlock, toBlock, tokenId);
                if(dataSingle && dataBatch && dataSingle.block > dataBatch.block){
                    data = dataSingle;
                }
                else{
                    data = dataBatch;
                }
                toBlock = fromBlock - 1;
                fromBlock = toBlock - MAX_BLOCKS;
            }
        }

        return data;
    }

    async getLastTransfer721(contract, fromBlock, toBlock, contractAddress, tokenId){
        return new Promise(async function(resolve, reject) {
            try {
                await contract.getPastEvents('Transfer', {
                    filter: {tokenId: tokenId},
                    fromBlock: fromBlock,
                    toBlock: toBlock
                }, function(e, events){
                    if(!e){
                        if (events.length > 0) {
                            const data = {
                                address: events[0].returnValues.to,
                                block: events[0].blockNumber
                            }
                            resolve(data);
                        }
                        resolve({block: -1});
                    }
                    reject(e);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async getLastTransfer1155(type, contract, fromBlock, toBlock, tokenId){
        return new Promise(async function(resolve, reject) {
            try {
                await contract.getPastEvents(type, {
                    fromBlock: fromBlock,
                    toBlock: toBlock
                }, function(e, events){
                    if(!e){
                        for(let i=events.length-1;i>=0;i--) {
                            if (events[i].returnValues.ids.includes(tokenId)) {
                                const data = {
                                    address: events[i].returnValues.to,
                                    block: events[i].blockNumber
                                }
                                resolve(data);
                                break;
                            }
                        }
                        resolve({block: -1});
                    }
                    reject(e);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async getSelectedAddress(instance){
        return new Promise(async function(resolve, reject) {
            try {
                await window.ethereum.request({method: 'eth_requestAccounts'});
                const accounts = await window.ethereum.request({method: 'eth_accounts'});
                if (accounts.length > 0) {
                    resolve(accounts[0]);
                } else {
                    reject("There is no account connected to MetaMask.");
                }
            } catch (e) {
                if(instance){
                    instance.onNotConnected();
                }
                else{
                    reject(e);
                }
            }
        });
    }

    getButtonStyle(className, index){
        if(document.getElementsByClassName(className)[index].classList.toString().includes("btn-primary")){
            return "btn-primary";
        }
        else if(document.getElementsByClassName(className)[index].classList.toString().includes("btn-success")){
            return "btn-success";
        }
        else if(document.getElementsByClassName(className)[index].classList.toString().includes("btn-danger")){
            return "btn-danger";
        }
        else if(document.getElementsByClassName(className)[index].classList.toString().includes("btn-warning")){
            return "btn-warning";
        }
        else if(document.getElementsByClassName(className)[index].classList.toString().includes("btn-info")){
            return "btn-info";
        }
        else if(document.getElementsByClassName(className)[index].classList.toString().includes("btn-light")){
            return "btn-light";
        }
        else if(document.getElementsByClassName(className)[index].classList.toString().includes("btn-dark")){
            return "btn-dark";
        }
        else{
            return window.getComputedStyle(document.getElementsByClassName(className)[index]).backgroundColor;
        }
    }

    disableButton(className, index){
        this.buttonStyle[className+index] = this.getButtonStyle(className, index);
        document.getElementsByClassName(className)[index].classList.remove(utils.buttonStyle[className+index])
        document.getElementsByClassName(className)[index].classList.add("btn-secondary");
        document.getElementsByClassName(className)[index].disabled = true;
    }

    enableButton(className, index){
        document.getElementsByClassName(className)[index].classList.remove("btn-secondary");
        if(utils.buttonStyle[className+index].includes("btn-")){
            document.getElementsByClassName(className)[index].classList.add(utils.buttonStyle[className+index]);
        }
        else{
            document.getElementsByClassName(className)[index].style.background = this.buttonStyle[className+index];
        }
        document.getElementsByClassName(className)[index].disabled = false;
    }

    async isOwner(contractAddress, id, currentAddress){
        const contract = await this.getContract(contractAddress);
        if(!contract){return;}
        const ercType = await this.getERCType(contract);
        const Constants = await (await utils.sharedPromise).getConstants();

        if(ercType.toString() === Constants.ERC_721.toString()){
            const owner = await contract.methods.ownerOf(id).call();
            return owner.toString().toLowerCase() === currentAddress.toString().toLowerCase();
        }
        else if(ercType.toString() === Constants.ERC_1155.toString()){
            const balance = await contract.methods.balanceOf(currentAddress, id).call();
            return balance > 0;
        }
    }

    async listenMetaMaskEvents(instance) {
        return new Promise(async function (resolve, reject) {
            try {
                if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
                    const provider = await detectEthereumProvider();
                    if(provider && provider !== window.ethereum){
                        reject('Error: do you have multiple wallets installed?');
                    }
                    else if(!provider){
                        reject({title: "MetaMask is not installed or enabled", text: 'This website works on the web3 and you need a provider for it. <br> Please install or enable the extension (add-on) MetaMask<br> to use this website. <br> Click on the link below to download:', lastText: 'https://metamask.io/download', link: 'https://metamask.io/download'});
                    }
                    window.ethereum
                        .request({method: 'eth_requestAccounts'})
                        .then(accounts => {
                            if (accounts.length === 0) {
                                reject('Error: please connect to MetaMask.');
                            }
                            else{
                                utils.accounts = accounts;
                                resolve(true);
                            }
                        })
                        .catch(e => {
                            if(instance){
                                instance.onNotConnected();
                            }
                            else{
                                reject(e);
                            }
                        });
                    window.ethereum.on('accountsChanged', () => {
                        if(instance){
                            instance.onAccountsChanged();
                        }
                        else{
                            window.location.reload();
                        }
                    });
                    window.ethereum.on('chainChanged', () => {
                        if(instance){
                            instance.onChainChanged();
                        }
                        else{
                            window.location.reload();
                        }
                    });
                }
                else{
                    reject({title: "MetaMask is not installed or enabled", text: 'This website works on the web3 and you need a provider for it. <br> Please install or enable the extension (add-on) MetaMask<br> to use this website. <br> Click on the link below to download:', lastText: 'https://metamask.io/download', link: 'https://metamask.io/download'});
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    onAccountsChanged(){}
    onChainChanged(){}

    getEllipsis(text, maxLength, textEnd){
        const end = (textEnd !== null && textEnd !== undefined) ? textEnd : "";
        if(text && (text.length + end.length) > maxLength){
            const ellipsis = "...";
            return text.substring(0, maxLength - ellipsis.length - end.length) + ellipsis + end;
        }
        return text + end;
    }

    isString(value){
        return typeof value === 'string' || value instanceof String;
    }

    downloadFile(url, fileName, extension, timeout){
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName + (extension.toString().startsWith(".") ? extension : "." + extension);
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), timeout);
    }

    async getTxValues(){
        const ethers = await (await this.sharedPromise).getEthers();
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const signer = provider.getSigner();
        const iface = new ethers.utils.Interface(this.getABI());
        return {signer: signer, iface: iface};
    }

    async getBigNumber(value){
        const ethers = await (await this.sharedPromise).getEthers();
        return ethers.BigNumber.from(value);
    }

    saveFile(data, filename, type) {
        const file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            const a = document.createElement("a");
            const url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

    setEnterClick(input, action){
        input.addEventListener("keyup", function(event) {
            // Number 13 is the "Enter" key on the keyboard
            if (event.key === 'Enter') {
                // Cancel the default action, if needed
                event.preventDefault();
                // Trigger the button element with a click
                action();
            }
        });
    }

    getMerkleTree(mainLeaf){
        const randomLeaf1 = this.getRandomValues();
        const randomLeaf2 = this.getRandomValues();
        const randomLeaf3 = this.getRandomValues();
        const leaves = [mainLeaf, randomLeaf1, randomLeaf2, randomLeaf3].map(v => keccak256(v));
        const tree = new MerkleTree(leaves, keccak256,{sort: true});
        return {root: tree.getHexRoot(), proof: tree.getHexProof(keccak256(mainLeaf))};
    }

    async returnResponse(response){
        if(response.status === 200){
            return response.json();
        }
        else{
            const error = {
                status: response.status,
                message: response.statusText,
                response: await response.text()
            }
            return Promise.reject(error);
        }
    }

    getRandomValues(){
        const randomArrayBuffer = window.crypto.getRandomValues(new Uint8Array(32));
        const textDecoder = new TextDecoder("utf-8");
        return textDecoder.decode(randomArrayBuffer);
    }

    isJson(text){
        const trimmed = text.trim();
        if(trimmed.startsWith("\"{") || trimmed.startsWith("{") || trimmed.startsWith("\"[") || trimmed.startsWith("[")){
            if (typeof text !== 'string') return false;
            try {
                let result = JSON.parse(text);
                let type = Object.prototype.toString.call(result);
                return type.toString().includes('[object');
            } catch (err) {
                return false;
            }
        }
        return false;
    }

    isMobileBrowser(){
        return this.isIos() ? true : (utils.isKindle() ? true : this.isMobile());
    }

    isMobile(){
        let check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    }

    isIos(){
        const toMatch = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i
        ];

        return toMatch.some((toMatchItem) => {
            return navigator.userAgent.match(toMatchItem);
        });
    }

    isKindle(){
        const ua = navigator.userAgent;
        return /Kindle/i.test(ua) || /Silk/i.test(ua) || /KFTT/i.test(ua) || /KFOT/i.test(ua) || /KFJWA/i.test(ua) || /KFJWI/i.test(ua) || /KFSOWI/i.test(ua) || /KFTHWA/i.test(ua) || /KFTHWI/i.test(ua) || /KFAPWA/i.test(ua) || /KFAPWI/i.test(ua);
    }

    get32BytesPassword(password, salt){
        const key = CryptoJS.PBKDF2(password, salt, {keySize: 128 / 32, iterations: 10000});
        return key.toString();
    }

    async checkUpdates(instance, smartContractAddress, latestUri, checkUri){
        if(instance){
            const shared = await this.sharedPromise;
            shared.showLoading();

            const contract = await this.getContract(smartContractAddress);
            if(!contract){return;}
            const versionUri = await contract.methods.getVersionURI().call();
            if(versionUri !== latestUri || checkUri){
                const uri = await this.setProtocol(versionUri);
                this.loadUri(uri)
                    .then(data => instance.onNotUpdated(data))
                    .catch(e => this.showAlert(e));
            }
            else{
                instance.onUpdated();
            }
        }
    }

    async checkIfMetaMaskIsInstalled(){
        return new Promise(async function(resolve, reject) {
            try {
                const e = {
                    title: "MetaMask is not installed or enabled",
                    text: 'This website works on the web3 and you need a provider for it. <br> Please install or enable the extension (add-on) MetaMask<br> to use this website. <br> Click on the link below to download:',
                    lastText: 'https://metamask.io/download',
                    link: 'https://metamask.io/download'
                }

                if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
                    const provider = await detectEthereumProvider();
                    if (provider && provider !== window.ethereum) {
                        reject('Error: do you have multiple wallets installed?');
                    } else if (!provider) {
                        reject(e);
                    }
                    resolve(true);
                }
                else{
                    reject(e);
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    async unsavedChanges(){
        const shared = await this.sharedPromise;
        window.onbeforeunload = event => {
            if(!this.showedAlert && !shared.showedAlert){
                if(event){
                    event.returnValue = "";
                }
                return "";
            }
        };
    }

    waitVerifyingTx(contractAddress, address, block, nonce, timeout){
        return new Promise(async function(resolve, reject) {
            try{
                await utils.verifyTx(contractAddress, address, block, nonce, timeout, resolve, reject);
            }
            catch (e) {
                reject(e);
            }
        });
    }

    async verifyTx(contractAddress, address, block, nonce, timeout, resolve, reject){
        try{
            const web3 = await this.getWeb3();
            if(!web3){return;}
            const currentBlock = await this.getLastBlock();
            let maxBlocks = await this.getMaxBlocks();
            let fromBlock = block;
            let toBlock;

            let difference = currentBlock - block;
            if(difference > 0 && difference >= maxBlocks){
                toBlock = block + maxBlocks;
            }
            else if(difference > 0 && difference < maxBlocks){
                toBlock = currentBlock;
            }
            else{
                toBlock = block;
            }
            let hash = null;

            //console.log("from "+fromBlock+" to "+toBlock+" difference "+difference);

            const txs = await web3.eth.getPastLogs({
                fromBlock: fromBlock,
                toBlock: toBlock,
                address: contractAddress
            });

            if(txs){
                for(let i=0;i<txs.length;i++){
                    const tx = await web3.eth.getTransaction(txs[i].transactionHash);
                    if(tx && tx.nonce === nonce && tx.from === address){
                        hash = tx.hash;
                        break;
                    }
                }
            }

            if(hash){
                resolve(hash);
            }
            else{
                block = toBlock;
                setTimeout(function() {
                    utils.verifyTx(contractAddress, address, block, nonce, timeout, resolve, reject);
                }, timeout);
            }
        }
        catch (e){
            //omitted to avoid error messages when the user cancels the timeout
        }
    }

    async getStatusTx(hash){
        try{
            const web3 = await this.getWeb3();
            if(!web3){return;}
            const receipt = await web3.eth.getTransactionReceipt(hash);
            return receipt.status;
        }
        catch (e) {
            return null;
        }
    }
}
const utils = new Utils();
export {utils};
