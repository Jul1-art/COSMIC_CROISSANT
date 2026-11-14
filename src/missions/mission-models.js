import * as THREE from 'three';
const gold=()=>new THREE.MeshStandardMaterial({color:0xcaa660,metalness:.7,roughness:.48,flatShading:true});
const silver=()=>new THREE.MeshStandardMaterial({color:0xb3b9bd,metalness:.8,roughness:.35});
const black=()=>new THREE.MeshStandardMaterial({color:0x151b24,roughness:.8});
function mesh(group,geometry,material,x=0,y=0,z=0){const node=new THREE.Mesh(geometry,material);node.position.set(x,y,z);node.castShadow=true;node.receiveShadow=true;group.add(node);return node;}
function box(group,size,material,x=0,y=0,z=0){return mesh(group,new THREE.BoxGeometry(...size),material,x,y,z);}
function cylinder(group,r1,r2,h,material,x=0,y=0,z=0,n=12){return mesh(group,new THREE.CylinderGeometry(r1,r2,h,n),material,x,y,z);}
function strut(group,a,b,r=.035,material=silver()){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),node=cylinder(group,r,r,from.distanceTo(to),material);node.position.copy(from).add(to).multiplyScalar(.5);node.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());return node;}
export function createLander(){
  const root=new THREE.Group(),lower=new THREE.Group(),upper=new THREE.Group();root.add(lower,upper);upper.position.y=2.8;
  const foil=gold(),alloy=silver(),dark=black();
  cylinder(lower,1.65,1.65,1.6,foil,0,1.9,0,8);cylinder(lower,.38,.7,.75,dark,0,.8,0);
  for(let i=0;i<4;i++){const angle=i*Math.PI/2+Math.PI/4,x=Math.cos(angle),z=Math.sin(angle);strut(lower,[x,2.3,z],[x*3,.25,z*3],.06,alloy);strut(lower,[x*1.5,1.1,z*1.5],[x*3,.25,z*3],.035,alloy);cylinder(lower,.5,.5,.08,alloy,x*3,.12,z*3);box(lower,[.7,.65,.4],foil,x*1.7,2,z*1.7);}
  box(lower,[.8,.1,1.2],alloy,0,2.7,2.1);strut(lower,[-.4,.3,2.7],[-.4,2.75,1.8],.03);strut(lower,[.4,.3,2.7],[.4,2.75,1.8],.03);for(let i=0;i<9;i++)strut(lower,[-.4,.4+i*.25,2.65-i*.09],[.4,.4+i*.25,2.65-i*.09],.025);
  box(lower,[.35,.22,.025],alloy,0,2.3,1.67);
  cylinder(upper,1.2,1.15,1.8,alloy,0,.95,0,8);box(upper,[1.5,1.25,.65],alloy,0,.9,1.05);cylinder(upper,.5,.7,.5,dark,0,-.15,0);
  const glass=new THREE.MeshStandardMaterial({color:0x193248,metalness:.7,roughness:.1});
  for(const x of [-.46,.46]){const node=mesh(upper,new THREE.CircleGeometry(.31,3),glass,x,1.35,1.39);node.rotation.z=Math.PI;}
  box(upper,[.65,.7,.08],dark,0,.45,1.4);cylinder(upper,.38,.38,.12,alloy,0,1.9,0);
  for(const x of [-1,1]){box(upper,[.8,.7,.6],foil,x*1.1,.6,-.75);for(const z of [-1,1]){const thruster=cylinder(upper,.07,.16,.25,dark,x*1.6,.9,z*.75);thruster.rotation.z=Math.PI/2;}}
  strut(upper,[0,1.7,0],[0,3,0],.025);const dish=mesh(upper,new THREE.SphereGeometry(.38,16,8,0,Math.PI*2,0,Math.PI/2),alloy,0,3,0);dish.rotation.z=.8;
  return {root,lower,upper};
}
export function createHardware(kind){
 const group=new THREE.Group(),alloy=silver(),foil=gold(),dark=black();
 if(kind==='reflector'){const panel=box(group,[.65,.05,.65],alloy,0,.24,0);panel.rotation.x=-.3;const cubes=new THREE.InstancedMesh(new THREE.BoxGeometry(.042,.025,.042),new THREE.MeshStandardMaterial({color:0xdbe9f1,metalness:.7,roughness:.15}),100),pose=new THREE.Object3D();cubes.castShadow=true;cubes.receiveShadow=true;for(let x=0;x<10;x++)for(let z=0;z<10;z++){pose.position.set((x-4.5)*.055,.29+(z-4.5)*.055*.3,(z-4.5)*.055);pose.updateMatrix();cubes.setMatrixAt(x*10+z,pose.matrix);}group.add(cubes);strut(group,[-.25,0,.3],[-.25,.3,-.3]);strut(group,[.25,0,.3],[.25,.3,-.3]);}
 if(kind==='seismic'){cylinder(group,.2,.25,.45,foil,0,.35,0);box(group,[.6,.1,.6],foil,0,.08,0);for(const x of [-1,1]){const p=box(group,[.95,.03,.6],new THREE.MeshStandardMaterial({color:0x263a56,metalness:.5,roughness:.4}),x*.7,.28,0);p.rotation.z=x*-.15;for(let i=0;i<6;i++)box(group,[.01,.008,.6],alloy,x*.7+(i-2.5)*.14,.31,0);}}
 if(kind==='dust'){box(group,[.22,.1,.15],alloy,0,.02,0);box(group,[.18,.02,.12],dark,0,.09,0);}
 if(kind==='flag'){strut(group,[0,0,0],[0,2.4,0],.025,alloy);strut(group,[0,2.4,0],[1.4,2.4,0],.02,alloy);const canvas=document.createElement('canvas');canvas.width=260;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#ece5d5';ctx.fillRect(0,0,260,160);ctx.fillStyle='#a82d3f';for(let i=0;i<13;i+=2)ctx.fillRect(0,i*160/13,260,160/13);ctx.fillStyle='#243c62';ctx.fillRect(0,0,110,86);ctx.fillStyle='#fff';for(let y=0;y<5;y++)for(let x=0;x<6;x++)ctx.fillRect(8+x*17,7+y*16,3,3);const tex=new THREE.CanvasTexture(canvas),geometry=new THREE.PlaneGeometry(1.4,.85,12,6);const pos=geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,.045*Math.sin(pos.getX(i)*18));geometry.computeVertexNormals();const flag=mesh(group,geometry,new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:1}),.7,1.95,0);flag.userData.flag=true;}
 if(kind==='antenna'){for(let i=0;i<3;i++){const a=i*2*Math.PI/3;strut(group,[Math.cos(a)*.65,0,Math.sin(a)*.65],[0,1.4,0]);}strut(group,[0,0,0],[0,2,0]);const dish=mesh(group,new THREE.SphereGeometry(.65,24,12,0,Math.PI*2,0,Math.PI/2),alloy,0,1.7,0);dish.rotation.x=.5;strut(group,[0,1.7,0],[0,2.5,.35]);}
 if(kind==='camera'){for(let i=0;i<3;i++){const a=i*2*Math.PI/3;strut(group,[Math.cos(a)*.5,0,Math.sin(a)*.5],[0,1.1,0],.018);}box(group,[.25,.25,.4],alloy,0,1.25,0);const lens=cylinder(group,.08,.08,.15,dark,0,1.25,.26);lens.rotation.x=Math.PI/2;}
 if(kind==='tools'){strut(group,[-.5,.1,-.5],[.5,.1,.5],.025);box(group,[.35,.06,.4],alloy,.65,.1,.65);strut(group,[-.5,.08,.5],[.5,.08,-.5],.025);}
 if(kind==='bags'){for(let i=0;i<3;i++){const bag=mesh(group,new THREE.IcosahedronGeometry(.3,1),new THREE.MeshStandardMaterial({color:0xd7cdb8,roughness:1}),i*.4,.25,0);bag.scale.set(1,1.3,.8);}}
 if(kind==='blankets'){const blanket=box(group,[.8,.03,.6],foil);blanket.rotation.z=.06;}
 return group;
}
export function createCSM(){const group=new THREE.Group(),alloy=silver();cylinder(group,.65,.65,1.6,alloy,0,0,0);cylinder(group,0,.65,.85,alloy,0,1.23,0);cylinder(group,.25,.45,.6,black(),0,-1.1,0);return group;}
export function makeLabel(text,size=5){const canvas=document.createElement('canvas');let ctx=canvas.getContext('2d');ctx.font='28px sans-serif';canvas.width=Math.ceil(ctx.measureText(text).width)+40;canvas.height=64;ctx=canvas.getContext('2d');ctx.fillStyle='rgba(7,12,20,.8)';ctx.fillRect(0,0,canvas.width,64);ctx.fillStyle='#e7dcc6';ctx.font='28px sans-serif';ctx.textAlign='center';ctx.fillText(text,canvas.width/2,42);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.userData.labelAspect=canvas.width/64;sprite.scale.set(size,size/sprite.userData.labelAspect,1);return sprite;}

export function createSaturnV(){
 const root=new THREE.Group(),white=new THREE.MeshStandardMaterial({color:0xe5e4de,roughness:.6}),dark=black(),alloy=silver();
 const first=new THREE.Group(),second=new THREE.Group(),third=new THREE.Group();root.add(first,second,third);
 cylinder(first,.8,.8,4.2,white,0,2.1,0);cylinder(first,.81,.81,.55,dark,0,.5,0);cylinder(first,.81,.81,.65,dark,0,3.6,0);
 for(let i=0;i<5;i++){const a=i*Math.PI/2,r=i===4?0:.45;cylinder(first,.15,.23,.5,dark,Math.cos(a)*r,-.2,Math.sin(a)*r);}
 cylinder(second,.8,.8,2.8,white,0,5.6,0);cylinder(second,.81,.81,.5,dark,0,4.4,0);cylinder(second,.55,.8,.6,white,0,7.3,0);
 cylinder(third,.55,.55,1.6,white,0,8.4,0);cylinder(third,.56,.56,.3,dark,0,7.8,0);cylinder(third,.35,.55,.8,white,0,9.6,0);cylinder(third,0,.35,.65,alloy,0,10.3,0);strut(third,[0,10.6,0],[0,11.6,0],.03);
 return {root,first,second,third};
}
