var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);
server.listen(8001);
require('./chat.js').setIo(io).setMaker('BlackNWhite');

var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);
server.listen(8000);
require('./chat.js').setIo(io).setMaker('AnimalChess');

httpProxy = require('http-proxy');
httpProxy.createProxyServer({target:'http://localhost:8080'}).listen(80);