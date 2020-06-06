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
// const jwt = require('jsonwebtoken');
const { signJWT, verifyUser } = require('./modules/jwt');
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

// register a new user
app.post("/register", async (req, res) => {
    // bcrypt goes here
    await pgClient.query(`SELECT adduser('${req.body.firstName}'::text, '${req.body.lastName}'::text, '${req.body.email}'::text, '${req.body.password}'::text);`, (err, result) => {
        if (err) {
            console.log(err);
            res.status(400).send(err)
            return;
        }
        // also need to send the jwt here

        var token = signJWT(req.body.email);
        
        res.status(200).send({
            jwt: token
        });

        prettyPrintResponse(result)
    });
});

app.post("/addItem", async (req, res) => {

    var decoded = verifyUser(req.body.email);

    if (decoded.name === 'TokenExpiredError') {
        res.status(401).send({ msg: token.message });
    }
    else if (decoded.name === 'JsonWebTokenError') {
        res.status(403).send({ msg: token.message });
    }
    else {

        await pgClient.query(`SELECT doesUserExists`)

        await pgClient.query(`SELECT addItem(\'${req.body.user}\'::text, \'${req.body.name}\'::text, \'${req.body.url}\'::text, ${req.body.cost}::money, \'${req.body.size}\'::text, \'${req.body.custom}\'::text);`, (err, result) => {
            if (err) {
                console.error(err);
                res.status(400).send(err);
                return;
            }
    
            // make sure that the user is in the db and their token is valid
            
    
            res.status(200).send();
            prettyPrintResponse(result)
        })   
    }
});


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});



var prettyPrintResponse = response => {
    console.log(util.inspect(response, {colors: true, depth: 4}));
};