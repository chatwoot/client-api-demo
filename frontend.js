$(function () {
    "use strict";

    window.chatwoot = {};
    // update the inbox identifier
    chatwoot.inboxIdentifier = "bXKr2F2asDjztoVipLF9Lt8v";
    chatwoot.chatwootAPIUrl = "http://localhost:3000/public/api/v1/"

    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');
    var xhttp = new XMLHttpRequest();


    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://localhost:3000/cable');

    connection.onopen = function () {
        // check whether we have a pubsub token and contact identifier or else set one
        setUpContact();
        setUpConversation();
 
        // first we want users to subscribe to the chatwoot webhooks
        connection.send(JSON.stringify({command:"subscribe", identifier: "{\"channel\":\"RoomChannel\",\"pubsub_token\":\""+chatwoot.contactPubsubToken+"\"}" }));
        input.removeAttr('disabled');
        status.text('Send Message:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with connection...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
 
        if (json.type === 'welcome') { 
          // lets ignore the welcome
        } else if (json.type === 'ping') {
          // lets ignore the pings
        } else if (json.type === 'confirm_subscription') {
          // lets ignore the confirmation
        }else if (json.message.event === 'message.created') {
          console.log('here comes message', json);
          if(json.message.data.message_type === 1)
          { 
            addMessage(json.message.data.sender.name, json.message.data.content); 
          }
        } else {
          console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
     * Send mesage when user presses Enter key
     */
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // send the message to chatwoot
            //connection.send(msg);
            sendMessage(msg);
            addMessage("me", msg)
            $(this).val('');
        }
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to communicate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    /**
     * Add message to the chat window
     */
    function addMessage(author, message) {
        content.append('<p><span>' + author + '</span> @ ' + ':' +  message + '</p>');
        content.scrollTop(1000000);
    }

    function setUpContact() {
      if(getCookie('contactIdentifier')){
        chatwoot.contactIdentifier = getCookie('contactIdentifier');
        chatwoot.contactPubsubToken = getCookie('contactPubsubToken')
      }else{
        xhttp.open("POST", chatwoot.chatwootAPIUrl + "inboxes/"+chatwoot.inboxIdentifier+"/contacts");
        xhttp.send();
        var contactPubsubToken = JSON.parse(xhttp.responseText).pubsub_token;
        var contactIdentifier = JSON.parse(xhttp.responseText).source_id;
        setCookie('contactIdentifier',contactIdentifier,30);
        setCookie('contactPubsubToken',contactPubsubToken,30);
      }
    }

    function setUpConversation() {
      if(getCookie('contactConverstion')){
        chatwoot.contactConverstion = getCookie('contactConverstion');
      }else{
        xhttp.open("POST", chatwoot.chatwootAPIUrl + "inboxes/"+chatwoot.inboxIdentifier+"/contacts/"+chatwoot.contactIdentifier+"/conversations", false);
        xhttp.send();
        var contactConverstion = JSON.parse(xhttp.responseText).id;
        setCookie('contactConverstion',contactConverstion,30);
      }
    }

    function sendMessage(msg){
      xhttp.open("POST", chatwoot.chatwootAPIUrl + "inboxes/"+chatwoot.inboxIdentifier+"/contacts/"+chatwoot.contactIdentifier+"/conversations/"+chatwoot.contactConverstion+"/messages", false);
      xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhttp.send(JSON.stringify({content: msg}));
    }

    function setCookie(name,value,days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }
    function eraseCookie(name) {   
        document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
});