////////////////////////////
////////////////////////////
////////////////////////////

var express = require('express'); // express handles our HTTP server
var ws = require('ws'); // ws is the WebSocket libary

var app = express();
var HTTP_port = process.env.PORT || 8000; // the port our server will run on


//build screen manager
var screens = {};
var screenNum;
var vidFiles = ['Sequence01.mov', 'Sequence02.mov', 'Sequence03.mov', 'Sequence04.mov'];
var modes = ['all', 'single'];
var screenSize = {};
var rows;
var cols;

// we are only using one route, which simply returns the file the browser asks for
app.use('/current', function(req, res, next){
	screenNum = req.query.screenNum;
	next();
});

app.route('/old')
	.get(function(req, res){
		res.sendfile('index1.html');
});

app.route('/current')
	.get(function (req, res){
		res.sendfile('index2.html');
	});

app.route('*').get(function(req, res){
	res.sendFile(__dirname + req.url);
});

// now actually start the server
var http = require('http');
var server = http.createServer(app);
server.listen(HTTP_port);

console.log('HTTP server started on port '+HTTP_port);

////////////////////////////
////////////////////////////
////////////////////////////

// have our WebSocket server listening on the same port as our HTTP server
var WebSocketServer = require('ws').Server;
var socketServer = new WebSocketServer({'server':server}); //create an instance of a socket connection

var allSockets = [];

socketServer.on('connection',function(socket){
	//console.log('socket on');
	//socketHandlers['videoURL'](socket);
	//console.log(screens);
	socket.on('message',function(data){
		var msg = JSON.parse(data);
		if(socketHandlers[msg.type]) socketHandlers[msg.type](socket,msg);
	});

	socket.on('close',function(){
		console.log('bye');
		for(var i=0;i<allSockets.length;i++){
			if(allSockets[i]===socket){
				allSockets.splice(i,1);
			}
		}
	});
	allSockets.push(socket);
	screens.socket = screenNum;
});

////////////////////////////
////////////////////////////
////////////////////////////

var socketHandlers = {
	'update': function(socket, msg){
		//console.log(msg.someShit);
		// console.log(msg.duration);
		// console.log(msg.current);
	},
	'first': function(socket, msg){
		rows = msg.rows;
		cols = msg.cols;
		for(var i=0;i<allSockets.length;i++){
			if(allSockets[i]===socket){
				//look up what I should be playing on this screen
				var scr = screens.socket;
				console.log(screens.socket);
				var vidData = {
					'videoSource': vidFiles[1],
					'mode': 'all',
					'screenNum': scr
				};
				allSockets[i].send(JSON.stringify(vidData));
			}
		}
	},
	'size': function(socket, msg){
		screenSize.socket = {'w':msg.w, 'h':msg.h};
		// console.log(screenSize.socket);
		console.log(cols, rows);
	},
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