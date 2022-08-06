"use strict";

const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const express = require('express');
const app = express();
const server = http.createServer(app);
const cors = require('cors');
const path = require('path');

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(function(e, req, res, next) {});
app.use(cors());
app.set('views', path.join(__dirname, 'src/'));
app.use(express.static(__dirname + '/src/'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', function(req, res) {
    res.render('pages/index.html');
});

app.get('/viewer.html', function(req, res) {
    res.render('pages/viewer.html');
});

app.get('/test', function(req, res) {
    res.render('pages/test.html');
});

app.get('/contact', function(req, res) {
    res.render('pages/contact.html');
});

app.get('/settings', function(req, res) {
    res.render('pages/settings.html');
});

app.get('/mail', function(req, res) {
    res.render('pages/mail.html');
});

app.get('/server', function(req, res) {
    res.render('pages/server.html');
});