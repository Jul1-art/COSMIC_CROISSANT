import * as Cesium from '../../vendor/cesium/index.js';
Cesium.Ion.defaultAccessToken = ''; // Optional ion assets use this private edition's configured token explicitly.
import { getCesiumToken, validateCesiumToken } from './api-config.js';
import { createIonEarthTiles } from '../worlds/ion-earth.js';

export function createGoogle3D(viewer, onState = () => {}) {
  const compact=globalThis.matchMedia?.('(pointer: coarse)').matches||(globalThis.navigator?.deviceMemory??8)<=4||(globalThis.innerWidth??Infinity)<=760;
  const controller=createIonEarthTiles({Cesium,viewer,compact,onState:state=>onState({...state,error:state.status==='error'?'Google 3D is unavailable.':''})});
  async function enable() {
    const token = getCesiumToken();
    if(token&&validateCesiumToken(token)){onState({status:'error',active:controller.active,error:'Google 3D is unavailable.'});return false;}
    return controller.enable(token);
  }
  return {enable,disable:controller.disable,destroy:controller.destroy,get active(){return controller.active;},get status(){return controller.status;},hasToken:()=>Boolean(getCesiumToken())};
}
