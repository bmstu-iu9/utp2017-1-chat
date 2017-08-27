const fs = require('fs');

const log = require('tech').log;
const extra = require('./extra');
const db = require('db');

const rooms = [];
const OnlineLogins = [];


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
 * @param room param
 */
exports.subscribe = function(req, res, room) {

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(res);

    res.on('close', function() {
        rooms[room].splice(rooms[room].indexOf(res), 1);
    });

};

/**
 * @param req Request
 * @param res Response
 * @param room param
 */
exports.publish = function(req, res, room) {

    extra.safeRequest(req, res)
        .then(function (data) {

            let name = extra.parseCookies(req).login;
            let time = (new Date(new Date().getTime()).toLocaleTimeString());
            if (data.attachment){
                data.id = name + Date.now();
                saveImage(data.attachment, data.id);
                delete data.attachment;
            }

            db.dialogs.addMessage(room, name, data.message, time, data.id)
                .then(function () {
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

function saveImage(image, id) {
    fs.mkdir("./temp", function () {
        fs.writeFile('./temp/' + id + '.png', Buffer(image, 'Base64'),  function (err) {
            if (err) log.error("chat.js/saveImage: " + err);
        });
    });
}

/*
    Добавляет информацию на сервер о том, что юзер онлайн. Юзер оффлайн, если от него в течение последних
     10 секунд не приходил запрос /get_users.
*/
function addOnlineLogin(login, room) {
    const obj = containInOnlineLogins(login, room);

    if (~obj) {
        obj.time = new Date().getTime();
    } else {
        OnlineLogins[room].push({ login: login, time: new Date().getTime() });
    }

    setTimeout(function(room) {
        if (containInOnlineLogins(login, room).time + 9 * 1000 < new Date().getTime()) {
            OnlineLogins[room].splice(obj, 1);

        }
    }, 10 * 1000, room);
}

function containInOnlineLogins(login, room) {
    let obj = -1;
    OnlineLogins[room].forEach(function(item) {
        if (item.login == login) return obj = item;
    });
    return obj;
}

/*
    Отправляет в response список онлайн-пользователей.
*/
exports.getUsers = function(req, res, room){

    if (!OnlineLogins[room]) OnlineLogins[room] = [];

    const login = extra.parseCookies(req).login;

    addOnlineLogin(login, room);

    result = [];

    OnlineLogins[room].forEach(function(item) {
        result.push(item.login);
    });

    res.end(JSON.stringify(result));
}