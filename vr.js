// Import modules
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://unpkg.com/three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'https://unpkg.com/three/examples/jsm/loaders/OBJLoader.js';
import { BoxLineGeometry } from 'https://unpkg.com/three/examples/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'https://unpkg.com/three/examples/jsm/webxr/XRControllerModelFactory.js';

// init scene and camera
let scene, camera, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let model;

let raycaster;
let buttons, rotationbutton, scaleupbutton, scaledownbutton;
let intersected = [];
let tempMatrix = new THREE.Matrix4();

let controls, group;

init();
animate();

function init() {
    // CREATE CONTAINER
    const container = document.createElement( 'div' );
    document.body.appendChild( container );

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcce0ff );
    scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

    //CAMERA
    camera = new THREE.PerspectiveCamera( 75,window.innerWidth/window.innerHeight
                                            , 0.1, 10000 );
    // adjust camera
    camera.position.x = 0;
    camera.position.y = 5;
    camera.position.z = 5;

    //LIGHTING
    scene.add( new THREE.AmbientLight( 0x666666 ) );

    const light = new THREE.DirectionalLight( 0xdfebff, 1 );
    light.position.set( 50, 200, 100 );
    light.position.multiplyScalar( 1.3 );

    light.castShadow = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    const d = 300;

    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;

    light.shadow.camera.far = 1000;

    scene.add( light );

    // const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
    // scene.add(ambientLight);

    // const pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    // camera.add( pointLight );
    // scene.add( camera );

    // Ground
    const loadert = new THREE.TextureLoader();
    const groundTexture = loadert.load( 'Models/baw.jpeg' );
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set( 25, 25 );
    groundTexture.anisotropy = 16;
    groundTexture.encoding = THREE.sRGBEncoding;

    const groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );

    let mesh = new THREE.Mesh( new THREE.PlaneGeometry( 20000, 20000 ), groundMaterial );
    mesh.position.y = -5;//- 250;
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    // IMPORTING MODELS
    model = new THREE.Mesh();

    // GLTF models
    const loader = new GLTFLoader();
    loader.load('Models/low_poly_king/scene.gltf',
                function( mod ) {

                    model = mod.scene;
                    model.position.set( 0,-5,-20 );
                    scene.add(mod.scene);

                },
                function(xhr) {
                    console.log( ( xhr.loaded/xhr.total * 100 ) + '% loaded' );
                },
                function(error) {
                    console.log( 'error occurred' );
                }

    );
    //let box = new THREE.Box3().setFromObject( model );
    //console.log( box.min, box.max, box.getSize() );

    // ROTATE AND SCALE BUTTONS
    group = new THREE.Group();
    scene.add( group );

    // rotation button
    const buttonGeometry = new THREE.CylinderGeometry( 0.2, 0.2, 0.1, 64 );
    const buttonMaterial = new THREE.MeshStandardMaterial( {
        color: 0x884444,
        roughness: 0.7,
        metalness: 0.0
    } );
    const buttonObject = new THREE.Mesh( buttonGeometry, buttonMaterial );
    buttonObject.name = 'rotate';

    // scale up button
    const upMaterial = new THREE.MeshStandardMaterial( {
        color: 0x884444,
        roughness: 0.7,
        metalness: 0.0
    } );
    const upArrowGeometry = new THREE.ConeGeometry( 0.1, 0.5, 16 );

    const upObject = new THREE.Mesh( upArrowGeometry, upMaterial );
    upObject.name = 'up';

    // scale down button
    const downMaterial = new THREE.MeshStandardMaterial( {
        color: 0x884444,
        roughness: 0.7,
        metalness: 0.0
    } );
    const downArrowGeometry = new THREE.ConeGeometry( 0.1, 0.5, 16 );
    const downObject = new THREE.Mesh( downArrowGeometry, downMaterial );
    downObject.name = 'down';

    group.add(buttonObject);
    group.add(upObject);
    group.add(downObject);

    buttons = group.children;

    buttons[0].position.x = -0.7;
    buttons[0].position.z = -2.2;
    buttons[0].rotation.x += Math.PI/2;
    
    buttons[1].position.x = 0.7;
    buttons[1].position.y = 0.5;
    buttons[1].position.z = -2.2;

    buttons[2].position.x = 0.7;
    buttons[2].position.y = -0.5;
    buttons[2].position.z = -2.2;
    buttons[2].rotation.z += Math.PI;

    // RENDERER
    renderer = new THREE.WebGLRenderer( { anialias: true } );
    renderer.setSize( window.innerWidth , window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.xr.enabled = true;
    //renderer.xr.setReferenceSpaceType( 'local-floor' );
    container.appendChild( renderer.domElement );
    container.appendChild( VRButton.createButton( renderer ) );

    // CONTROLS
    // mouse controls
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( model.position.x, model.position.y, model.position.z-20 );
    // controls.noPan = true;
    // controls.noZoom = true;
    controls.update();

    // VR camera controls
    controller1 = renderer.xr.getController( 0 );
    controller1.addEventListener( 'selectstart', onSelectStart );
    controller1.addEventListener( 'selectend', onSelectEnd );
    controller1.addEventListener( 'connected', function ( event ) {

        this.add( buildController( event.data ) );

    } );
    controller1.addEventListener( 'disconnected', function () {

        this.remove( this.children[ 0 ] );

    } );
    scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
    controller2.addEventListener( 'selectstart', onSelectStart );
    controller2.addEventListener( 'selectend', onSelectEnd );
    // controller2.addEventListener( 'connected', function ( event ) {

    //     this.add( buildController( event.data ) );

    // } );
    // controller2.addEventListener( 'disconnected', function () {

    //     this.remove( this.children[ 0 ] );

    // } );
    scene.add( controller2 );

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    scene.add( controllerGrip1 );

    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    scene.add( controllerGrip2 );
    

    // Line for camera 'pointer'
    // const geometry1 = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 0.1 ) ] );

    // const line = new THREE.Line( geometry1 );
    // line.name = 'line';
    // line.scale.z = 5;

    // controller1.add( line.clone() );
    // controller2.add( line.clone() );

    raycaster = new THREE.Raycaster();

    // resizes window
    window.addEventListener( 'resize', onWindowResize );

}

function onSelectStart() {

    this.userData.isSelecting = true;

    const controller = event.target;

    const intersections = getIntersections( controller );

    if ( intersections.length > 0 ) {

        const intersection = intersections[ 0 ];

        const object = intersection.object;
        object.material.emissive.b = 1;
        controller.attach( object );

        controller.userData.selected = object;

    }

}

function onSelectEnd() {

    this.userData.isSelecting = false;

    const controller = event.target;

    if ( controller.userData.selected !== undefined ) {

        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        group.attach( object );

        controller.userData.selected = undefined;

    }

}


function getIntersections( controller ) {

    tempMatrix.identity().extractRotation( controller.matrixWorld );

    raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
    raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

    return raycaster.intersectObjects( group.children );

}

function intersectObjects( controller ) {

    // Do not highlight when already selected

    if ( controller.userData.selected !== undefined ) return;

    const line = controller.getObjectByName( 'line' );
    const intersections = getIntersections( controller );

    if ( intersections.length > 0 ) {

        const intersection = intersections[ 0 ];

        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push( object );

        if ( object.name == 'rotate' ){

            rotationSelected();
            handleController( controller );

        }
        if ( object.name == 'up' ){

            scaleupSelected();
            handleController( controller );

        }
        if ( object.name == 'down' ){

            scaledownSelected();
            handleController( controller );

        }

        

        //line.scale.z = intersection.distance;
    
    }else {

        //line.scale.z = 1;

    }

}

function cleanIntersected() {

    while ( intersected.length ) {

        const object = intersected.pop();
        object.material.emissive.r = 0;

    }

}

function buildController( data ) {

    let geometry, material;

    switch ( data.targetRayMode ) {

        case 'tracked-pointer':

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
            geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

            material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

            return new THREE.Line( geometry, material );

        case 'gaze':

            geometry = new THREE.CircleGeometry( 0.01, 32 ).translate( 0, 0, - 1 );
            material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
            return new THREE.Mesh( geometry, material );

    }
 
}

function rotationSelected() {
    rotationbutton = true;
    scaleupbutton = false;
    scaledownbutton = false;
}

function scaleupSelected() {
    scaleupbutton = true;
    scaledownbutton = false;
    rotationbutton = false;
}

function scaledownSelected() {
    scaledownbutton = true;
    scaleupbutton = false;
    rotationbutton = false;
}

function handleController( controller ) {

    if ( controller.userData.isSelecting && rotationbutton == true ) {
        model.rotation.y += 0.05;
    }

    if ( controller.userData.isSelecting && scaleupbutton == true ) {
        model.scale.x += 0.02;
        model.scale.y += 0.02;
        model.scale.z += 0.02;
    }

    if ( controller.userData.isSelecting && scaledownbutton == true ) {
        model.scale.x -= 0.02;
        model.scale.y -= 0.02;
        model.scale.z -= 0.02;
    }

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

// ANIMATE
function animate() {

    renderer.setAnimationLoop(render);

}

function render() {

    cleanIntersected();

    intersectObjects( controller1 );
    intersectObjects( controller2 );
    handleController( controller1 );
    handleController( controller2 );

    renderer.render( scene, camera );

}