var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);
server.listen(8001);
require('./chat.js').setIo(io).setMaker('BlackNWhite');


