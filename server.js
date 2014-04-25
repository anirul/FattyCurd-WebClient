'use strict';

(function() {

	var module = angular.module('fcServer', []);

	module.provider('server', function() {

		function $get($q, $rootScope) {

			var lastMessageId = 0;
			var socket = undefined;
			var socketPromise = undefined;
			var deferreds = {};

			function serverPush(message) {
				server.push = message;
				$rootScope.$emit('server-push', message);
			}

			function connect(url) {
				if (socket !== undefined) {
					if (socket.url === url) {
						return socketPromise;
					}
					socket.close();
				}

				var deferred = $q.defer();
				socket = new WebSocket(url);
				socket.onopen = function(event) {
					deferred.resolve(socket);
				};
				socket.onclose = function(event) {
					console.log(event);
				};
				socket.onmessage = function(event) {
					var data = event.data;
					console.log(data);
					var message = JSON.parse(data);
					var correlationId = message.correlationId;
					if (correlationId === undefined || correlationId === 0) {
						// FIXME: server should not send correlationId 0
						serverPush(message);
					} else {
						var deferred = deferreds[correlationId];
						delete deferreds[correlationId];
						if (message.exception) {
							deferred.reject(message.exception);
						} else {
							deferred.resolve(message);
						}
					}
				};
				socketPromise = deferred.promise;
				return socketPromise;
			}

			function send(command, params) {

				var messageId = lastMessageId + 1;
				lastMessageId = messageId;

				socketPromise.then(function(socket) {
					var data = JSON.stringify({
						messageId : messageId,
						command : command,
						params : params,
					});
					console.log(data);
					socket.send(data);
				});

				var deferred = $q.defer();
				deferreds[messageId] = deferred;
				return deferred.promise;

			}

			var server = {
				url : 'ws://10.1.30.78:9980/ws',
				connect : function(url) {
					return connect(url);
				},
				accountLogin : function(name, pass) {
					return send('login account', {
						name : name,
						pass : pass,
					}).then(function(message) {
						server.characters = message.characters;
					});
				},
				accountNew : function(name, pass) {
					return send('new account', {
						name : name,
						pass : pass,
					}).then(function(message) {
						server.characters = message.characters;
					});
				},
				characterSelect : function(name) {
					return send('select character', {
						name : name,
					}).then(serverPush);
				},
				moveForward : function(name) {
					return send('move forward', {}).then(serverPush);
				},
				moveBack : function(name) {
					return send('move back', {}).then(serverPush);
				},
				turnLeft : function(name) {
					return send('turn left', {}).then(serverPush);
				},
				turnRight : function(name) {
					return send('turn right', {}).then(serverPush);
				},
			};

			return server;

		}

		var provider = {
			$get : $get,
		};

		return provider;

	});

}());
