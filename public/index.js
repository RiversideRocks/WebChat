$(function() {
    var socket = io();
    var username;


    //For the text box
    var TextBoxTimer = null;

    //For the '{user} is typing'
    var userTypingTimer = null;
    userTypingCounter = 0;
    
    //Get a username (using SweetAlert2)
    (async function getUsername() { 
      const{value: name} = await swal({
        title: "Enter YOUR name",
        input: 'text',
        inputPlaceholder: "Enter your Chatname",
        allowOutsideClick: false,
        inputValidator: (value) => {
          return !value && 'Username is required to use Riverside Chat'
        }
      })

      if(name) {
        swal({type: 'success', title: 'Welcome ' + name + ", to the Riverside Rocks charoom"})

        //Update local variable Username with our new username
        username = name

        //Send a message to sever saying that we have connected
        socket.emit("username connect", username)

        //Update the HTML to reflect new infomation
        $('#online').append($('<li><strong>' + username + '</strong></li>'));
        $('#username').html("<h5>Username: " + username + "</h5>")
      }
    })()

    //SEND STUFF

    //Send Messages
    $('form').submit(function(){
      socket.emit('chat message', [$('#m').val(), username]);
      $('#m').val('')
      return false;
    });

    //Send Typing Start
    $('#m').keydown(function(){
      socket.emit('started typing', username)
    });

    //Send Typing End (Normal)
    $('#m').keyup(function(){
      clearTimeout(TextBoxTimer);
    
      TextBoxTimer = setTimeout(function(){
        socket.emit('stopped typing', username);
      }, 1000)

    });

    //Window loose focus
    $(window).blur(function() {

      //If username doesn't equal null, then send to stopped typing message
      if (username != null) {
        socket.emit('stopped typing', username);
      }
    });

    //RECIVE STUFF

    //First Connection Handshake
    socket.on('first connect handshake', function(userList) {
      console.log("RECIVED FIRST CONNECTION FROM SERVER")

      //Update User List
      updateUserList(userList);
    });

    //New Message
    socket.on('chat message', function(msg){
      $('#messages').append($('<li> <strong>' + msg[1] + '</strong> - ' + msg[0] + ' </li>'));
    });

    //New User
    socket.on('new user', function(infomation){
      $('#messages').append($('<li><strong><i>' + infomation[0] + ' has connected to this chat room!' + '<i></strong></li>'));

      //Update User Number
      $('#membersOnline').html(infomation[1] + " Members Online")
    });

    //User disconnect
    socket.on('username disconnect', function(username) {
      $('#messages').append($('<li><strong><i>' + username + ' has left the chat room. Sad.' + '</i></strong></li>'));
    });

    //New User List
    socket.on('new user list', function(userList){
      //Update User List
      updateUserList(userList);
    });

    //User Typing
    socket.on('start user typing', function(username) {
      $('#typing').html("<h5>" + username + " is typing</h5>")
      userTypingTimer = setInterval(ChangeTypingText(username), 100)
    });

    socket.on('stop user typing', function(username) {
      clearInterval(userTypingTimer);
      userTypingTimer = null;
      $('#typing').html("<h5></h5>")
    })

    //Update Userlist
    function updateUserList(userList) {
      //Remove old users
      $('#online').html("")

      //Update number of users
      $('#membersOnline').html(userList.length + " Members Online")

      console.log("Number of users online = " + userList.length)

      for(i = 0; i < userList.length; i++) {
        $('#online').append($('<li><strong>' + userList[i][0] + '</strong></li>'));
      }
    }

    //Change the typing text
    function ChangeTypingText(username) {
      switch(userTypingCounter) {
        case 0:
          $('#typing').html("<h5>" + username + " is typing</h5>")
          userTypingCounter++;
        case 1:
          $('#typing').html("<h5>" + username + " is typing.</h5>")
          userTypingCounter++;
        case 2:
          $('#typing').html("<h5>" + username + " is typing..</h5>")
          userTypingCounter++;
        case 3:
          $('#typing').html("<h5>" + username + " is typing...</h5>")
          userTypingCounter = 0;

      }
    }

  });
  