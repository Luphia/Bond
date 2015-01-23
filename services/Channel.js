var Channel = function(config) {
	this.init(config);
};

Channel.prototype.init = function(config) {
	
};
Channel.prototype.setConfig = function(config) {
	this.config = config;
	this.io = require('socket.io').listen(this.config.get('server'), {
	    'pingInterval': 3600000,
	    'pingTimeout': 3600000
	});
};

Channel.prototype.start = function() {
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