const intersects=(a,b)=>a.x<b.x+b.width+4&&a.x+a.width+4>b.x&&a.y<b.y+b.height+4&&a.y+a.height+4>b.y;
const previousLayouts=new WeakMap();

/** Keep labels selectable on small globes without moving geographic pins. */
export function placeMissionLabels(points,bounds) {
  const placed=[],pins=points.map(p=>({x:p.x-17,y:p.y-42,width:34,height:42}));
  return points.map(point=>{
    const width=Math.min(point.width,bounds.width-16),height=point.height;
    let best=null,bestCost=Infinity;
    for(let ring=0;ring<14;ring++)for(const side of [0,1,-1]) {
      const x=Math.max(bounds.left+8,Math.min(bounds.left+bounds.width-width-8,point.x-width/2+side*(width/2+24)));
      const y=Math.max(bounds.top+8,Math.min(bounds.top+bounds.height-height-8,point.y-48-height-ring*(height+6)));
      const box={x,y,width,height};
      const collisions=placed.filter(other=>intersects(box,other)).length+pins.filter(other=>intersects(box,other)).length;
      const cost=collisions*100000+Math.hypot(x+width/2-point.x,y+height-(point.y-48));
      if(cost<bestCost){bestCost=cost;best=box;}
    }
    placed.push(best);return best;
  });
}

export function layoutMissionLabels(entries,bounds) {
  const visible=entries.filter(entry=>!entry.marker.hidden);
  const points=visible.map(({marker})=>({x:parseFloat(marker.style.left),y:parseFloat(marker.style.top),width:marker.querySelector('span').offsetWidth,height:marker.querySelector('span').offsetHeight}));
  const signature=JSON.stringify([bounds.left,bounds.top,bounds.width,bounds.height,visible.map((row,i)=>[row.site.id,Math.round(points[i].x),Math.round(points[i].y),points[i].width,points[i].height])]);
  if(previousLayouts.get(entries)===signature)return;previousLayouts.set(entries,signature);
  const boxes=placeMissionLabels(points,bounds);
  visible.forEach(({marker},i)=>{
    const p=points[i],box=boxes[i],dx=box.x+box.width/2-p.x,dy=(p.y-48-p.height)-box.y;
    marker.style.setProperty('--mission-label-x',`${dx.toFixed(1)}px`);
    marker.style.setProperty('--mission-label-offset',`${dy.toFixed(1)}px`);
    let leader=marker.querySelector('i');
    if(!leader){leader=document.createElement('i');leader.className='mission-marker-leader';leader.setAttribute('aria-hidden','true');marker.prepend(leader);}
    const lx=box.x+box.width/2-p.x,ly=box.y+box.height-p.y;
    leader.style.width=`${Math.hypot(lx,ly).toFixed(1)}px`;
    leader.style.transform=`rotate(${Math.atan2(ly,lx)}rad)`;
  });
}
