
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
    graph = new Node(nodes[0], null);
    $(file).find('edge').each(function(){
        addToGraph(graph, $(this));
    })

    console.log("NUMBER OF NODES: "+nodes.length);
    console.log("NUMBER OF GRAPH NODES: "+numberOfGraphNodes);
    drawGraph( graph );
}

var numberOfGraphNodes = 1;
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
                childred = node.getChildren();
                children.forEach(function (child) {
                    level.push(child);
                })
            }
        })
    }else{
        return nodes.getChildren();
    }

    if(typeof level !== 'undefined' && level.length > 0){
        return level;
    }else{
        return false;
    }
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
function Node( id, text ){
    this.id = id;
    this.children = [];
    this.parent = null;
    this.opacity = 1;
    this.text = text;

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

}

function drawGraph( graph ){
    /*console.log(graph.id);
    $("#UI").append(graph.id+"<br />");
    if(graph.getChildren() != ""){
        children = graph.getChildren();
        row = [];
        children.forEach(function( node ){
            row.push(node.id);
            //drawGraph(node); //dorobit funkciu getRow
        })
        $("#UI").append(row+"<br />");
    }*/

    nodes = nextLevel(graph);
    console.log(nodes);
    while(nodes != false) {
        nodes = nextLevel(nodes);
        console.log(nodes);
    }
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