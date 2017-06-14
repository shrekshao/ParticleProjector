var THREE = require('three');
// texture fbo / transform feedback for particle simulation

var Simulation = function (renderer, isWebGL2, simWidth, initPosTypedArray) {


    // // -------------------- use THREE.js GPUCompute Util --------------
    // // not webgl2
    // var gpuCompute = new GPUComputationRenderer( simWidth, simWidth, renderer );
    // // var dtPos = gpuCompute.createTexture();
    // // var dtVel = gpuCompute.createTexture();

    // // dtPosition.
    // // ----------------------------------------------------------------

    var _renderer = renderer;
    var _isWebGL2 = isWebGL2;

    var numParticle = simWidth * simWidth;

    var _registeredUniforms = [];

    var _target1;
    var _target2;
    var _target3;

    // var _simTexSideLen = Math.ceil( Math.sqrt( numParticle ) );

    // var _size = _renderer.getSize();

    // TODO: properly handle windowResize
    // camera used for texture buffer rendering
    var _cameraRTT = new THREE.OrthographicCamera( 
        // _size.width / - 2, 
        // _size.width / 2, 
        // _size.height / 2, 
        // _size.height / - 2, 
        - 1,
        1,
        1,
        - 1,
        -10000, 10000 );
    _cameraRTT.position.z = -10;

    // renderer.extensions.get( "OES_texture_float" );
    
    var _initPosTexture = new THREE.DataTexture( 
        initPosTypedArray, 
        simWidth,
        simWidth,
        // 200,
        // 200,
        THREE.RGBFormat, 
        THREE.FloatType, 
        THREE.UVMapping,
        THREE.ClampToEdgeWrapping,
        THREE.ClampToEdgeWrapping,
        THREE.NearestFilter,
        THREE.NearestFilter
    );
    _initPosTexture.needsUpdate = true;

    // // image is not deep copied, ? will it get flushed?
    // _target1 = _createTarget(simWidth, simWidth);
    // _target1.texture = _initPosTexture.clone();
    // // _target1.texture.image.data = new Float32Array(_initPosTexture.image.data);
    // // _target1.texture.image.data = new Float32Array(numParticle * 3);
    // _target1.texture.needsUpdate = true;
    // _target2 = _createTarget(simWidth, simWidth);
    // _target2.texture = _initPosTexture.clone();
    // // _target2.texture.image.data = new Float32Array(_initPosTexture.image.data);
    // // _target2.texture.image.data = new Float32Array(numParticle * 3);
    // _target2.texture.needsUpdate = true;
    // _target3 = _createTarget(simWidth, simWidth);



    var randomPos = new Float32Array(numParticle * 3);
    for ( var i = 0, j = 0, l = randomPos.length; i < l; i += 3, j += 1 ) {
        randomPos[ i ] = ( Math.random() - 0.5 ) * 100;
        randomPos[ i + 1 ] = ( Math.random() - 0.5 ) * 100;
        // randomPos[ i + 2 ] = ( Math.random() - 0.5 ) * 100;
        randomPos[ i + 2 ] = 0;
    }

    _target1 = _createTarget(simWidth, simWidth);
    _target1.texture = new THREE.DataTexture( 
        // new Float32Array(numParticle * 3), 
        randomPos,
        simWidth,
        simWidth,
        // 200,
        // 200,
        THREE.RGBFormat, 
        THREE.FloatType, 
        THREE.UVMapping,
        THREE.ClampToEdgeWrapping,
        THREE.ClampToEdgeWrapping,
        THREE.NearestFilter,
        THREE.NearestFilter
    );
    _target1.texture.needsUpdate = true;

    _target2 = _createTarget(simWidth, simWidth);

    _target3 = _createTarget(simWidth, simWidth);

    var _currUpdateTarget = 3;


    var _simulationMaterial = new THREE.RawShaderMaterial( {
        uniforms: {
            "tPrevPos": { type: "t", value: null },
            "tCurrPos": { type: "t", value: null },
            "tInitPos": { type: "t", value: _initPosTexture },
            "uDeltaT": { type: "f", value: 0.0 },
            "uTime": { type: "f", value: 0.0 },

            "uMousePos": { type: "v3", value: new THREE.Vector3(-999, -999, 0) }
            // "uInputPos": { type: "v3v", value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
            // "uInputPosAccel": { type: "v4", value: new THREE.Vector4(0,0,0,0) },
        },
        defines: {
            // K_VEL_DECAY: '0.99'
            K_VEL_DECAY: '0.95'
        },
        vertexShader: document.getElementById( 'vs-raw-sim' ).textContent,
        fragmentShader: document.getElementById( 'fs-raw-sim' ).textContent,
        
        transparent: false
    } );





    // scene: nothing fancy
    // just a full screen quad
    // TODO: maybe a triangle to avoid aliasing on the edge
    var _scene = new THREE.Scene();

    var _plane = new THREE.PlaneBufferGeometry( 2.0, 2.0 );
    var _quad = new THREE.Mesh( _plane, _simulationMaterial );

    _scene.add(_quad);

    // _checkSupport();


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



    var _outTargetPtr = null;

    function _updateRegisteredUniforms() {
        for (var i = 0; i < _registeredUniforms.length; i++) {
            _registeredUniforms[i].value = _outTargetPtr.texture;
        }
    };

    this.update = function (dt, t) {
        _simulationMaterial.uniforms.uDeltaT.value = dt;
        _simulationMaterial.uniforms.uTime.value = t;


        if (_currUpdateTarget === 1) {
            _simulationMaterial.uniforms.tPrevPos.value = _target2.texture;
            _simulationMaterial.uniforms.tCurrPos.value = _target3.texture;
            _renderer.render(_scene, _cameraRTT, _target1);
            _outTargetPtr = _target1;
        }
        else if (_currUpdateTarget === 2) {
            _simulationMaterial.uniforms.tPrevPos.value = _target3.texture;
            _simulationMaterial.uniforms.tCurrPos.value = _target1.texture;
            _renderer.render(_scene, _cameraRTT, _target2);
            _outTargetPtr = _target2;
        }
        else if (_currUpdateTarget === 3) {
            _simulationMaterial.uniforms.tPrevPos.value = _target1.texture;
            _simulationMaterial.uniforms.tCurrPos.value = _target2.texture;
            _renderer.render(_scene, _cameraRTT, _target3);
            _outTargetPtr = _target3;
        }
        else {
            console.error("Simulation target idx: something's wrong!");
        }

        // _simulationMaterial.uniforms.tPrevPos.value = _simulationMaterial.uniforms.tCurrPos.value;
        // _simulationMaterial.uniforms.tCurrPos.value = _outTargetPtr.texture;
        // _renderer.render(_scene, _cameraRTT);

        _updateRegisteredUniforms();

        _currUpdateTarget++;
        if (_currUpdateTarget > 3) {
            _currUpdateTarget = 1;
        }

    };

    this.registerUniform = function(uniform) {
        _registeredUniforms.push(uniform);
        uniform.value = _outTargetPtr;
    };



    this.mouseInteraction = function(e) {
        var x = e.clientX / e.currentTarget.width;
        var y = e.clientY / e.currentTarget.height;
        
        _simulationMaterial.uniforms.uMousePos.value.x = e.clientX / e.currentTarget.width;
        _simulationMaterial.uniforms.uMousePos.value.y = e.clientY / e.currentTarget.height;

        // console.log(x, y);
    }


    this.updateMousePosition = function(vector) {
        _simulationMaterial.uniforms.uMousePos.value = vector;
    }


};

export { Simulation };