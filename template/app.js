////////////////////////////
////////////////////////////
////////////////////////////

var express = require('express'); // express handles our HTTP server
var app = express();

// we are only using one route, which simply returns the file the browser asks for
// server automatically return 'index.html' if we have no file path in the requested url
app.get('*', function(req, res){
	res.sendfile(__dirname + req.url);
});

// now actually start the server
var http = require('http');
var server = http.createServer(app);

var HTTP_port = process.env.PORT || 8000; // the port our server will be listening on
server.listen(HTTP_port);

console.log('HTTP server started on port '+HTTP_port);

////////////////////////////
////////////////////////////
////////////////////////////

// load the WebSocket module 'ws'
// and start a WebSocket server at the same port as our HTTP server

var ws = require('ws'); // ws is the WebSocket libary

// have our WebSocket server listening on the same port as our HTTP server
var WebSocketServer = require('ws').Server;
var socketServer = new WebSocketServer({'server':server}); //create an instance of a socket connection

var allSockets = [];

socketServer.on('connection',function(socket){
	allSockets.push(socket);

	socket.on('message',function(msg){
		for(var i=0;i<allSockets.length;i++){
			if(allSockets[i] === socket){
				var nextIndex = (i+1)%allSockets.length;
				allSockets[nextIndex].send(msg);
			}
		}
	});

	socket.on('close',function(){
		for(var i=0;i<allSockets.length;i++){
			if(allSockets[i] === socket){
				allSockets.splice(i,1);
				break;
			}
		}
	});
});





















////////////////////////////
////////////////////////////
////////////////////////////