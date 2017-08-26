const log = require('tech').log;

exports.parseCookies = function(req) {
    let cookBook = {};
    let rc = req.headers.cookie;

    rc && rc.split(';').forEach( function(cookies) {
        let parts = cookies.split('=');
        cookBook[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return cookBook;
};

exports.safeRequest = function(req, res) {
    return new Promise(function(response, reject) {
        let body = '';

        req
            .on('readable', function () { //long-read message
                let r = req.read();
                if (r != null)
                    body += r;

                /* if (body.length > 1e4) {
                      res.statusCode = 413;
                      res.end("Message is too long");
                      log.error("413 in reading message");
                      reject('413: Message is too long');
                  }
                */
                //Это ограничение пришлось убрать,
                // т.к. файлы приходят вместе с сообщениями.
            })
            .on('end', function () { //JSON-safe function
                try {
                    if (body)
                        body = JSON.parse(body);
                    response(body);

                } catch (err) {
                    res.statusCode = 400;
                    res.end("Bad Request");
                    log.error('extra.js/safeRequest: ' + err + '; body: ' + body);
                    reject('400: Bad Request');
                }
            });
    });
};
