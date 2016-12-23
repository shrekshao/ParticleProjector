
/*
(function() {
    'use strict'
    
    var app = new App();
})();
*/

// var app = new App();


(function() {
    'use strict'

    var camera, tick = 0,
        scene, renderer, clock = new THREE.Clock(true),
        controls, gui = new dat.GUI(),
        options, spawnerOptions, particleSystem;

    var container;
    var canvas;

    var gl;
    var isWebGL2 = true;


    // temp cfg class
    var cfg = {
        pointSize: 50.0, 
        pointAlpha: 1.0
    };

    var particleMaterial;
    var pointMesh;

    gui.add( cfg, 'pointSize', 1.0, 100.0 ).onChange( function(value) {
        particleMaterial.uniforms.uPointSize.value = value;
        // pointMesh.material.uniforms.uPointSize.value = value;
        // console.log('pointSize: ' + value);
    } );
    gui.add( cfg, 'pointAlpha', 0.0, 1.0 ).onChange( function(value) {
        particleMaterial.uniforms.uAlpha.value = value;
        // pointMesh.material.uniforms.uAlpha.value = value;
        // console.log('pointAlpha: ' + value);
    } );

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    function init() {
        container = document.createElement( 'div' );
        document.body.appendChild( container );
        canvas = document.createElement( 'canvas' );

        gl = canvas.getContext( 'webgl2', { antialias: true } );
        if (!gl) {
            isWebGL2 = false;
            gl = canvas.getContext( 'webgl', { antialias: true } );
        }

        renderer = new THREE.WebGLRenderer( { canvas: canvas, context: gl } );
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);


        // camera
        camera = new THREE.PerspectiveCamera( 28, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 100;
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        

        // scene
        scene = new THREE.Scene();

        // var sphereBufferGeometry = new THREE.SphereBufferGeometry( 5, 10, 10 );
        // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
        // // var material = new THREE.MeshNormalMaterial( {shading: THREE.FlatShading} );
        // var sphere = new THREE.Mesh( sphereBufferGeometry, material );

        var sphereGeometry = new THREE.SphereGeometry(5, 10, 10);

        // point cloud of models
        var particleCount = 1000;
        var points = THREE.GeometryUtils.randomPointsInGeometry( sphereGeometry, particleCount );

        var data = new Float32Array( particleCount * 4 );
        for ( var i = 0, j = 0, l = data.length; i < l; i += 4, j += 1 ) {
            data[ i ] = points[ j ].x;
            data[ i + 1 ] = points[ j ].y;
            data[ i + 2 ] = points[ j ].z;
            data[ i + 3 ] = 1.0;
        }

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( data, 4 ).setDynamic( true ) );


        // custom particle shader test
        particleMaterial = new THREE.ShaderMaterial( {
            uniforms: {
              'uPointSize': { type: 'f', value: cfg.pointSize },
              'uAlpha': { type: 'f', value: cfg.pointAlpha },
            },
            vertexShader: document.getElementById( 'vs-particles' ).textContent,
            fragmentShader: document.getElementById( 'fs-particles' ).textContent,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            transparent: true
          } );




        pointMesh = new THREE.Points(geometry, particleMaterial);

        // scene.add( sphere );
        scene.add( pointMesh );

        // renderer.render(scene, camera);



    }



    function update() {

        requestAnimationFrame(update);

        renderer.render(scene, camera);
    }

    


    init();
    update();

})();