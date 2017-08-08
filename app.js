var http = require('http');

var chat = require('./modules/chat');
var auth = require('./modules/auth');
var reg = require('./modules/reg');

var extra = require('./modules/extra');

var config = require('config');
var db = require('db');

var tech = require('tech').server_tech;
var log = require('tech').log;

db.sessions.connect();
db.users.connect();
db.dialogs.connect();

http.createServer(function(req, res) {
    var urlLinks = parse(req.url);

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
                default:
                    if (urlLinks[1].substr(0, 5) == '/room') {
                        var room = urlLinks[1].substr(5, urlLinks[1].length - 5);

                        switch (urlLinks[2]) {
                            case '/msg':
                                db.dialogs.getMessages(room, 0, true)
                                    .then(function(data) {
                                        res.end(JSON.stringify(data));
                                        
                                    })
                                    .catch(function (err) {
                                        log.error('Error at app.js/chat/msg/getMessages', err);
                                    });
                                break;
                            case '/exit':
                                db.sessions.deleteSession(extra.parseCookies(req).sessionID)
                                    .then(function (data) {
                                        res.writeHead(302, { Location: ''});
                                        res.end();
                                    })
                                    .catch(function (err) {
                                        log.error("Error at app.js/chat/deleteSession", err);
                                    });
                                break;
                            case '/subscribe':
                                subscribeFunc(req, res, room);
                                break;
                            case '/publish':
                                chat.publish(req, res, room);
                                chat.subscribe(req, res, room);
                                break;
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
                default:
                    defaultError(req, res);
            }
            break;
        default:
            defaultError(req, res);
    }
}).listen(8080);

function parse(url) {
    var x = [];
    for (var i = 0; i < url.length; i++) {
        if (url.charAt(i) == '/')
            x.push('/');
        else
            x[x.length - 1] += url.charAt(i);
    }
    x.push('/');
    return x;
}

function subscribeFunc(req, res, room) {
    var p = extra.parseCookies(req);

    db.sessions.getSession(p.sessionID)
        .then(function(data) {
            if (data) {
                if (data.date - (new Date().getTime()) < 30000) {

                    db.sessions.addSession(p.login,
                        new Date().getTime() + 86409000)
                        .then(function(data) {

                            db.sessions.deleteSession(p.sessionID)
                                .then(function (data1) {

                                    var s = 'sessionID=' + data + '; Path=/';
                                    var s1 = 'login=' + p.login + '; Path=/';

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

function defaultError(req, res) {
    //TODO: need to redirect to error.html, maybe
    res.statusCode = 404;
    res.end("Page not found");
    log.error("default case in rooter", req.url);
}