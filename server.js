var express = require('express');
var app = express();
var path = require('path')
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

//App Global Stuff
var users = [];
var messages = [];

console.log("****** STARTING SERVER ******")
console.log("")

app.use('/static', express.static(path.join(__dirname + "/public")));
app.use('/static/assets', express.static(path.join(__dirname + "/public/assets")))
console.log("STATIC DIRECTORY: " + __dirname + "/pubic");

//Serve Main page
app.get('/', function(req, res){
  res.sendFile(__dirname + "/public/index.html");
})

//Serve the About Page
app.get('/about', function(req, res){
  res.sendFile(__dirname + "/public/about/about.html");
})

//Socket.IO Stuff
io.on('connection', function(socket){
  
  var usernameGlobal;

  socket.emit("first connect handshake", users)

  //Socket Connection
  socket.on("username connect", function(username){
    //Check that the username doesn't clash
    for(i = 0; i < users.count; i++) {
      if(users[i] == username) {
        console.log("Username Exists Twice")
        socket.disconnect();
        return;
      }
    }

    usernameGlobal = username;
    console.log(username + ' has connected')

    //Send a message out to everyone
    socket.broadcast.emit('new user', [username, users.length])

    //Add username to the list
    users.push([usernameGlobal,socket.id]);
    //Broadcast new user list
    socket.broadcast.emit('new user list', users)

    //Send it also to the client
    socket.emit('new user list', users)
  })


  //On Message Recive
  socket.on('chat message', function(msg){
    io.emit('chat message', msg)

    //Add to messages list
    messages.push([msg, usernameGlobal]);
  });

  //On User typing
  socket.on('started typing', function(username) {

    //Send message that the user has started to type
    socket.broadcast.emit('start user typing', username);
  });

  //On user stopped typing
  socket.on('stopped typing', function(username) {
    socket.broadcast.emit('stop user typing', username);
  });


  //On Disconnect
  socket.on('disconnect', function() {
    console.log(usernameGlobal + " has disconnected")
    if (usernameGlobal == null) {
      console.log("     Because your username is NULL, a message will not be sent out to everyone")
    } else {
      socket.broadcast.emit('username disconnect', usernameGlobal)
    }

    //Get rid of the name in the users loop
    for(var i = 0; i < users.length; i++) {
      if (users[i][0] == usernameGlobal) {
        //Delete the user from the Array using JQuery
        users.splice(users.indexOf(users[i]), 1);

        //Send out the new users list to all of the people
        socket.broadcast.emit('new user list', users);
      }
    }

  })
})

http.listen(port, function() {
  console.log("Listening on " + port)
  console.log("")
  console.log("****** SERVER HAS STARTED ******")
})


function handleMessage(chat) { var message = chat.message; if (message === "/help") { handleHelp(); } else { var split = message.indexOf(" "); var command; if (split === -1) { command = '/chat'; } else { command = message.substr(0, split); message = message.substr(split); } if (verifyEmptyness(message)) { emitToUser('PM: Sorry, you cannot send empty messages.'); } else { var realMessage = formatMessage(command, message, chat.username, moment(chat.date).format("LT, D/M")); if (realMessage.length > 8192) { emitToUser('PM: Oops! You cannot send messages longer than 8192 characters. Sorry!'); } else { emitToRoom(realMessage); } } } } function formatMessage(command, message, user, date) { var intro; switch (command) { case '/broadcast': intro = 'BROADCAST'; break; case '/bot-say': intro = 'Chat bot'; break; case '/chat': intro = escapeHTML(user); break; default: intro = 'UNKNOWN COMMAND'; message = command; break; } return '<p class="alignLeft"> ' + intro + ': ' + message + '</p><p class="alignRight">' + date + '</p>'; } function handleHelp() { sendToUser( 'Montreus Chat - v1.3.3' + '<br>Available commands:' + '<br>/help - Display help commands' + '<br>/bot-say &lt;message&gt; - Give something for the bot to say!' + '<br>/broadcast &lt;message&gt; - Broadcast a message' ); }