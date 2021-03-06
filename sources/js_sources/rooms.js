"use strict";

window.onload = function() {

    loadRooms();
    getGeolocation();

    document.getElementById("user").textContent = "Логин: " + getCookieValue("login");
    document.getElementById("exit").addEventListener("click", exit, false);
    document.getElementById("addRoom").addEventListener("click", addRoom, false);
};

function getWeather(crd) {
    return new Promise(function(response, reject) {
        let request = new XMLHttpRequest();
        let url = "https://api.openweathermap.org/data/2.5/weather?lat=" +
            crd.latitude + "&lon=" + crd.longitude +
            "&APPID=5356a6c0c9e4b5246d1aad91aa51fcbd";

        request.open('GET', url);

        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    response(JSON.parse(this.responseText));
                }
                else {
                    reject(this.status);
                }
            }
        };

        request.send();
    });
}

function loadNews(data) {
    data.news.forEach(function(msg) {
        let divNewsMsg = document.createElement('div');
        divNewsMsg.className = 'news';

        divNewsMsg.appendChild(document.createTextNode(msg.text));

        document.getElementById("nList").appendChild(divNewsMsg);
    })
}



function getNews(crd) {
    xhrGetNews(crd)
        .then(function (data) {
            data = JSON.parse(data);

            if (!navigator.geolocation) {
                document.getElementById("nList").innerHTML =
                    "<p>Geolocation is not supported " +
                    "by your browser, weather and map is not supported too</p>";
                loadNews(data);
            }

            else if (!crd.latitude) {
              document.getElementById("nList").innerHTML =
                    "<p align=\"center\">Произошла ошибка при определении вашего " +
                    "местонахождения, поэтому погода и карта не будут прогружены!</p>";
                loadNews(data);

            } else {
                document.getElementById("nList").innerHTML = "";
                let weather = {};

              
                let img = document.createElement('img');
                let width = 300;
                let height = 300;

                img.setAttribute("width", width);
                img.setAttribute("height", height);
                img.setAttribute("vspace", 10);
                img.setAttribute("hspace", 50);


                img.src = "https://maps.googleapis.com/maps/api/staticmap?center="
                    + crd.latitude + "," + crd.longitude + "&zoom=11&size="
                    + width + "x" + height +
                    "&path=weight:3%7Ccolor:blue%7Cenc:{coaHnetiVjM??_SkM??~R&" +
                    "key=AIzaSyDbksHMbdwjiNJj-JKp8O7vJd-Hfa4Ez94";

                document.getElementById("nList").appendChild(img);

                getWeather(crd).then(function(data) {
                    weather.city = data.name;
                    weather.country = data.sys.country;
                    weather.temperature = Math.round(data.main.temp - 273.15);
                    weather.descr = data.weather[0].description;
                })
                    .then(function() {

                        let img = document.createElement('img');

                        img.setAttribute("width", 64);
                        img.setAttribute("height", 64);
                        img.setAttribute("hspace", 180);
                        img.src = "../image_sources/flags/" + weather.country + ".png";
                        document.getElementById("nList").appendChild(img);
                    })
                    .then(function()  {

                        let msg = document.createElement('div');

                        msg.setAttribute("align", "center");
                        msg.className = 'news';
                        msg.innerHTML = "Ваша страна: " + weather.country + "<br>"
                            + "Ваш город/район: " + weather.city +
                            "<br>" + "Температура: " + weather.temperature + "<br>"
                            + "Погода: " + weather.descr;
                        document.getElementById("nList").appendChild(msg);
                    })
                    .then(function() {
                        loadNews(data);
                    })


            }

        })
        .catch(function (err) {
            window.location.replace(window.location.origin + '/error' + err);
        });
}


function getGeolocation() {

    document.getElementById("nList").innerHTML = "<p> <h1> Locating… </h1> </p>";
    if (!navigator.geolocation) return getNews({});

    let options = {
        timeout: 5 * 1000,
        maximumAge: 10 * 60 * 1000,
        enableHighAccuracy: false
    };

    function success(pos) {
        getNews(pos.coords);
    }

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        getNews({});
    }

    navigator.geolocation.getCurrentPosition(success, error, options);
}


function infoAboutTooManyRooms() {
    alert("Вы собираетесь добавить еще одну комнату, но сначала разберитесь со старой!");
}

function addRoom() {
    document.getElementById("addRoom").removeEventListener("click", addRoom, false);
    document.getElementById("addRoom").addEventListener("click", infoAboutTooManyRooms, false);

    let title;

    let x = document.getElementById("rooms");
    x.scrollTop = 1000000;

    let div = document.createElement('div');
    div.className = 'div';

    let input = document.createElement('input');
    input.className = 'input';
    input.type = 'text';

    div.appendChild(input);
    x.appendChild(div);

    input.addEventListener("keypress", function(event) {
        if (event.keyCode == 0x0D) {
            title = input.value;
            x.removeChild(div);
            document.getElementById("addRoom").removeEventListener("click", infoAboutTooManyRooms, false)
            document.getElementById("addRoom").addEventListener("click", addRoom, false);

            xhrAddRoom(title)
                .then(function (data) {
                    reshowRooms();
                })
                .catch(function (err) {
                    window.location.replace(window.location.origin + '/error' + err);
                });
        }
    }, false);
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
    let divLine = document.createElement('div');
    divLine.className = 'line';
    let divRoom = document.createElement('div');
    divRoom.className = 'room';
    let divDelete;

    divRoom.addEventListener('click', function () {
        goToRoom(data.id);
    }, false);

    if (data.author == getCookieValue("login")) {
        divDelete = document.createElement('div');
        divDelete.className = 'delete';
        divDelete.addEventListener('click', function() {
            deleteRoom(data.id);
        }, false);
    }

    if (data.title)
        divRoom.appendChild(document.createTextNode(data.title));
    else
        divRoom.appendChild(document.createTextNode(data.id));
    divLine.appendChild(divRoom);

    if (data.author == getCookieValue("login")) {
        divDelete.appendChild(document.createTextNode("Удалить комнату"));
        divLine.appendChild(divDelete);
    }

    document.getElementById("rooms").appendChild(divLine);
}

function reshowRooms() {
    let rooms = document.getElementById("rooms");
    while (rooms.firstChild) {
        rooms.removeChild(rooms.firstChild);
    }

    loadRooms();
}

function goToRoom(id) {
    let xhr = new XMLHttpRequest();

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
    let xhr = new XMLHttpRequest();

    xhr.open("POST", '/chat/exit', true);

    xhr.send();

    /*
     ВНИМАНИЕ!! Тут костыль, который является на данный момент единственным
     вариантом исправления бага #45 с кнопкой выхода в FireFox.
     */

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            ///if (xhr.status == 302) {
            if (xhr.status == 200) {
                //window.location.replace(window.location.origin
                // + xhr.getResponseHeader('Location'));
                window.location.replace(window.location.origin + '');
            } else if (xhr.status != 200){
                window.location.replace(window.location.origin + '/error'
                    + xhr.statusCode);
            }
        }
    }
}



function xhrGetNews(crd) {
    return new Promise(function(response, reject) {
        let xhr = new XMLHttpRequest();

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

function xhrAddRoom(title) {

    return new Promise(function(response, reject) {
        let xhr = new XMLHttpRequest();

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
        let xhr = new XMLHttpRequest();

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
        let xhr = new XMLHttpRequest();

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
    let b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}
