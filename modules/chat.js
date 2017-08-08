var log = require('tech').log;
var extra = require('./extra');
var db = require('db');

var clients = [];

/**
 * Long-polling mechanism.
 *
 * Server collects all active users by subscribing.
 *
 * Then, when some message gets to the server, all users
 * will catch it. (function "publish")
 */
/**
 * @param req Request
 * @param res Response
 * @param room param for multiple rooms, now is disabled
 */
exports.subscribe = function(req, res, room) {

    clients.push(res);

    res.on('close', function() {
        clients.splice(clients.indexOf(res), 1);
    });

};

/**
 * @param req Request
 * @param res Response
 * @param room param for multiple rooms, now is disabled
 */
exports.publish = function(req, res, room) {

    extra.safeRequest(req, res)
        .then(function (data) {

            var name = require('./extra').parseCookies(req).login;
            var time = (new Date(new Date().getTime()).toLocaleTimeString());

            db.dialogs.addMessage('0', name, data.message, time)
                .then(function (data1) {
                    clients.forEach(function(res) {
                        res.end(JSON.stringify({login: name,
                            message: data.message, date: time}));
                    });

                    clients = [];
                })
                .catch(function (err) {
                    log.error(err);
                });
        })
        .catch(function (err) {
            log.error("Error at chat.js/publish:", err);

        });
};