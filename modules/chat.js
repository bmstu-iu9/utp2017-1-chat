var log = require('tech').log;
var extra = require('./extra');
var msg = require('./message');

var clients = [];

/**
 * Long-polling mechanism.
 *
 * Server collects all active users by subscribing.
 *
 * Then, when some message gets to the server, all users
 * will catch it. (function "publish")
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

            var x = extra.parseCookies(req).login;
            var date = new Date().toDateString();
            msg.addMessage(x, data.message, date)
            clients.forEach(function(res) {
                res.end(date + " : " + x + " : " + data.message);
            });

            clients = [];
        })
        .catch(function (err) {
            log.error("Error at chat.js/publish:", err);
        });
};