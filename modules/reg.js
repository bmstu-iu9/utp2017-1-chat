var db = require('db');
var log = require('tech').log;
var extra = require('./extra');
var config = require('config');

exports.reg = function(req, res) {
    extra.safeRequest(req, res)
        .then(function(body) {
            db.users.addUser(body.login, body.password, body.salt)
                .then(function (data) {

                    db.sessions.addSession(body.login,
                        new Date().getTime() + 86409000)
                        .then(function(data) {
                            /*
                            ********************
                              CAN'T TOUCH THIS
                            ********************
                            var forge = require('node-forge');
                            var rsa = forge.pki.rsa;
                            var keys = rsa.generateKeyPair({bits: 2048, e: 0x10001});
                            data = forge.pki.rsa.encrypt(forge.util.createBuffer(data),
                                keys.privateKey, false, false);
                            console.log(forge.pki.rsa.decrypt(data, keys.publicKey, true, false));
                            var key = forge.pki.publicKeyToPem(keys.publicKey);*/

                            var s = 'sessionID=' + data + '; Path=/; Secure';
                            var s1 = 'login=' + body.login + '; Path=/; Secure';

                            res.writeHead(200, {
                                'Set-Cookie': [s, s1]
                            });

                            var x = {
                                key: '',
                                text: '/chat'
                            };
                            
                            res.end(JSON.stringify(x));

                        })
                        .catch(function (err) {
                            log.error("Error at reg.js/reg:", err);
                        });
                })
                .catch(function (err) {
                    if (err == "Deprecated") {
                        res.statusCode = 401;
                        res.end("Deprecated");

                    } else {
                        log.error("Error at reg.js/reg:", err);
                    }
                });
        })
        .catch(function(err) {
            log.error(err);
        });
};

exports.sendSalt = function(req, res) {
    extra.safeRequest(req, res)
        .then(function(data) {
            res.end(db.users.saltExtra());
        })
        .catch(function(err) {
            log.error("Error at reg.js/sendSalt:", err);
        });
};