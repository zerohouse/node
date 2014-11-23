var chat = {
    setIo: function(io){
        chat.io = io;
        io.sockets.on('connection', function (socket) {
            chat.joinRoom('square', socket);
            chat.updateRooms();

            socket.on('init', function(data){
                socket.user = data;
            });

            socket.on('makeroom',function(roomdata){
                chat.makeRoom(roomdata, socket);
                chat.joinRoom(socket.id, socket);
                chat.updateRooms();
            });

            socket.on('joinRoom', function(roomid){
                chat.joinRoom(roomid, socket);
                chat.updateRooms();
            });

            socket.on('game', function(data){
                socket.broadcast.to(socket.room).emit('game', data);
            });

            socket.on('sendchat', function(data){
                chat.chat(socket,data);
            });

            socket.on('disconnect', function () {
                chat.leaveRoom(socket);
            });
        });
        return this;
    },

    rooms : {
        square:{
            name:'광장',
            users:0,
            maxusers:1000,
            roomid:'square',
            maker:'animal',
            time:""
        }
    },

    updateRooms : function(){
        chat.io.emit('roomupdate', chat.rooms);
    },

    joinRoom : function(roomid, socket){
        if(chat.rooms[roomid].maxusers <= chat.rooms[roomid].users) {
            socket.emit('join', false);
            return;
        }
        if(socket.room==roomid){
            socket.emit('join', true);
            return;
        }
        chat.rooms[roomid].users++;
        chat.leaveRoom(socket);
        socket.room = roomid;
        socket.join(roomid);
        socket.emit('join', true, chat.rooms[roomid]);
        if(socket.user == undefined)
            return;
        chat.chat(socket, { chat: socket.user.name +'님이 들어왔습니다.'});
    },

    leaveRoom : function(socket){
        if(socket.room == undefined)
            return;
        if(socket.user == undefined)
            return;
        chat.chat(socket, { chat: socket.user.name +'님이 나갔습니다.'});
        socket.leave(socket.room);
        chat.rooms[socket.room].users--;
        if(chat.rooms[socket.room].users<=0 && socket.room!='square'){
            delete chat.rooms[socket.room];
        }
        socket.room == undefined;
    },

    makeRoom: function(roomdata, socket){
        roomdata.roomid = socket.id;
        roomdata.maxusers = 2;
        roomdata.users = 0;
        chat.rooms[socket.id] = roomdata;
    },

    chat: function(socket, message){
        message.name = socket.user.name;
        chat.io.to(socket.room).emit('chat', message);
    }
};


module.exports = chat;
