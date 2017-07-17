var log = require('tech').log;

var clients = [];

/**
 * Long-polling mechanism
 *
 * In subscribing server collects all active users
 *
 * Then, when some message gets to the server, all users
 * catch it by function publish
 */
exports.subscribe = function(req, res) {
    log.debug('subscribe');

    clients.push(res);

    res.on('close', function() {
        clients.splice(clients.indexOf(res), 1);
    });

    log.debug(clients.length);
};

exports.publish = function(message) {
    log.debug('publish: ' + message);

    clients.forEach(function(res) {
        res.end(message);
    });
    
    clients = [];
};