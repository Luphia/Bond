var express = require('express')
,	Session = require('express-session')
,	express = require('express')
,	favicon = require('serve-favicon')
,	fs = require('fs')
,	path = require('path')
,	bodyParser = require('body-parser')
,	log4js = require('log4js')
;

var Web = function(config) {
	this.init();
};

Web.prototype.init = function(config) {
	this.router = express.Router();
	this.app = express();
	this.https = require('https');
	this.server = require('http').createServer(this.app);

	if(config) {
		this.setConfig(config);
	}
};
Web.prototype.setConfig = function(config) {
	this.config = config;
	this.logger = this.config.get('logger');
	this.session = Session({
		secret: this.config.get('web').secret,
		resave: true,
		saveUninitialized: true
	});

	this.app.set('port', this.config.get('web').port);
	this.app.set('https', this.config.get('web').https);
	this.app.set('view engine', 'jade');

	this.app.use(log4js.connectLogger(this.logger.normal));
	this.app.use(this.session);
	this.app.use(bodyParser.urlencoded({ extended: false }));
	this.app.use(bodyParser.json());
	this.app.use(express.static(path.join(__dirname, '../public')));
	this.app.use(this.router);
};
Web.prototype.start = function() {
	var self = this;
	var httpPort = this.app.get('port');
	this.server.listen(httpPort, function () {
		self.logger.normal.info('Server listening at port %d', httpPort);
	});
};
Web.prototype.getRoute = function() { return this.Router; };
Web.prototype.getAPP = function() { return this.app; };
Web.prototype.getServer = function() { return this.server; };
Web.prototype.getSecure = function() { return this.secureServer; };

module.exports = Web;