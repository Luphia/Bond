var ParentBot = require('./_SocketBot.js')
,	fs = require('fs')
,	path = require('path')
,	util = require('util')
,	crypto = require('crypto')
,	Raid2X = require('raid2x')
,	Result = require('../classes/Result.js');

var Bot = function (config) {
	if (!config) config = {};
	this.init(config);
	this.path = [
		{"method": "post", "path": "/shard/:hash"},
		{"method": "post", "path": "/r2x/"}
	];
};

util.inherits(Bot, ParentBot);

Bot.prototype.init = function (config) {
	Bot.super_.prototype.init.call(this, config);

	this.homePath = path.join(__dirname, '../');
	this.shardPath = path.join(__dirname, '../shards/');
	try {
		this.homePath = this.config.path.home;
		this.shardPath = this.config.path.shards;
	}
	catch(e) {}
};

Bot.prototype.exec = function (msg, callback) {
	var path = msg.url;
	if(/^\/shard\//.test(path)) {
		this.postShard(msg, callback);
	}
	else if(/^\/r2x\//.test(path)) {
		this.postMeta(msg, callback);
	}
	else {
		callback(false, new Result().toJSON());
	}
};

Bot.prototype.postShard = function (msg, callback) {
	if(msg.blob) { msg = {"body": msg}; }

	var result = new Result();
	var response = !!msg.query.response;
	var rs = 0;
	var toChecked = 0;


	for(var key in msg.files) {
		toChecked ++;

		var hash = msg.params.hash;
		var oldname = msg.files[key]["path"];
		var newname = path.join(this.shardPath, hash);

		var s = fs.ReadStream(oldname);
		var shasum = crypto.createHash('sha1');
		s.on('data', function(d) {
			shasum.update(d);
		});
		s.on('error', function() {
			result.setMessage("something wrong with: " + oldname);

			toChecked--;
			if(toChecked == 0) {
				callback(false, result.toJSON());
			}
		});
		s.on('end', function() {
			var d = shasum.digest('hex');
			toChecked--;

			if(hash.indexOf(d) == 0) {
				var source = fs.createReadStream(oldname);
				var dest = fs.createWriteStream(newname);
				source.pipe(dest);
				source.on('end', function() { fs.unlink(oldname, function() {}); });

				result.setResult(1);
				result.setData({});

				callback(false, result.toJSON());
			}
			else if(toChecked == 0) {
				fs.unlink(oldname, function() {});
				result.setData({
					path: hash,
					hash: d,
					file: oldname
				});
				callback(false, result.toJSON());
			}
			else {
				fs.unlink(oldname, function() {});
				console.log(tochecked);
			}
		});		
	}

	return true;
};

Bot.prototype.postMeta = function (msg, callback) {
	var self = this;
	var result = new Result();
	var meta = msg.body;
	var r2x = new Raid2X(meta);
	var id;

	/*
	var todo = 2;
	var done = function() {
		if(--todo == 0) {
			self.db.putData("files", id, meta, function(e, d) {});
		}
	}
	*/
	self.db.postData("files", meta, function(e, d) {
		result.setResult(1);
		id = d;
		callback(false, result.toJSON());
		// done();
	});

	/* no need to gen Check Buffer
	r2x.importAllFile(this.shardPath, function(e, d) {	
		r2x.genCheckBuffer(this.shardPath, function(e, d) {
			meta.shardList = r2x.shardList;
			done();
		});
	});
	*/

	return true;
};

module.exports = Bot;