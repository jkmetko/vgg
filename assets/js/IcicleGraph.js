
	var camera, controls, light, scene, renderer;

    function icicle( path ){
        checkFile( path )
        init3D();
        animate();
    }

    /*-------1.0 - PARSING GRAPH ML---------------------*/

    function parseGraphML( file ){
        //GET NODES
        var nodes = [];
        $(file).find('node').each(function(){
            nodes.push($(this).attr("id"));
        })

        //GET EDGES
        var i = 0;
        $(file).find('edge').each(function(){
            source = $(this).attr("source");
            target = $(this).attr("target");

            if(typeof graph == "undefined"){
                graph = new Node(source);
                console.log("NOVY STROM S KORENOM: "+source)
            }else{
                if(graph.getChildren() == ""){
                    graph.addChild( new Node(target) );
                    console.log("PRIDANE PRVE DIETA: "+target);
                }else{
                    console.log("UZ MA DETI");
                    children = graph.getChildren();
                    children.forEach(function(child){
                        if(child.id == source){
                            child.addChild( new Node(target) );
                            console.log("New CHILD: "+target);
                        }else{
                            console.log("NENASLO SA");
                        }
                    })
                }
            }
        })
        console.log(graph);
    }

    function checkFile( path ) {
        $.ajax({
            type: "GET",
            url: path,
            dataType: "xml",
            success:  function( output ){
                parseGraphML( output )
            },error: function(){
                console.log("File '"+ path +"' does not exists")
            }
        })
    }

    /*--------2.0 - CREATING GRAPH----------------------*/
    function Node( id ){
        this.id = id;
        this.children = [];
        this.parent = null;

        this.setParentNode = function( node ){
            this.parent = node;
        }

        this.getParentNode = function(){
            return this.parent;
        }

        this.addChild = function( node ){
            node.setParentNode(this);
            this.children[this.children.length] = node;
        }

        this.getChildren = function(){
            return this.children;
        }

        this.removeChildren = function(){
            this.children = [];
        }
    }

    function findNode( nodes, node ){
        nodes.forEach(function(rootNode){
            if(rootNode.id == node.id){
                return node;
            }
        })
    }

    /*--------3.0 - CREATING 3D ENVIRONMENT-------------*/

	function init3D(){
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