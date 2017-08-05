var http = require('http');

var chat = require('./modules/chat');
var auth = require('./modules/auth');
var reg = require('./modules/reg');
var getmsg = require('./modules/message');

var extra = require('./modules/extra');

var config = require('config');
var db = require('db');

var tech = require('tech').server_tech;
var log = require('tech').log;


http.createServer(function(req, res) {
    db.sessions.connect();
    db.users.connect();

    switch (req.url) {
        case '/':
            auth.session(req, res);
            break;
        case '/error':
            require('./modules/send')("html_sources/error.html", res);
            break;
        case '/auth':
            require('./modules/send')("html_sources/auth.html", res);
            break;
        case '/auth/connect':
            auth.salt(req, res);
            break;
        case '/auth/enter':
            auth.auth(req, res);
            break;
        case '/reg':
            require('./modules/send')("html_sources/register.html", res);
            break;
        case '/reg/connect':
            reg.sendSalt(req, res);
            break;
        case '/reg/enter':
            reg.reg(req, res);
            break;
        case '/chat':
            //if server don't contain sessionID, redirect to auth
            db.sessions.deleteOldSessions()
                .then(function(data) {
                    db.sessions.getSession(extra.parseCookies(req).sessionID)
                        .then(function(data) {
                            if (data) {
                                require('./modules/send')("html_sources/chat.html",res);
                            } else {
                                res.writeHead(302, { Location: 'auth'});
                                res.end();
                            }
                        })
                        .catch(function (err) {
                            log.error("Error at server.js/chat/getSession:", err);
                        });
                })
                .catch(function (err) {
                    log.error('Error at server.js/chat/deleteOldSessions:', err);
                });
            break;
        case '/chat/exit':
            db.sessions.deleteSession(extra.parseCookies(req).sessionID)
                .then(function (data) {
                    res.writeHead(302, { Location: ''});
                    res.end();
                })
                .catch(function (err) {
                    log.error("Error at server.js/chat/deleteSession", err);
                });
            break;
        case '/chat/subscribe':
            var x = extra.parseCookies(req);

            db.sessions.getSession(x.sessionID)
                .then(function(data) {
                    if (data) {
                        if (data.date - (new Date().getTime()) < 600000) {

                            db.sessions.addSession(x.login,
                                new Date().getTime() + 86409000)
                                .then(function(data) {

                                    db.sessions.deleteSession(x.sessionID)
                                        .then(function (data1) {

                                            var s = 'sessionID='
                                                + data + '; expires=' +
                                                (new Date(new Date().getTime()
                                                    + 86409000)).toUTCString()
                                                +'; Path=/; HttpOnly';
                                            var s1 = 'login=' + x.login + '; expires='
                                                + (new Date(new Date().getTime()
                                                    + 86409000)).toUTCString()
                                                + '; Path=/; HttpOnly';

                                            res.writeHead(200, {
                                                'Set-Cookie': [s, s1]
                                            });
                                        })
                                        .catch(function (err) {
                                            log.error("Error at server.js/sb:", err);
                                        });
                                })
                                .catch(function (err) {
                                    log.error("Error at server.js/sb:", err);
                                });
                        }
                        chat.subscribe(req, res);
                    } else {
                        res.writeHead(302, { Location: ''});
                        res.end();
                    }
                })
                .catch(function (err) {
                    log.error("Error at server.js/chat/getSession", err);
                });
            break;
        case '/chat/publish':
            chat.publish(req, res);
            break;
        case '/chat/getmsg':
            getmsg.getMessages(res);
            break;
        default:
            //TODO: need to redirect to error.html, maybe
            res.statusCode = 404;
            res.end("Page not found");
            log.error("default case in rooter");
    }
}).listen(8080);