var express = require('express');
var router = express.Router();

router.get('/',function(req,res,next){
	res.sendFile('index.html',{"root":'./views'});
});
router.get('/admin',function(req,res,next){
	res.sendFile('admin.html',{"root":'./views'});
});
router.get('/music',function(req,res,next){
	res.sendFile('music.html',{"root":'./views'});
});
router.get('/temp',function(req,res,next){
	res.send('HI');
});
module.exports=router;