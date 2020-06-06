'use strict';

const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const forceSSL = require('express-force-ssl');
const fs = require('fs');
var http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
const util = require('util');
const { Client } =  require('pg');

dotenv.config();

const pgClient = new Client(process.env.POSTGRES_URL)

pgClient.connect();

const app = express();
const port = process.env.PORT || 5000;
var key = fs.readFileSync('key.pem', 'utf8');
// var cert = fs.readFileSync('primary.crt' );
var cert = fs.readFileSync('cert.pem', 'utf8');
var serverOptions = {
    key: key,
    // cert: cert,
    cert: cert
};

app.use(bodyParser.json());
app.use(cors({origin: 'http://localhost:3000'}));
// app.use(forceSSL); // for http to go through https (:

// http.createServer(app).listen(80);

// https.createServer(serverOptions, app).listen(port, () => {
//     console.log(`Server is running on port ${port}`)
// });

// make the JWT valid for a month
const signJWT = (payload) => {
    return jwt.sign({
            data: payload
        }, process.env.JWT_PASS, { expiresIn: '30d' }, (err, decode) => {
            if (err) console.err(err);
        });
};

// verify user
const verifyUser = async (token) => {
    var decoded_token;
     await jwt.decode(token, process.env.JWT_PASS, )
}

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

app.post("/register", async (req, res) => {
    // bcrypt goes here
    await pgClient.query(`SELECT adduser('${req.body.firstName}'::text, '${req.body.lastName}'::text, '${req.body.email}'::text, '${req.body.password}'::text);`, (err, result) => {
        if (err) {
            console.log(err);
            res.status(400).send(err)
        }
        // also need to send the jwt here
        res.status(200).send({
            jwt: signJWT(req.body.email)
        });

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


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});



var prettyPrintResponse = response => {
    console.log(util.inspect(response, {colors: true, depth: 4}));
};