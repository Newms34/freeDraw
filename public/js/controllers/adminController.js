var app = angular.module("freeDrawAdm", []);
var socket = io();

app.controller("adminController", function($scope, $window,$http) {
    $scope.serverRunning=true;
    $scope.stopServ = function() {
        bootbox.dialog({
            message: "Are you absolutely sure you want to stop the server? Warning: doing this will completely halt the server, and it will need to be restarted manually!<hr/>Server Password:<input id='servPass'/>",
            title: "Emergency Server Stop",
            buttons: {
                danger: {
                    label: "Stop Server",
                    className: "btn-danger",
                    callback: function() {
                        $scope.sendPass($('#servPass').val())
                    }
                },
                main: {
                    label: "Cancel",
                    className: "btn-info",
                    callback: function() {
                        //does not want to stop, do nothin
                    }
                }
            }
        });
    }
    $scope.sendPass = function(pwd){
        console.log('User thinks pwd is:',pwd)
        socket.emit('sendPwd',{pwd:pwd});
    };
    socket.on('passResp',function(res){
        $scope.serverRunning = !res.resp;
        console.log('password resp',res)
        $scope.$digest();
        if ($scope.serverRunning){
            bootbox.alert('Wrong password!')
        }
    });
});
