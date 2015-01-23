/*

	Bot want to buy 1 ~ 4 tickets
	Bot need to condsider 5 ~ 20 second before acting
	Bot would quit if all tickets was sold out
 */

var io = require('socket.io-client');
var ID = 0;

var zeroFill = function(d, length) {
	var l = parseInt(length);
	if(!l > 0) { l = 8; }

	var s = d.toString();
	while(s.length < l) {
		s = "0" + s;
	}
	return s;
};
var random = function(a, b) {
	if(a > b) { return random(b, a); }

	var range = b - a;
	return Math.random() * range + a;
};

var Bot = function(config) { this.init(config); };

Bot.prototype.init = function(config) {
	var self = this;

	this.ID = "BOT" + zeroFill(++ID, 8);
	this.birth = new Date();
	this.connect = io('ws://10.10.23.55');
	this.connect.on('channel', function(d) {
		var ev = d.event
		,	data = d.data

		switch(ev) {
			case 'getTickets':
				self.getTickets(data);
				break;
			case 'sold':
				self.getSold(data);
				break;
			case 'buyType':
				self.getBuyType(data);
			case 'buyCode':
				self.getBuyCode(data);
		}
	});

	this.want = parseInt(random(1, 4));
	this.goods = [];
	this.remainTickets = [];
	this.remainType = {};
	this.request('getTickets');
};

Bot.prototype.request = function(ev, data) {
	var msg = {
		"event": ev,
		"data": data
	};

	this.connect.emit('channel', msg);
};

Bot.prototype.getTickets = function(data) {
	this.remainTickets = data;
	this.countRemain();
	this.active = true;
};
Bot.prototype.countRemain = function() {
	this.remainType = {};
	for(var k in this.remainTickets) {
		var type = this.remainTickets[k].substr(0, 3);
		if(!this.remainType.hasOwnProperty(type)) { this.remainType[type] = 0; }
		this.remainType[type]++;
	}

	return this.remainType;
};
Bot.prototype.getSold = function(tickets) {
	if(!this.active) return false;

	for(var k in tickets) {
		var ticket = tickets[k];
		var type = ticket.substr(0, 3);
		this.remainTickets.splice( this.remainTickets.indexOf(ticket) , 1);
		this.remainType[type]--;
	}
};
Bot.prototype.getBuyCode = function(data) {

	if(data) {
		this.want--;
		this.goods.push(data);
		console.log(this.ID + " get " + data[0]);
	}

	this.done();
};
Bot.prototype.getBuyType = function(data) {
	for(var k in data) {
		if(data[k]) {
			this.want--;
			this.goods.push(data[k]);
			console.log(this.ID + " get " + data[k][0]);
		}
	}
	this.done();
};
Bot.prototype.done = function() {
	this.todo--;
	if(this.todo <= 0) this.finish();
};
Bot.prototype.buyTicket = function(type, number) {

};
Bot.prototype.focus = function() {

};
Bot.prototype.consider = function(action, probability) {
	if(!parseFloat(probability)) { probability = 1; }

	var time = random(0, 5000);
	if(Math.random() < probability) {
		setTimeout(action, time);
	}
};

Bot.prototype.shopping = function() {
/*
	this.todo = 1;

	var targets = [];
	for(var k in this.remainType) {
		if(this.remainType[k] >= this.want) {
			targets.push(k);
		}
	}

	var target = targets[Math.floor(Math.random() * targets.length)];
	var data = {"type": target, "number": this.want};

	var self = this;
	if(target) {
		this.consider(function() { self.request('buyType', data); });
	}
	else {
		this.consider(function() { self.finish(); });
	}
*/

	this.todo = this.want;

	var self = this;
	var targets = [];
	for(var i = 0; i < this.want; i++) {
		var target = this.remainTickets[ Math.floor(Math.random() * this.remainTickets.length) ];
		var data = target;
		this.consider(function() { self.request('buyCode', data); });
	}
};
Bot.prototype.finish = function() {
	if(this.want > 0) {
		this.shopping();
	}
	else {
		var worktime = new Date() - this.birth;
		console.log('\x1b[32m%s\x1b[0m worktime - %d sec', this.ID, (worktime / 1000));
		this.connect.disconnect();

		this.ID = "BOT" + zeroFill(++ID, 8);
		this.birth = new Date();
		this.connect.connect();
		this.want = parseInt(random(1, 4));
		this.goods = [];
		this.remainTickets = [];
		this.remainType = {};
		this.request('getTickets');
		this.start();
	}
};
Bot.prototype.start = function() {
	this.shopping();
};

/*

var Bot = require('./bin/Bot.js');
var bot = new Bot();
bot.start();

 */

 module.exports = Bot;