/** Initial orbit from the supplied mission sheet. Orientation/phase are
 * illustrative: no archived state vectors are supplied. This is not a TLE
 * propagation, a launch trajectory, or a model of the 92-day orbital decay. */
export const SPUTNIK_ORBIT=Object.freeze({earthRadiusKm:6378.137,perigeeKm:215,apogeeKm:939,inclinationDeg:65.1,mu:398600.4418,earthRotation:7.292115e-5});
const {earthRadiusKm:R,perigeeKm:hp,apogeeKm:ha,mu}=SPUTNIK_ORBIT;
export const SEMIMAJOR_KM=R+(hp+ha)/2;
export const ECCENTRICITY=(ha-hp)/(2*SEMIMAJOR_KM);
export const PERIOD_SECONDS=2*Math.PI*Math.sqrt(SEMIMAJOR_KM**3/mu);
export const ORBIT_DURATION=PERIOD_SECONDS*3;
export function sputnikOrbitState(seconds){
 if(!Number.isFinite(seconds))throw new TypeError('Finite mission time required');
 const mean=((seconds/PERIOD_SECONDS*2*Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
 let E=mean;for(let n=0;n<12;n++){const step=(E-ECCENTRICITY*Math.sin(E)-mean)/(1-ECCENTRICITY*Math.cos(E));E-=step;if(Math.abs(step)<1e-13)break;}
 const x=SEMIMAJOR_KM*(Math.cos(E)-ECCENTRICITY),y=SEMIMAJOR_KM*Math.sqrt(1-ECCENTRICITY**2)*Math.sin(E),i=SPUTNIK_ORBIT.inclinationDeg*Math.PI/180;
 const position=[x,y*Math.cos(i),y*Math.sin(i)],radius=Math.hypot(...position);
 const edot=Math.sqrt(mu/SEMIMAJOR_KM**3)/(1-ECCENTRICITY*Math.cos(E));
 const vx=-SEMIMAJOR_KM*Math.sin(E)*edot,vy=SEMIMAJOR_KM*Math.sqrt(1-ECCENTRICITY**2)*Math.cos(E)*edot;
 return {seconds,position,velocity:[vx,vy*Math.cos(i),vy*Math.sin(i)],altitudeKm:radius-R,speedKmS:Math.sqrt(mu*(2/radius-1/SEMIMAJOR_KM))};
}
/** ECI to Earth-fixed with an explicitly illustrative zero Greenwich phase. */
export function sputnikFixed(position,seconds){
 const angle=SPUTNIK_ORBIT.earthRotation*seconds,c=Math.cos(angle),s=Math.sin(angle),[x,y,z]=position;
 return [c*x+s*y,-s*x+c*y,z];
}
