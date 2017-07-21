var http = require('http');
var chat = require('./modules/chat');
var auth = require('./modules/auth');
var tech = require('tech').server_tech;
var log = require('tech').log;
var db = require('db');
var config = require('config');
var extra = require('./modules/extra');


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
        case '/auth/direct':
            auth.auth(req, res);
            break;
        case '/reg':
            require('./modules/send')("html_sources/register.html", res);
            break;
        case '/chat':
            //if server don't contain sessionID, redirect to auth
            console.log(new Date().getTime());
            db.sessions.deleteOldSessions()
                .then(function(data){
                    db.sessions.getSession(extra.parseCookies(req).sessionID)
                        .then(function(data) {
                            if (data)
                                require('./modules/send')("html_sources/chat.html", res);
                            else {
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
        case '/chat/subscribe':
            db.sessions.getSession(extra.parseCookies(req).sessionID)
                .then(function(data) {
                    if (data)
                        chat.subscribe(req, res);
                    else {
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
        default:
            //need to redirect to error.html, maybe
            res.statusCode = 404;
            res.end("Page not found");
            log.error("default case in rooter");
    }
}).listen(8080);