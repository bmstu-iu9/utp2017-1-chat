var fs = require('fs');
var log = require('tech').log;

/**
 * Function send file for client
 * @param file - name of file to sent
 * @param res - destination for file
 */
module.exports = function(file, res) {
    var stream = fs.createReadStream(file);

    stream.pipe(res);

    stream.on('error', function() {
            res.statusCode = 500;
            res.end("Server error");
            log.error("Error while reading file in send.js");
    });

    res.on('close', function() {
        stream.destroy();
    });
};