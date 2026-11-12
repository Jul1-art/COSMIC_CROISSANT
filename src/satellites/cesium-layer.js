/** RELIC host adapter for God's Eye View satellite rendering (MIT).
 * Uses GEV's point sizes/palette, red ISS, synchronous orbit primitives,
 * GMST ring rotation and round-robin propagation of the dense catalogue.
 */
import {createSatelliteCatalog,REFRESH_MS} from './catalog.js';
import {ISS_NORAD,COVERAGE_MS,propagatePosition,computeOrbitPath,orbitRotation} from './orbits.js';
import {SATELLITE_CLASS_IDS,SATELLITE_CLASS_DISPLAY} from '../../vendor/gods-eye-view/satellites/classes.js';
import {createSatellitePanel} from './panel.js';
export function createEarthSatellites({Cesium:C,viewer,host=document.body,getLanguage,onLanguageChange,onInteraction=()=>{},now=()=>Date.now()}){
 const scene=viewer.scene,points=scene.primitives.add(new C.PointPrimitiveCollection()),labels=scene.primitives.add(new C.LabelCollection());
 const byId=new Map(),rings=new Map(),samples=new Map(),classes=Object.fromEntries(SATELLITE_CLASS_IDS.map(id=>[id,true]));
 const colors=Object.fromEntries(SATELLITE_CLASS_IDS.map(id=>[id,C.Color.fromCssColorString(SATELLITE_CLASS_DISPLAY[id].color)]));
 const issColor=C.Color.fromCssColorString('#ff4444');
 const credit=new C.Credit('Satellite orbits · <a href="https://celestrak.org/" target="_blank" rel="noopener noreferrer">CelesTrak</a> · SGP4 / satellite.js · <a href="https://github.com/bilawalsidhu/gods-eye-view" target="_blank" rel="noopener noreferrer">God’s Eye View / Bilawal Sidhu · MIT</a>',false);
 viewer.creditDisplay?.addStaticCredit(credit);
 let disposed=false,paused=false,shown=true,selected=null,following=null,ownedEntity=null,rows=[],cursor=0,revision=0,buildTimer=0,lastPanelAt=0,lastRingAt=0,lastRefreshAttempt=now();
 const request=()=>{if(!disposed&&!viewer.isDestroyed())scene.requestRender();};
 const visible=row=>shown&&classes[row.satelliteClass]&&Math.abs(now()-row.epoch)<=COVERAGE_MS;
 function sample(row,date){
   if(!row||Math.abs(date.getTime()-row.epoch)>COVERAGE_MS)return null;
   const position=propagatePosition(row.satrec,date);if(position)samples.set(row.id,{...position,at:date.getTime()});
   return position;
 }
 function updatePoint(row,date){
   const point=byId.get(row.id);if(!point)return;
   const pos=sample(row,date);point.show=visible(row)&&Boolean(pos);
   if(pos)point.position=new C.Cartesian3(pos.x,pos.y,pos.z);
   return pos;
 }
 const panel=createSatellitePanel({host,getLanguage,onLanguageChange,
   onSelect:(id,follow)=>select(id,follow),onFollow:value=>value?startFollowing():stopFollowing(),
   onVisibility:value=>{shown=value;if(!value)stopFollowing();syncVisibility();},
   onClassChange:(id,value)=>{classes[id]=value;if(!value&&selected?.satelliteClass===id)stopFollowing();syncVisibility();},
   onRefresh:()=>{lastRefreshAttempt=now();void catalog.refresh();}});
 const catalog=createSatelliteCatalog({now,onChange:value=>{
   if(disposed)return;panel.update(value);
   // Status-only updates keep the point collection and orbit geometry alive.
   if(rows.length&&rows[0]===value.records.values().next().value)return;
   rebuild(value.records);
 }});
 function rebuild(records){
   const token=++revision;clearTimeout(buildTimer);
   rows=[...records.values()];cursor=0;
   for(const [id,point]of byId)if(!records.has(id)){points.remove(point);byId.delete(id);samples.delete(id);hideRing(id);}
   for(const id of rings.keys())hideRing(id);
   if(selected){selected=records.get(selected.id)||null;panel.select(selected);if(!selected)stopFollowing();}
   let offset=0;
   function chunk(){
     if(disposed||token!==revision)return;
     const end=Math.min(rows.length,offset+200),date=new Date(now());
     for(;offset<end;offset++){
       const row=rows[offset];let point=byId.get(row.id);
       if(!point){point=points.add({id:`relic-satellite:${row.id}`,show:false,position:C.Cartesian3.ZERO,pixelSize:row.id===ISS_NORAD?12:row.satelliteClass==='stations'?8:row.satelliteClass==='starlink'?3:5,
         color:row.id===ISS_NORAD?issColor:colors[row.satelliteClass],outlineColor:C.Color.WHITE.withAlpha(.3),outlineWidth:row.id===ISS_NORAD?2:0,disableDepthTestDistance:0});byId.set(row.id,point);}
       point.color=row.id===ISS_NORAD?issColor:colors[row.satelliteClass];updatePoint(row,date);
     }
     syncLabels();request();
     if(offset<rows.length)buildTimer=setTimeout(chunk,0);
     else{showRing(records.get(ISS_NORAD));if(selected)showRing(selected);}
   }
   chunk();
 }
 const issLabel=labels.add({text:'ISS',show:false,position:C.Cartesian3.ZERO,font:'bold 12px system-ui',fillColor:issColor,outlineColor:C.Color.BLACK,outlineWidth:3,style:C.LabelStyle.FILL_AND_OUTLINE,pixelOffset:new C.Cartesian2(12,-12),disableDepthTestDistance:0});
 const selectedLabel=labels.add({text:'',show:false,position:C.Cartesian3.ZERO,font:'12px system-ui',fillColor:C.Color.WHITE,outlineColor:C.Color.BLACK,outlineWidth:3,style:C.LabelStyle.FILL_AND_OUTLINE,pixelOffset:new C.Cartesian2(12,-12),disableDepthTestDistance:0});
 function syncLabels(){
   const iss=byId.get(ISS_NORAD);issLabel.show=Boolean(iss?.show);if(iss)issLabel.position=iss.position;
   const point=selected&&byId.get(selected.id);selectedLabel.show=Boolean(point?.show&&selected.id!==ISS_NORAD);if(point){selectedLabel.position=point.position;selectedLabel.text=selected.name;}
 }
 function showRing(row){
   if(!row||rings.has(row.id)||disposed)return;
   const date=new Date(now()),path=computeOrbitPath(row.satrec,date);if(path.points.length<2)return;
   const color=row.id===ISS_NORAD?issColor:colors[row.satelliteClass];
   const primitive=scene.primitives.add(new C.Primitive({geometryInstances:new C.GeometryInstance({id:`relic-satellite-orbit:${row.id}`,
     geometry:new C.PolylineGeometry({positions:path.points.map(p=>new C.Cartesian3(p.x,p.y,p.z)),width:row.id===ISS_NORAD?2.5:2,vertexFormat:C.PolylineColorAppearance.VERTEX_FORMAT}),
     attributes:{color:C.ColorGeometryInstanceAttribute.fromColor(color.withAlpha(.6)),depthFailColor:C.ColorGeometryInstanceAttribute.fromColor(color.withAlpha(.15))}}),
     appearance:new C.PolylineColorAppearance({translucent:true}),depthFailAppearance:new C.PolylineColorAppearance({translucent:true}),asynchronous:false,allowPicking:false,show:visible(row)}));
   rings.set(row.id,{...path,primitive,row});request();
 }
 function hideRing(id){const ring=rings.get(id);if(ring){scene.primitives.remove(ring.primitive);rings.delete(id);}}
 function syncVisibility(){
   for(const row of rows){const point=byId.get(row.id);if(point)point.show=visible(row)&&samples.has(row.id);}
   for(const ring of rings.values())ring.primitive.show=visible(ring.row);
   syncLabels();request();
 }
 function stopFollowing(){
   if(ownedEntity){if(viewer.trackedEntity===ownedEntity)viewer.trackedEntity=undefined;viewer.entities.remove(ownedEntity);ownedEntity=null;}
   following=null;panel.setFollowing(false);request();
 }
 function startFollowing(){
   if(!selected||!byId.get(selected.id)?.show)return false;
   stopFollowing();onInteraction();viewer.camera.cancelFlight();following=selected.id;
   const high=(samples.get(selected.id)?.altitude||0)>2000000?4:1;
   ownedEntity=viewer.entities.add({id:'relic-satellite-follow',position:new C.CallbackPositionProperty(()=>byId.get(following)?.position,false),viewFrom:new C.Cartesian3(-450000*high,-450000*high,350000*high)});
   viewer.trackedEntity=ownedEntity;panel.setFollowing(true);request();return true;
 }
 function select(id,follow=false){
   const row=catalog.records.get(Number(id));if(!row)return false;
   if(selected?.id!==row.id){stopFollowing();if(selected?.id!==ISS_NORAD)hideRing(selected?.id);}
   selected=row;shown=true;classes[row.satelliteClass]=true;panel.setVisibility(true);panel.setClasses(classes);updatePoint(row,new Date(now()));syncVisibility();panel.select(row);showRing(row);
   if(follow)startFollowing();request();return true;
 }
 function tick(){
   if(disposed||paused||document.hidden||viewer.useDefaultRenderLoop===false)return;
   const time=now(),date=new Date(time);
   const iss=catalog.records.get(ISS_NORAD);if(iss)updatePoint(iss,date);
   if(selected&&selected.id!==ISS_NORAD)updatePoint(selected,date);
   if(following!==null&&!byId.get(following)?.show)stopFollowing();
   // Same round-robin principle as GEV dense mode; bound main-thread work even
   // when the complete active feed contains tens of thousands of satellites.
   if(shown){const start=performance.now(),budget=Math.max(1,Math.ceil(rows.length/20));
     for(let i=0;i<budget&&rows.length;i++){
       if(cursor>=rows.length)cursor=0;const row=rows[cursor++];
       if(row.id!==ISS_NORAD&&row.id!==selected?.id&&classes[row.satelliteClass])updatePoint(row,date);
       if(performance.now()-start>3)break;
     }
   }
   syncLabels();
   if(time-lastRingAt>=1000){
     lastRingAt=time;
     for(const [id,ring]of [...rings]){
       ring.primitive.show=visible(ring.row);
       if(Math.abs(time-ring.bakeMs)>30*60000){hideRing(id);showRing(catalog.records.get(id));continue;}
       const rotation=C.Matrix3.fromRotationZ(orbitRotation(ring.gmstAtBake,date));
       ring.primitive.modelMatrix=C.Matrix4.fromRotationTranslation(rotation,C.Cartesian3.ZERO,ring.primitive.modelMatrix);
     }
   }
   if(selected&&time-lastPanelAt>=500){lastPanelAt=time;panel.position(samples.get(selected.id),following===selected.id);}
 }
 const removePreRender=scene.preRender.addEventListener(tick);
 const timer=setInterval(()=>{
   if(disposed||paused||document.hidden||viewer.useDefaultRenderLoop===false)return;
   if(now()-lastRefreshAttempt>=REFRESH_MS){lastRefreshAttempt=now();void catalog.refresh();}
   request();
 },250);
 const interrupt=()=>{if(following!==null)stopFollowing();};
 for(const type of ['pointerdown','wheel'])scene.canvas.addEventListener(type,interrupt,{passive:true});
 const visibility=()=>{if(!document.hidden)request();};document.addEventListener('visibilitychange',visibility);
 void catalog.refresh();
 return {select,stopFollowing,
   handleClick(position){
     const id=scene.pick(position)?.id;
     return typeof id==='string'&&id.startsWith('relic-satellite:')?select(Number(id.slice('relic-satellite:'.length)),true):false;
   },
   pause(value=true){paused=Boolean(value);if(paused)stopFollowing();else request();},
   dispose(){
     if(disposed)return;stopFollowing();disposed=true;++revision;clearInterval(timer);clearTimeout(buildTimer);catalog.dispose();removePreRender();panel.dispose();
     for(const type of ['pointerdown','wheel'])scene.canvas.removeEventListener(type,interrupt);
     document.removeEventListener('visibilitychange',visibility);
     if(!viewer.isDestroyed()){for(const id of [...rings.keys()])hideRing(id);scene.primitives.remove(points);scene.primitives.remove(labels);viewer.creditDisplay?.removeStaticCredit(credit);}
     byId.clear();samples.clear();rows=[];
   }};
}
