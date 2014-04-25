'use strict';

(function() {

	var module = angular.module('fcRenderer', []);

	module.directive('fcRenderer', function($rootScope, server) {
		var camera = new THREE.PerspectiveCamera(80, window.innerWidth
				/ window.innerHeight, 0.1, 10);
		camera.rotation.x = 1 * Math.PI / 2;
		// camera.rotation.y = 1 * Math.PI / 2;
		// camera.position.z = 1;

		var scene = new THREE.Scene();
		var objects = undefined;

		var geometry = new THREE.SphereGeometry(0.5);
		var material = new THREE.MeshBasicMaterial({
			color : 0x0f0f0f,
			wireframe : true
		});
		var player = new THREE.Mesh(geometry, material);

		var geometry = new THREE.BoxGeometry(1, 1, 1);
		var material = new THREE.MeshBasicMaterial({
			color : 0xff0000,
			wireframe : true
		});
		var border = new THREE.Mesh(geometry, material);

		var geometry = new THREE.BoxGeometry(1, 1, 1);
		var material = new THREE.MeshBasicMaterial({
			color : 0x0000ff,
			wireframe : true
		});
		var water = new THREE.Mesh(geometry, material);

		$rootScope.$on('server-push', function(x, message) {
			render(message);
		});
		render(server.push);

		function render(message) {
			console.log([ message.position.x, message.position.y,
					message.position.z ].toString());
			switch (message.orientation) {
			case "north":
				camera.rotation.y = 3 * Math.PI / 2;
				break;
			case "east":
				camera.rotation.y = 0 * Math.PI / 2;
				break;
			case "south":
				camera.rotation.y = 1 * Math.PI / 2;
				break;
			case "west":
				camera.rotation.y = 2 * Math.PI / 2;
				break;
			}

			if (objects !== undefined) {
				scene.remove(objects);
			}
			objects = new THREE.Object3D();
			message.surounding.forEach(function(tile, index) {
				var object = undefined;
				switch (tile.type) {
				case "player":
					object = new THREE.Object3D();
					object.add(player.clone());
					break;
				case "border":
					var geometry = new THREE.BoxGeometry(1, 1, 1);
					var material = new THREE.MeshBasicMaterial({
						color : (Math.abs(tile.x) << 21)
								+ (Math.abs(tile.y) << 13)
								+ (Math.abs(tile.z) << 5),
					// wireframe : true
					});
					object = new THREE.Mesh(geometry, material);
					break;
				case "water":
					object = new THREE.Object3D();
					object.add(water.clone());
					break;
				}
				if (object !== undefined) {
					object.position.x = tile.x - message.position.x;
					object.position.y = tile.y - message.position.y;
					object.position.z = tile.z - message.position.z;
					if (object.position.z == 0 || object.position.z == -1)
						objects.add(object);
				}
			});
			scene.add(objects);
		}

		return {
			link : function(scope, element, attributes) {
				var renderer = new THREE.CanvasRenderer();
				renderer.setSize(window.innerWidth, window.innerHeight);
				element.append(renderer.domElement);

				function animate() {

					requestAnimationFrame(animate);

					renderer.render(scene, camera);

				}
				var requestID = requestAnimationFrame(animate);

				scope.$on('$destroy', function() {
					element.remove(renderer.domElement);
					cancelAnimationFrame(requestID);
				});

			},
		};
	});

}());
