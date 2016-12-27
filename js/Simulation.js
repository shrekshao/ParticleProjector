// texture fbo / transform feedback for particle simulation

var Simulation = function (renderer, isWebGL2, numParticle, initPosTypedArray) {
    var _renderer = renderer;
    var _isWebGL2 = isWebGL2;

    var _simTexSideLen = Math.ceil( Math.sqrt( numParticle ) );

    // var _size = _renderer.getSize();

    // // TODO: properly handle windowResize
    // // camera used for texture buffer rendering
    // var _cameraRTT = new THREE.OrthographicCamera( 
    //     _size.width / - 2, 
    //     _size.width / 2, 
    //     _size.height / 2, 
    //     _size.height / - 2, 
    //     -10000, 10000 );
    // _cameraRTT.position.z = 100;

    
    var _initPosTexture = new THREE.DataTexture( 
        initPosTypedArray, 
        _simTexSideLen,
        _simTexSideLen,
        THREE.RGBAFormat, 
        THREE.FloatType, 
        THREE.ClampToEdgeWrapping,
        THREE.ClampToEdgeWrapping,
        THREE.NearestFilter,
        THREE.NearestFilter
    );

    var _target1 = _createTarget(_simTexSideLen, _simTexSideLen);
    _target1.texture = _initPosTexture.clone();
    var _target2 = _createTarget(_simTexSideLen, _simTexSideLen);
    _target2.texture = _initPosTexture.clone();


    var _simulationMaterial = new THREE.RawShaderMaterial( {
        uniforms: {
            "tPrevPos": { type: "t", value: null },
            "tCurrPos": { type: "t", value: null },
            "tInitPos": { type: "t", value: _initPosTexture },
            "uDeltaT": { type: "f", value: 0.0 },
            "uTime": { type: "f", value: 0.0 },
            // "uInputPos": { type: "v3v", value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
            // "uInputPosAccel": { type: "v4", value: new THREE.Vector4(0,0,0,0) },
        },
        defines: {
            K_VEL_DECAY: '0.99'
        },
        vertexShader: document.getElementById( 'vs-raw-sim' ).textContent,
        fragmentShader: document.getElementById( 'fs-raw-sim' ).textContent,
        side: THREE.DoubleSide,
        transparent: true
    } );





    // scene: nothing fancy
    // just a full screen quad
    // TODO: maybe a triangle to avoid aliasing on the edge
    var _scene = new THREE.Scene();

    var _plane = new THREE.PlaneBufferGeometry( 1.0, 1.0 );
    var _quad = new THREE.Mesh( _plane, _simulationMaterial );

    _scene.add(_quad);


    function _checkSupport() {
        var gl = _renderer.context;


        if (_isWebGL2) {
            console.log('WebGL2: use transform feedback for simulation.');
        } else {
            console.log('WebGL1: use texture fbo for simulation.');
        }


        if ( gl.getExtension( "OES_texture_float" ) === null ) {
            console.error("SimulationRenderer: OES_texture_float not supported.");
            return false;
        }

        if ( gl.getParameter( gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS ) === 0 ) {
            console.error("SimulationRenderer: Vertex shader textures not supported.");
            return false;
        }

        return true;
    }



    function _createTarget(width, height) {
        // var size = _renderer.getSize();

        var target = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        });
        target.texture.generateMipmaps = false;

        return target;
    }

    


    this.update = function (dt, t) {
        _simulationMaterial.material.uniforms.uDeltaT.value = dt;
        _simulationMaterial.material.uniforms.uTime.value = t;


    };



};