"use strict";

const https = require('https');
const express = require('express');
const app = express();
const fs = require('fs-extra');
const privKey = fs.readFileSync('/home/escasso/ssl.key', 'utf8');
const certificate = fs.readFileSync('/home/escasso/ssl.cert', 'utf8');
const credentials = {key: privKey, cert: certificate};
const server = https.createServer(credentials, app);
const cors = require('cors');
const bodyParser = require('body-parser');

const HOSTNAME = "escasso.com";
const PORT = 8444;
const BASE_URL = "https://" + HOSTNAME + "/";
const IPFS_API = "/ip4/127.0.0.1/tcp/5002";

const antiDDOS = {
    lastIPs: [],
    lastTimestamps: [],
    lastProofs: [],
    lastProofIP: [],
    blockedIPs: []
}

let utils = null;
let shared = null;

server.listen(PORT, HOSTNAME, async () => {
    utils = (await import('./src/modules/utils/utils.mjs')).utils;
    shared = (await import('./src/modules/shared/shared.mjs')).shared;
    shared.setBaseUrl(BASE_URL);
    shared.createIPFS(IPFS_API);
    console.log(`Server running at `+ BASE_URL);
});

app.use(bodyParser.json({limit: '100kb'}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(function(e, req, res, next) {});
app.use(cors());

app.post('/add', async function(req, res) {
    shared.postAdd(req, res, antiDDOS).catch(e => utils.internalServerError(res, e));
});

app.get('/pinned', async function(req, res) {
    shared.getPinned(req, res, antiDDOS).catch(e => utils.internalServerError(res, e));
});

app.get('/cat', async function(req, res) {
    shared.getCat(req, res,antiDDOS).catch(e => utils.internalServerError(res, e));
});

app.get('/file', async function(req, res) {
    shared.getFile(req, res, antiDDOS).catch(e => utils.internalServerError(res, e));
});

app.get('/download/:folder/:file', async (req, res) => {
    shared.getDownload(req, res, antiDDOS).catch(e => utils.internalServerError(res, e));
});

app.get('/ram', async function(req, res) {
    shared.getRam(req, res, antiDDOS);
});

app.post('/copy', async function(req, res) {
    shared.copyFile(req, res, antiDDOS);
});

//only for tests
app.get('/proof', async function(req, res) {
    shared.getProof(req, res, antiDDOS).catch(e => utils.internalServerError(res, e));
});
