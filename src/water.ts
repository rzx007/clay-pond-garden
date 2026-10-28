import * as THREE from 'three';
import {pondShape} from './terrain';
export function addWater(scene:THREE.Scene){
  const geometry=new THREE.ShapeGeometry(pondShape(),128);geometry.rotateX(Math.PI/2);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:`varying vec2 p; void main(){p=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time; varying vec2 p;
  void main(){float d=clamp(length(p/vec2(4.15,2.45)),0.,1.);vec3 col=mix(vec3(.23,.53,.60),vec3(.50,.79,.70),smoothstep(.35,1.,d));float w=sin(p.y*36.+sin(p.x*2.7+time*.23)*1.8-time*.6);float mask=pow(max(0.,sin(p.x*3.7+p.y*.8+time*.13)),14.);float ripple=smoothstep(.985,1.,w)*mask*.13;gl_FragColor=vec4(col+ripple,.25+ripple);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  const water=new THREE.Mesh(geometry,material);water.position.y=-.025;water.renderOrder=2;scene.add(water);
  const ripples=new THREE.Group();scene.add(ripples);
  for(let i=0;i<24;i++){
    const x=Math.sin(i*47.2)*3.6,z=Math.cos(i*31.4)*1.95;
    if(Math.hypot(x/4.1,z/2.4)>.9)continue;
    const pts=[];for(let j=0;j<12;j++)pts.push(new THREE.Vector3(x+(j/11-.5)*(.15+(i%4)*.09),-.014,z+Math.sin(j/11*Math.PI)*.009));
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#d9efdc',transparent:true,opacity:.23,depthWrite:false}));line.renderOrder=3;ripples.add(line);
  }
  return {update(t:number){material.uniforms.time.value=t;ripples.position.x=Math.sin(t*.12)*.035;}};
}
