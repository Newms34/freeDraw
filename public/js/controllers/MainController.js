var app = angular.module("freeDraw", []);
var socket = io();

app.controller("MainController", function($scope, $window) {
    //set an initial username
    $scope.un = Math.floor(Math.random() * 99999999).toString(32);
    $scope.canv = document.querySelector('#canv');
    $scope.ctx = $scope.canv.getContext("2d");
    $scope.sz = 2;
    $scope.trans = 100;
    $scope.colRaw = '#000000';
    $scope.col = 'rgba(0,0,0,1)';
    $scope.numPlayers = 2;
    $scope.isDrawing = false;
    $scope.serverRunning = true;
    //ask for initial pic
    socket.emit('getInitPic', { usr: $scope.un });
    socket.on('getPicStart', function(getPicUsr) {
        if (getPicUsr.usr == $scope.un) {
            //if this user is the one we're requesting from
            //send the desiring user and the canvas data
            socket.emit('usrGivePic', {
                data: $scope.canv.toDataURL("image/png"),
                wants: getPicUsr.wants
            })
        }
    });
    socket.on('sendInitPic', function(initPicData) {
        if (initPicData.wants == $scope.un) {
            //this is the user that asked for the data
            console.log('Hi new user! Here is your data:', initPicData)
            var img = new Image();
            img.src = initPicData.data;
            img.onload = function() {
                $scope.ctx.drawImage(img, 0, 0);
            };
        }
    })
    socket.on('outDraw', function(drawParams) {
        $scope.ctx.fillStyle = drawParams.col;
        $scope.ctx.fillRect(drawParams.x, drawParams.y, drawParams.sz, drawParams.sz);
    })
    socket.on('updateUserNum', function(numbs) {
        console.log('num:', numbs)
        $scope.numPlayers = numbs.num;
        $scope.$digest();
    })
    
    socket.on('userDC', function(marvel) {
        if ($scope.un == marvel.dcName) {
            bootbox.confirm('It looks like you&rsquo;ve lost your connection! Refresh page?', function(resp) {
                if (resp) {
                    window.location.reload(true);
                }
            })
        }
    })
    socket.on('passResp', function(servStat) {
        alert('TEST')
    });
    console.log(socket)
    $scope.canv.onmousedown = function(e) {
        //start draw
        console.log(e.button)
        if (e.button == 0) {
            $scope.isDrawing = true;
        }
        if (e.button == 2) {
            //if we right click, we need to turn drawing off
            $scope.isDrawing = false;
        }
    }
    $scope.canv.onmouseup = function(e) {
        //stop draw
        if (e.button == 0) {
            $scope.isDrawing = false;
        }
    }
    $scope.canv.onmousemove = function(e) {
        //polyfill type stuffs!
        e.x = e.x || e.clientX;
        e.y = e.y || e.clientY;
        if ($scope.isDrawing) {
            var drawObj = {
                un: $scope.un,
                x: e.x,
                y: e.y,
                col: $scope.col,
                sz: $scope.sz
            };
            socket.emit('drawData', drawObj)
        }
    }
    $scope.setCol = function() {
        var colArr, r, g, b;
        colArr = $scope.colRaw.split('');
        colArr.shift();
        r = parseInt((colArr[0] + '' + colArr[1]), 16);
        g = parseInt((colArr[2] + '' + colArr[3]), 16);
        b = parseInt((colArr[4] + '' + colArr[5]), 16);
        $scope.col = 'rgba(' + r + ',' + g + ',' + b + ',' + ($scope.trans / 100) + ')'
    }
    $scope.qs = ['one', 'two', 'blue']
    $scope.explText = '<h3>FreeDraw</h3><h4>The Collaborative Graffiti Initiative</h4><hr/><b>About:</b><br/>Free draw is a collaborative drawing app, where you&rsquo;re drawing with anonymous other users.<ul><li>You don&rsquo;t know who you&rsquo;re drawing with!</li><li>I don&rsquo;t save the pictures!</li><li>Seriously. I don&rsquo;t. Everything&rsquo;s running off a <a href="https://www.raspberrypi.org/products/model-b-plus/" target="_blank">Raspberry Pi B+</a> server, so I dont even have the ROOM to save your stuff!</li></ul><hr/><b>FAQ:</b><br/><div class="faqQ">How does this work?</div><div class="faqA">In short, magic. In slightly longer, I&rsquo;m using socket.io and HTML canvas to transmit your drawing "commands" thru the server and to other users.</div><div class="faqQ">Really. You can be honest. Do you save anything?</div><div class="faqA">For the last time, no. And it&rsquo;s not just a question of me wanting to keep you safe: I literally cannot save stuff to my server, since there&rsquo;s not enough room!</div><div class="faqQ">But I really like this picture! Can&rsquo;t I keep it?</div><div class="faqA">Of course you can! One of the (many) cool things about HTML Canvas is that it is, in many ways, treated as an image in the browser. To that end, you can save it (right-click, save image, etc.), print it, enlarge it, put it on a coffee mug, etc.</div><div class="faqQ">Can I PLEASE start with an image?</div><div class="faqA">In general, no. That&rsquo;s kinda against the spirit of this app. However, there ARE ways to "hack" the program to get a starting image. I&rsquo;ll let you figure those out, but remember that this will only really work if you are the ONLY person online at the time!</div>';
    $scope.expl = function() {
        bootbox.alert($scope.explText)
    };
    $scope.getPlayers = function() {
        if ($scope.numPlayers < 2) {
            return 'by yourself!';
        } else if ($scope.numPlayers < 3) {
            return 'with 1 other player!'
        } else {
            return 'with ' + ($scope.numPlayers - 1) + ' other players!'
        }
    }
});
