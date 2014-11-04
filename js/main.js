var socket = io.connect('http://54.65.20.191:80');
var game = {usablePoint : 99, round:1};
var warringhtml = $('warring').html();

socket.on('connect', function(){
    socket.emit('adduser', prompt("게임에서 사용할 이름을 입력해주세요."));
});

socket.on('updatechat', function (username, data) {
    var con = $('#conversation');
    con.append('<li>'+username + ': ' + data + '</li>');
    con.scrollTop(1000000);
});

socket.on('updateusers', function(data) {
    $('#users').empty();
    $.each(data, function(key, value) {
        $('#users').append('<li>' + key + '</li>');
        $('#users > li:last-child').click(function (){
            var rivalname = $(this).text();
            if(confirm(rivalname+"님께 게임 요청을 보낼까요?"))
                socket.emit('challenge', rivalname);
        });

    });
});

socket.on('challenge', function (username) {
    if(confirm(username + "님이 도전하셨습니다. 게임을 시작할까요?")){
        socket.emit('gameStart', username);
    }
    else{
        socket.emit('decline', username);
        console.log('decline')
    }
});

socket.on('winner', function(){
    warring('게임 패배ㅠㅠ');
    status('게임에서 승리하였습니다.<br>게임이 종료되었습니다.');
    setTimeout(function(){$('#warring').html(warringhtml).show();}, 4000
    );
});

socket.on('loser', function(){
    warring('게임 패배ㅠㅠ');
    status('게임에서 패배하였습니다.<br>게임이 종료되었습니다.');
    setTimeout(function(){$('#warring').html(warringhtml).show();}, 4000
    );

});


socket.on('start', function (type, rivalname) {
            phaseAdopt(5,5);
            game = {usablePoint : 99, round:1};
            status(rivalname+"님 과의 게임이 시작되었습니다.<br>");
            $('#playerid').text(rivalname);
            roundUpdate();

            if(type){
                status("당신은 선 플레이어 입니다.<br> 사용할 포인트를 입력해주세요.");
                $('#submitpoint').removeAttr('disabled');
               return;
            }
    status("상대가 포인트를 입력하고 있습니다.");
});

socket.on('updateGame', function (mydata, rivaldata) {

    game.usablePoint = mydata.point;
    $('#myWin').text(mydata.win);
    $('#youWin').text(rivaldata.win);
    phaseAdopt(mydata.phase, rivaldata.phase);
    console.log(mydata);
    console.log(rivaldata);

});

socket.on('alertPoint', function (blackflag, phase) {
    console.log(blackflag);
    console.log(phase);
});

socket.on('turnOver', function (isWin) {
    if(isWin){
        status('승점을 획득하였습니다.');
        $('#myWin').text(parseInt($('#myWin').text())+1);
        warring((game.round-1)+'라운드 승리!');
        return;
    }
    $('#youWin').text(parseInt($('#youWin').text())+1);
    status('이번 라운드에서 승점을 얻지 못했습니다.');
    warring((game.round-1)+'라운드 패배!');


    roundUpdate();
});

socket.on('rivaldoing', function () {
    status('상대가 포인트를 입력하고 있습니다.');
});

socket.on('doTurn', function (isFirst) {
    console.log('doTurn');
    $('#submitpoint').removeAttr('disabled');
    if(isFirst){
        status("당신은 선 플레이어 입니다.<br>사용할 포인트를 입력해주세요.");
        return;
    }
    status("사용할 포인트를 입력해주세요.");
});

socket.on('blackwhite', function (type) {
    if(type=='white'){
        warring('백');
        status('상대방이 백을 제시했습니다.');
        $('#blackwhite li:eq(0)').css('opacity', 0.1);
        $('#blackwhite li:eq(1)').css('opacity', 1);
        return;
    }
    $('#blackwhite li:eq(0)').css('opacity', 1);
    $('#blackwhite li:eq(1)').css('opacity', 0.1);
    warring('흑');
    status('상대방이 흑을 제시했습니다.');
});

socket.on('decline', function (username) {
    status(username + "님이 도전을 거절하셨습니다.")
});

$(function(){


    $('#datasend').click( function() {
        var message = $('#data').val();
        $('#data').val('');
        $('#data').focus();
        socket.emit('sendchat', message);
    });

    $('#data').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#datasend').focus().click();
        }
    });

    $('#submitpoint').click(function (){
        var point = $('#point').val();
        if (point =="")
            return;

        if( 0 <= point  && point <= game.usablePoint ){
            socket.emit('submitpoint', point);
            $('#submitpoint').attr('disabled', '');
            return;
        }
        status("Err! : 0~"+game.usablePoint+" 사이의 포인트를 입력해주세요.")
        $('#point').val('');
        $('#point').focus();

    });

});

function status(message){
    var status =  $('#status');
    $('#status li').css('opacity', 0.3);
    $('#status li:last-child').css('opacity', 0.7);
    status.append('<li>'+message+'</li>');
    status.scrollTop(1000000);
}

function phaseAdopt(myphase, rivalphase){
    phase(rivalphase,'#rivalblock');
    phase(myphase, '#myblock');

    function phase(phase, domId){
        $(domId+' li').css('opacity',1);
        for (var i=0;i<5-phase;i++){
            console.log(domId+i);
            $(domId+' li:eq('+i+')').css('opacity',0.2);
        }
    }

}

function warring(message){
    var warring = $('#warring');
    if(warring.css('display')!='none'){
        warring.html(warring.html()+"<br>"+message);
        }else{
         warring.html(message);
        }
    warring.show();
    setTimeout(function(){
        warring.hide(500);
    }, 2000);

}

function roundUpdate(){
    warring("라운드"+ game.round + "시작");
    status("라운드"+ game.round +" 이 시작되었습니다.");
    game.round++;
}