var http = require('http');

var chat = require('./modules/chat');
var auth = require('./modules/auth');
var reg = require('./modules/reg');

var extra = require('./modules/extra');

var config = require('config');
var db = require('db');

var tech = require('tech').server_tech;
var log = require('tech').log;


http.createServer(function(req, res) {
    db.sessions.connect();
    db.users.connect();
    db.dialogs.connect();
    
    db.dialogs.addRoom('0');

    switch (req.url) {
        case '/':
            auth.session(req, res);
            break;
        case '/error':
            require('./modules/send')("sources/html_sources/error.html", res, 'text/html');
            break;
        case '/start':
            require('./modules/send')("sources/html_sources/index.html", res, 'text/html');
            break;
        case '/start/a_connect':
            auth.salt(req, res);
            break;
        case '/start/a_enter':
            auth.auth(req, res);
            break;
        case '/start/r_connect':
            reg.sendSalt(req, res);
            break;
        case '/start/r_enter':
            reg.reg(req, res);
            break;
        case '/chat':
            //if server don't contain sessionID, redirect to auth
            db.sessions.deleteOldSessions()
                .then(function(data) {
                    db.sessions.getSession(extra.parseCookies(req).sessionID)
                        .then(function(data) {
                            if (data) {
                                require('./modules/send')("sources/html_sources/chat.html",
                                    res, 'text/html');
                            } else {
                                res.writeHead(302, { Location: 'start'});
                                res.end();
                            }
                        })
                        .catch(function (err) {
                            log.error("Error at app.js/chat/getSession:", err);
                        });
                })
                .catch(function (err) {
                    log.error('Error at app.js/chat/deleteOldSessions:', err);
                });
            break;
        case '/chat/exit':
            db.sessions.deleteSession(extra.parseCookies(req).sessionID)
                .then(function (data) {
                    res.writeHead(302, { Location: ''});
                    res.end();
                })
                .catch(function (err) {
                    log.error("Error at app.js/chat/deleteSession", err);
                });
            break;
        case '/chat/subscribe':
            var x = extra.parseCookies(req);

            db.sessions.getSession(x.sessionID)
                .then(function(data) {
                    if (data) {
                        if (data.date - (new Date().getTime()) < 30000) {

                            db.sessions.addSession(x.login,
                                new Date().getTime() + 86409000)
                                .then(function(data) {

                                    db.sessions.deleteSession(x.sessionID)
                                        .then(function (data1) {

                                            var s = 'sessionID=' + data + '; Path=/';
                                            var s1 = 'login=' + x.login + '; Path=/';

                                            res.writeHead(200, {
                                                'Set-Cookie': [s, s1]
                                            });
                                        })
                                        .catch(function (err) {
                                            log.error("Error at app.js/sb:", err);
                                        });
                                })
                                .catch(function (err) {
                                    log.error("Error at app.js/sb:", err);
                                });
                        }
                        chat.subscribe(req, res);
                    } else {
                        res.writeHead(302, { Location: ''});
                        res.end();
                    }
                })
                .catch(function (err) {
                    log.error("Error at app.js/chat/getSession", err);
                });
            break;
        case '/chat/publish':
            chat.publish(req, res);
            chat.subscribe(req, res);
            break;
        case '/css_sources/style.css':
            require('./modules/send')("sources/css_sources/style.css", res, 'text/css');
            break;
        case '/image_sources/letters/ch.png':
            require('./modules/send')("sources/image_sources/letters/ch.png", res, 'image/png');
            break;
        case '/image_sources/letters/a.png':
            require('./modules/send')("sources/image_sources/letters/a.png", res, 'image/png');
            break;
        case '/image_sources/letters/t.png':
            require('./modules/send')("sources/image_sources/letters/t.png", res, 'image/png');
            break;
        case '/js_sources/start.js':
            require('./modules/send')("sources/js_sources/start.js", res, 'text/javascript');
            break;
        case '/js_sources/chat.js':
            require('./modules/send')("sources/js_sources/chat.js", res, 'text/javascript');
            break;
        case '/image_sources/clouds/sun.png':
            require('./modules/send')("sources/image_sources/clouds/sun.png", res, 'image/png');
            break;
        case '/image_sources/clouds/cloud2.png':
            require('./modules/send')("sources/image_sources/clouds/cloud2.png", res, 'image/png');
            break;
        case '/image_sources/clouds/cloud1.png':
            require('./modules/send')("sources/image_sources/clouds/cloud1.png", res, 'image/png');
            break;
        case '/image_sources/grass/grass2.png':
            require('./modules/send')("sources/image_sources/grass/grass2.png", res, 'image/png');
            break;
        case '/image_sources/cat/butterfly.png':
            require('./modules/send')("sources/image_sources/cat/butterfly.png", res, 'image/png');
            break;
        case '/image_sources/close.png':
            require('./modules/send')("sources/image_sources/close.png", res, 'image/png');
            break;
        case '/css_sources/chat.css':
            require('./modules/send')("sources/css_sources/chat.css", res, 'text/css');
            break;
        default:
            //TODO: need to redirect to error.html, maybe
            res.statusCode = 404;
            res.end("Page not found");
            log.error("default case in rooter", req.url);
    }
}).listen(8080);