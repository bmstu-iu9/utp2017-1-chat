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

                            var s = 'sessionID='
                                + data + '; expires=' +
                                (new Date(new Date().getTime() + 86409000))
                                    .toUTCString() + '; Path=/; HttpOnly';
                            var s1 = 'login=' + body.login + '; expires=' +
                                (new Date(new Date().getTime() + 86409000))
                                    .toUTCString() + '; Path=/; HttpOnly';

                            res.writeHead(200, {
                                'Set-Cookie': [s, s1]
                            });
                            res.end('/chat');

                        })
                        .catch(function (err) {
                            log.error("Error at reg.js/reg:", err);
                        });
                })
                .catch  (function (err) {
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