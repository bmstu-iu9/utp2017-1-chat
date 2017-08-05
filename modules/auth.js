var db = require('db');
var log = require('tech').log;
var extra = require('./extra');

exports.session = function(req, res) {
    var ID = extra.parseCookies(req).sessionID;

    db.sessions.getSession(ID)
        .then(function (data) {
            if (data) {
                res.writeHead(302, { Location: req.url + 'chat'});
                res.end();

            } else {
                res.writeHead(302, { Location: req.url + 'auth'});
                res.end();
            }
        })
        .catch(function (err) {
            console.log("Error in auth.js/getSession", err);
        });
};

exports.auth = function(req, res) {
    extra.safeRequest(req, res)
        .then(function(body) {
            db.users.getUserRead(body.login)
                .then(function (data) {

                    if (data) {
                        if (data.password == body.password) {
                            db.sessions.addSession(body.login,
                                new Date().getTime() + 86409000)
                                .then(function(data) {

                                    var s = 'sessionID=' + data + '; Path=/';
                                    var s1 = 'login=' + body.login + '; Path=/';

                                    res.writeHead(200, {
                                        'Set-Cookie': [s, s1]
                                    });
                                    res.end('/chat');

                                })
                                .catch(function (err) {
                                    log.error("Error at auth.js/auth:", err);
                                });
                        } else {
                            res.statusCode = 401;
                            res.end();

                        }
                    }
                })
                .catch(function (err) {
                    log.error("Error at auth.js/auth:", err);
                });
        })
        .catch(function(err) {
            log.error(err);
        });
};

exports.salt = function(req, res) {
    extra.safeRequest(req, res)
        .then(function(data) {
            var login = data.login;

            db.users.getUserRead(login)
                .then(function(data) {
                    if (data) {
                        res.end(data.salt)
                    } else {
                        res.end(data);
                    }
                })
                .catch(function(err) {
                    log.error("Error at auth.js/salt:", err);
                });
        })
        .catch(function(err) {
            log.error(err);
        });
};