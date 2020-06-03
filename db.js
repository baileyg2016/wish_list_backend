const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: "BaileySpell",
    password: process.env.POSTGRES_PASSWORD,
    host: "localhost",
    port: 5432,
    database: "wish_list"
})

module.exports = pool;