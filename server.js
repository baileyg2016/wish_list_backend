'use strict';

const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const express = require('express');
const forceSSL = require('express-force-ssl');
const fs = require('fs');
var http = require('http');
const https = require('https');
const util = require('util');
const { Client } =  require('pg');

dotenv.config();

const pgClient = new Client(process.env.POSTGRES_URL)

pgClient.connect();

const app = express();
const port = process.env.PORT || 5000;
var key = fs.readFileSync('private.key');
// var cert = fs.readFileSync('primary.crt' );
var ca = fs.readFileSync('mydomain.csr' );
var serverOptions = {
    key: key,
    // cert: cert,
    ca: ca
};

app.use(bodyParser.json());
app.use(forceSSL); // for http to go through https (:

// perform login credentials
app.get("/", async (req, res, next) => {
    // should check for duplicates

    await pgClient.query("SELECT * FROM users", (err, result) => {
        if (err) {
            console.log(err);
            res.status(400).send(err)
        }
        res.send(result.rows)
        prettyPrintResponse(result.rows)
    });
});

app.post("/", async (req, res) => {
    // bcrypt goes here
    await pgClient.query(`SELECT adduser('${req.body.firstName}'::text, '${req.bodylastName}'::text, '${req.body.email}'::text, 'testing123'::text);`, (err, result) => {
        if (err) {
            console.log(err);
            res.status(400).send(err)
        }
        res.send(result.rows)
        prettyPrintResponse(result.rows)
    });
});

app.post("/addItem", async (req, res) => {
    await pgClient.query(`SELECT addItem(\'${req.body.user}\'::text, \'${req.body.name}\'::text, \'${req.body.url}\'::text, ${req.body.cost}::money, \'${req.body.size}\'::text, \'${req.body.custom}\'::text);`, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send(err);
            return;
        }

        res.send(result)
        prettyPrintResponse(result)
    })
});


// app.listen(port, () => {
//     console.log(`Server is running on port: ${port}`);
// });

http.createServer(app).listen(80);

https.createServer(serverOptions, app).listen(port, () => {
    console.log(`Server is running on port ${port}`)
});

var prettyPrintResponse = response => {
    console.log(util.inspect(response, {colors: true, depth: 4}));
};