"""Reproducible Apollo 11 reconstruction, NOT recovered continuous telemetry.
Requires numpy, scipy, spiceypy. NASA requests are serialized and cached.
Usage: python tools/data/build-apollo11-trajectory.py --cache /tmp/apollo-flight-research
"""
from pathlib import Path
import argparse,csv,hashlib,io,json,math,re,urllib.parse,urllib.request
from datetime import datetime,timezone,timedelta
import numpy as np
from scipy.integrate import solve_ivp
from scipy.interpolate import CubicHermiteSpline
from scipy.optimize import root
from scipy.spatial.transform import Rotation
import spiceypy as spice

ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--cache',type=Path,required=True);args=parser.parse_args();CACHE=args.cache;CACHE.mkdir(parents=True,exist_ok=True)
EPOCH=datetime(1969,7,16,13,32,tzinfo=timezone.utc); MU_E=398600.435507;MU_M=4902.800118;MU_S=132712440041.9394;R_E=6378.137
source=json.loads((ROOT/'assets/missions/apollo-11/trajectory-anchors.json').read_text());R_M=source['lunarAltitudeReferenceKm']
KERNELS={'naif0012.tls':'lsk/naif0012.tls','pck00011.tpc':'pck/pck00011.tpc','moon_pa_de421.bpc':'pck/moon_pa_de421_1900-2050.bpc','moon.tf':'fk/satellites/moon_080317.tf'}
for name,path in KERNELS.items():
 target=CACHE/name
 if not target.exists():urllib.request.urlretrieve('https://naif.jpl.nasa.gov/pub/naif/generic_kernels/'+path,target)
 spice.furnsh(str(target))
et0=spice.str2et(EPOCH.isoformat().replace('+00:00',''))
def met(s):
 h,m,sec=map(float,s.split(':'));return h*3600+m*60+sec

def horizons(target,name):
 path=CACHE/(name+'-horizons.json')
 if not path.exists():
  params=dict(COMMAND=target,CENTER='500@399',MAKE_EPHEM='YES',EPHEM_TYPE='VECTORS',START_TIME='1969-07-16 00:00',STOP_TIME='1969-07-25 00:00',STEP_SIZE='1 h',OUT_UNITS='KM-S',REF_PLANE='FRAME',REF_SYSTEM='ICRF',VEC_CORR='NONE',VEC_TABLE='2',CSV_FORMAT='YES',TIME_TYPE='UT')
  url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode({'format':'json',**{k:"'"+v+"'" for k,v in params.items()}})
  request=urllib.request.Request(url,headers={'User-Agent':'RELIC Apollo 11 offline reconstruction'})
  with urllib.request.urlopen(request,timeout=50) as response:payload=json.load(response)
  path.write_text(json.dumps(payload))
 payload=json.loads(path.read_text());result=payload.get('result','');match=re.search(r'\$\$SOE\s*\n(.*?)\n\$\$EOE',result,re.S)
 if not match:raise ValueError(payload.get('error') or result[:300])
 rows=np.array([[float(row[0]),*[float(v) for v in row[2:8]]] for row in csv.reader(io.StringIO(match[1]))])
 ts=(rows[:,0]-2440420.5)*86400-met('13:32:00') # Julian day 1969-07-16 00 UTC
 actual=(EPOCH.timestamp()/86400+2440587.5)
 ts=(rows[:,0]-actual)*86400
 return CubicHermiteSpline(ts,rows[:,1:4],rows[:,4:7]),rows
moon,moonrows=horizons('301','moon');sun,sunrows=horizons('10','sun')

def rotation(body,t):return spice.pxform('IAU_EARTH' if body=='earth' else 'MOON_ME','J2000',et0+t)
def unit(lat,lon):
 a,b=np.radians([lat,lon]);return np.array([np.cos(a)*np.cos(b),np.cos(a)*np.sin(b),np.sin(a)])
# Minimal rigid frame correction, explicitly a reconstruction of the report's old map frame.
old,new=unit(.647,23.505),unit(.67409,23.47298);cross=np.cross(old,new);angle=math.atan2(np.linalg.norm(cross),np.dot(old,new));cal=Rotation.from_rotvec(cross/np.linalg.norm(cross)*angle).as_matrix()

def state(row):
 t=met(row['met']);body=row['body'];lat,lon=np.radians([row['latitudeDeg'],row['longitudeDeg']]);up=unit(row['latitudeDeg'],row['longitudeDeg']);east=np.array([-np.sin(lon),np.cos(lon),0]);north=np.cross(up,east)
 if body=='earth':
  e2=6.69437999014e-3;N=R_E/np.sqrt(1-e2*np.sin(lat)**2);h=row['altitudeNmi']*1.852
  p=np.array([(N+h)*np.cos(lat)*np.cos(lon),(N+h)*np.cos(lat)*np.sin(lon),(N*(1-e2)+h)*np.sin(lat)])
 else:p=up*(R_M+row['altitudeNmi']*1.852)
 gamma,heading=np.radians([row['flightPathDeg'],row['headingEastOfNorthDeg']]);v=row['speedFtS']*.0003048*(np.sin(gamma)*up+np.cos(gamma)*(np.cos(heading)*north+np.sin(heading)*east))
 R=rotation(body,t)
 if body=='moon':R=R@cal
 p,v=R@p,R@v
 if body=='moon':
  # Lunar heading reference in the scanned report is not assumed to be the
  # modern Moon-ME local north. Solve the direction from endpoints instead.
  radial=p/np.linalg.norm(p);west=np.cross(radial,R[:,2]);west/=np.linalg.norm(west)
  v=row['speedFtS']*.0003048*(np.sin(gamma)*radial+np.cos(gamma)*west)
  p+=moon(t);v+=moon(t,1)
 return dict(id=row['id'],t=t,p=p,v=v,body=body,measured=True)
A={r['id']:state(r) for r in source['anchors']}

def gravity(t,r):
 m=moon(t);s=sun(t);rm=m-r;rs=s-r
 return -MU_E*r/np.linalg.norm(r)**3+MU_M*(rm/np.linalg.norm(rm)**3-m/np.linalg.norm(m)**3)+MU_S*(rs/np.linalg.norm(rs)**3-s/np.linalg.norm(s)**3)
def ode(t,y):return np.r_[y[3:],gravity(t,y[:3])]
def propagate(t0,t1,p,v,dense=False):
 sol=solve_ivp(ode,(t0,t1),np.r_[p,v],method='DOP853',rtol=2e-10,atol=1e-8,dense_output=dense,max_step=300)
 if not sol.success:raise ValueError(sol.message)
 return sol

def ground(id,t,lat,lon,body):
 p0=unit(lat,lon)*(R_M if body=='moon' else R_E)
 R=rotation(body,t);p=R@p0;dt=.1;v=(rotation(body,t+dt)@p0-rotation(body,t-dt)@p0)/(2*dt)
 if body=='moon':p+=moon(t);v+=moon(t,1)
 return dict(id=id,t=t,p=p,v=v,body=body,measured=False)
A['launch']=ground('launch',0,28.608389,-80.604333,'earth')
A['landing']=ground('landing',met('102:45:43'),.67409,23.47298,'moon');A['ascent']=ground('ascent',met('124:22:00.8'),.67409,23.47298,'moon')
A['splash']=ground('splash',met('195:18:35'),13+19/60,-169-9/60,'earth')
park_t=met('0:11:49.3');park=propagate(A['tli-ign']['t'],park_t,A['tli-ign']['p'],A['tli-ign']['v']);A['parking']=dict(id='parking',t=park_t,p=park.y[:3,-1],v=park.y[3:,-1],body='earth',measured=False)

AUDIT=[]
def coast(a,b):
 # Multiple-revolution initial guess comes from the measured inertial heading and speed.
 def residual(v):return propagate(a['t'],b['t'],a['p'],v).y[:3,-1]-b['p']
 solved=root(residual,a['v'],tol=1e-8)
 sol=propagate(a['t'],b['t'],a['p'],solved.x,True);error=np.linalg.norm(sol.y[:3,-1]-b['p']);dv=np.linalg.norm(solved.x-a['v'])
 if error>.2 or dv>(.8 if a['id']=='transposition-dock' else .3):raise ValueError(f"Unacceptable coast fit {a['id']} -> {b['id']}: endpoint {error} km, velocity correction {dv} km/s")
 AUDIT.append(dict(start=a['id'],end=b['id'],endpointResidualKm=round(error,6),initialVelocityFitCorrectionMS=round(dv*1000,3)))
 print(a['id'],'->',b['id'],'residual km',round(error,5),'fit m/s',round(dv*1000,3),flush=True)
 return dict(a=a,b=b,kind='gravity-fit',evaluate=sol.sol,va=sol.y[3:,0],vb=sol.y[3:,-1])

def powered(a,b,kind='powered-reconstruction'):
 # A minimum-degree controlled trajectory with fixed position, velocity and
 # gravitational acceleration boundary conditions. Thrust/guidance is inferred,
 # never labelled telemetry or an unpowered orbit.
 duration=b['t']-a['t'];p=a['p'];v=a['v']*duration;acc=gravity(a['t'],p)*duration**2
 target=np.array([b['p']-p-v-acc/2,b['v']*duration-v-acc,gravity(b['t'],b['p'])*duration**2-acc])
 coeff=np.linalg.solve(np.array([[1,1,1],[3,4,5],[6,12,20]],float),target)
 def evaluate(t):
  u=(np.asarray(t)-a['t'])/duration
  pval=p[:,None]+v[:,None]*u+acc[:,None]*u*u/2+coeff[0,:,None]*u**3+coeff[1,:,None]*u**4+coeff[2,:,None]*u**5
  vel=(v[:,None]+acc[:,None]*u+3*coeff[0,:,None]*u**2+4*coeff[1,:,None]*u**3+5*coeff[2,:,None]*u**4)/duration
  return np.vstack([pval,vel])
 if (a['id'],b['id']) in {('launch','parking'),('pdi','landing'),('ascent','ascent-cut'),('entry','splash')}:
  cartesian=evaluate;body=a['body'];surface=R_E if body=='earth' else R_M
  center=lambda t:np.zeros((3,len(np.atleast_1d(t)))) if body=='earth' else moon(np.atleast_1d(t)).T
  center_v=lambda t:np.zeros(3) if body=='earth' else moon(t,1)
  r0=a['p']-center(a['t'])[:,0];r1=b['p']-center(b['t'])[:,0];h0=np.linalg.norm(r0)-surface;h1=np.linalg.norm(r1)-surface
  dr0=np.dot(a['v']-center_v(a['t']),r0)/np.linalg.norm(r0);dr1=np.dot(b['v']-center_v(b['t']),r1)/np.linalg.norm(r1)
  radial=CubicHermiteSpline([0,duration],[max(0,h0),max(0,h1)],[dr0,dr1])
  def positions(t):
   ts=np.atleast_1d(t);u=np.clip((ts-a['t'])/duration,0,1);relative=cartesian(ts)[:3]-center(ts);direction=relative/np.linalg.norm(relative,axis=0)
   if a['id']=='entry':
    exponent=max(2,-dr0*duration/max(h0,1e-6));height=max(0,h0)*(1-u)**exponent
   else:height=np.maximum(0,radial(u*duration))
   return center(ts)+direction*(surface+height)
  def constrained(t):
   ts=np.atleast_1d(t);plus=np.minimum(b['t'],ts+.001);minus=np.maximum(a['t'],ts-.001)
   return np.vstack([positions(ts),(positions(plus)-positions(minus))/(plus-minus)])
  evaluate=constrained
 return dict(a=a,b=b,kind=kind,evaluate=evaluate,va=a['v'],vb=b['v'])

common=['launch','parking','tli-ign','tli-cut','tli','csm-separation','transposition-dock','separation-ign','separation-cut','mcc2-ign','mcc2-cut','loi-ign','loi-cut','circular-ign','circular-cut','undock']
csm=['undock','csm-separation-ign','csm-separation-cut','dock','jettison','tei-ign','tei-cut','mcc5-ign','mcc5-cut','cm-sm-separation','entry','splash']
eagle=['undock','doi-ign','doi-cut','pdi','landing','ascent','ascent-cut','csi-ign','csi-cut','tpi-ign','tpi-cut','tpf','dock']
POWERED={('launch','parking'),('tli-ign','tli-cut'),('separation-ign','separation-cut'),('mcc2-ign','mcc2-cut'),('loi-ign','loi-cut'),('circular-ign','circular-cut'),('csm-separation-ign','csm-separation-cut'),('final-separation-ign','final-separation-cut'),('tei-ign','tei-cut'),('mcc5-ign','mcc5-cut'),('doi-ign','doi-cut'),('pdi','landing'),('ascent','ascent-cut'),('csi-ign','csi-cut'),('tpi-ign','tpi-cut'),('tpf','dock'),('entry','splash')}

def build(ids):
 segments=[]
 for aid,bid in zip(ids,ids[1:]):
  a,b=A[aid],A[bid]
  if aid=='landing' and bid=='ascent':
   def surface(t):
    return np.array([np.r_[ground('surface',float(x),.67409,23.47298,'moon')['p'],ground('surface',float(x),.67409,23.47298,'moon')['v']] for x in np.atleast_1d(t)]).T
   segments.append(dict(a=a,b=b,kind='surface',evaluate=surface,va=a['v'],vb=b['v']));continue
  if (aid,bid) in POWERED or b['t']-a['t']<60:segments.append(powered(a,b))
  else:segments.append(coast(a,b))
 # Powered intervals meet the fitted incoming/outgoing coast velocities; the
 # rounded report vectors remain available separately in the source anchors.
 for i,seg in enumerate(segments):
  if seg['kind']!='powered-reconstruction':continue
  a,b=dict(seg['a']),dict(seg['b'])
  if i and segments[i-1]['kind']=='gravity-fit':a['v']=segments[i-1]['vb']
  if i+1<len(segments) and segments[i+1]['kind']=='gravity-fit':b['v']=segments[i+1]['va']
  segments[i]=powered(a,b)
 rows=[];phases=[]
 for seg in segments:
  a,b=seg['a'],seg['b'];duration=b['t']-a['t'];step=2 if seg['kind']=='powered-reconstruction' else 30 if a['body']=='moon' else 120
  ts=np.linspace(a['t'],b['t'],max(2,math.ceil(duration/step)+1));ys=seg['evaluate'](ts)
  for i,t in enumerate(ts):
   if rows and abs(rows[-1][0]-t)<1e-6:continue
   vals=[round(float(t),5),*[round(float(v),6) for v in ys[:3,i]],*[round(float(v),9) for v in ys[3:,i]]];rows.append(vals)
  phases.append(dict(start=a['t'],end=b['t'],fromAnchor=a['id'],toAnchor=b['id'],method=seg['kind']))
 return dict(states=rows,phases=phases)

tracks={};tracks['stack']=build(common);tracks['columbia']=build(csm);tracks['eagle']=build(eagle);tracks['discarded-eagle']=build(['jettison','final-separation-ign','final-separation-cut'])
# Full historical orientations in the same inertial frame, 15-minute samples.
orientations=[]
for t in np.arange(0,met('195:18:35')+901,900):
 orientations.append([float(t),*Rotation.from_matrix(rotation('earth',float(t))).as_quat().tolist(),*Rotation.from_matrix(rotation('moon',float(t))).as_quat().tolist()])
def states_for(spline):
 return [[round(float(t),5),*[round(float(x),6) for x in spline(t)],*[round(float(x),9) for x in spline(t,1)]] for t in np.arange(-900,met('195:18:35')+1801,900)]
result=dict(version=1,epochUTC=EPOCH.isoformat(),frame='geocentric J2000 equatorial / ICRF',timeScale='UTC seconds since launch',units={'position':'km','velocity':'km/s'},reconstruction=True,gravity={'earthGM':MU_E,'moonGM':MU_M,'sunGM':MU_S,'moonSurfaceRadiusKm':R_M},ephemeris={'source':'NASA/JPL Horizons, geometric vectors, ICRF, UTC','moon':states_for(moon),'sun':states_for(sun)},orientations=orientations,tracks=tracks,anchors=[dict(id=a['id'],t=a['t'],body=a['body'],positionKm=a['p'].tolist(),velocityKmS=a['v'].tolist(),measuredParameters=a['measured']) for a in A.values()],coastFitAudit=AUDIT,
 methodology=['This is a physical reconstruction constrained by rounded NASA mission-report states; no continuous spacecraft telemetry is bundled.','Unpowered legs: DOP853 Earth–Moon–Sun point-mass gravity, shooting fit to endpoint positions.','Powered legs: controlled quintic boundary reconstruction. Launch, landing and ascent enforce a nonnegative radial altitude profile; entry uses a monotonically damped radial profile fitted to entry vertical speed and splashdown. Throttle, aerodynamic lift, bank angle and guidance histories are not recovered.','Lunar velocity directions are solved from position endpoints with a retrograde initial guess; the printed heading convention is not treated as modern Moon-ME local north. Orbital periods, planes and speeds follow the constrained gravity solution. Gravity harmonics, solar radiation pressure and atmospheric drag outside reconstructed entry are not resolved.','Old lunar map-frame alignment and Earth ellipsoid substitution are documented in trajectory-anchors.json.','Scene distances and radii retain the atlas display scale; body-frame coordinates use NASA SPICE orientations.','No long-term location is assigned to the discarded ascent stage.'],sources=[source['sourceUrl'],'https://ssd.jpl.nasa.gov/horizons/','https://naif.jpl.nasa.gov/pub/naif/generic_kernels/'],kernelSHA256={name:hashlib.sha256((CACHE/name).read_bytes()).hexdigest() for name in KERNELS})
result['provenance']={'generatedAtUTC':datetime.now(timezone.utc).isoformat(),'anchorSHA256':hashlib.sha256((ROOT/'assets/missions/apollo-11/trajectory-anchors.json').read_bytes()).hexdigest(),'HorizonsRawResponseSHA256':{name:hashlib.sha256((CACHE/(name+'-horizons.json')).read_bytes()).hexdigest() for name in ['moon','sun']}}
out=ROOT/'assets/missions/apollo-11/trajectory.json';out.write_text(json.dumps(result,separators=(',',':'))+'\n');print('Wrote',out,'bytes',out.stat().st_size,flush=True)
