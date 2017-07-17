var http = require('http');
var chat = require('./modules/chat');
var auth = require('./modules/auth');
var tech = require('tech').server_tech;
var log = require('tech').log;
var db = require('db');
var config = require('config');

var body;

http.createServer(function(req, res) {
    switch (req.url) {
        case '/':
            require('./modules/send')("html_sources/auth.html", res);
            break;
        /* TODO: This fragment of rooter contains authentication root */
        /*case '/auth':
            body = '';

            req
                .on('readable', function() {
                    var r = req.read();
                    if (r != null)
                        body += r;

                    if (body.length > 1e4){
                        res.statusCode = 413;
                        res.end("Message is too long");
                        log.error("413 in reading message");
                    }
                })
                .on('end', function() {
                    try {
                        body = JSON.parse(body);

                        if (body.hash)
                            res.end(config.SECRET_KEY);
                        else
                            auth.getHash(res, body.login, body.hash);

                        res.end("ok");

                    } catch (err) {
                        res.statusCode = 400;
                        res.end("Bad Request");
                        log.error('server/publish: ' + err + 'body: ' + body);
                    }
                });
            break;
        case '/s_auth':
            auth.send(req, res);
            break;*/
        case '/chat':
            require('./modules/send')("html_sources/chat.html", res);
            break;
        case '/chat/subscribe':
            chat.subscribe(req, res);
            break;
        case '/chat/publish':
            body = '';

            req
                .on('readable', function() { //long-read message
                    var r = req.read();
                    if (r != null)
                        body += r;
                    
                    if (body.length > 1e4){
                        res.statusCode = 413;
                        res.end("Message is too long");
                        log.error("413 in reading message");
                    }
                })
                .on('end', function() { //JSON-safe function
                    try {
                        body = JSON.parse(body);
                        
                        chat.publish(body.message);
                        res.end("ok");

                    } catch (err) {
                        res.statusCode = 400;
                        res.end("Bad Request");
                        log.error('server/publish: ' + err + 'body: ' + body);
                    }
                });
            break;
        default:
            res.statusCode = 404;
            res.end("Page not found");
            log.error("default case in rooter");
    }
}).listen(8080);