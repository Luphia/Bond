var fs = require('fs')
,	sub = 'json'
,	config = {}
,	reg = new RegExp('\.' + sub + '$')
,	files = fs.readdirSync(__dirname)
;

for(var key in files) {
	if(reg.test(files[key]) && files[key] != 'index.js') {
		var name = files[key].substr(0, files[key].length - sub.length - 1);
		config[name] = require('./' + files[key]);
	}
}

var loader = {
	get: function(key) {
		var data = config.hasOwnProperty(key)? config[key]: false;
		return data;
	}
	, set: function(key, value) {
		config[key] = value;
	}
	, save: function() {

	}
};

module.exports = loader;