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
    var xhr = new XMLHttpRequest();

    xhr.open("POST", "chat/room" + room + "/publish", true);

    var message = document.getElementById("message").value;

    if (message != "")
        xhr.send(JSON.stringify({message: message}));

    document.getElementById("message").value = "";

    return false;
}

function subscribe() {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", "chat/room" + room + "/subscribe", true);

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

    xhr.open("GET", "chat/room" + room + "/msg", true);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {

                JSON.parse(this.responseText).forEach(function(obj) {
                    console.log(obj);
                    get_message(obj);
                });
            }
        }
    };
}

function exit() {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", "chat/room" + room + "/exit", true);

    xhr.send(); 

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 302) {
                window.location.replace(window.location.origin
                    + xhr.getResponseHeader('Location'));

            } else {
                console.log(xhr.status)
            }
        }
    }
}

function get_message(message){
    var text = message.message;

    if (text != ""){

        var divMessage = document.createElement('div');
        divMessage.className = 'messages';
        var divLogin = document.createElement('div');
        divLogin.className = 'login';
        var divDate = document.createElement('div');
        divDate.className = 'date_time';
        var divText = document.createElement('div');
        divText.className = 'text_of_message';

        divText.innerHTML = text.replace(/([^>])\n/g, '$1<br/>');

        divDate.appendChild(document.createTextNode(message.date));
        divLogin.appendChild(document.createTextNode(message.login));
        divMessage.appendChild(divLogin);
        divMessage.appendChild(divText);
        divMessage.appendChild(divDate);

        document.getElementById("dialog").appendChild(divMessage);
    }
}