window.onload = function() {
    loadRooms();

    document.getElementById("addRoom").addEventListener("click", addRoom, false);
};

function addRoom() {
    xhrAddRoom()
        .then(function (data) {
            showRoom(JSON.parse(data));
        })
        .catch(function (err) {
            window.location.replace(window.location.origin + '/error');
        });
}

function deleteRoom(id) {
    xhrDeleteRoom(id)
        .then(function (data) {
            unshowRoom(); //TODO
        })
        .catch(function (err) {
            window.location.replace(window.location.origin + '/error');
        });
}

function xhrDeleteRoom(id) {
    return new Promise(function(response, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("POST", '/chat/delete_room', true);

        xhr.send(id);

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    response(this.responseText);

                } else {
                    reject(xhr.status);

                }
            }
        };
    })
}

function loadRooms() {
    xhrLoadRoom()
        .then(function (data) {
            JSON.parse(data).forEach(function(obj) {
                showRoom(obj);
            });
        })
        .catch(function (err) {
            console.log(err);
            //window.location.replace(window.location.origin + '/error');
        });
}

function xhrAddRoom() {
    return new Promise(function(response, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("POST", '/chat/add_room', true);

        xhr.send();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    response(this.responseText);

                } else {
                    reject(xhr.status);

                }
            }
        };
    })
}

function xhrLoadRoom() {
    return new Promise(function(response, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("POST", '/chat/get_rooms', true);

        xhr.send();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    response(this.responseText);

                } else {
                    reject(xhr.status);

                }
            }
        };

        xhr.onabort = function() {
            reject(xhr.status);
        }
    })
}

function showRoom(data) {
    var divLine = document.createElement('div');
    divLine.className = 'line';
    var divRoom = document.createElement('div');
    divRoom.className = 'room';

    divRoom.addEventListener('click', function () {
        window.location.replace('/chat/room' + data.id);
    }, false);

    if (data.author == getCookieValue("login")) {
        var divDelete = document.createElement('div');
        divDelete.className = 'delete';
        //divDelete.addEventListener('click', deleteRoom, false);
    }

    divRoom.appendChild(document.createTextNode(data.id));
    divLine.appendChild(divRoom);

    if (data.author == getCookieValue("login")) {
        divDelete.appendChild(document.createTextNode("Delete room"));
        divLine.appendChild(divDelete);
    }

    document.getElementById("rooms").appendChild(divLine);
}

function unshowRoom() {

}

function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}