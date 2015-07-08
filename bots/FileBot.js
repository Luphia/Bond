var ParentBot = require('./_SocketBot.js')
,	fs = require('fs')
,	path = require('path')
,	util = require('util')
,	Result = require('../classes/Result.js');

var Bot = function (config) {
	if (!config) config = {};
	this.init(config);
	this.path = [
		{"method": "post", "path": "/shard/:hash"}
	];
};

util.inherits(Bot, ParentBot);

Bot.prototype.init = function (config) {
	Bot.super_.prototype.init.call(this, config);

};

Bot.prototype.exec = function (msg, callback) {
	if(msg.blob) { msg = {"body": msg}; }

	var result = new Result();
	var response = !!msg.query.response;

	for(var key in msg.files) {
		var hash = msg.params.hash;
		var oldname = path.join(__dirname, '../' + msg.files[key]["path"]);
		var newname = path.join(__dirname, '../uploads/' + hash);
		fs.rename(oldname, newname, function() {});
	}

	result.setResult(1);
	result.setData({});

	callback(false, result.toJSON());
	return result.toJSON();
};

module.exports = Bot;