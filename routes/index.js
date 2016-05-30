var express = require('express');
var router = express.Router();
var path = require('path');

// router.get('/',function(req,res,next){
// 	res.sendFile('index.html',{"root":'./views'});
// });
// router.get('/admin',function(req,res,next){
// 	res.sendFile('admin.html',{"root":'./views'});
// });
// router.get('/music',function(req,res,next){
// 	res.sendFile('music.html',{"root":'./views'});
// });

router.get('/',function(req,res,next){
	res.sendFile(path.join(__dirname, '../views', 'index.html'));
});
router.get('/admin',function(req,res,next){
	res.sendFile(path.join(__dirname, '../views', 'admin.html'));
});
router.get('/music',function(req,res,next){
	res.sendFile(path.join(__dirname, '../views', 'music.html'));
});

router.get('/temp',function(req,res,next){
	res.send('HI');
});
// res.sendFile(path.join(__dirname, '../public', 'index1.html'));
module.exports=router;