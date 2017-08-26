"use strict";

const http = require('http');
const https = require('https');
const fs = require('fs');

const chat = require('./modules/chat');
const auth = require('./modules/auth');
const reg = require('./modules/reg');

const extra = require('./modules/extra');

const config = require('config');
const db = require('db');

const tech = require('tech').server_tech;
const log = require('tech').log;

db.sessions.connect();
db.users.connect();
db.dialogs.connect();

const options = {
    key: fs.readFileSync('keys/key.pem'),
    cert: fs.readFileSync('keys/cert.pem')
};

https.createServer(options, function(req, res) {
    const urlLinks = parse(req.url);

    switch (urlLinks[0]) {
        case '/':
            auth.session(req, res);
            break;
        case '/error':
            require('./modules/send')("sources/html_sources/error.html", res, 'text/html');
            break;
        case '/start':
            switch (urlLinks[1]) {
                case '/':
                    require('./modules/send')
                    ("sources/html_sources/index.html", res, 'text/html');
                    break;
                case '/a_connect':
                    auth.salt(req, res);
                    break;
                case '/a_enter':
                    auth.auth(req, res);
                    break;
                case '/r_connect':
                    reg.sendSalt(req, res);
                    break;
                case '/r_enter':
                    reg.reg(req, res);
                    break;
                default:
                    defaultError(req, res);
            }
            break;
        case '/chat':
            switch (urlLinks[1]) {
                case '/':
                    chatShow(req, res, "/rooms.html");
                    break;
                case '/news':
                    extra.safeRequest(req, res);

                    db.dialogs.getNews()
                        .then(data => { res.end(JSON.stringify(data)); })
                        .catch(err => { log.error('Error at app.js/chat/getNews:', err) });

                    break;
                case '/delete_room':
                    extra.safeRequest(req, res)
                        .then(function (data) {
                            db.dialogs.deleteRoom(JSON.parse(data.id))
                                .then(function () {
                                    res.end();
                                })
                                .catch(function (err) {
                                    log.error('Error at app.js/chat/deleteRoom:', err);
                                });
                        })
                        .catch(function (err) {
                            log.error('Error at app.js/chat/deleteRoom:', err);
                        });
                    break;
                case '/add_room':
                    extra.safeRequest(req, res)
                        .then(function (data) {
                            db.dialogs.addRoom(extra.parseCookies(req).login, data.title)
                                .then(function (data) {
                                    res.end(data);
                                })
                                .catch(function (err) {
                                    log.error("Error at app.js/chat/addRoom:", err);
                                });
                        })
                        .catch(function (err) {
                            log.error('Error at app.js/chat/addRoom:', err);
                        });
                    break;
                case '/get_rooms':
                    db.dialogs.getRooms()
                        .then(function (data) {
                            res.end(JSON.stringify(data));
                        })
                        .catch(function (err) {
                            log.error("Error at app.js/chat/getRooms:", err);
                        });
                    break;
                case '/redirect':
                    extra.safeRequest(req, res)
                        .then(function (data) {
                            db.dialogs.containRoom(data)
                                .then(function (data1) {
                                    if (data1 != -1) {
                                        res.end();
                                    } else {
                                        res.end("No such room");
                                    }
                                })
                                .catch(function (err) {
                                    log.error("Error at app.js/chat/redirect:", err);
                                });
                        })
                        .catch(function (err) {
                            log.error("Error at app.js/chat/redirect:", err);
                        });
                    break;
                case '/exit':
                    db.sessions.deleteSession(extra.parseCookies(req).sessionID)
                        .then(function () {
                            // КОСТЫЛЬ res.writeHead(302, { Location: '' });
                            res.end();
                        })
                        .catch(function (err) {
                            log.error("Error at app.js/chat/deleteSession", err);
                        });
                    break;
                default:
                    if (urlLinks[1].substr(0, 5) == '/room') {
                        let room = urlLinks[1].substr(5, urlLinks[1].length - 5);
                        switch (urlLinks[2]) {
                            case '/':
                                chatShow(req, res, "/chat.html");
                                break;
                            case '/msg':
                                db.dialogs.getMessages(room, 0, true)
                                    .then(function(data) {
                                        res.end(JSON.stringify(data));
                                        
                                    })
                                    .catch(function (err) {
                                        log.error('Error at app.js/chat/msg' +
                                            '/getMessages', err);
                                    });
                                break;
                            case '/exit':
                                // КОСТЫЛЬ res.writeHead(302, { Location: '' });
                                res.end();
                                break;
                            case '/subscribe':
                                subscribeFunc(req, res, room);
                                break;
                            case '/publish':
                                chat.publish(req, res, room);
                                chat.subscribe(req, res, room);
                                break;
                            case '/get_users':
                                chat.usersSave(req, res, room);
                                break;
                            default:
                                if(urlLinks[2].substr(0, 6) == '/image') {
                                    require('./modules/send')
                                    ("./temp"+urlLinks[3]+'.png', res, 'image/png');
                                }
                        }
                    } else
                        defaultError(req, res);
            }
            break;
        case '/image_sources':
            switch (urlLinks[1]) {
                case '/clouds':
                    switch (urlLinks[2]) {
                        case '/sun.png':
                            require('./modules/send')
                            ("sources/image_sources/clouds/sun.png", res, 'image/png');
                            break;
                        case '/cloud2.png':
                            require('./modules/send')
                            ("sources/image_sources/clouds/cloud2.png", res, 'image/png');
                            break;
                        case '/cloud1.png':
                            require('./modules/send')
                            ("sources/image_sources/clouds/cloud1.png", res, 'image/png');
                            break;
                        default:
                            defaultError(req, res);
                    }
                    break;
                case '/grass':
                    switch (urlLinks[2]) {
                        case '/grass2.png':
                            require('./modules/send')
                            ("sources/image_sources/grass/grass2.png", res, 'image/png');
                            break;
                        default:
                            defaultError(req, res);
                    }
                    break;
                case '/cat':
                    switch (urlLinks[2]) {
                        case '/butterfly.png':
                            require('./modules/send')
                            ("sources/image_sources/cat/butterfly.png", res, 'image/png');
                            break;
                        default:
                            defaultError(req, res);
                    }
                    break;
                case '/letters':
                    switch (urlLinks[2]) {
                        case '/ch.png':
                            require('./modules/send')
                            ("sources/image_sources/letters/ch.png", res, 'image/png');
                            break;
                        case '/a.png':
                            require('./modules/send')
                            ("sources/image_sources/letters/a.png", res, 'image/png');
                            break;
                        case '/t.png':
                            require('./modules/send')
                            ("sources/image_sources/letters/t.png", res, 'image/png');
                            break;
                        default:
                            defaultError(req, res);
                    }
                    break;
                case '/flags':
                    let URL = urlLinks[2];
                    require('./modules/send')
                    ("sources/image_sources/flags" + URL, res, 'image/png');
                    break;
                case '/error':
                    switch (urlLinks[2]) {
                        case '/0.png':
                            require('./modules/send')
                            ("sources/image_sources/error/0.png", res, 'image/png');
                            break;
                        case '/400.png':
                            require('./modules/send')
                            ("sources/image_sources/error/400.png", res, 'image/png');
                            break;
                        case '/403.jpg':
                            require('./modules/send')
                            ("sources/image_sources/error/403.png", res, 'image/jpg');
                            break;
                        case '/404.png':
                            require('./modules/send')
                            ("sources/image_sources/error/404.png", res, 'image/png');
                            break;
                        case '/cat404.jpg':
                            require('./modules/send')
                            ("sources/image_sources/error/cat404.jpg", res, 'image/jpg');
                            break;
                        case '/poly404.png':
                            require('./modules/send')
                            ("sources/image_sources/error/poly404.png", res, 'image/png');
                            break;
                        case '/poly403.png':
                            require('./modules/send')
                            ("sources/image_sources/error/poly403.png", res, 'image/png');
                            break;
                        case '/poly400.png':
                            require('./modules/send')
                            ("sources/image_sources/error/poly400.png", res, 'image/png');
                            break;
                        case '/poly502.png':
                            require('./modules/send')
                            ("sources/image_sources/error/poly502.png", res, 'image/png');
                            break;
                        case '/poly503.png':
                            require('./modules/send')
                            ("sources/image_sources/error/poly503.png", res, 'image/png');
                            break;
                        case '/doge403.png':
                            require('./modules/send')
                            ("sources/image_sources/error/doge403.png", res, 'image/png');
                            break;
                        case '/cat400.png':
                            require('./modules/send')
                            ("sources/image_sources/error/cat400.png", res, 'image/png');
                            break;
                        case '/cat502.png':
                            require('./modules/send')
                            ("sources/image_sources/error/cat502.png", res, 'image/png');
                            break;
                        case '/cat503.png':
                            require('./modules/send')
                            ("sources/image_sources/error/cat503.png", res, 'image/png');
                            break;
                        case '/errorshark.png':
                            require('./modules/send')
                            ("sources/image_sources/error/errorshark.png", res, 'image/png');
                            break;

                    }
                    break;
                case '/close.png':
                    require('./modules/send')
                    ("sources/image_sources/close.png", res, 'image/png');
                    break;
                default:
                    defaultError(req, res);
            }
            break;
        case '/css_sources':
            switch (urlLinks[1]) {
                case '/style.css':
                    require('./modules/send')
                    ("sources/css_sources/style.css", res, 'text/css');
                    break;
                case '/chat.css':
                    require('./modules/send')
                    ("sources/css_sources/chat.css", res, 'text/css');
                    break;
                case '/error.css':
                    require('./modules/send')
                    ("sources/css_sources/error.css", res, 'text/css');
                    break;
                case '/rooms.css':
                    require('./modules/send')
                    ("sources/css_sources/rooms.css", res, 'text/css');
                    break;
                case '/error404.css':
                    require('./modules/send')
                    ("sources/css_sources/error404.css", res, 'text/css');
                    break;
                case '/error403.css':
                    require('./modules/send')
                    ("sources/css_sources/error403.css", res, 'text/css');
                    break;
                case '/error400.css':
                    require('./modules/send')
                    ("sources/css_sources/error400.css", res, 'text/css');
                    break;
                case '/error502.css':
                    require('./modules/send')
                    ("sources/css_sources/error502.css", res, 'text/css');
                    break;
                case '/error503.css':
                    require('./modules/send')
                    ("sources/css_sources/error503.css", res, 'text/css');
                    break;
                default:
                    defaultError(req, res);
            }
            break;
        case '/js_sources':
            switch (urlLinks[1]) {
                case '/start.js':
                    require('./modules/send')
                    ("sources/js_sources/start.js", res, 'text/javascript');
                    break;
                case '/chat.js':
                    require('./modules/send')
                    ("sources/js_sources/chat.js", res, 'text/javascript');
                    break;
                case '/rooms.js':
                    require('./modules/send')
                    ("sources/js_sources/rooms.js", res, 'text/javascript');
                    break;
                default:
                    defaultError(req, res);
            }
            break;
        default:
            if(urlLinks[0].substr(0, 6) == '/error'){
                require('./modules/send')("sources/html_sources"+urlLinks[0].substr(0, 9)+".html", res, 'text/html');
            } else {
                log.debug("Server error with: " + req.url);
                require('./modules/send')("sources/html_sources/error404.html", res, 'text/html');
            }
            //defaultError(req, res);
    }
}).listen(4433);

function parse(url) {
    let x = [];
    for (let i = 0; i < url.length; i++) {
        if (url.charAt(i) == '/')
            x.push('/');
        else
            x[x.length - 1] += url.charAt(i);
    }
    x.push('/');
    return x;
}

function subscribeFunc(req, res, room) {
    let p = extra.parseCookies(req);

    db.sessions.getSession(p.sessionID)
        .then(function(data) {
            if (data) {
                if (data.date - (new Date().getTime()) < 30000) {

                    db.sessions.addSession(p.login,
                        new Date().getTime() + 86409000)
                        .then(function(data) {

                            db.sessions.deleteSession(p.sessionID)
                                .then(function () {

                                    let s = 'sessionID=' + data + '; Path=/; Secure';
                                    let s1 = 'login=' + p.login + '; Path=/; Secure';

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
                chat.subscribe(req, res, room);
            } else {
                res.writeHead(302, { Location: ''});
                res.end();
            }
        })
        .catch(function (err) {
            log.error("Error at app.js/chat/getSession", err);
        });
}

function chatShow(req, res, path) {
    //if server don't contain sessionID, redirect to auth
    db.sessions.deleteOldSessions()
        .then(function() {
            db.sessions.getSession(extra.parseCookies(req).sessionID)
                .then(function(data) {
                    if (data) {
                        require('./modules/send')
                        ("sources/html_sources" + path, res, 'text/html');
                    } else {
                        res.writeHead(302, { Location: '/'});
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
}

function defaultError(req, res) {
    res.statusCode = 404;
    res.end("Page not found");
    log.error("default case in rooter", req.url);
}