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
var screenSize = {};
var rows;
var cols;

//These are all the videos
var vidLibrary = [
	'turntable_one.mov',
	'turntable_two.mov',
	'turntable_three.mov',
	'turntable_four.mov',
	'seal_one.mp4',
	'NSF_Science_Nation.mp4',
	'antarctica.mp4'
];
var turns = 0;
var checkedOut = [];
var allScreens = false;

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
		console.log(msg);
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
	screens[socket] = screenNum; //screenNum set in the HTTP GET request
});

////////////////////////////
////////////////////////////
////////////////////////////

var socketHandlers = {
	'update': function(socket, msg){
		screenSize[socket] = {'w':msg.w, 'h':msg.h};
		console.log(msg.duration);
		console.log(msg.current);
	},
	'first': function(socket, msg){
		rows = msg.rows;
		cols = msg.cols;
		screenSize[socket] = {'w':msg.w, 'h':msg.h};
		for(var i=0;i<allSockets.length;i++){
			if(allSockets[i]===socket){
				//look up what I should be playing on this screen
				var toPlay = checkoutVid(socket, msg);
				play(toPlay, allSockets[i], screenSize);
			}
		}
	},
	'next': function(socket, msg){
		var toPlay = checkoutVid(socket, msg);
		play(toPlay, socket, screenSize);
		// //let's do one video full screen every turn through the video library
		// //to do this we will increment a counter that resets...
		// turns ++;
		// //needs to know the mode we're in - or at least decide the mode we are in
		// if (turns==vidLibrary.length){
		// 	turns = 0;
		// 	allScreens = true;
		// 	toPlay = checkoutVid();
		// }
		// return toPlay
	},
	'resize': function(socket, msg){
		
		//console.log(screenSize.socket);
		//console.log(cols, rows);
	},
	//might need this for fast screen resizing
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

//what can we do with socket & msg? right now we are handing things out randomly
var checkoutVid = function(socket, msg){
	console.log(vidLibrary);
	var vid = vidLibrary[Math.floor(Math.random()*vidLibrary.length)];
	checkedOut.push(vid);
	vidLibrary.splice(checkedOut,checkedOut.length);
	if (vidLibrary.length===0){
		vidLibrary.push(checkedOut); //recall books, no fines here, just magically bring everyone back.
		// playBig();//time to play big video
	}
	return vid;
};

var playBig = function(){

};

//probably should send screen size not allScreens boolean
var play = function(toPlay, socket, screenSize){
	var vidData = {
		'videoSource': toPlay,
		'mode': screenSize,
	};
	socket.send(JSON.stringify(vidData));
};

////////////////////////////
////////////////////////////
////////////////////////////