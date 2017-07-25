var log = require('tech').log;
var extra = require('./extra');

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

    clients.push(res);

    res.on('close', function() {
        clients.splice(clients.indexOf(res), 1);
    });

};

exports.publish = function(req, res) {

    extra.safeRequest(req, res)
        .then(function (data) {

            clients.forEach(function(res) {
                res.end(data.message);
            });

            clients = [];
        })
        .catch(function (err) {
            log.error("Error at chat.js/publish:", err);

        });
};