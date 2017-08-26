const db = require('db');
const log = require('tech').log;
const extra = require('./extra');
const config = require('config');

exports.reg = function(req, res) {
    extra.safeRequest(req, res)
        .then(function(body) {
            db.users.addUser(body.login, body.password, body.salt)
                .then(function (data) {

                    db.sessions.addSession(body.login,
                        new Date().getTime() + 86409000)
                        .then(function(data) {

                            let s = 'sessionID=' + data + '; Path=/; Secure';
                            let s1 = 'login=' + body.login + '; Path=/; Secure';

                            res.writeHead(200, {
                                'Set-Cookie': [s, s1]
                            });

                            //rudimentary field @key
                            let x = {
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
