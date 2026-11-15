"""Read published NASA Eyes Dynamo ephemeris packets (little endian, versions 1/2).

This module reads numerical data only; it never executes the source application's JavaScript.
Orbital point rows contain ET, a, e, mean motion, mean anomaly, and a w/x/y/z quaternion.
"""
from dataclasses import dataclass
import struct,math

POINT_WIDTH={'pos':7,'lin':4,'orb':9,'quat':5}

class Reader:
 def __init__(self,payload):self.payload=payload;self.offset=0
 def read(self,format):
  values=struct.unpack_from('<'+format,self.payload,self.offset);self.offset+=struct.calcsize('<'+format);return values[0] if len(values)==1 else values
 def string(self):
  end=self.payload.index(b'\0',self.offset);value=self.payload[self.offset:end].decode('utf8');self.offset=end+1;return value

@dataclass
class Definition:
 version:int
 kind:str
 digits:int
 header:dict
 tree:dict

def point_set(reader,definition,name):
 inline=reader.read('B')==1 if definition.version==2 or name=='def' else True
 count=reader.read('i')
 if count<0 or count>10000000:raise ValueError('Invalid NASA point count')
 if inline:
  rows=[list(reader.read('d'*POINT_WIDTH[definition.kind])) for _ in range(count)]
  if any(rows[i][0]>rows[i+1][0] for i in range(len(rows)-1)):raise ValueError('Unordered ephemeris samples')
  return {'name':name,'points':rows}
 digits=definition.digits if definition.version==2 else max(1,math.ceil(math.log10(max(1,count))))
 if definition.version==2:
  boundaries=[reader.read('d') for _ in range(count)];intervals=list(zip(boundaries,boundaries[1:]))
 else:intervals=[reader.read('dd') for _ in range(count)]
 return {'name':name,'children':[{'name':(str(i).zfill(digits) if name=='def' else name+'_'+str(i).zfill(digits)),'start':start,'end':end} for i,(start,end) in enumerate(intervals)]}

def decode(payload,definition=None,name='def'):
 reader=Reader(payload)
 if definition is None:
  version=reader.read('h');kind=reader.string()
  if version not in [1,2] or kind not in POINT_WIDTH:raise ValueError('Unsupported NASA Dynamo packet')
  digits=reader.read('B') if version==2 else 0
  header={'gm1':reader.read('d'),'gm2':reader.read('d')} if kind=='orb' else {}
  definition=Definition(version,kind,digits,header,{})
 tree=point_set(reader,definition,name)
 if reader.offset!=len(payload):raise ValueError('Unexpected trailing ephemeris bytes')
 return Definition(definition.version,definition.kind,definition.digits,definition.header,tree)

def rotate(vector,quaternion):
 w,x,y,z=quaternion;vx,vy,vz=vector
 # Unit-quaternion rotation, with the scalar-first order used in the packets.
 tx,ty,tz=2*(y*vz-z*vy),2*(z*vx-x*vz),2*(x*vy-y*vx)
 return [vx+w*tx+y*tz-z*ty,vy+w*ty+z*tx-x*tz,vz+w*tz+x*ty-y*tx]

def orbital_position(row,et):
 epoch,a,e,motion,mean,*quaternion=row;mean+=motion*(et-epoch)
 if e<1:
  mean=(mean+math.pi)%(2*math.pi)-math.pi;eccentric=mean if e<.8 else math.copysign(math.pi,mean)
  for _ in range(40):
   step=(eccentric-e*math.sin(eccentric)-mean)/(1-e*math.cos(eccentric));eccentric-=step
   if abs(step)<1e-13:break
  point=[a*(math.cos(eccentric)-e),a*math.sqrt(1-e*e)*math.sin(eccentric),0]
 else:
  if e==1:raise ValueError('Parabolic packets require a state-vector representation')
  # A bracket also converges near e=1, where an unguarded Newton step can overflow.
  magnitude=abs(mean);low=0;high=max(1,math.asinh(magnitude/e)+1)
  while e*math.sinh(high)-high<magnitude:high*=2
  for _ in range(80):
   middle=(low+high)/2
   if e*math.sinh(middle)-middle<magnitude:low=middle
   else:high=middle
  eccentric=math.copysign((low+high)/2,mean)
  # NASA packets store the positive magnitude of a for a hyperbolic conic.
  point=[a*(e-math.cosh(eccentric)),a*math.sqrt(e*e-1)*math.sinh(eccentric),0]
 return rotate(point,quaternion)
