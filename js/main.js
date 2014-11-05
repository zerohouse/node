    $('#gameContainer').draggable();
    $('.foot').each(function(){$(this).draggable();});





    function statusChangeCallback(response) {
        if (response.status === 'connected') {
            fbConnected();
        }
    }

    function checkLoginState() {
        FB.getLoginStatus(function(response) {
            statusChangeCallback(response);
        });
    }

    window.fbAsyncInit = function() {
        FB.init({
            appId      : '508840425919832',
            cookie     : true,  // enable cookies to allow the server to access
                                // the session
            xfbml      : true,  // parse social plugins on this page
            version    : 'v2.1' // use version 2.1
        });

        FB.getLoginStatus(function(response) {
            statusChangeCallback(response);
        });

        FB.Event.subscribe('auth.statusChange', function(){location.reload();});
    };

    (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    function fbConnected() {
        console.log('Welcome!  Fetching your information.... ');
        FB.api('/me', function(response) {
            login(response.id, response.name);
        });
    }













function login(fbid, fbname){

    status('로그인 되었습니다.');
    status('현재 접속자 창에서 다른 사용자의 이름을 눌러 대결을 신청해 보세요.');

    var socket = io.connect('http://localhost:8080');
    var game = {usablePoint : 99, round:1, rival: "", myid: fbid};

    $('#logintitle').text(fbname);
    $('#logincontents').html('<br>안녕하세요! 흑과 백2입니다.');
    $('#fblogin').hide(500);
    var warringhtml = "<font size='6'><br></font>흑과백2<br><font size='4'>게임을 시작하려면 접속자 목록에서<br> 게임하실분의 이름을 아이디를 눌러주세요.</font>";

    socket.on('connect', function(){
        socket.emit('adduser', game.myid, fbname);
    });

    socket.on('updatechat', function (username, data) {
        var con = $('#conversation');
        con.append('<li>'+username + ': ' + data + '</li>');
        con.scrollTop(1000000);
    });

    socket.on('out', function () {
            setTimeout(function(){$('#warring').html(warringhtml).show();}, 4000
            );
            status('상대가 나갔습니다.');
            $('#usercon').show(500);
            $('#chattitle').text("채팅");
            $('#conversation').empty();
            $('#conversation').append("<li>붕대맨 : 게임이 끝났습니다. 새로운 상대를 선택해 보세요.</li>");
    });

    socket.on('updateusers', function(data) {
        $('#users').empty();
        $.each(data, function(key, value) {
            if(key == game.myid) {
                $('#users').append("<li style='cursor:auto;color:darkred'>" + value.name + ' ( 나 )</li>');
                return;
            }
            $('#users').append("<li data-id="+ value.id + ">" + value.name + '</li>');
            $('#users > li:last-child').click(function (){
                if(confirm(value.name+"님께 게임 요청을 보낼까요?"))
                    socket.emit('challenge', value.id);
            });

        });
    });

    socket.on('challenge', function (username, Id) {
        if(confirm(username + "님이 도전하셨습니다. 게임을 시작할까요?")){
            socket.emit('gameStart', Id);
        }
        else{
            socket.emit('decline', Id);
        }
    });

    socket.on('winner', function(){
        warring('게임 패배ㅠㅠ');
        status('게임에서 승리하였습니다.<br>게임이 종료되었습니다.');
        setTimeout(function(){$('#warring').html(warringhtml).show();}, 4000
        );
        $('#usercon').show(500);
        $('#chattitle').text("채팅");
        $('#conversation').empty();
        $('#conversation').append("<li>붕대맨 : 게임이 끝났습니다. 새로운 상대를 선택해 보세요.</li>");
    });

    socket.on('loser', function(){
        warring('게임 패배ㅠㅠ');
        status('게임에서 패배하였습니다.<br>게임이 종료되었습니다.');
        setTimeout(function(){$('#warring').html(warringhtml).show();}, 4000
        );
        $('#usercon').show(500);
        $('#chattitle').text("채팅");
        $('#conversation').empty();
        $('#conversation').append("<li>붕대맨 : 게임이 끝났습니다. 새로운 상대를 선택해 보세요.</li>");

    });


    socket.on('start', function (type, name, id) {

                $('#usercon').hide(500);
                $('#chattitle').text(name+"님과의 채팅");
                $('#conversation').empty();

                phaseAdopt(5,5);
                game = {usablePoint : 99, round:1, rival: {name:name,id:id}};
                status(name+"님 과의 게임이 시작되었습니다.<br>");
                $('#playerid').text(name);

                roundUpdate();

                if(type){
                    status("당신은 선 플레이어 입니다.<br> 사용할 포인트를 입력해주세요.");
                    $('#submitpoint').removeAttr('disabled');
                    $('#point').css('border','3px solid red');
                   return;
                }
        status("상대가 포인트를 입력하고 있습니다.");
    });

    socket.on('updateGame', function (mydata, rivaldata) {

        game.usablePoint = mydata.point;
        $('#myWin').text(mydata.win);
        $('#youWin').text(rivaldata.win);
        phaseAdopt(mydata.phase, rivaldata.phase);

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
        $('#submitpoint').removeAttr('disabled');
        $('#point').css('border','3px solid red');
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
                $('#point').css('border','none');
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

}


