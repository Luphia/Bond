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
var s;
	var postShard = function(r2x) {
s = new Date();//--
		var hash = r2x.getShard(r2x.pointer, 'hash');
		var shard = r2x.nextShard('blob');

		if(shard) {
			var formData = new FormData();
			formData.append("file", shard);
			var request = new XMLHttpRequest();
			request.onload = function() {
				postShard(r2x);
console.log("cost: %d", (new Date() - s));//--
			}
			request.open("POST", "/shard/" + hash);
			request.send(formData);
		}
		else if(!r2x.write) {
			r2x.write = true;
			var meta = r2x.getMeta();
			$http.post('/dataset/meta/', meta).success(function(d, s, h, c) {
				var url = r2x.toURL();
				var video = document.createElement('video');
				video.setAttribute("src", url);
				video.setAttribute("controls", "");
				video.setAttribute("autoplay", "");
				document.body.appendChild(video);
			});
console.log(meta);
			$socket.emit('meta', meta);
		}
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
		f.setAttribute("style", "display: none");
		document.body.appendChild(f);
		f.addEventListener('change', function(evt) {
			for(var k in evt.target.files) {
				if(new String(evt.target.files[k]) != "[object File]") { continue; }
				var r2x = new Raid2X();
				r2x.readFile(evt.target.files[k], function(e, r) {
					$scope.files[r.attr.hash] = r;
					postShard(r);
console.log(r.getMeta(true))
				});
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

		//++ something whrong
		for(var i = 0; i < meta.sliceCount; i++) {
			var fp = '/shard/' + meta.shardList[i];

			var xhr = new XMLHttpRequest();
			xhr.open('GET', fp, true);
			xhr.responseType = 'blob';

			xhr.onload = function(e) {
				var file = new Blob([xhr.response]);
				r2x.importFile(file, function(e, d) {
					if(d < 1) {
						console.log('%d%', d * 100);
					}
					else {
						var url = r2x.toURL();
						var video = document.createElement('video');
						video.setAttribute("src", url);
						video.setAttribute("controls", "");
						video.setAttribute("autoplay", "");
						document.body.appendChild(video);
					}
				});
			}
			xhr.send();
			/*
			$http.get('/shard/' + meta.shardList[i]).success(function(d, s, h, c) {
				var file = new Blob(d);

				r2x.importFile(file, function(e, d) {
					if(d < 1) {
						console.log('%d%', d * 100);
					}
					else {
						var url = r2x.toURL();
						var video = document.createElement('video');
						video.setAttribute("src", url);
						video.setAttribute("controls", "");
						video.setAttribute("autoplay", "");
						document.body.appendChild(video);
					}
				});


			});
			*/
		}
	};
	var addShard = function(hash, shard) {
		var r2x = $scope.files[hash];
		var size = r2x.attr.sliceSize + 8;
		var arr = new Array(size);
		for(var i = 0; i < arr.length; i++) {
			arr[i] = shard[i];
		}
		shard = new Uint8Array(arr); 
		var progress = r2x.importShard(shard);
		console.log("%d % - %d", progress * 100, new Date() - s);
		if(progress < 1) {
			// $socket.emit('requestShard', {hash: hash, i: r2x.getDownloadPlan()[0]});
		}
		else {
			var url = r2x.toURL();
			var video = document.createElement('video');
			video.setAttribute("src", url);
			video.setAttribute("controls", "");
			video.setAttribute("autoplay", "");
			document.body.appendChild(video);
		}
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
		var file = data.message;
		// ArrayBuffer -> blob
		file.blob = new Blob([file.blob]);

		var a = document.createElement("a");
		document.body.appendChild(a);

		a.href = createObjectURL(file.blob);
		a.download = file.name;
		a.click();

		data.type = 'text';
		data.message = "Sends '" + file.name + "' and it will be download\
		ed automatically";

		addMessage(data);
		gotoBottom();
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
		addShard(data.hash, data.shard);
	}).bindTo($scope);
	$socket.on('requestShard', function (data) {
		sendShard(data.hash, data.i);
	}).bindTo($scope);
}]);