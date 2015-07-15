var Bot = require('./_Bot.js')
,	util = require('util')
;


var Channel = function(config) { this.init(config); };

util.inherits(Channel, Bot);

Channel.prototype.init = function(config) {

};

Channel.prototype.setApp = function(server, secureServer) {
	var io = require('socket.io');
	
	if(server) { this.io = io.listen(server); }
	if(secureServer) { io.listen(secureServer); }
};

Channel.prototype.tag = function(client, tag) {
	if(Array.isArray(tag)) {
		for(var k in tag) {
			this.tag(client, tag[k]);
		}
	}

	if(!!tag) {
		if(!this.tags[tag]) {
			this.tags[tag] = [];
		}

		if(this.tags[tag].indexOf(client) == -1) {
			this.tags[tag].push(client);
		}
	}
};

Channel.prototype.untag = function(client) {
	for(var k in this.tags) {
		var clientIndex = this.tags[k].indexOf(client);
		if(clientIndex != -1) {
			this.tags[k].splice(this.tags[k].indexOf(client), 1);
		}
	}
};

Channel.prototype.start = function() {
	var db = this.db;
	var io = this.io;

	// usernames which are currently connected to the chat
	var usernames = {};
	var numUsers = 0;

	io.on('connection', function (socket) {
		var addedUser = false;
		socket.channel = [];
		// when the client emits 'new message', this listens and executes
		socket.on('new message', function (data) {
			var msg = {
				user: {
					uid: socket.id,
					ip: socket.handshake.address.address,
					name: socket.username
				},
				channel: data.channel,
				message: data,
				timestamp: new Date()
			};

			// we tell the client to execute 'new message'
			socket.broadcast.emit('new message', msg);

			//self.send();
		});

		socket.on('meta', function (data) {
			socket.broadcast.emit('meta', data);
		});
		socket.on('shard', function (data) {
			socket.broadcast.emit('shard', data);
		});
		socket.on('requestShard', function (data) {
			socket.broadcast.emit('requestShard', data);
		});

		// when the client emits 'new file message', this listens and executes
		socket.on('new file message', function (data) {
			var msg = {
				user: {
					uid: socket.id,
					ip: socket.handshake.address.address,
					name: socket.username
				},
				channel: data.channel,
				message: data,
				timestamp: new Date()
			};

			// we tell the client to execute 'new message'
			socket.broadcast.emit('new file message', msg);

			//self.send();
		});

		// get file list
		socket.on('file list', function(data) {
			var limit = data.limit || 20;
			var from = data.from || 0;
			var query = from > 0? 'where _id < ' + from + ' limit ' + limit: 'limit ' + limit;

			db.listData('files', query, function(e, d) {
				var msg = {
					files: d
				};

				socket.emit('file list', msg);
			});

		});

		// get channel history
		socket.on('load message', function(data) {

		});

		// get channel list
		socket.on('get channel', function(data) {

		});

		// when the client emits 'add user', this listens and executes
		socket.on('add user', function (username) {
			// we store the username in the socket session for this client
			socket.username = username;
			// add the client's username to the global list
			usernames[username] = username;
			++numUsers;
			addedUser = true;
			socket.emit('login', {
				numUsers: numUsers,
				timestamp: new Date()
			});
			// echo globally (all clients) that a person has connected
			socket.broadcast.emit('user joined', {
				user: {
					name: socket.username
				},
				numUsers: numUsers,
				timestamp: new Date()
			});
		});

		// when the client emits 'typing', we broadcast it to others
		socket.on('typing', function () {
			socket.broadcast.emit('typing', {
				user: {
					name: socket.username
				},
				timestamp: new Date()
			});
		});

		// when the client emits 'stop typing', we broadcast it to others
		socket.on('stop typing', function () {
			socket.broadcast.emit('stop typing', {
				user: {
					name: socket.username
				},
				timestamp: new Date()
			});
		});

		// when the user disconnects.. perform this
		socket.on('disconnect', function () {
			// remove the username from global usernames list
			if (addedUser) {
				delete usernames[socket.username];
				--numUsers;

				// echo globally that this client has left
				socket.broadcast.emit('user left', {
					user: {
						name: socket.username
					},
					numUsers: numUsers,
					timestamp: new Date()
				});
			}
		});

		// when the user join some channel
		socket.on('join', function (room) {
			socket.join(room);
			socket.channel.indexOf(room) == -1 && socket.channel.push(room);
		});

		// where the user leave some channel
		socket.on('leave', function (room) {
			socket.leave(room);
			socket.channel.splice(socket.channel.indexOf(room), 1);
		});
	});

	active = true;

};

module.exports = Channel;