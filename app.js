var express = require('express')
	, app = express()
	, http = require('http')
	, server = http.createServer(app)
	, io = require('socket.io').listen(server);

server.listen(8000);


httpProxy = require('http-proxy');
//
// Create your proxy server and set the target in the options.
//
httpProxy.createProxyServer({target:'http://localhost:8080'}).listen(80);

var users = {};
var sockets = [];
var index = 0;

io.sockets.on('connection', function (socket) {
	socket.on('sendchat', function (data) {
		if(socket.game!=undefined){
			var rival = socket.broadcast.to(socket.game.room);
			rival.emit('updatechat', users[socket.fbid].name, data, true);
			socket.emit('updatechat', users[socket.fbid].name, data, true);
			return;
		}
		io.sockets.emit('updatechat', users[socket.fbid].name, data);
	});

	socket.on('challenge', function (facebookId) {
		if(sockets[users[facebookId].index].game!=undefined){
			socket.emit('updatechat', '붕대맨', '상대가 게임 중입니다.');
			return;
		}
		sockets[users[facebookId].index].emit('challenge', users[socket.fbid].name, socket.fbid);
	});

	socket.on('gameStart', function (facebookId) {
		users[socket.fbid].ing = true;
		users[facebookId].ing = true;
		var rival = sockets[users[facebookId].index];
		rival.join(facebookId);
		socket.join(facebookId);

		rival.game = {room :facebookId, point :99, phase : 5, win:0, rival: socket.fbid, submittedPoint : -1};
		socket.game = {room :facebookId, point :99, phase : 5, win:0, rival: rival.fbid, submittedPoint : -1};

		io.to(facebookId).emit('updatechat', '붕대맨' ,'게임을 시작합니다.');

		if(Math.random(1)>0.5){
			socket.emit('start', true, users[rival.fbid].name, rival.fbid);
			rival.emit('start', false, users[socket.fbid].name, socket.fbid);
			updateGame(socket, rival);
			return;
		}
		socket.emit('start', false, users[rival.fbid].name ,rival.fbid);
		rival.emit('start', true, users[socket.fbid].name ,socket.fbid);
		updateGame(socket, rival);

	});


	socket.on('submitpoint', function (point) {
		try {
			console.log(socket.fbid ,'submit', point, socket.fbid);
			var rival = sockets[users[socket.game.rival].index];
			socket.game.point -= point;
			var phase = whichPhase(socket.game.point);
			socket.game.phase = phase;

			rival.emit('blackwhite', blackWhite(point));
			updateGame(rival, socket);

			if (socket.game.submittedPoint == -1) {
				rival.game.submittedPoint = point;
				socket.game.submittedPoint = point;
				socket.emit('rivaldoing');
				rival.emit('doTurn', false);
				return;
			}
			turnOver(point);
			rival.emit('rivaldoing');
			socket.emit('doTurn', true);
			rival.game.submittedPoint = -1;
			socket.game.submittedPoint = -1;
		}
		catch(err){console.log(err);}


		function blackWhite(point){
			if(	point > 9)
				return 'white';
			return 'black';
		}



		function turnOver(point){
			var submit = socket.game.submittedPoint;
			if(submit==-1){
				setTimeout(turnOver(point), 1000);
				console.log('err');
				return;
			}

			if(parseInt(submit)<parseInt(point)){
				socket.game.win++;
				if(socket.game.win>4){
					try {
						var wins = parseInt(users[socket.fbid].gamewin) + 1;
						console.log('win', wins);

					}
					catch(err){}
					socket.emit('winner');
					rival.emit('loser');
					users[socket.fbid].ing = false;
					users[facebookId].ing = false;
					return;
				}
				rival.emit('turnOver', false);
				socket.emit('turnOver',	true);
				return;
			}
			rival.game.win++;
			if(rival.game.win>4){
				try {
					var wins = parseInt(users[rival.fbid].gamewin) + 1;
					console.log('win', wins);
				}
				catch(err){}
				rival.emit('winner');
				socket.emit('loser');
				users[socket.fbid].ing = false;
				users[facebookId].ing = false;
				return;
			}
			socket.emit('turnOver',false);
			rival.emit('turnOver', true);

		}

	});




	socket.on('usedpoints', function(usedpoints){
		try{
			console.log(socket.fbid ,usedpoints);
			var rival = socket.broadcast.to(socket.game.room);
			rival.emit('yourusedpoints', usedpoints);
			users[socket.fbid].ing = false;
			users[rival.fbid].ing = false;
			socket.leave(rival.fbid);

			setTimeout(function(){
				socket.game = undefined;
				rival.game = undefined;
				socket.emit('updateusers', users);
				rival.emit('updateusers', users);
				console.log(users);

			}, 1000);
		}
		catch(err){

		}
	});



	socket.on('decline', function (facebookId) {
		sockets[users[facebookId].index].emit('decline', users[socket.fbid].name);
	});



	socket.on('adduser', function(facebookid, fbname){
		if(users[facebookid]!=undefined){
			socket.emit('updatechat', '붕대맨', '이미 접속중입니다.');
			return;
		}
		socket.fbid = facebookid;
		sockets.push(socket);
		var win = 0;


		users[facebookid] = {name : fbname, index : index, gamewin: win, ing:false};
		index++;

		socket.emit('updatechat', '붕대맨', '흑과백에 접속하셨습니다.');
		socket.broadcast.emit('updatechat', '붕대맨', fbname + '님이 오셨습니다.');
		io.sockets.emit('updateusers', users);
	});

	socket.on('disconnect', function(){

		if(socket.game != undefined){
			try {
				var rival = sockets[users[socket.game.rival].index];
				rival.leave(socket.game.room);
				rival.emit('out');
				users[socket.game.rival].ing = false;
				rival.game = undefined;
				rival.leave(socket.fbid);
			}
			catch(err){

			}
		}
		try {
			socket.broadcast.emit('updatechat', '붕대맨', users[socket.fbid].name + '님이 나갔습니다.');
		}
		catch(err){}
		delete users[socket.fbid];
		io.sockets.emit('updateusers', users);
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
