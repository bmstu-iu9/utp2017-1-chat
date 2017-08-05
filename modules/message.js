var messages = [];

var count = require('../node_modules/config').COUNT_OF_MESSAGES;

exports.addMessage = function(user, data, time){
    if (messages.length == count) {
        messages.shift();
    }
    messages.push({ time: time, data: data, login: user});
}

exports.getMessages = function getMessages(res) {
    try {
        var text = [];
        messages.forEach(function (obj) {
            text.push(obj.time + " : " + obj.login + " : " + obj.data)
        });
        res.end(JSON.stringify(text));
    } catch (err) {
        log.error("Error at server.js/chat/message.js", err);
    };
}

