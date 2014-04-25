'use strict';

(function() {

	var routes = {};

	routes[''] = {
		redirectTo : '/',
	};

	routes['/'] = {
		templateUrl : 'login.html',
		controller : function($scope, $location, server) {
			function exception(exception) {
				$scope.exception = exception;
			}
			function characters() {
				$location.path('/characters');
			}

			$scope.url = server.url;
			$scope.name = 'anirul';
			$scope.pass = 'pouet';
			$scope.repeat = '';
			$scope.connect = function() {
				server.connect($scope.url).then(function() {
					// connected
				}, exception);
			};
			$scope.accountLogin = function() {
				$scope.exception = '';
				server.connect($scope.url).then(function() {
					return server.accountLogin($scope.name, $scope.pass);
				}).then(characters, exception);
			};
			$scope.accountNew = function() {
				if ($scope.pass != $scope.repeat) {
					$scope.exception = 'passwords don\'t match';
					return;
				}
				$scope.exception = '';
				server.connect($scope.url).then(function() {
					return server.accountNew($scope.name, $scope.pass);
				}).then(characters, exception);
			};
		},
	};

	routes['/characters'] = {
		templateUrl : 'characters.html',
		controller : function($scope, $location, server) {
			$scope.characters = server.characters;
			$scope.characterSelect = function(character) {
				server.characterSelect(character).then(function() {
					$location.path('/game');
				});
			};
		},
	};

	routes['/game'] = {
		templateUrl : 'game.html',
		controller : function($scope, server) {
			$scope.grid = server.grid;
			document.onkeypress = function(event) {
				switch (event.keyCode) {
				case 37:
					// left
					event.preventDefault();
					server.turnLeft();
					break;
				case 38:
					// up
					event.preventDefault();
					server.moveForward();
					break;
				case 39:
					// right
					event.preventDefault();
					server.turnRight();
					break;
				case 40:
					// down
					event.preventDefault();
					server.moveBack();
					break;
				}
			};
			$scope.$on('$destroy', function() {
				document.onkeypress = null;
			});
		},
	};

	var module = angular.module('fcApp',
			[ 'fcRenderer', 'fcServer', 'ngRoute', ]);

	angular.forEach(routes, function(route, path) {
		if (route.controller) {
			module.controller(path, route.controller);
			route.controller = path;
		}
	});

	module.config(function(serverProvider, $routeProvider) {

		angular.forEach(routes, function(route, path) {
			if (path === '') {
				$routeProvider.otherwise(route);
			} else {
				$routeProvider.when(path, route);
			}
		});

	});

}());
