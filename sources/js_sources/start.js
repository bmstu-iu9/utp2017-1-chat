"use strict";

window.onload = function() {
	document.getElementById("Reg").addEventListener("click", function() {
		document.getElementById("back").style.display="block";
		document.getElementById("registration_form").style.display="block";
	}, false);

	document.getElementById("Enter").addEventListener("click", function() {
		document.getElementById("back").style.display="block";
		document.getElementById("enter_form").style.display="block";
	}, false);

	document.getElementById("back").addEventListener("click", function() {
		document.getElementById("back").style.display="none";
		document.getElementById("registration_form").style.display="none";
		document.getElementById("enter_form").style.display="none";
	}, false);
	document.getElementsByClassName("close")[0].addEventListener("click", function() {
		document.getElementById("back").style.display="none";
		document.getElementById("enter_form").style.display="none";
		document.getElementById("registration_form").style.display="none";
	}, false);
	document.getElementsByClassName("close")[1].addEventListener("click", function() {
		document.getElementById("back").style.display="none";
		document.getElementById("enter_form").style.display="none";
		document.getElementById("registration_form").style.display="none";
	}, false);

    document.getElementsByClassName("submit")[0].addEventListener("click", registration, false);
    document.getElementsByClassName("submit")[1].addEventListener("click", authentication, false);

    //Удаление красной рамки и сообщения при нажатии на поле.

    document.getElementById("login").onclick = function() {
        this.removeAttribute("style", "border:1px solid red;");
        var del = document.getElementById('alert_text_reg_login');
        del.parentNode.removeChild(del);
    };

    document.getElementById("password").onclick = function() {
        this.removeAttribute("style", "border:1px solid red;");
        let del = document.getElementById('alert_text_reg');
        del.parentNode.removeChild(del);
    };

    document.getElementById("repeat_password").onclick = function() {
        this.removeAttribute("style", "border:1px solid red;");
        let del = document.getElementById('alert_text_reg');
        del.parentNode.removeChild(del);
    };

    document.getElementById("login1").onclick = function() {
        this.removeAttribute("style", "border:1px solid red;");
        let del = document.getElementById('alert_text_auth');
        del.parentNode.removeChild(del);
    };

    document.getElementById("password1").onclick = function() {
        this.removeAttribute("style", "border:1px solid red;");
        let del = document.getElementById('alert_text_auth');
        del.parentNode.removeChild(del);
    }
};

const origin = window.location.origin;
/**
 * Registration functions
 */
function registration() {
    if (document.getElementById('alert_text_reg_login')) {
        let del = document.getElementById('alert_text_reg_login');
        del.parentNode.removeChild(del);
    }
    if (document.getElementById('alert_text_reg')) {
        let del = document.getElementById('alert_text_reg');
        del.parentNode.removeChild(del);
    }

    let login = document.getElementById("login").value;
    let password = document.getElementById("password").value;
    let passwordRepeat = document.getElementById("repeat_password").value;

    if (password === passwordRepeat && password.length > 5 && login.length != 0 ) {
        getSalt()
            .then(function (data) {
                reg(login, password, data)
                    .then(function(data1) {
                        window.location.replace(origin + data1);
                    })
                    .catch(function (err1) {
                        if (err1 == 401) {
                            //Добавление красной рамки и сообщения
                            document.getElementById("login").value = "";
                            document.getElementById("login")
                                .setAttribute("style", "border:1px solid red;");

                            let divAlert = document.createElement('div');
                            divAlert.setAttribute("style", "color:red");
                            divAlert.id = 'alert_text_reg_login';

                            divAlert.appendChild(document
                                .createTextNode("Логин уже используется"));
                            document.getElementById("registration_form")
                                .appendChild(divAlert);

                        } else {
                            window.location.replace(origin + '/error' + err1);
                        }
                    });
            })
            .catch(function(err) {
                window.location.replace(origin + '/error' + err);
            });
    } else {
        let divAlert = document.createElement('div');
        divAlert.setAttribute("style", "color:red");
        divAlert.id = 'alert_text_reg';
        if (login.length == 0) {
            //Добавление красной рамки и сообщения
            document.getElementById("login")
                .setAttribute("style", "border:1px solid red;");
            divAlert.appendChild(document.createTextNode("Заполните поле"));
        } else {
            //Добавление красной рамки и сообщения
            document.getElementById("password")
                .setAttribute("style", "border:1px solid red;");
            document.getElementById("repeat_password")
                .setAttribute("style", "border:1px solid red;");

            if (password !== passwordRepeat) {
                divAlert.appendChild(document.createTextNode("Пароли не совпадают"));
            }
            else if (password.length < 6 && password.length > 0) {
                divAlert.appendChild(document.createTextNode("Пароль слишком короткий"));
            } else if (password.length == 0) {
                    divAlert.appendChild(document.createTextNode("Заполните поля"));
            }
            document.getElementById("password").value = "";
            document.getElementById("repeat_password").value = "";
        }
        document.getElementById("registration_form").appendChild(divAlert);
    }
}

function getSalt() {
    return new Promise(function(response, reject) {
        let xhr = new XMLHttpRequest();

        xhr.open("POST", '/start/r_connect', true);

        xhr.send(null);

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

function reg(login, password, salt) {
    return new Promise(function(response, reject) {
        let xhr = new XMLHttpRequest();

        xhr.open("POST", '/start/r_enter', true);

        xhr.send(JSON.stringify({ "login": login,
            "password": sha(password, salt),
            "salt": salt}));

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    let x = JSON.parse(this.responseText);
                    response(x.text);

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

/**
 * Authentication functions
 */
function authentication() {
    let login = document.getElementById("login1").value;
    let password = document.getElementById("password1").value;
    if (document.getElementById('alert_text_auth')) {
        let del = document.getElementById('alert_text_auth');
        del.parentNode.removeChild(del);
    }

    /**
     * This block of promises takes a login and session ID,
     * sends them to the server and gets response.
     * If this response contains route to the chat,
     * user will redirect automatically.
     * Otherwise salt will be extracted from response and
     * browser will send request to the server with login and hashed password+salt.
     * If all data is correct, user will redirect to the chat.
     */
    getSalt1(login)
        .then(function(data) {
            console.log(data);
            if (!data) {
                document.getElementById("login1").value = "";
                document.getElementById("password1").value = "";

            }
            else {
                authCheck(login, sha(password, data))
                    .then(function(data1) {
                        window.location.replace(origin + data1);
                    })
                    .catch(function (err1) {
                        if (err1 == 401) {
                            //Добавление красной рамки и сообщения
                            document.getElementById("login1")
                                .setAttribute("style", "border:1px solid red;");
                            document.getElementById("password1")
                                .setAttribute("style", "border:1px solid red;");
                            let divAlert = document.createElement('div');
                            divAlert.setAttribute("style", "color:red");
                            divAlert.id = 'alert_text_auth';

                            divAlert.appendChild(document
                                .createTextNode("Неверный логин или пароль"));
                            document.getElementById("enter_form")
                                .appendChild(divAlert);
                            document.getElementById("login1").value = "";
                            document.getElementById("password1").value = "";

                        } else {
                            window.location.replace(origin + '/error'  + err1);

                        }
                    })
            }
        })
        .catch(function(err) {
            window.location.replace(origin + '/error' + err);
        });
}

function getSalt1(login) {
    return new Promise(function(response, reject) {
        let xhr = new XMLHttpRequest();

        xhr.open("POST", '/start/a_connect', true);

        xhr.send(JSON.stringify({ "login": login }));

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

function authCheck(login, password) {
    return new Promise(function(response, reject) {
        let xhr = new XMLHttpRequest();

        xhr.open("POST", '/start/a_enter', true);

        xhr.send(JSON.stringify({ "login": login, "password": password }));

        xhr.onreadystatechange = function() {
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

function sha(password, salt) {
    let n = salt.substr(0, 1);
    salt = salt.substr(1, salt.length - 1);

    for (let i = 0; i < n; i++)
        password = keccak512(password + salt)
    return password;
}

//sha3
!function(){"use strict";function t(t,e,r){this.blocks=[],this.s=[],this.padding=e,this.outputBits=r,this.reset=!0,this.block=0,this.start=0,this.blockCount=1600-(t<<1)>>5,this.byteCount=this.blockCount<<2,this.outputBlocks=r>>5,this.extraBytes=(31&r)>>3;for(var n=0;50>n;++n)this.s[n]=0}function e(e,r,n){t.call(this,e,r,n)}var r="object"==typeof window?window:{},n=!r.JS_SHA3_NO_NODE_JS&&"object"==typeof process&&process.versions&&process.versions.node;n&&(r=global);var o=!r.JS_SHA3_NO_COMMON_JS&&"object"==typeof module&&module.exports,i=!r.JS_SHA3_NO_ARRAY_BUFFER&&"undefined"!=typeof ArrayBuffer,a="0123456789abcdef".split(""),s=[31,7936,2031616,520093696],u=[4,1024,262144,67108864],f=[1,256,65536,16777216],c=[6,1536,393216,100663296],h=[0,8,16,24],p=[1,0,32898,0,32906,2147483648,2147516416,2147483648,32907,0,2147483649,0,2147516545,2147483648,32777,2147483648,138,0,136,0,2147516425,0,2147483658,0,2147516555,0,139,2147483648,32905,2147483648,32771,2147483648,32770,2147483648,128,2147483648,32778,0,2147483658,2147483648,2147516545,2147483648,32896,2147483648,2147483649,0,2147516424,2147483648],d=[224,256,384,512],y=[128,256],l=["hex","buffer","arrayBuffer","array"],b={128:168,256:136};(r.JS_SHA3_NO_NODE_JS||!Array.isArray)&&(Array.isArray=function(t){return"[object Array]"===Object.prototype.toString.call(t)});for(var v=function(e,r,n){return function(o){return new t(e,r,e).update(o)[n]()}},A=function(e,r,n){return function(o,i){return new t(e,r,i).update(o)[n]()}},g=function(t,e,r){return function(e,n,o,i){return S["cshake"+t].update(e,n,o,i)[r]()}},k=function(t,e,r){return function(e,n,o,i){return S["kmac"+t].update(e,n,o,i)[r]()}},B=function(t,e,r,n){for(var o=0;o<l.length;++o){var i=l[o];t[i]=e(r,n,i)}return t},w=function(e,r){var n=v(e,r,"hex");return n.create=function(){return new t(e,r,e)},n.update=function(t){return n.create().update(t)},B(n,v,e,r)},_=function(e,r){var n=A(e,r,"hex");return n.create=function(n){return new t(e,r,n)},n.update=function(t,e){return n.create(e).update(t)},B(n,A,e,r)},C=function(e,r){var n=b[e],o=g(e,r,"hex");return o.create=function(o,i,a){return i||a?new t(e,r,o).bytepad([i,a],n):S["shake"+e].create(o)},o.update=function(t,e,r,n){return o.create(e,r,n).update(t)},B(o,g,e,r)},m=function(t,r){var n=b[t],o=k(t,r,"hex");return o.create=function(o,i,a){return new e(t,r,i).bytepad(["KMAC",a],n).bytepad([o],n)},o.update=function(t,e,r,n){return o.create(t,r,n).update(e)},B(o,k,t,r)},x=[{name:"keccak",padding:f,bits:d,createMethod:w},{name:"sha3",padding:c,bits:d,createMethod:w},{name:"shake",padding:s,bits:y,createMethod:_},{name:"cshake",padding:u,bits:y,createMethod:C},{name:"kmac",padding:u,bits:y,createMethod:m}],S={},M=[],O=0;O<x.length;++O)for(var J=x[O],N=J.bits,z=0;z<N.length;++z){var j=J.name+"_"+N[z];if(M.push(j),S[j]=J.createMethod(N[z],J.padding),"sha3"!==J.name){var H=J.name+N[z];M.push(H),S[H]=S[j]}}t.prototype.update=function(t){var e="string"!=typeof t;e&&t.constructor===r.ArrayBuffer&&(t=new Uint8Array(t));var n=t.length;if(!(!e||"number"==typeof n&&(Array.isArray(t)||i&&ArrayBuffer.isView(t))))throw"input is invalid type";for(var o,a,s=this.blocks,u=this.byteCount,f=this.blockCount,c=0,p=this.s;n>c;){if(this.reset)for(this.reset=!1,s[0]=this.block,o=1;f+1>o;++o)s[o]=0;if(e)for(o=this.start;n>c&&u>o;++c)s[o>>2]|=t[c]<<h[3&o++];else for(o=this.start;n>c&&u>o;++c)a=t.charCodeAt(c),128>a?s[o>>2]|=a<<h[3&o++]:2048>a?(s[o>>2]|=(192|a>>6)<<h[3&o++],s[o>>2]|=(128|63&a)<<h[3&o++]):55296>a||a>=57344?(s[o>>2]|=(224|a>>12)<<h[3&o++],s[o>>2]|=(128|a>>6&63)<<h[3&o++],s[o>>2]|=(128|63&a)<<h[3&o++]):(a=65536+((1023&a)<<10|1023&t.charCodeAt(++c)),s[o>>2]|=(240|a>>18)<<h[3&o++],s[o>>2]|=(128|a>>12&63)<<h[3&o++],s[o>>2]|=(128|a>>6&63)<<h[3&o++],s[o>>2]|=(128|63&a)<<h[3&o++]);if(this.lastByteIndex=o,o>=u){for(this.start=o-u,this.block=s[f],o=0;f>o;++o)p[o]^=s[o];U(p),this.reset=!0}else this.start=o}return this},t.prototype.encode=function(t,e){var r=255&t,n=1,o=[r];for(t>>=8,r=255&t;r>0;)o.unshift(r),t>>=8,r=255&t,++n;return e?o.push(n):o.unshift(n),this.update(o),o.length},t.prototype.encodeString=function(t){t=t||"";var e="string"!=typeof t;e&&t.constructor===r.ArrayBuffer&&(t=new Uint8Array(t));var n=t.length;if(!(!e||"number"==typeof n&&(Array.isArray(t)||i&&ArrayBuffer.isView(t))))throw"input is invalid type";var o=0;if(e)o=n;else for(var a=0;a<t.length;++a){var s=t.charCodeAt(a);128>s?o+=1:2048>s?o+=2:55296>s||s>=57344?o+=3:(s=65536+((1023&s)<<10|1023&t.charCodeAt(++a)),o+=4)}return o+=this.encode(8*o),this.update(t),o},t.prototype.bytepad=function(t,e){for(var r=this.encode(e),n=0;n<t.length;++n)r+=this.encodeString(t[n]);var o=e-r%e,i=[];return i.length=o,this.update(i),this},t.prototype.finalize=function(){var t=this.blocks,e=this.lastByteIndex,r=this.blockCount,n=this.s;if(t[e>>2]|=this.padding[3&e],this.lastByteIndex===this.byteCount)for(t[0]=t[r],e=1;r+1>e;++e)t[e]=0;for(t[r-1]|=2147483648,e=0;r>e;++e)n[e]^=t[e];U(n)},t.prototype.toString=t.prototype.hex=function(){this.finalize();for(var t,e=this.blockCount,r=this.s,n=this.outputBlocks,o=this.extraBytes,i=0,s=0,u="";n>s;){for(i=0;e>i&&n>s;++i,++s)t=r[i],u+=a[t>>4&15]+a[15&t]+a[t>>12&15]+a[t>>8&15]+a[t>>20&15]+a[t>>16&15]+a[t>>28&15]+a[t>>24&15];s%e===0&&(U(r),i=0)}return o&&(t=r[i],o>0&&(u+=a[t>>4&15]+a[15&t]),o>1&&(u+=a[t>>12&15]+a[t>>8&15]),o>2&&(u+=a[t>>20&15]+a[t>>16&15])),u},t.prototype.arrayBuffer=function(){this.finalize();var t,e=this.blockCount,r=this.s,n=this.outputBlocks,o=this.extraBytes,i=0,a=0,s=this.outputBits>>3;t=new ArrayBuffer(o?n+1<<2:s);for(var u=new Uint32Array(t);n>a;){for(i=0;e>i&&n>a;++i,++a)u[a]=r[i];a%e===0&&U(r)}return o&&(u[i]=r[i],t=t.slice(0,s)),t},t.prototype.buffer=t.prototype.arrayBuffer,t.prototype.digest=t.prototype.array=function(){this.finalize();for(var t,e,r=this.blockCount,n=this.s,o=this.outputBlocks,i=this.extraBytes,a=0,s=0,u=[];o>s;){for(a=0;r>a&&o>s;++a,++s)t=s<<2,e=n[a],u[t]=255&e,u[t+1]=e>>8&255,u[t+2]=e>>16&255,u[t+3]=e>>24&255;s%r===0&&U(n)}return i&&(t=s<<2,e=n[a],i>0&&(u[t]=255&e),i>1&&(u[t+1]=e>>8&255),i>2&&(u[t+2]=e>>16&255)),u},e.prototype=new t,e.prototype.finalize=function(){return this.encode(this.outputBits,!0),t.prototype.finalize.call(this)};var U=function(t){var e,r,n,o,i,a,s,u,f,c,h,d,y,l,b,v,A,g,k,B,w,_,C,m,x,S,M,O,J,N,z,j,H,U,E,I,R,D,F,V,K,Y,q,G,L,P,Q,T,W,X,Z,$,tt,et,rt,nt,ot,it,at,st,ut,ft,ct;for(n=0;48>n;n+=2)o=t[0]^t[10]^t[20]^t[30]^t[40],i=t[1]^t[11]^t[21]^t[31]^t[41],a=t[2]^t[12]^t[22]^t[32]^t[42],s=t[3]^t[13]^t[23]^t[33]^t[43],u=t[4]^t[14]^t[24]^t[34]^t[44],f=t[5]^t[15]^t[25]^t[35]^t[45],c=t[6]^t[16]^t[26]^t[36]^t[46],h=t[7]^t[17]^t[27]^t[37]^t[47],d=t[8]^t[18]^t[28]^t[38]^t[48],y=t[9]^t[19]^t[29]^t[39]^t[49],e=d^(a<<1|s>>>31),r=y^(s<<1|a>>>31),t[0]^=e,t[1]^=r,t[10]^=e,t[11]^=r,t[20]^=e,t[21]^=r,t[30]^=e,t[31]^=r,t[40]^=e,t[41]^=r,e=o^(u<<1|f>>>31),r=i^(f<<1|u>>>31),t[2]^=e,t[3]^=r,t[12]^=e,t[13]^=r,t[22]^=e,t[23]^=r,t[32]^=e,t[33]^=r,t[42]^=e,t[43]^=r,e=a^(c<<1|h>>>31),r=s^(h<<1|c>>>31),t[4]^=e,t[5]^=r,t[14]^=e,t[15]^=r,t[24]^=e,t[25]^=r,t[34]^=e,t[35]^=r,t[44]^=e,t[45]^=r,e=u^(d<<1|y>>>31),r=f^(y<<1|d>>>31),t[6]^=e,t[7]^=r,t[16]^=e,t[17]^=r,t[26]^=e,t[27]^=r,t[36]^=e,t[37]^=r,t[46]^=e,t[47]^=r,e=c^(o<<1|i>>>31),r=h^(i<<1|o>>>31),t[8]^=e,t[9]^=r,t[18]^=e,t[19]^=r,t[28]^=e,t[29]^=r,t[38]^=e,t[39]^=r,t[48]^=e,t[49]^=r,l=t[0],b=t[1],P=t[11]<<4|t[10]>>>28,Q=t[10]<<4|t[11]>>>28,O=t[20]<<3|t[21]>>>29,J=t[21]<<3|t[20]>>>29,st=t[31]<<9|t[30]>>>23,ut=t[30]<<9|t[31]>>>23,Y=t[40]<<18|t[41]>>>14,q=t[41]<<18|t[40]>>>14,U=t[2]<<1|t[3]>>>31,E=t[3]<<1|t[2]>>>31,v=t[13]<<12|t[12]>>>20,A=t[12]<<12|t[13]>>>20,T=t[22]<<10|t[23]>>>22,W=t[23]<<10|t[22]>>>22,N=t[33]<<13|t[32]>>>19,z=t[32]<<13|t[33]>>>19,ft=t[42]<<2|t[43]>>>30,ct=t[43]<<2|t[42]>>>30,et=t[5]<<30|t[4]>>>2,rt=t[4]<<30|t[5]>>>2,I=t[14]<<6|t[15]>>>26,R=t[15]<<6|t[14]>>>26,g=t[25]<<11|t[24]>>>21,k=t[24]<<11|t[25]>>>21,X=t[34]<<15|t[35]>>>17,Z=t[35]<<15|t[34]>>>17,j=t[45]<<29|t[44]>>>3,H=t[44]<<29|t[45]>>>3,m=t[6]<<28|t[7]>>>4,x=t[7]<<28|t[6]>>>4,nt=t[17]<<23|t[16]>>>9,ot=t[16]<<23|t[17]>>>9,D=t[26]<<25|t[27]>>>7,F=t[27]<<25|t[26]>>>7,B=t[36]<<21|t[37]>>>11,w=t[37]<<21|t[36]>>>11,$=t[47]<<24|t[46]>>>8,tt=t[46]<<24|t[47]>>>8,G=t[8]<<27|t[9]>>>5,L=t[9]<<27|t[8]>>>5,S=t[18]<<20|t[19]>>>12,M=t[19]<<20|t[18]>>>12,it=t[29]<<7|t[28]>>>25,at=t[28]<<7|t[29]>>>25,V=t[38]<<8|t[39]>>>24,K=t[39]<<8|t[38]>>>24,_=t[48]<<14|t[49]>>>18,C=t[49]<<14|t[48]>>>18,t[0]=l^~v&g,t[1]=b^~A&k,t[10]=m^~S&O,t[11]=x^~M&J,t[20]=U^~I&D,t[21]=E^~R&F,t[30]=G^~P&T,t[31]=L^~Q&W,t[40]=et^~nt&it,t[41]=rt^~ot&at,t[2]=v^~g&B,t[3]=A^~k&w,t[12]=S^~O&N,t[13]=M^~J&z,t[22]=I^~D&V,t[23]=R^~F&K,t[32]=P^~T&X,t[33]=Q^~W&Z,t[42]=nt^~it&st,t[43]=ot^~at&ut,t[4]=g^~B&_,t[5]=k^~w&C,t[14]=O^~N&j,t[15]=J^~z&H,t[24]=D^~V&Y,t[25]=F^~K&q,t[34]=T^~X&$,t[35]=W^~Z&tt,t[44]=it^~st&ft,t[45]=at^~ut&ct,t[6]=B^~_&l,t[7]=w^~C&b,t[16]=N^~j&m,t[17]=z^~H&x,t[26]=V^~Y&U,t[27]=K^~q&E,t[36]=X^~$&G,t[37]=Z^~tt&L,t[46]=st^~ft&et,t[47]=ut^~ct&rt,t[8]=_^~l&v,t[9]=C^~b&A,t[18]=j^~m&S,t[19]=H^~x&M,t[28]=Y^~U&I,t[29]=q^~E&R,t[38]=$^~G&P,t[39]=tt^~L&Q,t[48]=ft^~et&nt,t[49]=ct^~rt&ot,t[0]^=p[n],t[1]^=p[n+1]};if(o)module.exports=S;else for(var O=0;O<M.length;++O)r[M[O]]=S[M[O]]}();