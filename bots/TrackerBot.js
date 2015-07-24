var ParentBot = require('./_SocketBot.js')
,	util = require('util')
,	BorgRing = require('borg-ring')
,	Result = require('../classes/Result.js');

var Bot = function (config) {
	if (!config) config = {};
	this.init(config);
	this.path = [
		{"method": "post", "path": "/track/:client"},
		{"method": "get", "path": "/track/:client"},
		{"method": "get", "path": "/track/"}
	];
	this.nodes = [];
	this.nodeIndex = {};
};

util.inherits(Bot, ParentBot);

Bot.prototype.start = function() {
	Bot.super_.prototype.start.apply(this);
	this.loadNode();
};

Bot.prototype.exec = function(msg, callback) {
	var path = msg.url;
	var method = msg.method.toLowerCase();
	var client = msg.params.client;

	var node = {
		client: client,
		port: msg.query.port || 5566,
		ip: msg.session.ip
	};
	if(node.ip == "::1") { node.ip = "127.0.0.1"; }

	var rs;
	switch(method) {
		case 'get':
			rs = client? this.checkNode(node): this.findNode();
			break;

		case 'post':
			rs = this.addNode(node);
			break;

		case 'put':
			rs = this.updateNode(node);
			break;

		default:
			rs = new Result();
			break;
	}

	callback(false, rs.toJSON());
	return true;
};
Bot.prototype.checkNode = function(node, callback) {
	var result;

	if(!this.exist(node)) {
		result = this.addNode(node);
	}
	else {
		result = this.updateNode(node);
	}

	result.setResult(1);
	result.setData(node);	//-- debug info
	return result;
};
Bot.prototype.loadNode = function() {
	var self = this;

	this.db.listData('nodes', {}, function(e, d) {
		self.nodes = d;
	});
};
Bot.prototype.addNode = function(node) {
	var result = new Result();

	if(node.client){
		this.nodeIndex[node.client] = (this.nodes.push(node) - 1);
		result.setResult(1);
		result.setMessage('add node: ' + node.client);

		// write db
		this.db.postData('nodes', node, function(e, d) { node._id = d; });
	}
	else {
		result.setResult(0);
		result.setMessage('Invalid node');
	}

	return result;
};
Bot.prototype.updateNode = function(node) {
	var result = new Result();

	if(node.client && this.nodes[ this.nodeIndex[node.client] ]._id) {
		var dirty = false;

		for(var k in node) {
			if(new RegExp("^_").test(k)) { continue; }
			if(this.nodes[ this.nodeIndex[node.client] ][k] == node[k]) { continue; }

			dirty = true;
			this.nodes[ this.nodeIndex[node.client] ][k] = node[k];
		}
		result.setResult(1);
		result.setMessage('update node: ' + node.client);

		if(dirty) {
			// write db
			this.db.putData('nodes', node._id, node, function() {});
		}
	}
	else {
		result.setResult(0);
		result.setMessage('Invalid node');
	}

	return result;
};
Bot.prototype.findNode = function() {
	var result = new Result();
	result.setResult(1);
	result.setMessage('fetch nodes');
	result.setData(this.nodes);

	return result;
};
Bot.prototype.exist = function(node) {
	return (this.nodeIndex[node.client] >= 0);
};

module.exports = Bot;