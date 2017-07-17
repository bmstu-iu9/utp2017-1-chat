var db = require('db');
var config = require('config');
var keccak = require('js-sha3').keccak512;

/**
 * In developing
 */
exports.getHash = function(res, login, hash) {
    var user = db.getUser(login);
    if (hash == keccak(user.login + user.password + config.SECRET_KEY))
        res.end("chat");
    else
        res.end("decline");
};