window.onload = function() {
    oldMessages();
    subscribe();
    document.getElementById("message").focus();
    setTimeout(function() {
        var ch = document.getElementById("dialog");
        ch.scrollTop = 1000000;
    }, 150);
    document.getElementById("out").addEventListener("click", exit, false);
	document.getElementById("send").addEventListener("click", publish, false);
	document.getElementById("message").addEventListener("keypress", function(e) {
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
    document.getElementById("online").addEventListener("click", function(e) {
        var element = document.getElementById("online_list_users");
        if(element.style.display == "none" || element.style.display == ""){
            element.style.display = "block";
            element.getElementsByClassName("user")[element.getElementsByClassName("user").length-1].scrollIntoView(false);
        }else{
            element.style.display = "none";
        }
    }, false);
    document.getElementById("offline").addEventListener("click", function(e) {
        var element = document.getElementById("offline_list_users");
        if(element.style.display == "none" || element.style.display == ""){
            element.style.display = "block";
            element.getElementsByClassName("user")[element.getElementsByClassName("user").length-1].scrollIntoView(false);
        }else{
            element.style.display = "none";
        }
    }, false);
};
var room = 0; //stub
function publish() {
    var message = document.getElementById("message").value.trim();

    var inputFileToLoad = document.getElementById("inputFileToLoad").files[0];

    if (inputFileToLoad) {
        var fileReader = new FileReader();

        fileReader.addEventListener("load", function() {
            var attachment = fileReader.result.split("base64,")[1];

            var xhr = new XMLHttpRequest();

            xhr.open("POST", window.location.pathname + "/publish", true);

            xhr.send(JSON.stringify({message: message, attachment: attachment}));

            document.getElementById("message").value = "";

        });

        fileReader.readAsDataURL(inputFileToLoad);

        var oldInput = document.getElementById("inputFileToLoad");

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
    document.getElementById("message").focus();
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
            } else {
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

    /*
    ВНИМАНИЕ!! Тут костыль, который является на данный момент единственным
    вариантом исправления бага #45 с кнопкой выхода в FireFox.
     */

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            ///if (xhr.status == 302) {
            if (xhr.status == 200) {
                //window.location.replace(window.location.origin + xhr.getResponseHeader('Location'));
                window.location.replace(window.location.origin + '');
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
        if(text == "")
            text = "&nbsp";
        divText.innerHTML = text.replace(/([^>])\n/g, '$1<br/>');

        divDate.appendChild(document.createTextNode(message.date));
        divLogin.appendChild(document.createTextNode(message.login));
        divMessage.appendChild(divLogin);
        divMessage.appendChild(divText);
        divMessage.appendChild(divDate);
        if(message.attachment){
            var oImg = document.createElement("img");                      //TODO FRONTEND
            oImg.setAttribute('src', window.location.pathname + "/image/" + message.attachment);
            oImg.setAttribute("class", "image_in_message");
            divMessage.appendChild(oImg);
            oImg.onload = function (event) {
                event=event || window.event;
                var el=event.target || event.srcElement;
                var tmp=get_dimensions(el);
                var width = 0;
                var height = 0;
                if(tmp.real_width > 890 || tmp.real_height > 480){
                    var kof1 = tmp.real_width / 690;
                    var kof2 = tmp.real_height / 400;
                    width = tmp.real_width / max(kof1, kof2);
                    height = tmp.real_height / max(kof1, kof2);
                    oImg.setAttribute("width", width+"px");
                    oImg.setAttribute("height", height+"px");
                }
                oImg.addEventListener("click", function(){
                    document.getElementById("back").style.display = "block";
                    var fullImg = document.getElementById("popup_image");
                    fullImg.setAttribute('src', window.location.pathname + "/image/" + message.attachment);
                    fullImg.style.display = "block";
                    if(tmp.real_width+150 > screen.width || tmp.real_height+150 > screen.height){
                        var kof1 = tmp.real_width / (screen.width-150);
                        var kof2 = tmp.real_height / (screen.height-150);
                        width = tmp.real_width / max(kof1, kof2);
                        height = tmp.real_height / max(kof1, kof2);
                        fullImg.setAttribute("width", width+"px");
                        fullImg.setAttribute("height", height+"px");
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
    if (el.naturalWidth!=undefined) {
        return { 'real_width':el.naturalWidth,
            'real_height':el.naturalHeight,
            'client_width':el.width,
            'client_height':el.height };
    }
    else if (el.tagName.toLowerCase()=='img') {
        var img=new Image();
        img.src=el.src;
        var real_w=img.width;
        var real_h=img.height;
        return { 'real_width':real_w,
            'real_height':real_h,
            'client_width':el.width,
            'client_height':el.height };
    }
    else {
        return false;
    }
}
function max(a, b) {
    if(a > b)
        return a;
    return b;
}