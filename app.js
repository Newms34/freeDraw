var express = require('express'),
    logger = require('morgan'),
    path = require('path'),
    bodyParser = require('body-parser');

var app = express();
var routes = require('./routes');
var config = require('./.config');

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
var currUserTimes=[];
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
        currUserTimes[pos] = new Date().getTime();//update time
        console.log(drawObj)
        io.emit('outDraw', drawObj);
    });
    socket.on('getInitPic',function(usr){
        //a user just logged in, so give them the 
        //current picture by fetching it from the
        //first user in our list. also reg them
        currUserNames.push(usr.usr);
        currUserTimes.push(new Date().getTime())
        if(currUserNames.length==1){
            //no other users, so just return 0
            console.log('first user connected!')
            return 'blank';
        }
        else{
            //ask the first user for the current pic
            //we're also senting the user who WANTS this pic
            io.emit('getPicStart',{
                usr:currUserNames[0],
                wants:usr.usr
            });
        }
    });
    socket.on('usrGivePic',function(newUsrPic){
        //sent intitial pic to a new user
        //we get the data and the target user
        io.emit('sendInitPic',newUsrPic);
    })
    //this timer "DCs" inactive users. All this
    // actually does is push them from the user list, so that they're not
    //used as the new user template
    var t = setInterval(function(){
        var now = new Date().getTime();
        for (var i=0;i<currUserTimes.length;i++){
            if((now-currUserTimes[i])>60000){
                //more than a minute has elapsed!
                currUserTimes.splice(i,1);
                currUserNames.splice(i,1);
            }
        }
    },60000)
});
io.on('error', function(err) {
    console.log("SocketIO error! Error was", err)
});
//set port, or process.env if not local

http.listen(process.env.PORT || 8080);

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
