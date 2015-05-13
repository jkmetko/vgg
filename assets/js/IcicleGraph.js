function icicle( path, fullscreen ){
    var numberOfGraphNodes = 0;
    var nodes = [];
    var minWidth = 0;
    var minHeight = 0;
    var nodeWidth = 5;
    var nodeHeight = 10;
    var nodeDepth = 1;
    var fullscreen = fullscreen;

    initialize();

    function initialize(){
        XMLFile = checkFile( path );
        graph = parseGraphML(XMLFile);
        setMinValues( graph );

        dimensionalGraph = THREEDGraph( graph );
    }

    /*-------1.0 - PARSING GRAPH ML---------------------*/

    function parseGraphML( file ){
        //GET NODES
        $(file).find('node').each(function(){
            nodes.push($(this).attr("id"));
        })

        //GET EDGES
        graph = new Node(nodes[0], null);
        numberOfGraphNodes++;
        $(file).find('edge').each(function(){
            addToGraph(graph, $(this));
        })

        console.log("NUMBER OF NODES IN GUML: "+nodes.length);
        console.log("NUMBER OF NODES IN GRAPH: "+numberOfGraphNodes);

        return graph;
    }

    function checkFile( path ) {
        if (window.XMLHttpRequest)
        {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp=new XMLHttpRequest();
        }
        else{
            // code for IE6, IE5
            xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.open("GET",path,false);
        xmlhttp.send();
        xmlDoc=xmlhttp.responseXML;

        return xmlDoc;
    }

    /*-------2.0 -  ABSTRACT GRAPH----------------------*/

    function addToGraph(graph, node){
        source = node.attr("source");
        target = node.attr("target");

        if(graph != ""){
            graph.findChild(source).addChild( new Node(target, null) );
            numberOfGraphNodes++;
        }

        return graph;
    }

    function nextLevel(nodes) {
        level = [];
        if(nodes instanceof Array){
            nodes.forEach(function (node) {
                if (node.getChildren() != "") {
                    children = node.getChildren();
                    children.forEach(function (child) {
                        level.push(child);
                    })
                }
            })
        }else{
            level = nodes.getChildren();
        }

        if(typeof level !== 'undefined'){
            return level;
        }else{
            return false;
        }
    }

    function setMinValues( graph ){
        var maxChildrenDepth = 0;
        var maxChildrenInLevel = 0;

        nodes = nextLevel(graph);
        while(nodes != false){
            if(nodes.length > maxChildrenInLevel){
                maxChildrenInLevel = nodes.length; //MAX WIDTH OF LEVEL IN THREE
            }
            maxChildrenDepth++;
            nodes = nextLevel(nodes);
        }
        minWidth = maxChildrenInLevel * nodeWidth;
        minHeight = maxChildrenDepth * nodeHeight;


        console.log("MAX CHILDREN IN LEVEL: "+maxChildrenInLevel);
        console.log("GRAPH MIN WIDTH: "+minWidth);
        console.log("GRAPH MIN HEIGHT: "+minHeight);

        setGraph( graph );
    }

    function setGraph( graph ){
        var levelIndex = 1;

        graph.setWidth( minWidth );
        graph.setPosition(0,0);
        nodes = nextLevel(graph);
        while(nodes != false){
            numberOfNodesInLevel = nodes.length;

            nodes.forEach(function( node, index ){
                parent = node.getParentNode();
                parentWidth = parent.width;
                numberOfChildren = parent.getChildren().length;
                childrenWidth = parentWidth / numberOfChildren;
                nodeX = (index * childrenWidth);
                nodeY = levelIndex * nodeHeight;

                node.setWidth( childrenWidth );
                node.setPosition( nodeX, nodeY );
                //console.log("WIDTH OF "+node.id+" = "+childrenWidth);
                //console.log("X OF "+node.id+" = "+nodeX);
            });

            levelIndex++;
            nodes = nextLevel(nodes);
        }
    }

    /*--------3.0 - TREE STRUCTURE---------------------*/
    function Node( id, text ){
        this.id = id;
        this.children = [];
        this.parent = null;
        this.opacity = 1;
        this.text = text;
        this.width = null;
        this.x = null;
        this.y = null;
        this.z = 0;
        this.color = null;

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

        this.findChild = function( id ){
            if(this.id == id){
                result = this;
            }else if(this.getChildren() != ""){
                children = this.getChildren();
                children.forEach(function(child){
                    return child.findChild( id );
                })
            }
            return result;
        }

        this.setOpacity = function( value ){
            this.opacity = value;
        }

        this.setWidth = function( value ){
            this.width = value;
        }

        this.setPosition = function( valueX, valueY ){
            this.x = valueX;
            this.y = valueY;
        }

    }

    /*--------4.0 - 3D TREE STRUCTURE------------------*/
    function THREEDGraph( graph ){
        this.camera;
        this.controls;
        this.lights;
        this.scene;
        this.renderer;
        this.cubemap;

        this.container = document.getElementById( 'icicleContainer' );
        this.containerWidth, this.containerHeight;

        this.range = 50;
        this.cubes = new THREE.Object3D();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.graph = graph;

        this.defaultColor = 0x181818;
        this.pathColor = 0x58401c;
        this.childColor = 0x37260c;

        this.defaultOpacity = 0.7;
        this.pathOpacity = 1;

        init();

        function init() {
            /*CONTAINER*/
            this.containerWidth = container.clientWidth;
            this.containerHeight = container.clientHeight;

            /*SCENE*/
            this.scene = new THREE.Scene();

            /*AXIS HELPER*/
            scene.add(new THREE.AxisHelper(1000));

            /*CAMERA*/
            this.camera = setCamera();
            this.scene.add(camera);

            /*CONTROLS*/
            setControls();

            /*SETMAP*/
            this.cubemap = setMap();

            /*GEOMETRY*/
            this.cubes = addTo3DGraph(this.cubes, this.nodes);
            this.scene.add(this.cubes);
            console.log(this.scene);

            /*LIGHTS*/
            setLights(this.scene);

            /*RENDERER*/
            this.renderer = new THREE.WebGLRenderer({antialias: true});
            this.renderer.setSize(containerWidth, containerHeight);
            this.container.appendChild(renderer.domElement);

            /*LISTENERS*/
            this.controls.addEventListener('change', render);
            document.addEventListener('mousedown', onDocumentMouseDown, false);
            if (fullscreen) {
                window.addEventListener('resize', onWindowResize, false);
            }

            /*ANIMATE*/
            animate();
       }

        function setCamera(){
            camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 1, 1000);
            camera.position.set( 0, 0, range * 2 );
            camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

            return camera;
        }

        function setControls(){
            this.controls = new THREE.TrackballControls( camera );
            this.controls.rotateSpeed = 10;
            this.controls.zoomSpeed = 12;
            this.controls.panSpeed = 1;
            this.controls.noZoom = false;
            this.controls.noPan = false;
            this.controls.staticMoving = true;
            this.controls.dynamicDampingFactor = 0.3;
        }

        function setMap(){
            var urls = [
                'assets/img/panorama/0004.png',
                'assets/img/panorama/0002.png',
                'assets/img/panorama/0006.png',
                'assets/img/panorama/0005.png',
                'assets/img/panorama/0001.png',
                'assets/img/panorama/0003.png'
            ];

            cubemap = THREE.ImageUtils.loadTextureCube(urls); // load textures
            cubemap.format = THREE.RGBFormat;

            var shader = THREE.ShaderLib['cube']; // init cube shader from built-in lib
            shader.uniforms['tCube'].value = cubemap; // apply textures to shader

            // create shader material
            var skyBoxMaterial = new THREE.ShaderMaterial( {
                fragmentShader: shader.fragmentShader,
                vertexShader: shader.vertexShader,
                uniforms: shader.uniforms,
                depthWrite: false,
                side: THREE.BackSide
            });

            // create skybox mesh
            var skybox = new THREE.Mesh(
                new THREE.BoxGeometry(1000, 1000, 1000),
                skyBoxMaterial
            );

            this.scene.add(skybox);
            return cubemap;
        }

        function setLights( scene ){
            var ambientLight = new THREE.AmbientLight( 0xffffff );
            this.cubes.add( ambientLight );

            this.lights = [];
            this.lights.push( new THREE.PointLight( 0xffffff, 1, 0 ) );
            this.lights.push( new THREE.PointLight( 0xffffff, 1, 0 ) );
            this.lights.push( new THREE.PointLight( 0xffffff, 1, 0 ) );
            this.lights.push( new THREE.PointLight( 0xffffff, 1, 0 ) );

            this.lights[0].position.set( 0, 200, 0 );
            this.lights[1].position.set( 100, 200, 100 );
            this.lights[2].position.set( -100, -200, 100 );
            this.lights[3].position.set( -100, -200, -200 );

            this.lights.forEach(function(light){
                this.cubes.add( light );
            })
        }

        function setGeometry( node ){
            cube = new THREE.Object3D();

            geometry = new THREE.BoxGeometry( node.width, nodeHeight, nodeDepth );
            material = new THREE.MeshPhongMaterial({
                color: this.defaultColor,
                evnMap: this.cubemap,
                reflectivity: 100,
                wireframe: true,
                wireframe_linewidth: 10,
                transparent: true,
                opacity: 1
            });
            mesh = new THREE.Mesh( geometry, material );
            mesh.position.set(node.x, node.y*-1, node.z);

            cube.add( mesh );
            cube.name = node.id;

            return cube;
        }

        function addTo3DGraph( DGraph ){
            nodes = nextLevel( this.graph );
            DGraph.add(setGeometry( this.graph ));
            /*//TEST SETUP
             DGraph.children[0].add(setGeometry( graph.getChildren()[0] ));
             DGraph.children[0].add(setGeometry( graph.getChildren()[1] ));
             DGraph.children[0].children[1].add(setGeometry( graph.getChildren()[0].getChildren()[0] ));
             DGraph.children[0].children[1].add(setGeometry( graph.getChildren()[0].getChildren()[1] ));
             DGraph.children[0].children[1].add(setGeometry( graph.getChildren()[0].getChildren()[2] ));
             */
            while(nodes != false){
                nodes.forEach(function(node){
                    cube = setGeometry( node );
                    child = find3Dchild(DGraph, node.parent.id);
                    child.add(setGeometry( node ));
                })

                nodes = nextLevel( nodes );
            }

            return DGraph;
        }

        function find3Dchild( DGraph, id ){
            if(DGraph instanceof THREE.Object3D){
                if(DGraph.name == id){
                    result = DGraph;
                }else if(DGraph.children.length > 0){
                    children = DGraph.children;
                    children.forEach(function(child){
                        return find3Dchild( child, id );
                    })
                }
            }
            return result;
        }

        function resetColors( DGraph ){
            DGraph.traverse(function(child){
                if(child instanceof THREE.Mesh){
                    child.material.color.setHex(this.defaultColor);
                    child.material.opacity = this.defaultOpacity;
                }
            });
        }

        function findRoot( node ){
            if(node.parent != null){
                THREEDChild = this.cubes.getObjectByName(node.id);
                THREEDChild.children.forEach(function(child){
                    if(child instanceof THREE.Mesh){
                        child.material.color.setHex(this.pathColor);
                        child.material.opacity = this.pathOpacity;
                    }
                });
                return findRoot( node.parent );
            }else{
                THREEDChild = this.cubes.getObjectByName(node.id);
                THREEDChild.children.forEach(function(child){
                    if(child instanceof THREE.Mesh){
                        child.material.color.setHex(this.pathColor);
                        child.material.opacity = this.pathOpacity;
                    }
                });
                return node.id;
            }
        }

        function onDocumentMouseDown( event ){
            mouse.x = ( event.clientX / containerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / containerHeight ) * 2 + 1;

            raycaster.setFromCamera( mouse, camera );
            intersects = raycaster.intersectObjects( scene.children, true );

            if (intersects.length > 0) {
                objectID = intersects[0].object.id - 1;
                object = cubes.getObjectById( objectID, true );
                nodeObject = graph.findChild( object.name );
                resetColors( cubes );
                findRoot( nodeObject );
                intersects[0].object.material.color.set( this.childColor );
            }
        }

        function onWindowResize() {
            camera.aspect = containerWidth / containerHeight;
            camera.updateProjectionMatrix();

            $("#icicleContainer").css({
                width: $(window).width(),
                height: $(window).height()
            });

            renderer.setSize( $( "#icicleContainer").width(), $( "#icicleContainer").height() );
            render();
        }

        function animate(){
            requestAnimationFrame( animate );
            controls.update();
            render();
        }

        function render(){
            renderer.render( scene, camera );
        }
    }

}