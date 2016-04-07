var express = require('express');
var router = express.Router();

router.get('/',function(req,res,next){
	res.sendFile('index.html',{"root":'./views'});
});
router.get('/admin',function(req,res,next){
	res.sendFile('admin.html',{"root":'./views'})
})
module.exports=router;