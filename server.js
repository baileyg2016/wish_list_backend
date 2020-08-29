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

// GraphQL
const { PrismaClient } = require('@prisma/client');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema');
const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutations')
const prisma = new PrismaClient();

const resolvers = {
    Query,
    Mutation
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        let token = '';
        // could create a potential error in the future but
        // being optimistic
        if (!req.body.query.split('\n')[1].includes('register')) {
            token = req.headers.authorization.slice(7)
        }
        
        return { prisma, token }
    }
})

server.applyMiddleware({ app });
app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
