"use strict";

window.onload = function() {
    oldMessages();
    getOnlineUsers();
    subscribe();
    document.getElementById("message").focus();
    setTimeout(function() {
        document.getElementById("dialog").scrollTop = 1000000;
    }, 150);
    document.getElementById("out").addEventListener("click", exit, false);
    document.getElementById("send").addEventListener("click", publish, false);
    document.getElementById("message").addEventListener("keypress", function(event) {
        if((event.ctrlKey) && ((event.keyCode == 0xA)||(event.keyCode == 0xD))){
            publish();
            setTimeout(function() {
                document.getElementById("message").value = "";
            }, 1);
        }
    }, false);
    document.getElementById("back").addEventListener("click", function() {
        document.getElementById("back").style.display="none";
        document.getElementById("popup_image").style.display="none";
        document.getElementById("popup_image").setAttribute("width", "");
        document.getElementById("popup_image").setAttribute("height", "");
    }, false);
};

function publish() {
    let message = document.getElementById("message").value.trim();

    let inputFileToLoad = document.getElementById("inputFileToLoad").files[0];

    if (inputFileToLoad) {
        let fileReader = new FileReader();

        fileReader.addEventListener("load", function() {
            let attachment = fileReader.result.split("base64,")[1];

            let xhr = new XMLHttpRequest();

            xhr.open("POST", window.location.pathname + "/publish", true);

            xhr.send(JSON.stringify({message: message, attachment: attachment}));

            document.getElementById("message").value = "";

        });

        fileReader.readAsDataURL(inputFileToLoad);

        let oldInput = document.getElementById("inputFileToLoad");

        let newInput = document.createElement("input");

        newInput.type = oldInput.type;
        newInput.accept = oldInput.accept;
        newInput.id = oldInput.id;

        oldInput.parentNode.replaceChild(newInput, oldInput);
    } else {

        let xhr = new XMLHttpRequest();

        xhr.open("POST", window.location.pathname + "/publish", true);

        if (message != "")
            xhr.send(JSON.stringify({message: message}));

        document.getElementById("message").value = "";
    }
    document.getElementById("message").focus();
    return false;
}

function subscribe() {
    let xhr = new XMLHttpRequest();

    xhr.open("POST", window.location.pathname + "/subscribe", true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 302) {
                window.location.replace(window.location.origin
                    + xhr.getResponseHeader('Location'));

            } else if (xhr.status == 200) {

                let x = JSON.parse(this.responseText);
                get_message(x);

                subscribe();

            } else {
                setTimeout(subscribe, 100);
            }
        }
    };

    xhr.onabort = function() { //this function let page not to fall after error
        setTimeout(subscribe, 100);
    };

    xhr.send('');
}

function oldMessages() {
    let xhr = new XMLHttpRequest();

    xhr.open("GET", window.location.pathname + "/msg", true);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {

                JSON.parse(this.responseText).forEach(function(obj) {
                    get_message(obj);

                });
            } else {
                window.location.replace(window.location.origin + '/error'
                    + xhr.statusCode);
            }
        }
    };
}

function exit() {
    let xhr = new XMLHttpRequest();

    xhr.open("POST", window.location.pathname + "/exit", true);

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

function get_message(message){
    let text = message.message;

    if (text != "" || message.attachment){

        let divMessage = document.createElement('div');
        divMessage.className = 'messages';
        let divLogin = document.createElement('div');
        divLogin.className = 'login';
        let divDate = document.createElement('div');
        divDate.className = 'date_time';
        let divText = document.createElement('div');
        divText.className = 'text_of_message';

        if(text == "")
            text = "&nbsp";
        divText.innerHTML = text.replace(/([^>])\n/g, '$1<br/>');

        divDate.appendChild(document.createTextNode(message.date));
        divLogin.appendChild(document.createTextNode(message.login));

        divMessage.appendChild(divLogin);
        divMessage.appendChild(divText);
        divMessage.appendChild(divDate);

        if(message.attachment){

            let oImg = document.createElement("img");
            oImg.setAttribute('src', window.location.pathname +
                "/image/" + message.attachment);
            oImg.setAttribute("class", "image_in_message");
            divMessage.appendChild(oImg);

            oImg.onload = function (event) {
                event = event || window.event;

                let el = event.target || event.srcElement;
                let tmp = get_dimensions(el);
                let width = 0;
                let height = 0;

                if(tmp.real_width > 890 || tmp.real_height > 480){
                    let kof1 = tmp.real_width / 690;
                    let kof2 = tmp.real_height / 400;
                    width = tmp.real_width / Math.max(kof1, kof2);
                    height = tmp.real_height / Math.max(kof1, kof2);
                    oImg.setAttribute("width", width + "px");
                    oImg.setAttribute("height", height + "px");
                }

                oImg.addEventListener("click", function(){
                    document.getElementById("back").style.display = "block";
                    let fullImg = document.getElementById("popup_image");
                    fullImg.setAttribute('src', window.location.pathname
                        + "/image/" + message.attachment);
                    fullImg.style.display = "block";

                    if(tmp.real_width+150 > screen.width
                        || tmp.real_height+150 > screen.height){
                        let kof1 = tmp.real_width / (screen.width-150);
                        let kof2 = tmp.real_height / (screen.height-150);

                        width = tmp.real_width / Math.max(kof1, kof2);
                        height = tmp.real_height / Math.max(kof1, kof2);

                        fullImg.setAttribute("width", width + "px");
                        fullImg.setAttribute("height", height + "px");
                    }
                }, false);
                document.getElementById("dialog").scrollTop = 1000000;
            }
        }
        document.getElementById("dialog").appendChild(divMessage);
    }
    document.getElementById("dialog").scrollTop = 1000000;
}
function get_dimensions(el) {
    //noinspection JSValidateTypes
    if (el.naturalWidth != undefined) {
        return { 'real_width':el.naturalWidth,
            'real_height':el.naturalHeight,
            'client_width':el.width,
            'client_height':el.height };

    } else if (el.tagName.toLowerCase()=='img') {
        let img = new Image();
        img.src = el.src;
        let real_w=img.width;
        let real_h=img.height;

        return { 'real_width':real_w,
            'real_height':real_h,
            'client_width':el.width,
            'client_height':el.height };
    } else {
        return false;
    }
}

function getOnlineUsers() {
    const xhr = new XMLHttpRequest();

    xhr.open("GET", window.location.pathname + "/get_users", true);

    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {

                const x = JSON.parse(this.responseText);
                document.getElementById('online_list_users').innerHTML = '';

                x.forEach(function (user) {
                    let userID = 'user_' + user;
                    let divUsers = document.createElement('div');
                    divUsers.className = 'user';
                    divUsers.id = userID;
                    divUsers.appendChild(document.createTextNode(user));
                    document.getElementById('online_list_users')
                        .appendChild(divUsers);
                });
            }

            setTimeout(getOnlineUsers, 5 * 1000);

        }
    }

}