import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {HARDWARE, EVENTS, START, END, eventTime, missionState} from './apollo11-data.js';
import {createLander,createHardware,createCSM,makeLabel,createSaturnV} from './mission-models.js';

/** Two scale-separated scenes share one renderer; no historical ephemeris is implied. */
export function createMissionScene({host,onTime=()=>{},onSelect=()=>{},onError=()=>{}}){
 const abort=new AbortController();let disposed=false,mode='journey',time=START,playing=false,speed=3600,frame=0,last=performance.now(),contextLost=false,lastUI=0,lastTrailIndex=-1;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.25:1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x05080d);host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Reconstitution 3D interactive d’Apollo 11');renderer.domElement.tabIndex=0;
 const camera=new THREE.PerspectiveCamera(45,1,.05,14000);const controls=new OrbitControls(camera,renderer.domElement);controls.listenToKeyEvents(renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.maxPolarAngle=Math.PI*.495;
 const journey=new THREE.Scene(),surface=new THREE.Scene();journey.background=new THREE.Color(0x05080d);surface.background=new THREE.Color(0x020408);
 for(const scene of [journey,surface]){scene.add(new THREE.HemisphereLight(0xa8bbda,0x44403a,1.3));const sun=new THREE.DirectionalLight(0xfff0d1,3);sun.position.set(-90,70,30);scene.add(sun);}
 const textures=new Set(),loader=new THREE.TextureLoader();
 function texture(path,material){loader.load(new URL('../../'+path,import.meta.url).href,value=>{if(disposed){value.dispose();return;}textures.add(value);value.colorSpace=THREE.SRGBColorSpace;material.map=value;material.needsUpdate=true;},undefined,()=>{});}
 const earthMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),moonMaterial=new THREE.MeshStandardMaterial({color:0xeeeeee,roughness:1});
 texture('assets/earth-blue-marble-4k.webp',earthMaterial);texture('assets/moons/moon-lroc-2k.webp',moonMaterial);
 const earth=new THREE.Mesh(new THREE.SphereGeometry(12,64,40),earthMaterial);earth.position.x=-80;journey.add(earth);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(3.27,48,32),moonMaterial);moon.position.x=80;journey.add(moon);
 const earthLabel=makeLabel('TERRE',24),moonLabel=makeLabel('LUNE',20);earthLabel.position.set(-80,17,0);moonLabel.position.set(80,9,0);journey.add(earthLabel,moonLabel);
 const positions=[];let seed=11;for(let i=0;i<1800;i++){seed=(seed*16807)%2147483647;const az=seed/2147483647*Math.PI*2;seed=(seed*16807)%2147483647;const y=seed/2147483647*2-1;seed=(seed*16807)%2147483647;const r=700+seed/2147483647*500;positions.push(r*Math.sqrt(1-y*y)*Math.cos(az),r*y,r*Math.sqrt(1-y*y)*Math.sin(az));}
 const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));journey.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xcbd6e8,size:.6,sizeAttenuation:true})));
 const outbound=new THREE.CubicBezierCurve3(new THREE.Vector3(-77,12,0),new THREE.Vector3(-45,35,-25),new THREE.Vector3(50,30,-14),new THREE.Vector3(80,6,0));
 const inbound=new THREE.CubicBezierCurve3(new THREE.Vector3(80,6,0),new THREE.Vector3(35,40,38),new THREE.Vector3(-35,25,30),new THREE.Vector3(-80,12,0));
 function line(points,color,opacity=.6){const geometry=new THREE.BufferGeometry().setFromPoints(points),node=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity}));journey.add(node);return node;}
 line(outbound.getPoints(180),0xdac398);const returnLine=line(inbound.getPoints(180),0x759bb8,.3);
 line(Array.from({length:129},(_,i)=>new THREE.Vector3(80+Math.cos(i/128*Math.PI*2)*6,Math.sin(i/128*Math.PI*2)*6,0)),0xe1e4e8,.3);
 const rocket=createSaturnV();rocket.root.scale.setScalar(.65);journey.add(rocket.root);
 const craft=createCSM();craft.scale.setScalar(1.4);journey.add(craft);const craftLabel=makeLabel('COLUMBIA',22);journey.add(craftLabel);
 const eagle=createLander();eagle.root.scale.setScalar(.3);journey.add(eagle.root);
 const sitePin=new THREE.Mesh(new THREE.SphereGeometry(.32,12,8),new THREE.MeshBasicMaterial({color:0xe6c28c}));sitePin.position.set(80,3.3,0);journey.add(sitePin);
 const siteLabel=makeLabel('BASE DE LA TRANQUILLITÉ',23);siteLabel.position.set(80,-4,0);journey.add(siteLabel);
 const outboundPoints=outbound.getPoints(100);const flightTrail=line([new THREE.Vector3(),new THREE.Vector3()],0xffffff,.9);
 const lander=createLander();surface.add(lander.root);
 const objectGroups=new Map([['descent',lander.lower]]),pickable=[];
 function tag(root,id){root.userData.hardwareId=id;root.traverse(node=>{if(node.isMesh){node.userData.hardwareId=id;pickable.push(node);}});}
 tag(lander.lower,'descent');tag(lander.upper,'descent');
 for(const row of HARDWARE.filter(row=>row.position&&row.kind!=='lander')){const group=createHardware(row.kind);group.position.fromArray(row.position);surface.add(group);objectGroups.set(row.id,group);tag(group,row.id);}
 const selection=makeLabel('Étage de descente d’Eagle',14);selection.position.set(0,7,0);surface.add(selection);let selectedId='descent';
 const halo=new THREE.Mesh(new THREE.RingGeometry(1,1.1,48),new THREE.MeshBasicMaterial({color:0xdac398,side:THREE.DoubleSide,transparent:true,opacity:.7}));halo.rotation.x=-Math.PI/2;halo.position.y=.04;surface.add(halo);
 const grain=document.createElement('canvas');grain.width=grain.height=256;const grainContext=grain.getContext('2d'),grainData=grainContext.createImageData(256,256);let noise=1969;for(let i=0;i<grainData.data.length;i+=4){noise=(noise*16807)%2147483647;const v=80+noise/2147483647*100;grainData.data[i]=grainData.data[i+1]=grainData.data[i+2]=v;grainData.data[i+3]=255;}grainContext.putImageData(grainData,0,0);const bump=new THREE.CanvasTexture(grain);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.repeat.set(500,500);textures.add(bump);
 const groundMaterial=new THREE.MeshStandardMaterial({color:0x858581,roughness:1,bumpMap:bump,bumpScale:.045});
 let ground=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),groundMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-.06;surface.add(ground);
 // Source mesh is a 257² downsample of the LROC DTM, about 19.5 m between samples.
 let sampleGround=()=>0;
 async function loadTerrain(){try{
   const base=new URL('../../assets/terrain/',import.meta.url);
   const [catalogResponse,binResponse]=await Promise.all([fetch(new URL('catalog.json',base),{signal:abort.signal}),fetch(new URL('moon-apollo11.bin',base),{signal:abort.signal})]);
   if(!catalogResponse.ok||!binResponse.ok)throw new Error('terrain');const catalog=await catalogResponse.json(),buffer=await binResponse.arrayBuffer();if(disposed)return;
   const data=new Uint16Array(buffer),n=catalog.grid,row=catalog.sites['moon-apollo11'];if(data.length!==n*n)throw new Error('grid');
   const height=(x,z)=>{const fx=THREE.MathUtils.clamp((x/5000+.5)*(n-1),0,n-1),fz=THREE.MathUtils.clamp((z/5000+.5)*(n-1),0,n-1),ix=Math.min(n-2,Math.floor(fx)),iz=Math.min(n-2,Math.floor(fz)),u=fx-ix,v=fz-iz;return row.minMeters+(row.maxMeters-row.minMeters)/65535*((1-v)*((1-u)*data[iz*n+ix]+u*data[iz*n+ix+1])+v*((1-u)*data[(iz+1)*n+ix]+u*data[(iz+1)*n+ix+1]));};
   const zero=height(0,0);sampleGround=(x,z)=>height(x,z)-zero;
   const geometry=new THREE.PlaneGeometry(5000,5000,n-1,n-1);geometry.rotateX(-Math.PI/2);const vertices=geometry.attributes.position;for(let i=0;i<vertices.count;i++)vertices.setY(i,sampleGround(vertices.getX(i),vertices.getZ(i))-.06);geometry.computeVertexNormals();ground.geometry.dispose();ground.geometry=geometry;ground.rotation.x=0;ground.position.y=0;
   texture('assets/terrain/moon-apollo11.webp',groundMaterial);
   for(const row of HARDWARE.filter(row=>row.position)){const group=objectGroups.get(row.id);group.position.y=row.position[1]+sampleGround(row.position[0],row.position[2]);}updateTime();
 }catch(error){if(error.name!=='AbortError'&&!disposed)onError('Le relief NASA n’a pas pu être chargé. Le sol plat affiché est une solution de repli ; le matériel reste explorable.');}}
 loadTerrain();
 function segment(t,a,b){return THREE.MathUtils.clamp((t-eventTime(a))/(eventTime(b)-eventTime(a)),0,1);}
 function orbitPoint(t){const phase=(t-eventTime('orbit'))/(2*3600000)*Math.PI*2;return new THREE.Vector3(80+Math.sin(phase)*6,Math.cos(phase)*6,0);}
 function journeyPosition(t){if(t<START+720000)return new THREE.Vector3(-80+(t-START)/720000*4,12+(t-START)/720000*1.5,0);if(t<eventTime('tli')){const phase=segment(t,'launch','tli')*Math.PI*4;return new THREE.Vector3(-80+Math.sin(phase)*13,Math.cos(phase)*13,0);}if(t<eventTime('orbit'))return outbound.getPoint(segment(t,'tli','orbit'));if(t<eventTime('return'))return orbitPoint(t);if(t<eventTime('separation'))return inbound.getPoint(segment(t,'return','separation'));const u=segment(t,'separation','splash');return new THREE.Vector3(-80,12.8-u*.8,0);}
 function updateTime(notify=true){if(disposed)return;const state=missionState(time);craft.position.copy(journeyPosition(time));const elapsed=(time-START)/1000;rocket.root.visible=elapsed<720;craft.visible=!rocket.root.visible;rocket.root.position.copy(craft.position);rocket.first.visible=elapsed<162;rocket.second.visible=elapsed<552;craftLabel.visible=craft.visible;craftLabel.position.copy(craft.position).add(new THREE.Vector3(0,5,0));returnLine.material.opacity=time>=eventTime('return')?.7:.2;
   eagle.root.visible=time>=eventTime('descent')&&time<eventTime('dock');
   if(time<eventTime('landing'))eagle.root.position.copy(orbitPoint(eventTime('descent'))).lerp(sitePin.position,segment(time,'descent','landing'));
   else if(time<eventTime('ascent'))eagle.root.position.copy(sitePin.position);
   else eagle.root.position.copy(sitePin.position).lerp(craft.position,segment(time,'ascent','dock'));
   for(const row of HARDWARE.filter(row=>row.position)){const group=objectGroups.get(row.id);group.visible=time>=eventTime(row.since);if(row.id==='flag'){group.rotation.z=state.ascent?-Math.PI/2:0;group.position.y=state.ascent?.08:sampleGround(row.position[0],row.position[2]);}}
   lander.upper.visible=state.landed&&time<eventTime('ascent')+180000;lander.upper.position.y=2.8+(state.ascent?Math.min(400,(time-eventTime('ascent'))/200):0);
   const selected=objectGroups.get(selectedId);selection.visible=Boolean(selected?.visible);halo.visible=selection.visible;
   if(selected){selection.position.copy(selected.position).add(new THREE.Vector3(0,selectedId==='descent'?6:1.5,0));halo.position.set(selected.position.x,sampleGround(selected.position.x,selected.position.z)+.03,selected.position.z);}
   // Highlight the travelled part of the educational route, rather than implying live telemetry.
   const trailIndex=time<eventTime('orbit')?Math.max(1,Math.floor(segment(time,'tli','orbit')*100)):100;flightTrail.visible=time>=eventTime('tli');if(trailIndex!==lastTrailIndex){lastTrailIndex=trailIndex;flightTrail.geometry.dispose();flightTrail.geometry=new THREE.BufferGeometry().setFromPoints(outboundPoints.slice(0,trailIndex+1));}
   if(notify){lastUI=performance.now();onTime(time);}
 }
 function resize(){if(disposed)return;const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
 const observer=new ResizeObserver(resize);observer.observe(host);
 function reset(){if(mode==='journey'){const distance=Math.max(145,235/camera.aspect);camera.position.set(0,distance*.4,distance);controls.target.set(0,0,0);controls.minDistance=6;controls.maxDistance=600;}else{camera.position.set(32,23,42);controls.target.set(0,1,0);controls.minDistance=1.5;controls.maxDistance=2000;}controls.update();}
 function setMode(value){mode=value==='surface'?'surface':'journey';if(mode==='surface'&&time<eventTime('landing'))setTime(eventTime('landing'));reset();}
 function setTime(value){time=missionState(value).time;updateTime();}
 function focusObject(id){const row=HARDWARE.find(row=>row.id===id&&row.position);if(!row)return;playing=false;setMode('surface');if(time<eventTime(row.since))setTime(eventTime(row.since));selectedId=id;onSelect(id);selection.material.map.dispose();const label=makeLabel(row.name,Math.max(8,row.name.length*.35));selection.material.map=label.material.map;label.material.dispose();selection.scale.copy(label.scale);selection.userData.labelAspect=label.userData.labelAspect;const group=objectGroups.get(id);controls.target.copy(group.position).add(new THREE.Vector3(0,.6,0));camera.position.copy(controls.target).add(new THREE.Vector3(id==='descent'?10:4,id==='descent'?7:3,id==='descent'?13:5));updateTime();controls.update();}
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart;
 function down(event){pointerStart={x:event.clientX,y:event.clientY};}
 function up(event){if(mode!=='surface'||!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickable,false).find(item=>{let node=item.object;while(node){if(!node.visible)return false;node=node.parent;}return true;});if(hit)focusObject(hit.object.userData.hardwareId);}
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
 const fallback=host.querySelector('.mission-scene-loading');if(fallback)fallback.hidden=true;
 const loss=event=>{event.preventDefault();contextLost=true;playing=false;cancelAnimationFrame(frame);onError('Le contexte 3D a été interrompu. Rouvrez l’immersion ; les vidéos et le dossier restent accessibles.');};renderer.domElement.addEventListener('webglcontextlost',loss);
 function render(now){frame=0;if(disposed||document.hidden||contextLost)return;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;if(playing){time=Math.min(END,time+dt*speed*1000);if(time>=END)playing=false;updateTime(time>=END||now-lastUI>=100);}controls.update();if(mode==='surface'){const labelWidth=2*camera.position.distanceTo(selection.position)*Math.tan(camera.fov*Math.PI/360)*Math.min(250,host.clientWidth*.65)/host.clientHeight;selection.scale.set(labelWidth,labelWidth/selection.userData.labelAspect,1);}renderer.render(mode==='journey'?journey:surface,camera);frame=requestAnimationFrame(render);}
 function visibility(){cancelAnimationFrame(frame);frame=0;if(!document.hidden&&!disposed&&!contextLost){last=performance.now();frame=requestAnimationFrame(render);}}
 document.addEventListener('visibilitychange',visibility);resize();reset();updateTime();frame=requestAnimationFrame(render);
 return {setTime,setMode,reset,focusObject,setPlaying(value){playing=Boolean(value);last=performance.now();},setSpeed(value){if(Number.isFinite(value)&&value>0)speed=value;},get time(){return time;},dispose(){if(disposed)return;disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',loss);controls.dispose();const geometries=new Set(),materials=new Set();for(const scene of [journey,surface])scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)for(const material of [].concat(node.material)){materials.add(material);if(material.map)textures.add(material.map);if(material.bumpMap)textures.add(material.bumpMap);}});for(const value of geometries)value.dispose();for(const value of materials)value.dispose();for(const value of textures)value.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
