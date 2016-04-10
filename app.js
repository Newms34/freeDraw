var express = require('express'),
    logger = require('morgan'),
    path = require('path'),
    bodyParser = require('body-parser');

var app = express();
var routes = require('./routes');
var config = require('./.config');
var pwd = require('./pwd')

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

//use stuff
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'views')));

app.use('/', routes);


var http = require('http').Server(app);
var io = require('socket.io')(http);
var currUserNames = [];
var currUserTimes = [];
var timer,museTimer;

io.on('connection', function(socket) {
    socket.on('drawData', function(drawObj) {
        /*data of some user drawing
        note that this gets sent to back end, and THEN sent to front as a draw command (so that everyone sees the update potentially at once).
        Stats:
            drawObj.un = username (randomly generated alphanumeric string each time user goes to site)
            drawObj.x = x position of draw cmd
            drawObj.y = y position of draw cmd
            drawObj.sz = size of draw square
            drawObj.col = color (in rgba) of square. can include transparency.

        this function also serves to update the 'last used' timer for users. If they haven't drawn in 5 min, dc em
        */
        var pos = currUserNames.indexOf(drawObj.un);
        currUserTimes[pos] = new Date().getTime(); //update time
        io.emit('outDraw', drawObj);
    });
    
    socket.on('getInitTune', function(usr) {
        //a user just logged in, so give them the 
        //current tune by fetching it from the
        //first user in our list. also register them
        currUserNames.push(usr.usr);
        currUserTimes.push(new Date().getTime());
        sendUserNums();
        if (currUserNames.length == 1) {
            //no other users, so just return 0
            console.log('first user connected!')
            return 'blank';
        } else {
            //ask the first user for the current pic
            //we're also sending the user who WANTS this tune
            askFirstMuse(usr);
        }
        console.log('User List',currUserNames)
    });
    var askFirstMuse = function(usr) {
        io.emit('getTuneStart', {
            usr: currUserNames[0],
            wants: usr.usr
        });
        museTimer = setTimeout(function() {
            //user timed out!
            io.emit('userDC', { dcName: currUserNames[0] })
            currUserTimes.shift();
            currUserNames.shift();
            sendUserNums();
            if (currUserNames.length && currUserNames[0]!=usr.usr) {
                //users remain
                askFirstUser(usr); //try another user!
            }
        }, 700); //after 700ms (.7s), if user we ask for template has not responded, delete em
    }
    socket.on('usrGiveTune', function(newUsrTune) {
        //got a response! clear the timer, since we no longer need to remove that user
        clearTimeout(museTimer);
            //sent intitial tune to a new user
            //we get the data and the target user
        io.emit('sendInitTune', newUsrTune);
    })
    socket.on('getInitPic', function(usr) {
        //a user just logged in, so give them the 
        //current picture by fetching it from the
        //first user in our list. also reg them
        currUserNames.push(usr.usr);
        currUserTimes.push(new Date().getTime());
        sendUserNums();
        if (currUserNames.length == 1) {
            //no other users, so just return 0
            console.log('first user connected!')
            return 'blank';
        } else {
            //ask the first user for the current pic
            //we're also sending the user who WANTS this pic
            askFirstUser(usr);

        }
    });
    var askFirstUser = function(usr) {
        io.emit('getPicStart', {
            usr: currUserNames[0],
            wants: usr.usr
        });
        timer = setTimeout(function() {
            io.emit('userDC', { dcName: currUserNames[0] })
            currUserTimes.shift();
            currUserNames.shift();
            sendUserNums();
            if (currUserNames.length) {
                //users remain
                askFirstUser(usr); //try another user!
            }
        }, 700); //after 700ms (.7s), if user we ask for template has not responded, delete em
    }
    
    socket.on('usrGivePic', function(newUsrPic) {
        //got a response! clear the timer, since we no longer need to remove that user
        clearTimeout(timer);
        console.log('Template to send out:', newUsrPic)
            //sent intitial pic to a new user
            //we get the data and the target user
        io.emit('sendInitPic', newUsrPic);
    })
    var sendUserNums = function() {
        var num = { num: currUserNames.length };
        io.emit('updateUserNum', num)
    }
    socket.on('sendPwd', function(testPwd) {
        var resp = false;
        console.log(new Buffer(testPwd.pwd).toString('base64'))
        if (new Buffer(testPwd.pwd).toString('base64') == pwd.pwd) {
            resp = true;
        }
        var respObj = { resp: resp };
        console.log('sending out',respObj)
        io.emit('passResp', respObj);
        if (resp) {
            killAll();
        }
    })
    var killAll = function(){
        console.log('killinz')
        http.close();
        process.exit();
    }
    socket.on('noteSrv',function(noteObj){
        console.log('note placed:', noteObj)
        io.emit('noteCli',noteObj)
    })
    socket.on('noteRemSrv',function(noteObj){
        console.log('note removed:', noteObj)
        io.emit('noteRemCli',noteObj)
    })
});

io.on('error', function(err) {
    console.log("SocketIO error! Error was", err)
});
//set port, or process.env if not local

http.listen(9264);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500).send({
        message: err.message,
        error: {}
    });
});
/*TO DO:
-Add 'emergency stop' button to halt server
-Improve draw target accuracy. Should be centered
*/
