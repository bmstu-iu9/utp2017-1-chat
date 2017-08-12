var log = require('tech').log;
var extra = require('./extra');
var db = require('db');

var rooms = [];

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

    if (rooms[room])
        rooms[room].push(res);
    else {
        rooms[room] = [];
        rooms[room].push(res);
    }

    res.on('close', function() {
        rooms[room].splice(rooms[room].indexOf(res), 1);
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
            if (data.attachment){
                data.id = name+Date.now();
                saveImage(data.attachment, data.id);
                delete data.attachment;
            }

            db.dialogs.addMessage(room, name, data.message, time, data.id)
                .then(function (data1) {
                    if (data.id) {
                        rooms[room].forEach(function (res) {
                            res.end(JSON.stringify({
                                login: name,
                                message: data.message,  attachment: data.id, date: time
                            }));
                        });
                    } else {
                        rooms[room].forEach(function (res) {
                            res.end(JSON.stringify({
                                login: name,
                                message: data.message, date: time
                            }));
                        });
                    }
                    rooms[room] = [];
                })
                .catch(function (err) {
                    log.error(err);
                });
        })
        .catch(function (err) {
            log.error("Error at chat.js/publish:", err);

        });
};

exports.getUsersInRoom = function (id) {
    return rooms[id];
};

var saveImage = function (image, id) {
    var fs = require('fs');
    fs.mkdir("./temp", function () {
        fs.writeFile('./temp/' + id + '.png', Buffer(image, 'Base64'),  function (err) {
            if(err) log.error("chat.js/saveImage: " + err);
        });
    });

};