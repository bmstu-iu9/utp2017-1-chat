var log = require('tech').log;
var extra = require('./extra');
var db = require('db');

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

            var name = require('./extra').parseCookies(req).login;
            var time = (new Date(new Date().getTime()).toLocaleTimeString());

            db.dialogs.addMessage('0', name, data.message, time)
                .then(function (data1) {
                    clients.forEach(function(res) {
                        res.end(name + ': ' + data.message + '\t' + time);
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