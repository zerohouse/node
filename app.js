var express = require('express')
	, app = express()
	, http = require('http')
	, server = http.createServer(app)
	, io = require('socket.io').listen(server)

server.listen(8080);

// 라우팅 
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

app.get('/css/:id', function (req, res) {
	res.sendfile(__dirname + '/css/' + req.params.id);
});

app.get('/js/:id', function (req, res) {
	res.sendfile(__dirname + '/js/' + req.params.id);
});

var users = {};
var sockets = [];
var index = 0;

io.sockets.on('connection', function (socket) {

	socket.on('sendchat', function (data) {
		if(socket.game!=undefined){
			var rival = sockets[users[socket.game.rival].index];
			rival.emit('updatechat', socket.username, data);
			socket.emit('updatechat', socket.username, data);
			return;
		}
		io.sockets.emit('updatechat', socket.username, data);
	});

	socket.on('challenge', function (username) {
		sockets[users[username].index].emit('challenge', socket.username);
	});

	socket.on('gameStart', function (username) {
		var rival = sockets[users[username].index];
		rival.join(username);
		socket.join(username);

		rival.game = {room :username, point :99, phase : 5, win:0, rival: socket.username, submittedPoint : -1};
		socket.game = {room :username, point :99, phase : 5, win:0, rival: rival.username, submittedPoint : -1};

		io.to(username).emit('updatechat', '붕대맨' ,'게임을 시작합니다.');

		if(Math.random(1)>0.5){
			socket.emit('start', true, rival.username);
			rival.emit('start', false, socket.username);
			updateGame(socket, rival);
			return;
		}
		socket.emit('start', false, rival.username);
		rival.emit('start', true, socket.username);
		updateGame(socket, rival);


	});


	socket.on('submitpoint', function (point) {
		var rival = sockets[users[socket.game.rival].index];
		socket.game.point -= point;
		var phase = whichPhase(socket.game.point);
		socket.game.phase = phase;

		rival.emit('blackwhite', blackWhite(point));
		updateGame(rival, socket);

		if(socket.game.submittedPoint == -1){
			rival.game.submittedPoint = point;
			socket.game.submittedPoint = point;
			doTurn(false);
			return;
		}
		turnOver(point);
		doTurn(true);
		rival.game.submittedPoint = -1;
		socket.game.submittedPoint = -1;



		function blackWhite(point){
			if(	point > 9)
				return 'white';
			return 'black';
		}



		function doTurn(myTurn){
			if(myTurn){
				rival.emit('rivaldoing');
				socket.emit('doTurn', true);
				return;
			}
			socket.emit('rivaldoing');
			rival.emit('doTurn', false);
		}

		function turnOver(point){
			var submit = socket.game.submittedPoint;

			if(submit<point){
				socket.game.win++;
				if(socket.game.win>4){
					socket.emit('winner');
					rival.emit('loser');
					return;
				}
				rival.emit('turnOver', false);
				socket.emit('turnOver',	true);
				return;
			}
			rival.game.win++;
			if(rival.game.win>4){
				rival.emit('winner');
				socket.emit('loser');
				return;
			}
			socket.emit('turnOver',false);
			rival.emit('turnOver', true);

		}

	});





	socket.on('decline', function (username) {
		sockets[users[username].index].emit('decline', socket.username);
	});



	socket.on('adduser', function(username){
		socket.username = username;
		socket.index = index;


		sockets.push(socket);
		users[username] = {name : username, index : index};

		index++;

		socket.emit('updatechat', '붕대맨', '흑과백에 접속하셨습니다.');
		socket.broadcast.emit('updatechat', '붕대맨', username + '님이 오셨습니다.');
		io.sockets.emit('updateusers', users);
	});

	socket.on('disconnect', function(){
		delete users[socket.username];
		io.sockets.emit('updateusers', users);
		if(socket.game != undefined){
			try {
				var rival = sockets[users[socket.game.rival].index];
				rival.leave(socket.game.room);
				rival.emit('out');
				rival.game = undefined;
			}
			catch(err){

			}
		}
		socket.broadcast.emit('updatechat', '붕대맨', socket.username + '님이 나갔습니다.');
	});






	function whichPhase(point){
		if (point>79)
			return 5;
		if (point>59)
			return 4;
		if (point>39)
			return 3;
		if (point>19)
			return 2;
		return 1;
	}

	function updateGame(socket1, socket2){
		socket1.emit('updateGame', socket1.game, socket2.game);
		socket2.emit('updateGame', socket2.game, socket1.game);
	}

});