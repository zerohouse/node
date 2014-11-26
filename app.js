var express = require('express')
	, http = require('http')
	, animalserver = http.createServer(express())
	, bnwserver = http.createServer(express())
	, animalio = require('socket.io').listen(animalserver)
	, bnwio = require('socket.io').listen(bnwserver);

animalserver.listen(8000);
require('./chat.js').setIo(animalio).setMaker('AnimalChess');
bnwserver.listen(8001);
require('./chat.js').setIo(bnwio).setMaker('BlackAndWhite');




httpProxy = require('http-proxy');
httpProxy.createProxyServer({target:'http://localhost:8080'}).listen(80);




