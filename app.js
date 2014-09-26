////////////////////////////
////////////////////////////
////////////////////////////

var express = require('express'); // express handles our HTTP server
var ws = require('ws'); // ws is the WebSocket libary

var app = express();
var HTTP_port = process.env.PORT || 8000; // the port our server will run on

//build screen manager
var screensConnected = [];

// we are only using one route, which simply returns the file the browser asks for
app.get('*', function(req, res){
	screensConnected[req.query.q]=true;
	res.sendfile(__dirname + req.url);
});

// now actually start the server
var http = require('http');
var server = http.createServer(app);
server.listen(HTTP_port);

console.log('HTTP server started on port '+HTTP_port);
screensConnected.forEach(function(entry){
	console.log(entry);
});

////////////////////////////
////////////////////////////
////////////////////////////

// have our WebSocket server listening on the same port as our HTTP server
var WebSocketServer = require('ws').Server;
var socketServer = new WebSocketServer({'server':server}); //create an instance of a socket connection

var allSockets = [];

socketServer.on('connection',function(socket){
	socket.on('message',function(data){
		var msg = JSON.parse(data);
		if(socketHandlers[msg.type]) socketHandlers[msg.type](socket,msg);
	});

	socket.on('close',function(){
		for(var i=0;i<allSockets.length;i++){
			if(allSockets[i]===socket){
				allSockets.splice(i,1);
				//maybe make sure database connection is saved and closed.
				break;
			}
		}
	});

	allSockets.push(socket);
});

////////////////////////////
////////////////////////////
////////////////////////////

var socketHandlers = {
	'passAlong':function(socket,msg){
		for(var i=0;i<allSockets.length;i++){
			if(allSockets[i]===socket){
				var passAlongIndex = (i+msg.direction)%allSockets.length;
				if(passAlongIndex<0){
					passAlongIndex = passAlongIndex+allSockets.length;
				}

				try{
					allSockets[passAlongIndex].send(JSON.stringify(msg));
				}
				catch(error){
					console.log(error);
				}
				
				break;
			}
		}
	}
};

////////////////////////////
////////////////////////////
////////////////////////////