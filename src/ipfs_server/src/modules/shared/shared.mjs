"use strict";

import {create} from "ipfs-http-client";
import {BufferList} from "bl";
import {utils} from '../utils/utils.mjs';
import {Constants} from '../utils/constants.mjs';
import fetch from 'cross-fetch';

let ipfs = null;

class Shared{

    constructor(){
        this.baseUrl = "";
    }

    setBaseUrl(url){
        this.baseUrl = url;
    }

    createIPFS(url){
        ipfs = create(url);
    }

    async postAdd(req, res, antiDDOS){
        const params = {
            text: req.body.text,
            serverId: req.body.serverId,
            userId: req.body.userId,
            proof: req.body.proof,
            pinned: req.body.pinned,
            serverUrls: req.body.serverUrls,
        }
        this.common(this.add, params, utils, req, res, antiDDOS);
    }

    async getPinned(req, res, antiDDOS){
        const params = {
            cid: req.query.cid,
            serverId: req.query.serverId,
            userId: req.query.userId,
            proof: req.query.proof,
        }
        this.common(this.pinned, params, utils, req, res, antiDDOS);
    }

    async getCat(req, res, antiDDOS){
        const params = {
            cid: req.query.cid,
            serverId: req.query.serverId,
            userId: req.query.userId,
            proof: req.query.proof,
        }
        this.common(this.cat, params, utils, req, res, antiDDOS);
    }

    async getFile(req, res, antiDDOS){
        const params = {
            cid: req.query.cid,
            serverId: req.query.serverId,
            userId: req.query.userId,
            proof: req.query.proof,
            ext: req.query.ext,
        }
        this.common(this.file, params, utils, req, res, antiDDOS);
    }

    getRam(req, res, antiDDOS){
        const params = {
            serverId: req.query.serverId,
            userId: req.query.userId,
            proof: req.query.proof,
        }
        this.common(this.ram, params, utils, req, res, antiDDOS);
    }

    async copyFile(req, res, antiDDOS){
        const params = {
            cid: req.body.cid,
            serverId: req.body.serverId,
            userId: req.body.userId,
            proof: req.body.proof,
            pinned: req.body.pinned,
            serverUrls: req.body.serverUrls,
        }
        this.common(this.copy, params, utils, req, res, antiDDOS);
    }

    async getDownload(req, res, antiDDOS){
        const filePath = "./" + req.params.folder + "/" + req.params.file;
        const ip = utils.parseIP(req);

        if(Constants.IS_LOCALHOST){
            this.download(filePath, res, utils);
        }
        else{
            const checkResult = utils.checkIPs(ip, antiDDOS.lastIPs, antiDDOS.lastTimestamps, antiDDOS.blockedIPs, Constants.MAX_DIFF_IN_SECS, Constants.DIFF_TO_UNBLOCK_IN_SECS, Constants.MAX_LAST_IPS);
            antiDDOS.lastIPs = checkResult.lastIPs;
            antiDDOS.lastTimestamps = checkResult.lastTimestamps;
            if(checkResult.allowed){
                this.download(filePath, res, utils);
            }
            else{
                utils.tooManyRequests(res);
            }
        }
    }

    async getProof(req, res){
        const serverId = req.query.serverId;
        const userId = req.query.userId;
        const proof = utils.getArray(req.query.proof);
        utils.isValid(serverId, userId, proof, Constants.RPC_LINK, Constants.CONTRACT_ADDRESS)
            .then(isValid => {
                res.send({isValid: isValid});
            })
            .catch(e => utils.internalServerError(res, e));
    }

    download(filePath, res, serverUtils){
        try{
            res.download(filePath, (e) => {
                if (e) {
                    serverUtils.internalServerError(res, e);
                }
            });
        }
        catch (e) {
            serverUtils.internalServerError(res, e);
        }
    }

    async file(params, res){
        try{
            const cid = params.cid;
            const ext = params.ext;

            const chunks = [];
            for await (const chunk of ipfs.cat(cid)) {
                chunks.push(chunk);
            }

            let start = 0;
            let end = Constants.BUFFER_SIZE;
            if(end > chunks.length){
                end = chunks.length;
            }
            const bl = BufferList();

            while(start !== end){
                const buffer = Buffer.from(chunks.slice(start, end).toString());
                bl.append(buffer);

                start = start + Constants.BUFFER_SIZE;
                if(start > chunks.length){
                    start = chunks.length;
                }

                end = end + Constants.BUFFER_SIZE;
                if(end > chunks.length){
                    end = chunks.length;
                }
            }

            utils.getDownloadLink(shared.baseUrl, Constants.DOWNLOAD_ENDPOINT, Constants.FILES_FOLDER, bl, cid, ext)
                .then(link => utils.ok(res, {link: link}))
                .catch(e => utils.internalServerError(res, e));
        }
        catch (e) {
            utils.internalServerError(res, e);
        }
    }

    async cat(params, res){
        try{
            const cid = params.cid;
            const cidIsOK = await utils.checkCID(cid, ipfs, Constants.RAM_PERCENT, res);
            if(!cidIsOK){
                return;
            }

            const chunks = [];
            for await (const chunk of ipfs.cat(cid)) {
                chunks.push(chunk);
            }

            const text = chunks.toString();
            utils.ok(res, {text: text});
        }
        catch (e) {
            utils.internalServerError(res, e);
        }
    }

    async copy(params, res){
        try {
            const serverId = params.serverId;
            const userId = params.userId;
            utils.isPremium(serverId, userId, Constants.RPC_LINK, Constants.CONTRACT_ADDRESS)
                .then(async isPremium => {
                    if(isPremium || Constants.IS_LOCALHOST){
                        const cid = params.cid;
                        const cidIsOK = await utils.checkCID(cid, ipfs, Constants.RAM_PERCENT, res);
                        if(!cidIsOK){
                            return;
                        }

                        const chunks = [];
                        for await (const chunk of ipfs.cat(cid)) {
                            chunks.push(chunk);
                        }

                        const text = chunks.toString();
                        shared.waitFetchingUrl(params.serverUrls, 0, params, text, res);
                    }
                    else{
                        utils.isNotPremium(res);
                    }
                })
                .catch(e => utils.internalServerError(res, e));
        }
        catch (e) {
            utils.internalServerError(res, e);
        }
    }

    waitFetchingUrl(serverUrls, index, params, text, res){
        this.fetchUrl(serverUrls[index], params, text)
            .then(data => {
                index++;
                if(index < serverUrls.length){
                    this.waitFetchingUrl(serverUrls, index, params, text, res);
                }
                else{
                    utils.ok(res, data);
                }
            })
            .catch(e => utils.internalServerError(res, e));
    }

    fetchUrl(serverUrl, params, text){
        return new Promise(function (resolve, reject) {
            try {
                const url = serverUrl + "add";
                fetch(url, {
                    body: JSON.stringify({
                        text: text,
                        serverId: params.serverId,
                        userId: params.userId,
                        proof: params.proof,
                        pinned: params.pinned,
                        serverUrls: []
                    }),
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => utils.returnResponse(response,resolve,reject)).catch(error => reject(error));
            } catch (e) {
                reject(e);
            }
        });
    }

    async pinned(params, res){
        try{
            const cid_ = params.cid;

            let isPinned = false;
            for await (const {cid} of ipfs.pin.ls()) {
                if(cid.toString().includes(cid_)){
                    isPinned = true;
                    break;
                }
            }

            utils.ok(res, {isPinned: isPinned});
        }
        catch (e) {
            utils.internalServerError(res, e);
        }
    }

    add(params, res){
        try{
            const text = params.text;
            const pinned = params.pinned;
            const serverId = params.serverId;
            const userId = params.userId;
            ipfs.add(text)
                .then(cid => {
                    if(pinned === "true"){
                        utils.isPremium(serverId, userId, Constants.RPC_LINK, Constants.CONTRACT_ADDRESS)
                            .then(isPremium => {
                                if(isPremium || Constants.IS_LOCALHOST){
                                    ipfs.pin.add(cid.cid)
                                        .then(() => shared.copyAdd(text, cid, params, res))
                                        .catch(e => utils.internalServerError(res, e));
                                }
                                else{
                                    utils.isNotPremium(res);
                                }
                            })
                            .catch(e => utils.internalServerError(res, e));
                    }
                    else{
                        shared.copyAdd(text, cid, params, res);
                    }
                })
                .catch(e => utils.internalServerError(res, e));
        }
        catch (e) {
            utils.internalServerError(res, e);
        }
    }

    copyAdd(text, cid, params, res){
        if(params.serverUrls !== "null" && params.serverUrls !== "undefined" && params.serverUrls.length > 0){
            this.waitFetchingUrl(params.serverUrls, 0, params, text, res);
        }
        else{
            utils.ok(res, cid);
        }
    }

    ram(params, res){
        utils.ok(res, {total: utils.getTotalRAM(), free: utils.getFreeRAM()});
    }

    common(function_, params, serverUtils, req, res, antiDDOS){
        const serverId = params.serverId;
        const userId = params.userId;
        const proof = serverUtils.getArray(params.proof);
        const ip = serverUtils.parseIP(req);

        if(Constants.IS_LOCALHOST){
            function_(params, res);
        }
        else{
            const checkResult = serverUtils.checkIPs(ip, antiDDOS.lastIPs, antiDDOS.lastTimestamps, antiDDOS.blockedIPs, Constants.MAX_DIFF_IN_SECS, Constants.DIFF_TO_UNBLOCK_IN_SECS, Constants.MAX_LAST_IPS);
            antiDDOS.lastIPs = checkResult.lastIPs;
            antiDDOS.lastTimestamps = checkResult.lastTimestamps;
            if(checkResult.allowed){
                const checkResult = serverUtils.checkProofs(ip, antiDDOS.lastProofs, antiDDOS.lastProofIP, proof, Constants.MAX_LAST_PROOFS);
                antiDDOS.lastProofs = checkResult.lastProofs;
                antiDDOS.lastProofIP = checkResult.lastProofIP;
                if(checkResult.allowed){
                    serverUtils.isValid(serverId, userId, proof, Constants.RPC_LINK, Constants.CONTRACT_ADDRESS)
                        .then(isValid => {
                            if(isValid){
                                function_(params, res);
                            }
                            else{
                                serverUtils.unauthorized(res);
                            }
                        })
                        .catch(e => serverUtils.internalServerError(res, e));
                }
                else{
                    serverUtils.forbidden(res);
                }
            }
            else{
                serverUtils.tooManyRequests(res);
            }
        }
    }
}
const shared = new Shared();
export {shared};