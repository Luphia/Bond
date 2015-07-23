var ParentBot = require('./_SocketBot.js')
,	util = require('util')
,	BorgRing = require('borgring')
,	Result = require('../classes/Result.js');

var Bot = function (config) {
	if (!config) config = {};
	this.init(config);
	this.path = [
		{"method": "post", "path": "/track/:id"},
		{"method": "get", "path": "/track/:id"},
		{"method": "get", "path": "/track/"}
	];
};

util.inherits(Bot, ParentBot);

Bot.prototype.start = function() {
	this.db.listData('nodes', function(e, d) {
		this.nodes = d;
	});
};

Bot.prototype.exec = function (msg, callback) {
	var path = msg.url;
	var method = msg.method.toLowerCase();
	var clientID = msg.params.id;

	switch(method) {
		case 'get':
			this.checkNode(node, callback);
			break;

		case 'post':
			this.addNode(node, callback);
			break;

		case 'put':
			this.updateNode(node, callback);
			break;

		default:
			callback(false, new Result().toJSON());
			break;
	}
};
Bot.prototype.checkNode = function(node, callback) {

};
Bot.prototype.addNode = function(node, callback) {

};
Bot.prototype.updateNode = function(node, callback) {

};
Bot.prototype.exist = function(node) {
	
};

module.exports = Bot;