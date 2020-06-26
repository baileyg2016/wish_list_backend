'use strict';

const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookie = require('cookie-parser');
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


// const makeQuery = async (query, ...args) {
//     await pgClient.query(`SELECT ${query}()`, (err, result) => {
//         if (err) {
//             console.log(err);
//             res.status(400).send(err)
//         }
//         res.send(result.rows)
//         prettyPrintResponse(result.rows)
//     });
// }

const doesUserExist = async (email) => {
    return await pgClient.query(`SELECT doesUserExist(\'${email}\')`).then(res => { return res.rows[0].doesuserexist });
}


/* perform login credentials
    request body = {
        username: // user's username,
        password: // user's password
    }
*/

app.post("/", async (req, res, next) => {
    // should check for duplicates

    await pgClient.query(`SELECT checkLoginUser(\'${req.body.username}\', \'${req.body.password}\')`, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send(err)
        }

        if (result.rows[0]) {
            console.log(req.body)
            res.send({
                jwt: signJWT(req.body.email)
            })
        }
        else {
            res.status(403).send( { msg: "Username and/or password is incorrect" } );
        }

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

        // res.cookie
        
        res.status(200).send({
            jwt: token
        });

        prettyPrintResponse(result)
    });
});

/*
    Request body: 
        {
            jwt: // email/username,
            name: // name of the item,
            size: // size of the item,
            url: // item url,
            imageURL: //url to the image,
            cost: // how much the item cost,
            custom: // any item custumization specifics
        }
    the decoded token should have the username/email as the data field
*/

app.post("/addItem", async (req, res) => {
    var decoded;
    try {
        decoded = verifyUser(req.body.token);
    }
    catch {
        res.sendStatus(500);
        return;
    }

    if (decoded.name === 'TokenExpiredError') { // generate new token
        var token = signJWT(decoded.data);
        res.status(200).send({
            jwt: token
        });
    }
    else if (decoded.name === 'JsonWebTokenError') {
        res.status(403).send({ msg: decoded.message });
    }
    else {
        // make sure that the user is in the db and their token is valid
        if (await doesUserExist(decoded.data)) {
            pgClient.query(`SELECT addItem(\'${decoded.data}\'::text, \'${req.body.name}\'::text, \'${req.body.url}\'::text, ${req.body.cost}::money, \'${req.body.size}\'::text, \'${req.body.custom}\'::text);`, (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(400).send(err);
                    return;
                }
                
                res.status(200).send({pk: result.rows[0].additem});
                prettyPrintResponse(result)
            });    
        }
        else {
            res.status(403).send({ msg: 'User does not exist' });
        }
    }
});

app.get('/getItems', async (req, res) => {
    var token = req.headers.authorization;
    console.log(req.headers)
    console.log(token)
    if (token.startsWith('Bearer')) {
        token = token.replace('Bearer ', '')
    }
    console.log(token)
    console.log("here")
    var decoded;
    try {
        decoded = verifyUser(token);
        console.log("decoded: ", decoded)
    }
    catch {
        res.sendStatus(500);
        return;
    }

    // will need to change this if
    if (decoded.name === 'TokenExpiredError') {
        var token = signJWT(decoded.data);
        res.status(200).send({
            jwt: token
        });
    }
    else if (decoded.name === 'JsonWebTokenError') {
        console.log('webtoken error')
        res.status(403).send({ msg: decoded.message });
    }
    else {
        // make sure that the user is in the db and their token is valid
        if (await doesUserExist(decoded.data)) {
            pgClient.query(`SELECT
                                items."pkItem",
                                items."Name",
                                items.url,
                                items."ImageURL",
                                items."Cost",
                                items."Size",
                                items."Custom"
                            FROM items INNER JOIN users u ON items."UserID" = u."pkUser" WHERE "Email"='${decoded.data}'; `,
                            (err, result) => {
                                if (err) {
                                    console.error(err);
                                    res.status(400).send(err);
                                    return;
                                }
                                console.log(result)
                                res.status(200).send({ items: result.rows });
                            });
        }
        else {
            res.status(403).send({ msg: "User does not exist" });
        }
    }
});

/*
    request body = {
        pkItem: // primary of the item to delete
    }
*/
app.delete("/deleteItem", async (req, res) => {
    var decoded = verifyUser(req.body.token);

    if (decoded.name === 'TokenExpiredError') {
        var token = signJWT(decoded.data);
        res.status(200).send({
            jwt: token
        });
    }
    else if (decoded.name === 'JsonWebTokenError') {
        res.status(403).send({ msg: decoded.message });
    }
    else {
        await pgClient.query(`SELECT deleteitem(\'${req.body.pkItem}\')`, (err, result) => {
            if (err) {
                console.error(err);
                res.status(400).send(err);
                return;
            }
            
            prettyPrintResponse(result);
        });
    }
});

app.get('/friends', async (req, res) => {
        let token = req.headers.authorization;
        let decoded;

        if (token.startsWith('Bearer')) {
            token = token.replace('Bearer ', '')
        }

        try {
            decoded = verifyUser(token);
        } catch(err) {
            console.log(err)
            console.log(token)
            console.log("Something wrong in get /friends")
            res.sendStatus(500);
            return;
        }

        // will need to change this if
        if (decoded.name === 'TokenExpiredError') {
            token = signJWT(decoded.data);
            res.status(200).send({
                jwt: token
            });
        }
        else if (decoded.name === 'JsonWebTokenError') {
            console.log('webtoken error')
            res.status(403).send({ msg: decoded.message });
        }
        else {
            // make sure that the user is in the db and their token is valid
            if (await doesUserExist(decoded.data)) {
                pgClient.query(`select u2."pkUser", u2."FirstName", u2."LastName", u2.image_path
                                from users u1
                                inner join friends f
                                    on u1."pkUser" in (f."User2ID", f."User1ID")
                                inner join users   u2
                                    on  u2."pkUser" in (f."User2ID", f."User1ID")
                                    and u1."pkUser" <> u2."pkUser"
                                where u1."Email" = '${decoded.data}';`,
                                (err, result) => {
                                    if (err) {
                                        console.error(err);
                                        res.status(400).send(err);
                                        return;
                                    }
                                    console.log(result)
                                    res.status(200).send({ friends: result.rows });
                                });
            }
            else {
                res.status(403).send({ msg: "User does not exist" });
            }
        }
    });


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});



var prettyPrintResponse = response => {
    console.log(util.inspect(response, {colors: true, depth: 4}));
};