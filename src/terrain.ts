import * as THREE from 'three';

export function boundary(a:number, scale=1):THREE.Vector2 {
  return new THREE.Vector2(4.15*Math.cos(a)*(1+.045*Math.sin(3*a)+.035*Math.cos(5*a))*scale,2.45*Math.sin(a)*(1+.07*Math.cos(3*a))*scale);
}
export function pondShape(scale=1) {
  return new THREE.Shape(Array.from({length:192},(_,i)=>boundary(i/192*Math.PI*2,scale)));
}
export function addTerrain(scene:THREE.Scene) {
  const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:1});
  const outline:THREE.Vector2[]=[];
  for(let i=0;i<256;i++){
    const a=i/256*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
    outline.push(new THREE.Vector2(5.95*Math.sign(c)*Math.pow(Math.abs(c),.22)*(1+.012*Math.sin(19*a)),3.9*Math.sign(s)*Math.pow(Math.abs(s),.22)*(1+.017*Math.cos(17*a))));
  }
  const landShape=new THREE.Shape(outline);
  landShape.holes.push(new THREE.Path(pondShape(1.046).getPoints().reverse()));
  const geo=new THREE.ShapeGeometry(landShape,128);geo.rotateX(Math.PI/2);
  const colors=[];const positions=geo.getAttribute('position');
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=positions.getZ(i);const c=new THREE.Color('#9bcb57');
    c.multiplyScalar(.97+.035*Math.sin(x*2+z*3)+.025*Math.sin(z*5-x));colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const land=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));land.position.y=.035;land.receiveShadow=true;
  land.material.onBeforeCompile=(shader)=>{
    shader.vertexShader='varying vec2 lawnXZ;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlawnXZ=position.xz;');
    shader.fragmentShader='varying vec2 lawnXZ;\nfloat lawnHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float edge=pow(abs(lawnXZ.x)/5.9,12.)+pow(abs(lawnXZ.y)/3.88,12.);
      float speck=lawnHash(floor(lawnXZ*190.));
      if(edge>.72 && speck<smoothstep(.72,1.12,edge))discard;
      diffuseColor.rgb*=.90+.13*speck;
    `);
  };scene.add(land);
  // Real cut-out terrain joined to a low, sloping shoreline.
  const verts:number[]=[],indices:number[]=[];
  for(let i=0;i<=256;i++){
    const a=i/256*Math.PI*2;const inner=boundary(a,.994),outer=boundary(a,1.047);
    verts.push(inner.x,-.04,inner.y,outer.x,.039+.008*Math.sin(a*11),outer.y);
    if(i<256){let k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const shoreGeo=new THREE.BufferGeometry();shoreGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));shoreGeo.setIndex(indices);shoreGeo.computeVertexNormals();
  const shore=new THREE.Mesh(shoreGeo,new THREE.MeshStandardMaterial({color:'#dfd0a3',roughness:1,side:THREE.DoubleSide}));shore.receiveShadow=true;scene.add(shore);
  // Radial fan gives the bottom a continuous shallow-to-deep colour gradient.
  const v=[0,-.26,0],cs:number[]=[];const center=new THREE.Color('#448b9d');cs.push(center.r,center.g,center.b);const ix:number[]=[];
  for(let i=0;i<=256;i++){const p=boundary(i/256*Math.PI*2,1.005);v.push(p.x,-.26,p.y);const c=new THREE.Color('#81bfa7');cs.push(c.r,c.g,c.b);if(i<256)ix.push(0,i+2,i+1);}
  const bedG=new THREE.BufferGeometry();bedG.setAttribute('position',new THREE.Float32BufferAttribute(v,3));bedG.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));bedG.setIndex(ix);bedG.computeVertexNormals();
  const bed=new THREE.Mesh(bedG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));bed.receiveShadow=true;scene.add(bed);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(3.35,.048,2.13),new THREE.Vector3(3.9,.048,2.6),new THREE.Vector3(4.2,.048,3.2),new THREE.Vector3(4.42,.048,3.91)]);
  const pv:number[]=[],pi:number[]=[];
  for(let i=0;i<=64;i++){const t=i/64,p=curve.getPoint(t),tan=curve.getTangent(t);const w=.22+.025*Math.sin(t*8);const n=new THREE.Vector3(-tan.z,0,tan.x).multiplyScalar(w);pv.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);if(i<64){const k=i*2;pi.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pv,3));pg.setIndex(pi);pg.computeVertexNormals();const path=new THREE.Mesh(pg,new THREE.MeshStandardMaterial({color:'#dfd0a3',roughness:1,side:THREE.DoubleSide}));path.receiveShadow=true;scene.add(path);
  const bridge=new THREE.Group();bridge.position.set(3.02,.11,1.88);bridge.rotation.y=.85;
  for(let i=0;i<9;i++){const plank=new THREE.Mesh(new THREE.BoxGeometry(.64,.075,.145),material(['#a77b50','#ac8256','#b18b60'][i%3]));plank.position.set(0,Math.sin(i)*.006,(i-4)*.16);plank.castShadow=true;plank.receiveShadow=true;bridge.add(plank);}
  for(const x of [-.25,.25]){const beam=new THREE.Mesh(new THREE.BoxGeometry(.055,.08,1.5),material('#8a694a'));beam.position.set(x,-.07,0);bridge.add(beam);}
  scene.add(bridge);
  const stones=[[-4.15,-.65,.16],[-3.75,1.45,.22],[-3.56,1.68,.15],[-1.25,2.6,.18],[1.4,-2.5,.16],[1.54,-2.6,.11],[4,-.9,.21],[4.15,-.65,.14]];
  for(const [x,z,r] of stones){const rock=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),material('#c9c7bb'));rock.position.set(x,.1,z);rock.scale.set(1,.78,.85);rock.rotation.z=x;rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);}
}
