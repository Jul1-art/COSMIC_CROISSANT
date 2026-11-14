/** Normalize logarithmic depth to metre-scale units during a mission. The
 * stock `1 + clip.w` loses sub-metre precision in the atlas's tiny world units.
 * Every visible material shares the same mapping, preserving body occlusion. */
export function createMissionDepth(camera){
 const scale={value:1},factor={value:2/Math.log2(camera.far+1)},entries=new Map();
 function install(scene){scene.traverse(object=>{
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(!material||entries.has(material))continue;
   const compile=material.onBeforeCompile,key=material.customProgramCacheKey;
   const dispose=()=>{entries.delete(material);material.removeEventListener('dispose',dispose);};
   entries.set(material,{compile,key,dispose});material.addEventListener('dispose',dispose);
   material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);shader.uniforms.relicDepthScale=scale;shader.uniforms.relicDepthFactor=factor;
    shader.vertexShader='uniform float relicDepthScale;\n'+shader.vertexShader.replace('#include <logdepthbuf_vertex>',`#ifdef USE_LOGDEPTHBUF\nvFragDepth=1.0+gl_Position.w*relicDepthScale;\nvIsPerspective=float(isPerspectiveMatrix(projectionMatrix));\n#endif`);
    shader.fragmentShader='uniform float relicDepthFactor;\n'+shader.fragmentShader.replace('#include <logdepthbuf_fragment>',`#ifdef USE_LOGDEPTHBUF\ngl_FragDepth=vIsPerspective==0.0?gl_FragCoord.z:log2(vFragDepth)*relicDepthFactor*.5;\n#endif`);
   };
   material.customProgramCacheKey=function(){return key.call(this)+':relic-metre-depth-v1';};material.needsUpdate=true;
  }
 });}
 return {install,setScale(value){scale.value=value;factor.value=2/Math.log2(camera.far*value+1);},
  dispose(){for(const [material,old] of entries){material.onBeforeCompile=old.compile;material.customProgramCacheKey=old.key;material.removeEventListener('dispose',old.dispose);material.needsUpdate=true;}entries.clear();}
 };
}
