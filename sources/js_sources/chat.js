window.onload = function() {
    oldMessages();
    subscribe();

    document.getElementById("out").addEventListener("click", exit, false);
	document.getElementById("send").addEventListener("click", publish, false);
	document.getElementById("message").addEventListener("keypress", function(e) {
		if((event.ctrlKey) && ((event.keyCode == 0xA)||(event.keyCode == 0xD))){
			publish();
		}
	}, false);
};

var room = 0; //stub

function publish() {
    var message = document.getElementById("message").value.trim();

    var inputFileToLoad = document.getElementById("inputFileToLoad").files[0];

    if (inputFileToLoad) {
        if(inputFileToLoad.size > 2097152) {
            //TODO сообщать пользователю, что файл слишком большой
            alert("Your file is too large");
            return false;
        }

        var fileReader = new FileReader(); //эта штука может подгружать миниатюры! Для фронтенда это можнт быть полезно

        fileReader.addEventListener("load", function() {
            var attachment = fileReader.result.split("base64,")[1];

            var xhr = new XMLHttpRequest();

            xhr.open("POST", window.location.pathname + "/publish", true);

            xhr.send(JSON.stringify({message: message, attachment: attachment}));

            document.getElementById("message").value = "";

        });

        fileReader.readAsDataURL(inputFileToLoad);

        var oldInput = document.getElementById("inputFileToLoad")

        var newInput = document.createElement("input");

        newInput.type = oldInput.type;
        newInput.accept = oldInput.accept;
        newInput.id = oldInput.id;

        oldInput.parentNode.replaceChild(newInput, oldInput);

    } else {

        var xhr = new XMLHttpRequest();

        xhr.open("POST", window.location.pathname + "/publish", true);

        if (message != "")
            xhr.send(JSON.stringify({message: message}));

        document.getElementById("message").value = "";
    }

    return false;
}

function subscribe() {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", window.location.pathname + "/subscribe", true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 302) {
                window.location.replace(window.location.origin
                    + xhr.getResponseHeader('Location'));

            } else if (xhr.status == 200) {

            	var x = JSON.parse(this.responseText);
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
    var xhr = new XMLHttpRequest();

    xhr.open("GET", window.location.pathname + "/msg", true);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {

                JSON.parse(this.responseText).forEach(function(obj) {
                    get_message(obj);

                });
            } else if (xhr.status != 200){
                window.location.replace(window.location.origin + '/error'
                    + xhr.statusCode);
            }
        }
    };
}

function exit() {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", window.location.pathname + "/exit", true);

    xhr.send(); 

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 302) {
                window.location.replace(window.location.origin
                    + xhr.getResponseHeader('Location'));

            } else if (xhr.status != 200){
                window.location.replace(window.location.origin + '/error'
                    + xhr.statusCode);
            }
        }
    }
}

function get_message(message){
    var text = message.message;

    if (text != "" || message.attachment){

        var divMessage = document.createElement('div');
        divMessage.className = 'messages';
        var divLogin = document.createElement('div');
        divLogin.className = 'login';
        var divDate = document.createElement('div');
        divDate.className = 'date_time';
        var divText = document.createElement('div');
        divText.className = 'text_of_message';

        divText.innerHTML = text.replace(/([^>])\n/g, '$1<br/>');


        if(message.attachment){
            var oImg = document.createElement("img");                      //TODO FRONTEND
            oImg.setAttribute('src', window.location.pathname + "/image/" + message.attachment);
            divMessage.appendChild(oImg);
        }
        divDate.appendChild(document.createTextNode(message.date));
        divLogin.appendChild(document.createTextNode(message.login));
        divMessage.appendChild(divLogin);
        divMessage.appendChild(divText);
        divMessage.appendChild(divDate);

        document.getElementById("dialog").appendChild(divMessage);

    }
}