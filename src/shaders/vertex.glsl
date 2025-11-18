#include simplexnoise4d.glsl
attribute vec3 tangent;

float getBlob(vec3 position){
    vec3 wrappedPosition = position;
    wrappedPosition += simplexNoise4d(vec4(position * 1.5 , 1.0 * .7)) * .3; // up and down wave
    return simplexNoise4d(vec4(wrappedPosition * 1.2 , 1.0 * .7)) * .2; // first will acquire three xyz and 4th for time
}

void main(){
    // finding bitangent 
    vec3 bitangent = cross(tangent.xyz , normal);
    // finding amplitude 
    float shift = .07;
    vec3 A = csm_Position + shift * bitangent; //upper value max
    // csm_Position -> position of each point  where how much it will animate
    vec3 B = csm_Position - shift * bitangent ;// lower value min

    float blob  = getBlob(A);
    csm_Position += blob * normal;
}