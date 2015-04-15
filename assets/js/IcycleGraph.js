
	var camera, controls, light, scene, renderer;
	
	init();
	animate();
	
	function init(){
		/*CAMERA*/
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
		camera.position.z = 50;
		
		/*CONTROLS*/
		controls = new THREE.TrackballControls( camera );
		controls.addEventListener('change', render);
		controls.rotateSpeed = 10;
		controls.zoomSpeed = 12;
		controls.panSpeed = 1;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;
		
		scene = new THREE.Scene();
		
		/*LIGHTS*/
		var ambientLight = new THREE.AmbientLight( 0x000000 );
		scene.add( ambientLight );
		
		var lights = [];
		lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
		lights[1] = new THREE.PointLight( 0xffffff, 1, 0 );
		lights[2] = new THREE.PointLight( 0xffffff, 1, 0 );
		
		lights[0].position.set( 0, 200, 0 );
		lights[1].position.set( 100, 200, 100 );
		lights[2].position.set( -100, -200, -100 );

		scene.add( lights[0] );
		scene.add( lights[1] );
		scene.add( lights[2] );
		
		/*GEOMETRY*/
		var geometry = new THREE.TorusKnotGeometry( 10, 3, 1000, 16 );
		var material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
		
		var mesh = new THREE.Mesh( geometry, material );
		scene.add(mesh);
		
		/*RENDERER*/
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
	}
	
	function animate(){
		requestAnimationFrame( animate );
		controls.update();
		render();
		
	}
	
	function render(){
		renderer.render( scene, camera );
	}