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
    $scope.isDrawing=false;
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
            var img = new Image();
            img.src = initPicData.data;
            img.onload = function() {
                $scope.ctx.drawImage(img, 0, 0);
            };
        }
    })
    socket.on('outDraw',function(drawParams){
        $scope.ctx.fillStyle = drawParams.col;
        $scope.ctx.fillRect(drawParams.x, drawParams.y, drawParams.sz, drawParams.sz);
    })
   $scope.canv.onmousedown = function(e) {
        //start draw
        console.log(e.button)
        if (e.button == 0) {
            $scope.isDrawing = true;
        }
    }
   $scope.canv.onmouseup = function(e) {
        //stop draw
        if(e.button==0){
            $scope.isDrawing = false;
        }
    }
   $scope.canv.onmousemove = function(e) {
        //polyfill type stuffs!
        e.x = e.x || e.clientX;
        e.y = e.y || e.clientY;
        if ($scope.isDrawing) {
            var drawObj =  {
                un:$scope.un,
                x: e.x,
                y: e.y,
                col:$scope.col,
                sz:$scope.sz
            };
            socket.emit('drawData',drawObj)
        }
    }
    $scope.setCol = function() {
        var colArr, r, g, b;
        colArr = $scope.colRaw.split('');
        colArr.shift();
        r = parseInt((colArr[0] + '' + colArr[1]), 16);
        g = parseInt((colArr[2] + '' + colArr[3]), 16);
        b = parseInt((colArr[4] + '' + colArr[5]), 16);
        $scope.col = 'rgba(' + r + ',' + g + ',' + b + ',' + ($scope.trans/100) + ')'
    }
});
