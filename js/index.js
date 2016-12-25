
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

    var particleCount = 4000;//400000;

    // temp cfg class
    var cfg = {
        pointSize: 20.0, 
        pointAlpha: 1.0
    };

    var particleMaterial;
    var pointMesh;
    
    var leftMouseKeyDown;

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



    var objLoader = new THREE.OBJLoader();
    var mtlLoader = new THREE.MTLLoader();


    // stonebird teach me how to use require
    function loadObjModel(params, onload) {

        mtlLoader.setBaseUrl(params.baseUrl); //texture base path
        mtlLoader.setPath(params.baseUrl);    //mtl base path
        mtlLoader.load(params.mtlName, function(materials) {
            materials.preload();
            
            objLoader.setMaterials(materials);
            objLoader.setPath(params.baseUrl);
            objLoader.load(params.objName, function(object){
                onload(object);
            });
        });
    }




    function init(success) {
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

        var ambient = new THREE.AmbientLight( 0x444444 );
        scene.add( ambient );

        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 0, 0, 1 ).normalize();
        scene.add( directionalLight );

        // var sphereBufferGeometry = new THREE.SphereBufferGeometry( 5, 10, 10 );
        // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
        // // var material = new THREE.MeshNormalMaterial( {shading: THREE.FlatShading} );
        // var sphere = new THREE.Mesh( sphereBufferGeometry, material );



        // // sphere geometry
        // var sphereGeometry = new THREE.SphereGeometry(5, 10, 10);

        // // point cloud of models
        // var particleCount = 1000;
        // var points = THREE.GeometryUtils.randomPointsInGeometry( sphereGeometry, particleCount );

        // var data = new Float32Array( particleCount * 4 );
        // for ( var i = 0, j = 0, l = data.length; i < l; i += 4, j += 1 ) {
        //     data[ i ] = points[ j ].x;
        //     data[ i + 1 ] = points[ j ].y;
        //     data[ i + 2 ] = points[ j ].z;
        //     data[ i + 3 ] = 1.0;
        // }

        // var geometry = new THREE.BufferGeometry();
        // geometry.addAttribute( 'position', new THREE.BufferAttribute( data, 4 ).setDynamic( true ) );

        

        // pointMesh = new THREE.Points(geometry, particleMaterial);

        // // scene.add( sphere );
        // scene.add( pointMesh );




        loadObjModel( {
            // baseUrl: 'models/obj/sword/',
            // mtlName: 'Sword07_obj.mtl',
            // objName: 'Sword07_obj.obj'

            baseUrl: 'models/obj/di/',
            mtlName: 'di.mtl',
            objName: 'di.obj'
        } , function (object) {

            console.log(object);

            // TODO: groups, complete obj support
            var bufferGeo = object.children[0].geometry;
            var texture = object.children[0].material.map;
            // var texture = object.children[0].material.materials[0].map;

            
            var points = THREE.GeometryUtils.randomPointsWithAttributeInBufferGeometry( bufferGeo, particleCount );
            // custom particle shader test
            particleMaterial = new THREE.ShaderMaterial( {
                uniforms: {
                    'uTime': { type: 'f', value: 0.0 },
                    'uKtime': { value: 0.0 },
                    'uConcentration': {value: new THREE.Vector4(0.0, 0.0, 0.0, 1.0)},
                    'uPointSize': { type: 'f', value: cfg.pointSize },
                    'uAlpha': { type: 'f', value: cfg.pointAlpha },
                    'tDiffuse': { type: 't', value: texture }
                    // 'tDiffuse': { type: 't', value: THREE.ImageUtils.loadTexture( 'models/obj/di/di.png' ) }
                },
                vertexShader: document.getElementById( 'vs-particles' ).textContent,
                fragmentShader: document.getElementById( 'fs-particles' ).textContent,
                blending: THREE.AdditiveBlending,
                // blending: THREE.NormalBlending,
                depthWrite: false,
                depthTest: true,
                transparent: true
            } );


            var position = new Float32Array( particleCount * 3 );
            for ( var i = 0, j = 0, l = position.length; i < l; i += 3, j += 1 ) {
                position[ i ] = points.position[ j ].x;
                position[ i + 1 ] = points.position[ j ].y;
                position[ i + 2 ] = points.position[ j ].z;
            }

            var normal = new Float32Array( particleCount * 3 );
            for ( i = 0, j = 0, l = normal.length; i < l; i += 3, j += 1 ) {
                normal[ i ] = points.normal[ j ].x;
                normal[ i + 1 ] = points.normal[ j ].y;
                normal[ i + 2 ] = points.normal[ j ].z;
            }

            var uv = new Float32Array( particleCount * 2 );
            for ( i = 0, j = 0, l = uv.length; i < l; i += 2, j += 1 ) {
                uv[ i ] = points.uv[ j ].x;
                uv[ i + 1 ] = points.uv[ j ].y;
            }

            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ).setDynamic( true ) );
            geometry.addAttribute( 'normal', new THREE.BufferAttribute( normal, 3 ).setDynamic( true ) );
            geometry.addAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ).setDynamic( true ) );

            pointMesh = new THREE.Points(geometry, particleMaterial);
            scene.add( pointMesh );

            document.addEventListener('mousedown', function(e){
                if (e.which == 1){
                    leftMouseKeyDown = true;
                    
                    var vec = new THREE.Vector3(
                        ( e.offsetX / window.innerWidth ) * 2 - 1, 
                        - ( e.offsetY / window.innerHeight ) * 2 + 1, 
                        0.5);
                    
                    vec.unproject(camera);
                    
                    var vec = new THREE.Vector4(vec.x, vec.y, vec.z, 0.0);
                    
                    particleMaterial.uniforms.uConcentration.value = vec;
                }
            });
            document.addEventListener('mouseup', function(e){
                if (e.which == 1){
                    leftMouseKeyDown = false;
                    particleMaterial.uniforms.uKtime.value = 0.0;
                    particleMaterial.uniforms.uConcentration.value = new THREE.Vector3(0.0, 0.0, 0.0, 1.0);
                }
            });

            // scene.add(object);

            success();
        } );

    }

    // var direction = new THREE.Vector3(0.03, 0.05, 0);

    function update() {
        requestAnimationFrame(update);
        particleMaterial.uniforms.uTime.value += 0.1;
        if (leftMouseKeyDown){
            particleMaterial.uniforms.uKtime.value += 0.1;
        }
        renderer.render(scene, camera);
    }


    window.onload = function() {
        init(update);
    };
    // update();

})();