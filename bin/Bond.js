#!/usr/bin/env node

var config = require('../config')
,	Web = require('../services/Web.js')
,	Channel = require('../services/Channel.js')
,	log4js = require('log4js')
;

var web = new Web()
,	channel = new Channel()
;

log4js.configure(config.get('log4js'));
var logger = {
	normal: log4js.getLogger('Kamato.INFO'),
	exception: log4js.getLogger('Kamato.EXCEPTION'),
	hack: log4js.getLogger('Kamato.HACK')
};
logger.normal.setLevel('INFO');
logger.exception.setLevel('ERROR');
logger.hack.setLevel('WARN');
config.set('logger', logger);
config.set('server', web.getServer());

// log for crash event
process.on('uncaughtException', function(err) {
	logger.exception.error(err);
});

web.setConfig(config);
channel.setConfig(config);

web.start();
channel.start();