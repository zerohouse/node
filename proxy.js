httpProxy = require('http-proxy');
httpProxy.createProxyServer({target:'http://localhost:8080'}).listen(80);