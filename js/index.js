
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
        controls, container, gui = new dat.GUI(),
        options, spawnerOptions, particleSystem;

    function init() {
        container = document.createElement('div');
        document.body.appendChild(container);


        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);


        camera = new THREE.PerspectiveCamera( 28, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 100;
        
        scene = new THREE.Scene();



        var sphereBufferGeometry = new THREE.SphereBufferGeometry( 5, 10, 10 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
        // var material = new THREE.MeshNormalMaterial( {shading: THREE.FlatShading} );
        var sphere = new THREE.Mesh( sphereBufferGeometry, material );

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

        var mesh = new THREE.Points(geometry);

        // scene.add( sphere );
        scene.add( mesh );

        renderer.render(scene, camera);



    }



    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }


    init();

})();