const jwt = require('jsonwebtoken');
require('dotenv').config();

// make the JWT valid for a month
const signJWT = (payload) => {
    console.log(payload)
    return jwt.sign({
            data: payload
        }, process.env.JWT_PASS, { expiresIn: '30d' });
};

// verify user
// returns a json object with the keys: data, exp, iat
const verifyUser = (token) => {
    return jwt.verify(token, process.env.JWT_PASS);
}

module.exports = {
    signJWT,
    verifyUser
}