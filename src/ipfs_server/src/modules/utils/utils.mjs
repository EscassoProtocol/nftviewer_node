"use strict";

import Web3 from 'web3';
import path from "path";
import fs from "fs-extra";
import MD5 from "crypto-js/md5.js";
import os from "os";
import {webcrypto} from 'crypto';

class Utils{
    getABI(){
        return [
            {"inputs": [{"internalType": "uint256","name": "serverId","type": "uint256"},
                    {"internalType": "uint256","name": "userId","type": "uint256"}],
                "name": "getServerSettings",
                "outputs": [{"internalType": "address","name": "","type": "address"},
                    {"internalType": "uint256","name": "","type": "uint256"},
                    {"internalType": "address","name": "","type": "address"},
                    {"internalType": "bool","name": "","type": "bool"}],
                "stateMutability": "view","type": "function"},
            {"inputs": [{"internalType": "uint256","name": "serverId","type": "uint256"},
                    {"internalType": "address","name": "userAddress","type": "address"}],
                "name": "getUserId",
                "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
                "stateMutability": "view","type": "function"},
            {"inputs":[
                {"internalType":"uint256","name":"serverId","type":"uint256"},
                {"internalType":"uint256","name":"userId","type":"uint256"},
                {"internalType":"bytes32[]","name":"proof","type":"bytes32[]"}],
                "name":"checkProof",
                "outputs":[{"internalType":"bool","name":"","type":"bool"}],
                "stateMutability":"view","type":"function"},
        ];
    }

    getContract(rpcLink, contractAddress){
        const web3 = new Web3(rpcLink);
        return new web3.eth.Contract(this.getABI(), contractAddress);
    }

    async isValid(serverId, userId, proof, rpcLink, contractAddress){
        const contract = this.getContract(rpcLink, contractAddress);

        let result = false;
        try{
            result = await contract.methods.checkProof(serverId, userId, proof).call();
        }
        catch (e) {
            //console.log(e);
        }

        return result;
    }

    async isPremium(serverId, userId, rpcLink, contractAddress){
        const contract = this.getContract(rpcLink, contractAddress);

        let result = false;
        try{
            const settings = await contract.methods.getServerSettings(serverId, userId).call();
            result = settings[3];
        }
        catch (e) {
            //console.log(e);
        }

        return result;
    }

    getDownloadLink(baseUrl, downloadEndpoint, filesFolder, bufferList, cid, ext){
        return new Promise(function(resolve, reject) {
            try {
                const randomValue = utils.getRandomValues();
                const fileId = MD5(randomValue).toString();
                const slashIndex = cid.indexOf("/");
                cid = slashIndex > -1 ? cid.substring(0, slashIndex) : cid;
                const fileName =  fileId + "_" + cid + "." + ext;
                const path_ = path.join('./' + filesFolder + "/", fileName);
                const pathRel = './' + filesFolder + "/";

                fs.ensureDirSync(pathRel);
                fs.writeFile(path_, utils.getBufferFromBufferList(bufferList), (error) => {
                    if(!error){
                        resolve(baseUrl + downloadEndpoint + "/" + filesFolder + "/" + fileName);
                    }
                    else{
                        reject(error);
                    }
                });
            } catch (e) {
                return null;
            }
        });
    }

    getBufferFromBufferList(bufferList){
        const uint8Array = new Uint8Array(bufferList.length);
        for(let i=0;i<uint8Array.byteLength;i++){
            uint8Array.set([bufferList.get(i)], i);
        }
        return Buffer.from(uint8Array, "hex");
    }

    ok(res, obj){
        if(res && !res.headersSent) {
            res.status(200).send(obj);
        }
    }

    internalServerError(res, e){
        if(res && !res.headersSent) {
            res.status(500).send(e);
        }
    }

    unauthorized(res){
        if(res && !res.headersSent) {
            res.status(401).send("Invalid Signature.");
        }
    }

    isNotPremium(res){
        if(res && !res.headersSent) {
            res.status(401).send("The user is not premium.");
        }
    }

    tooManyRequests(res){
        if(res && !res.headersSent) {
            res.status(429).send("Too many requests.");
        }
    }

    forbidden(res){
        if(res && !res.headersSent) {
            res.status(403).send("The server is not localhost or your IP address has been changed. " +
                "You need to change the server settings to localhost or create a different proof.");
        }
    }

    payloadTooLarge(res){
        if(res && !res.headersSent) {
            res.status(413).send("Payload too large.");
        }
    }

    /*removeFile(filePath){
        if(fs.pathExistsSync(filePath)){
            fs.unlink(filePath);
        }
    }

    getFileSize(filePath){
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        return fileSizeInBytes / (1024 * 1024);
    }*/

    checkIPs(ip, lastIPs, lastTimestamps, blockedIPs, maxDiffInSecs, diffToUnblock, maxLastIPs){
        if(lastIPs && lastTimestamps && blockedIPs){
            const blockedIndex = blockedIPs.lastIndexOf(ip);
            if(blockedIndex > -1){
                const lastIPsIndex = lastIPs.lastIndexOf(ip);
                if(lastIPsIndex > -1){
                    const difference = this.getDifference(lastTimestamps, lastIPsIndex);
                    if(difference >= diffToUnblock){
                        blockedIPs[blockedIndex] = -1;
                        lastTimestamps[lastIPsIndex] = new Date() / 1000;
                        return {allowed: true, lastIPs: lastIPs, lastTimestamps: lastTimestamps};
                    }
                    else{
                        return {allowed: false, lastIPs: lastIPs, lastTimestamps: lastTimestamps};
                    }
                }
                else{
                    return {allowed: false, lastIPs: lastIPs, lastTimestamps: lastTimestamps};
                }
            }
            else{
                const lastIPsIndex = lastIPs.lastIndexOf(ip);
                if(lastIPsIndex > -1){
                    const difference = this.getDifference(lastTimestamps, lastIPsIndex);
                    if(difference <= maxDiffInSecs){
                        blockedIPs.push(ip);
                        return {allowed: false, lastIPs: lastIPs, lastTimestamps: lastTimestamps};
                    }
                    else{
                        lastTimestamps[lastIPsIndex] = new Date() / 1000;
                        return {allowed: true, lastIPs: lastIPs, lastTimestamps: lastTimestamps};
                    }
                }
                else{
                    if(lastIPs.length >= maxLastIPs){
                        lastIPs = [];
                        lastTimestamps = [];
                    }
                    lastIPs.push(ip);
                    lastTimestamps.push(new Date() / 1000);
                    return {allowed: true, lastIPs: lastIPs, lastTimestamps: lastTimestamps};
                }
            }
        }
        return {allowed: false, lastIPs: lastIPs, lastTimestamps: lastTimestamps};
    }

    getDifference(lastTimestamps, lastIndex){
        const lastTimestamp = lastTimestamps[lastIndex];
        const lastDate = new Date(lastTimestamp * 1000);
        return (new Date() - lastDate) / 1000;
    }

    checkProofs(ip, lastProofs, lastProofIP, proof, maxLastProofs){
        if(lastProofs && lastProofIP && proof){
            const currentProof = proof.join("").toLowerCase();
            const lastProofIndex = lastProofs.lastIndexOf(currentProof);
            if(lastProofIndex > -1){
                const lastIP = lastProofIP[lastProofIndex];
                if(lastIP === ip){
                    return {allowed: true, lastProofs: lastProofs, lastProofIP: lastProofIP};
                }
                else{
                    return {allowed: false, lastProofs: lastProofs, lastProofIP: lastProofIP};
                }
            }
            else{
                if(lastProofs.length >= maxLastProofs){
                    lastProofs = [];
                    lastProofIP = [];
                }
                lastProofs.push(currentProof);
                lastProofIP.push(ip);
                return {allowed: true, lastProofs: lastProofs, lastProofIP: lastProofIP};
            }
        }
        return {allowed: false, lastProofs: lastProofs, lastProofIP: lastProofIP};
    }

    getArray(obj){
        if(obj && !Array.isArray(obj)){
            if(obj.includes(",")){
                obj = obj.split(',');
            }
            else{
                obj = [obj];
            }
        }
        return obj;
    }

    getRandomValues(){
        return webcrypto.getRandomValues(new Uint8Array(1024)).toString();
    }

    getTotalRAM(){
        return os.totalmem() / 1024 / 1024;
    }

    getFreeRAM(){
        return os.freemem() / 1024 / 1024;
    }

    parseIP(req){
        return req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
    }

    async returnResponse(response, resolve, reject){
        if(response.status === 200){
            resolve(response.json());
        }
        else{
            const error = {
                status: response.status,
                message: response.statusText,
                response: await response.text()
            }
            reject(error);
        }
    }

    async checkCID(cid, ipfs, ramPercent, res){
        const stats = await ipfs.files.stat('/ipfs/'+cid);
        const size = stats.cumulativeSize / 1024 / 1024;
        const maxRamSize = (this.getFreeRAM() * ramPercent) / 100;
        if(size >= maxRamSize){
            this.payloadTooLarge(res);
            return false;
        }
        return true;
    }
}
const utils = new Utils();
export {utils};