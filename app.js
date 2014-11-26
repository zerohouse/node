var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);
server.listen(8001);
require('./chat.js').setIo(io).setMaker('BlackNWhite');

var express2 = require('express')
    , app2 = express2()
    , http2 = require('http')
    , server2 = http2.createServer(app2)
    , io2 = require('socket.io').listen(server2);
server2.listen(8000);
require('./chat.js').setIo(io2).setMaker('AnimalChess');

httpProxy = require('http-proxy');
httpProxy.createProxyServer({target:'http://localhost:8080'}).listen(80);