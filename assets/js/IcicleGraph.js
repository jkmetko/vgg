function icicle( path ){
    var camera, controls, lights, scene, renderer, graph;
    var container = document.getElementById( 'icicleContainer' ),
        containerWidth, containerHeight,
        range = 50;
    var cubes = new THREE.Object3D();
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    var numberOfGraphNodes = 0;
    var nodes = [];
    var minWidth = 0;
    var minHeight = 0;
    var nodeWidth = 5;
    var nodeHeight = 10;
    var nodeDepth = 1;
    var DGraph;

    init();

    function init(){
        XMLFile = checkFile( path );
        graph = parseGraphML(XMLFile);
        setMinValues( graph );

        THREEDGraph = DGraph( graph );
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

    /*--------2.0 - CREATING GRAPH----------------------*/
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
                nodeX = index * childrenWidth;
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

    /*--------3.0 - CREATING 3D ENVIRONMENT-------------*/

    function DGraph( graph ){
        /*CONTAINER*/
        containerWidth = container.clientWidth;
        containerHeight = container.clientHeight;

        /*SCENE*/
        scene = new THREE.Scene();

        /*CAMERA*/
        camera = setCamera();
        scene.add(camera);

        /*CONTROLS*/
        setControls();

        /*GEOMETRY*/
        cubes = addTo3DGraph( cubes );
        //cubes.add(setGeometry(graph));
        scene.add(cubes);
        console.log(scene);

        /*LIGHTS*/
        setLights( scene );

        /*RENDERER*/
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize( containerWidth, containerHeight );
        container.appendChild( renderer.domElement );

        /*LISTENERS*/
        controls.addEventListener('change', render);
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        window.addEventListener( 'resize', onWindowResize, false )

        /*ANIMATE*/
        return animate();
    }

    function setCamera(){
        camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 1, 1000);
        camera.position.set( 0, 0, range * 2 );
        camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

        return camera;
    }

    function setControls(){
        controls = new THREE.TrackballControls( camera );
        controls.rotateSpeed = 10;
        controls.zoomSpeed = 12;
        controls.panSpeed = 1;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
    }

    function setLights( scene ){
        var ambientLight = new THREE.AmbientLight( 0x000000 );
        cubes.add( ambientLight );

        lights = [];
        lights.push( new THREE.PointLight( 0xffffff, 1, 0 ) );
        lights.push( new THREE.PointLight( 0xffffff, 1, 0 ) );
        lights.push( new THREE.PointLight( 0xffffff, 1, 0 ) );

        lights[0].position.set( 0, 200, 0 );
        lights[1].position.set( 100, 200, 100 );
        lights[2].position.set( -100, -200, -100 );

        lights.forEach(function(light){
            cubes.add( light );
        })
    }

    function setGeometry( node ){
        cube = new THREE.Object3D();

        geometry = new THREE.BoxGeometry( node.width, nodeHeight, nodeDepth );
        material = new THREE.MeshLambertMaterial({ color: 0x00ff00, wireframe: true, wireframe_linewidth: 10 });
        mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(node.x, node.y*-1, node.z);

        //console.log("X OF"+node.id+" = "+node.x);
        cube.add( mesh );

        //cube.position.set(node.x, node.y*-1, node.z);
        cube.name = node.id;

        return cube;
    }

    function addTo3DGraph( DGraph ){
        nodes = nextLevel( graph );
        DGraph.add(setGeometry( graph ));
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

    function findRoot( node ){
        if(node.parent != null){
            return findRoot( node.parent );
        }else{
            return node.id;
        }
    }

    function onDocumentMouseDown( event ){
        mouse.x = ( event.clientX / containerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / containerHeight ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );
        intersects = raycaster.intersectObjects( scene.children, true );

        if (intersects.length > 0) {
            intersects[0].object.material.color.set( 0xff0000 );
        }

        objectID = intersects[0].object.id - 1;
        object = cubes.getObjectById( objectID, true );
        nodeObject = graph.findChild( object.name );
        findRoot( nodeObject );
    }

    function onWindowResize() {
        camera.aspect = containerWidth / containerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( containerWidth, containerHeight );
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