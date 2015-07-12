'use strict';

/* Controllers */
var KamatoControllers = angular.module('KamatoControllers', []);
KamatoControllers.controller('ChatCtrl', ['$scope', '$compile', '$window', '$routeParams', '$http', 'socket', function($scope, $compile, $window, $routeParams, $http, $socket) {
	/* message type: log text link emotion image sound video */
	var COLORS = [
		'#e2aa99', '#ccbbaa', '#f8cc88', '#f7aa55',
		'#aadd88', '#78bb50', '#c8f095', '#7be8c4',
		'#6699cc', '#aa88dd', '#ccbbff', '#d3aae7'
	];

	$scope.end = false;
	$scope.files = {};
	var s;

	$scope.join = function(ch) {
		if(!ch.listen) {
			$socket.emit('join', ch.channel);
			ch.listen = !ch.listen;
		}
		else {
			$socket.emit('leave', ch.channel);
			ch.listen = !ch.listen;
		}
	};

	$scope.initializeWindowSize = function() {
		$scope.windowHeight = $window.innerHeight;
		$scope.chatAreaHeight = $window.innerHeight - 60;
		$scope.inputAreawidth = $window.innerWidth - 20;
		$scope.boardWidth = ($window.innerWidth > 1300)? $window.innerWidth - 420 : 900;
		return $scope.windowWidth = $window.innerWidth;
	};
	$scope.initializeWindowSize();
	angular.element($window).bind('resize', function() {
		$scope.initializeWindowSize();
		return $scope.$apply();
	});

	var getUsernameColor = function(username) {
		// Compute hash code
		!username && (username = '');
		var hash = 7;
		for (var i = 0; i < username.length; i++) {
			hash = username.charCodeAt(i) + (hash << 5) - hash;
		}
		// Calculate color
		var index = Math.abs(hash % COLORS.length);
		return COLORS[index];
	};

	var formatDate = function(d){
		var addZero = function(n){
			return n < 10 ? '0' + n : '' + n;
		}

		return d.getFullYear() +"/"+ addZero(d.getMonth()+1) + "/" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ":" + addZero(d.getMinutes()) + ":" + addZero(d.getMinutes());
	};

	var processMessages = function(messages) {
		for(var k in messages) {
			messages[k] = processMessage(messages[k]);
		}
		return messages;
	};
	var processMessage = function(message) {
		if(!message.user) {
			message.user = {
				"name": message.username || ''
			};
		}

		if(message.user.image) {
			message.background = 'url(' + message.user.image + ')';
		}
		else {
			message.background = getUsernameColor(message.user.name);
		}
		message.textDate = formatDate(new Date(message.timestamp));
		return message;
	};
	var addMessage = function(message, pre) {
		if(pre) {
			$scope.messages.unshift(processMessage(message));
		}
		else {
			$scope.messages.push(processMessage(message));
		}
	};
	var addLog = function(message) {
		message.type = 'log';
		$scope.messages.push(processMessage(message));
	};
	var prependMessage = function(message) {
		if(message.length == 0) {
		}
		else if(message.length > 0) {
			for(var k in message) {
				addMessage(message[k], true);
			}
		}
		else {
			addMessage(message, true);
		}
	};
	var sendMessage = function() {
		var text = $scope.newMessage;
		if (text.length == 0) { return false; }

		var message = {
			"user": {
				"name": "me",
				"me": true
			},
			"message": text,
			"timestamp": new Date()
		};

		$socket.emit('new message', text);
		addMessage(message);
		$scope.newMessage = '';
		gotoBottom();
	};

	var postFile = function(file) {
		var meta = Raid2X.getMeta(file);
		$scope.newMessage = 'File: ' + meta.name;
		sendMessage();
		$socket.emit('meta', meta);
		console.log(meta);//--

		Raid2X.quickSend(file, "/shard/", meta, function(e, d) {
			if(d.progress == 1) {
				var r2x = new Raid2X(d.meta);
				var meta = r2x.getMeta();
				$http.post('/dataset/files/', meta)
					.success(function(data, status, headers, config) {
						$socket.emit('new file message', meta);
					})
					.error(function(data, status, headers, config) {
					});
			}

			delete d.meta;
			console.log('emit shard');
			console.log(d);//--
			$socket.emit('shard', d);
		});


		/*
		$scope.newMessage = 'File: ' + r2x.attr.name;
		sendMessage();
		var meta = r2x.getMeta(true);
		$socket.emit('meta', meta);

		r2x.sendAll("/shard/", function(e, d) {
			console.log(d);//--
			$socket.emit('shard', d);
		});
		*/
	};

	var sendShard = function(hash, i) {
		$socket.emit('shard', {
			hash: hash,
			shard: $scope.files[hash].getShard(i)
		});
	};
	var requestShard = function(data) {
		$socket.emit('shard', sendShard(data.hash, data.i));
	};

	$scope.sendMessage = sendMessage;

	var selectFile = function() {
		var f = document.createElement("input");
		f.setAttribute("type", "file");
		f.setAttribute("multiple", true);
		f.setAttribute("style", "display: none");
		document.body.appendChild(f);
		f.addEventListener('change', function(evt) {
			for(var k in evt.target.files) {
				if(new String(evt.target.files[k]) != "[object File]") { continue; }
				postFile(evt.target.files[k]);

				/*
				var r2x = new Raid2X();
				r2x.readFile(evt.target.files[k], function(e, r) {
					$scope.files[r.attr.hash] = r;
					postFile(r);
				});
				*/
			}
		}, false);
		f.click();
		document.body.removeChild(f);
	}
	$scope.selectFile = selectFile;


	var addChatTyping = function(data) {

	};
	var removeChatTyping = function(data) {

	};

	var gotoBottom = function() {

	};
	var gotoTop = function() {

	};

	var stopTyping = function() {
		$socket.emit('stop typing');
	};
	var stopTypingEvent;
	var setStopTyping = function(time) {
		if(!(time && time > 0)) {
			time = 1000;
		}

		clearTimeout(stopTypingEvent);
		stopTypingEvent = setTimeout(stopTyping, time);
	}

	var addMeta = function(meta) {
		s = new Date();
		var r2x = new Raid2X(meta);
		$scope.files[meta.hash] = r2x;

		var pn = document.createElement('div');
		var p1 = document.createElement('div');
		var p2 = document.createElement('span');
		var p3 = document.createElement('div');
		var p4 = document.createElement('div');
		var p5 = document.createElement('div');

		pn.setAttribute("class", "progress");
		p1.setAttribute("class", "progress c100 p0 dark big blue");
		p2.innerHTML = "0%";
		p3.setAttribute("class", "slice");
		p4.setAttribute("class", "bar");
		p5.setAttribute("class", "fill");

		pn.appendChild(p1)
		p1.appendChild(p2);
		p1.appendChild(p3);
		p3.appendChild(p4);
		p3.appendChild(p5);
		document.body.appendChild(pn);

		r2x.nodes = {
			pn: pn,
			p1: p1,
			p2: p2,
			p3: p3,
			p4: p4,
			p5: p5
		};
	};
	var addShard = function(hash, path) {
		var r2x = $scope.files[hash];
		if(!r2x) { console.log("no such meta: %s", hash); return false; }
		console.log("download: %s", path);
		r2x.addDownloadList({
			path: path,
			callback: function(e, d) {
				console.log("%d %", d*100);
				var p = parseInt(d * 100);
				r2x.nodes.p1.setAttribute("class", "dark big blue c100 p" + p);
				r2x.nodes.p2.innerHTML = p + "%";

				if(p == 100) {
					if(/^video/.test(r2x.attr.type)) {
						var url = r2x.toURL();
						var video = document.createElement('video');
						video.setAttribute("src", url);
						video.setAttribute("controls", "");
						video.setAttribute("autoplay", "");
						document.body.appendChild(video);
					}
					else {
						r2x.save();
					}

					document.body.removeChild(r2x.nodes.pn);
					delete r2x.nodes;
				}
			}
		});
		r2x.startDownload();
	};

	var listen = {"channel": "default", "timestamp": new Date() * 1};
	$scope.loadMessage = function() {
		if($scope.end) { return false; }
		$socket.emit('load message', listen);
	};

	$scope.keyMessage = function(e) {
		if(e.keyCode == 13) {
			sendMessage();
		}
		else {
			$socket.emit('typing');
		}

		setStopTyping(500);
	}

	$scope.chatID = $routeParams.chatID;
	$scope.isLogin = true;
	$scope.messages = [];
	processMessages($scope.messages);
	$scope.newMessage = '';

	//var $socket = io();
	$socket.emit('add user', 'Somebody');	// --
	$scope.loadMessage();
	$socket.on('login', function (data) {
		$scope.isLogin = true;
		// Display the welcome message
		data.type = "log";
		data.message = "Welcome to Kamato;";
		prependMessage(data);
	}).bindTo($scope);

	// Whenever the server emits 'new message', update the chat body
	$socket.on('load message', function (data) {
		var n = data.messages.length
		$scope.end = !(n > 0);
		if(!$scope.end) { listen.timestamp = new Date(data.messages[n-1].timestamp) * 1; }

		prependMessage(data.messages);
		gotoTop();
	}).bindTo($scope);
	$socket.on('new message', function (data) {
		data.type = "text";
		addMessage(data);
		gotoBottom();
	}).bindTo($scope);

	// Whenever the server emits 'new file message', update the chat body
	$socket.on('new file message', function (data) {
		//++ here comes new file
		console.log(data);
	}).bindTo($scope);

	// Whenever the server emits 'user joined', log it in the chat body
	$socket.on('user joined', function (data) {
		data.message = data.user.name + ' joined';
		addLog(data);
	}).bindTo($scope);

	// Whenever the server emits 'user left', log it in the chat body
	$socket.on('user left', function (data) {
		data.message = data.user.name + ' left';
		addLog(data);

		removeChatTyping(data);
	}).bindTo($scope);

	// Whenever the server emits 'typing', show the typing message
	$socket.on('typing', function (data) {
		addChatTyping(data);
	}).bindTo($scope);

	// Whenever the server emits 'stop typing', kill the typing message
	$socket.on('stop typing', function (data) {
		removeChatTyping(data);
	}).bindTo($scope);

	$socket.on('meta', function (data) {
		addMeta(data);
	}).bindTo($scope);
	$socket.on('shard', function (data) {
		addShard(data.hash, data.path);
	}).bindTo($scope);
	$socket.on('requestShard', function (data) {
		sendShard(data.hash, data.i);
	}).bindTo($scope);
}]);