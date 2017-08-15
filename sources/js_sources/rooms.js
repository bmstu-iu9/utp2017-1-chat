window.onload = function() {
    loadRooms();
    getNews();

    document.getElementById("user").textContent = "Логин: " + getCookieValue("login");
    document.getElementById("exit").addEventListener("click", exit, false);
    document.getElementById("addRoom").addEventListener("click", addRoom, false);
};

function getNews() {
    xhrGetNews()
        .then(function (data) {
            data = JSON.parse(data);

            if (data.length != 0) {
                var divNews = document.createElement('div');
                divNews.className = 'news';

                divNews.appendChild(document.createTextNode(data.text));

                document.getElementById("nList").appendChild(divNews);
            }
        })
        .catch(function (err) {
            window.location.replace(window.location.origin + '/error' + err);
        });
}

function addRoom() {
    xhrAddRoom()
        .then(function (data) {
            reshowRooms();
        })
        .catch(function (err) {
            window.location.replace(window.location.origin + '/error' + err);
        });
}

function deleteRoom(id) {
    xhrDeleteRoom(id)
        .then(function (data) {
            reshowRooms();
        })
        .catch(function (err) {
            window.location.replace(window.location.origin + '/error' + err);
        });
}

function loadRooms() {
    xhrLoadRoom()
        .then(function (data) {
            JSON.parse(data).forEach(function(obj) {
                showRoom(obj);
            });
        })
        .catch(function (err) {
            window.location.replace(window.location.origin + '/error' + err);
        });
}

function showRoom(data) {
    var divLine = document.createElement('div');
    divLine.className = 'line';
    var divRoom = document.createElement('div');
    divRoom.className = 'room';

    divRoom.addEventListener('click', function () {
        goToRoom(data.id);
    }, false);

    if (data.author == getCookieValue("login")) {
        var divDelete = document.createElement('div');
        divDelete.className = 'delete';
        divDelete.addEventListener('click', function() {
            deleteRoom(data.id);
        }, false);
    }

    divRoom.appendChild(document.createTextNode(data.title));
    divLine.appendChild(divRoom);

    if (data.author == getCookieValue("login")) {
        divDelete.appendChild(document.createTextNode("Удалить комнату"));
        divLine.appendChild(divDelete);
    }

    document.getElementById("rooms").appendChild(divLine);
}

function reshowRooms() {
    var rooms = document.getElementById("rooms");
    while (rooms.firstChild) {
        rooms.removeChild(rooms.firstChild);
    }

    loadRooms();
}

function goToRoom(id) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/chat/redirect', true);

    xhr.send(id);

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                if (this.responseText == '')
                    window.location.replace('/chat/room' + id);
                else
                    reshowRooms();
            } else {
                window.location.replace(window.location.origin + '/error'
                    + xhr.statusCode);

            }
        }
    };
}

function exit() {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", '/chat/exit', true);

    xhr.send();

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 302) {
                window.location.replace(window.location.origin
                    + xhr.getResponseHeader('Location'));

            } else if (xhr.status != 200){
                window.location.replace(window.location.origin + '/error'
                    + xhr.statusCode);
            }
        }
    };
}



function xhrGetNews() {
    return new Promise(function(response, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("POST", '/chat/news', true);

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

function xhrAddRoom() {

    var title = prompt("Введите название комнаты ", ""); //TODO: Frontend
    if (!title) return;

    return new Promise(function(response, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("POST", '/chat/add_room', true);

        xhr.send(JSON.stringify({title: title}));

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

function xhrDeleteRoom(id) {
    return new Promise(function(response, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("POST", '/chat/delete_room', true);

        xhr.send(JSON.stringify({ id: id }));

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

function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}