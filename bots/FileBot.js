var ParentBot = require('./_SocketBot.js')
,	fs = require('fs')
,	path = require('path')
,	util = require('util')
,	crypto = require('crypto')
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

	var shardPath = path.join(__dirname, '../shards/')
	var result = new Result();
	var response = !!msg.query.response;
	var rs = 0;
	var toChecked = 0;

	for(var key in msg.files) {
		toChecked ++;

		var hash = msg.params.hash;
		var oldname = path.join(__dirname, '../' + msg.files[key]["path"]);
		var newname = path.join(shardPath, hash);

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
				result.setData({
					path: hash,
					hash: d,
					file: oldname
				});
				callback(false, result.toJSON());
			}
			else {
				console.log(tochecked);
			}
		});		
	}


	return true;
};

module.exports = Bot;