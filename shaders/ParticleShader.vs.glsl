
// varying vec3 vColor;

// uniform sampler2D tPos;
// uniform float uTime;

#define PS_CAM_MAX_DIST 12.0

uniform float uPointSize;


void main()
{
    vec3 pos = position;    // temp

    vec3 camToPos = pos - cameraPosition;
    float camDist = length(camToPos);

    gl_PointSize = max( uPointSize * PS_CAM_MAX_DIST / camDist, 1.0 );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}