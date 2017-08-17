window.onload = function() {

    loadRooms();
    getGeolocation();

    document.getElementById("user").textContent = "Логин: " + getCookieValue("login");
    document.getElementById("exit").addEventListener("click", exit, false);
    document.getElementById("addRoom").addEventListener("click", addRoom, false);
};

function getWeather() {
    return new Promise(function(response, reject) {
        var request = new XMLHttpRequest();
        var url = "https://api.openweathermap.org/data/2.5/weather?lat=" + crd.latitude +
            "&lon=" + crd.longitude + "&APPID=5356a6c0c9e4b5246d1aad91aa51fcbd";

        request.open('GET', url);

        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    alert(this.responseText);
                    response(JSON.parse(this.responseText));
                }
                else {
                    reject(this.status);
                }
            }
        }

        request.send();
    });
}


function getNews() {
    xhrGetNews(crd)
        .then(function (data) {
            data = JSON.parse(data);

            if (data.length != 0) {
            //    document.getElementById("nList").innerHTML = "";

                getWeather().then(function(data) {
                    crd.city = data.name;
                    crd.country = data.sys.country;
                    crd.temperature = data.main.temp - 273.15;
                    crd.weather = data.weather[0].description;
                     })
                    .then(function()  {
                        var divNewsMsg = document.createElement('div');
                        divNewsMsg.className = 'news';

                        divNewsMsg.appendChild(document.createTextNode("Ваша страна: " + crd.country + " | Ваш город " + crd.city +
                            " | Температура " + crd.temperature + " | Погода " + crd.weather));

                        document.getElementById("nList").appendChild(divNewsMsg);
                    })


                var img = new Image(413, 300);
                img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + crd.latitude + "," + crd.longitude +
                    "&zoom=16&size=500x500&path=weight:3%7Ccolor:blue%7Cenc:{coaHnetiVjM??_SkM??~R&key= AIzaSyDbksHMbdwjiNJj-JKp8O7vJd-Hfa4Ez94";
                document.getElementById("nList").appendChild(img);


                data.forEach(function(msg) {
                    var divNewsMsg = document.createElement('div');
                    divNewsMsg.className = 'news';

                    divNewsMsg.appendChild(document.createTextNode(msg.text));

                    document.getElementById("nList").appendChild(divNewsMsg);
                })
            }
        })
        .catch(function (err) {
            window.location.replace(window.location.origin + '/error' + err);
        });
}

var crd = {
    latitude: 10,//55.7485,
    longitude: 10,//37.6184,
};

function getGeolocation() {

  //  document.getElementById("nList").innerHTML = "<p>Locating…</p>";
    if (!navigator.geolocation){
        document.getElementById("nList").innerHTML = "<p>Geolocation is not supported by your browser</p>";
        return;
    }

    var options = {
        timeout: 5 * 1000,
        maximumAge: 10 * 60 * 1000,
        enableHighAccuracy: false,
    };

    function success(pos) {
        crd.latitude = pos.coords.latitude;
        crd.longitude = pos.coords.longitude;
        getNews();
    };

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        // error.code can be:
        //   0: unknown error
        //   1: permission denied
        //   2: position unavailable (error response from location provider)
        //   3: timed out

        getNews();
    };

     navigator.geolocation.getCurrentPosition(success, error, options);
};


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



function xhrGetNews(crd) {
    return new Promise(function(response, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("POST", '/chat/news', true);

        xhr.send(JSON.stringify(crd));

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