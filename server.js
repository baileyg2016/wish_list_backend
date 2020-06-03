'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const dotenv = require('dotenv');
const util = require('util');
const { Client } =  require('pg');

// const pool = require('./db');

dotenv.config();

const pgClient = new Client(process.env.POSTGRES_URL)

pgClient.connect();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

app.get("/", async (req, res, next) => {
    await pgClient.query("SELECT * FROM \"Users\"", (err, result) => {
        if (err) {
            console.log(err);
            res.status(400).send(err)
        }
        res.send(result.rows)
        prettyPrintResponse(result.rows)
    })
})




app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

var prettyPrintResponse = response => {
    console.log(util.inspect(response, {colors: true, depth: 4}));
};