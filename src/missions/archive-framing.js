/** Local radial framing works on either hemisphere; never place a surface camera underground. */
export function archiveCloseFrame(THREE,{target,radial,distance,surface}){
 const up=radial.clone().normalize();
 const tangent=new THREE.Vector3().crossVectors(up,new THREE.Vector3(0,1,0));
 if(tangent.lengthSq()<1e-10)tangent.crossVectors(up,new THREE.Vector3(1,0,0));
 tangent.normalize();
 const across=new THREE.Vector3().crossVectors(up,tangent).normalize();
 const direction=tangent.addScaledVector(across,.35).addScaledVector(up,surface?.7:.08).normalize();
 return {target,position:target.clone().addScaledVector(direction,distance),up};
}
