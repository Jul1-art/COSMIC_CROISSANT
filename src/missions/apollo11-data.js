/** Apollo 11 catalogue. UTC dates; reconstructed positions are identified as such. */
export const APOLLO_11 = {
  "id": "apollo-11",
  "name": "Apollo 11",
  "agency": "NASA",
  "programme": "Apollo",
  "site": {
    "name": "Tranquility Base",
    "body": "moon",
    "latitude": 0.67409,
    "longitude": 23.47298
  },
  "crew": [
    [
      "Neil Armstrong",
      "Commander"
    ],
    [
      "Buzz Aldrin",
      "Lunar Module Pilot"
    ],
    [
      "Michael Collins",
      "Command Module Pilot"
    ]
  ],
  "summary": "The first crewed lunar landing: eight days of flight, two explorers on the Moon, and a technical legacy still on its surface.",
  "sources": [
    [
      "NASA · Lunar module 3D model (Michael D. Carbajal)",
      "https://science.nasa.gov/3d-resources/apollo-lunar-module/"
    ],
    [
      "NASA · Apollo 11 mission",
      "https://www.nasa.gov/mission/apollo-11/"
    ],
    [
      "NASA · Official timeline SP-4029",
      "https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11i_Timeline.htm"
    ],
    [
      "NASA · Mission report MSC-00171",
      "https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf"
    ],
    [
      "NASA · Lunar Surface Journal",
      "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11ov.html"
    ],
    [
      "NASA · Passive seismic experiment",
      "https://science.nasa.gov/resource/apollo-11-seismic-experiment/"
    ],
    [
      "NASA SVS · LRO landing-site reconstruction",
      "https://svs.gsfc.nasa.gov/4185/"
    ],
    [
      "NASA · Lunar heritage protection",
      "https://www.nasa.gov/history/for-all-humanity/"
    ]
  ],
  "film": {
    "path": "assets/missions/apollo-11/film/mission.m3u8",
    "source": "https://images.nasa.gov/details/KSC-19690716-MH-NAS01-0001-The_Flight_of_Apollo_11_The_Eagle_Has_Landed_HS_from_Film_JSC-DVC_1928",
    "jfkSource": "https://images.nasa.gov/details/President%20Kennedy%20Challenges%20NASA%20to%20Go%20to%20the%20Moon",
    "jfkDuration": 125.736,
    "duration": 1866.736,
    "coverage": [
      "JFK",
      "Preparations",
      "Launch",
      "Earth–Moon flight",
      "Lunar landing",
      "Moonwalk",
      "Return to Earth",
      "Recovery"
    ]
  }
};
export const EVENTS = [
  {
    "id": "launch",
    "date": "1969-07-16T13:32:00Z",
    "title": "Liftoff",
    "text": "Saturn V lifts off from Kennedy Space Center. The crew enters an Earth parking orbit."
  },
  {
    "id": "tli",
    "date": "1969-07-16T16:22:13Z",
    "title": "Bound for the Moon",
    "text": "The S-IVB stage performs translunar injection. Columbia turns around, docks with Eagle and extracts it from its adapter."
  },
  {
    "id": "orbit",
    "date": "1969-07-19T17:21:50Z",
    "title": "Lunar orbit",
    "text": "A service-module engine burn slows the spacecraft into lunar orbit."
  },
  {
    "id": "descent",
    "date": "1969-07-20T20:05:05Z",
    "title": "Powered descent",
    "text": "Armstrong and Aldrin descend in Eagle while Collins remains in lunar orbit aboard Columbia."
  },
  {
    "id": "landing",
    "date": "1969-07-20T20:17:43Z",
    "title": "Eagle has landed",
    "text": "Eagle touches down in the Sea of Tranquility. Its descent stage will remain on the Moon."
  },
  {
    "id": "step",
    "date": "1969-07-21T02:56:15Z",
    "title": "The first step",
    "text": "Armstrong steps onto the lunar surface. Aldrin joins him; the astronauts deploy experiments and collect samples."
  },
  {
    "id": "eva-end",
    "date": "1969-07-21T05:11:12Z",
    "title": "Back inside Eagle",
    "text": "The moonwalk ends. Samples and film are aboard; instruments, tools and unwanted equipment stay on the surface."
  },
  {
    "id": "ascent",
    "date": "1969-07-21T17:54:00Z",
    "title": "Lunar liftoff",
    "text": "The ascent stage leaves the surface. The descent stage serves as its launch platform and remains at the site."
  },
  {
    "id": "dock",
    "date": "1969-07-21T21:35:00Z",
    "title": "Rendezvous in orbit",
    "text": "Eagle rejoins Columbia. The astronauts and lunar samples transfer to the command module."
  },
  {
    "id": "jettison",
    "date": "1969-07-21T23:41:31Z",
    "title": "Eagle is jettisoned",
    "text": "The ascent stage is abandoned in lunar orbit. Its eventual fate and final location are not confirmed."
  },
  {
    "id": "return",
    "date": "1969-07-22T04:55:42Z",
    "title": "Homeward bound",
    "text": "The service module propels Columbia onto its return trajectory."
  },
  {
    "id": "separation",
    "date": "1969-07-24T16:21:12Z",
    "title": "Service-module separation",
    "text": "The service module is discarded before reentry and is destroyed in the atmosphere."
  },
  {
    "id": "splash",
    "date": "1969-07-24T16:50:35Z",
    "title": "Splashdown",
    "text": "Columbia splashes down in the Pacific with its crew and about 21.55 kg of lunar samples."
  }
].map(row=>({...row,time:Date.parse(row.date)}));
export const START=EVENTS[0].time, END=EVENTS.at(-1).time;
export const eventTime=id=>EVENTS.find(row=>row.id===id).time;
export function missionState(time){
  const value=Number(time),t=Number.isFinite(value)?Math.max(START,Math.min(END,value)):START;
  const event=EVENTS.findLast(row=>row.time<=t)||EVENTS[0];
  return {time:t,event,elapsedSeconds:Math.floor((t-START)/1000),landed:t>=eventTime('landing'),deployed:t>=eventTime('step'),ascent:t>=eventTime('ascent'),returned:t>=END};
}
export function missionProgress(time){return (missionState(time).time-START)/(END-START);}
export function formatUTC(time){return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(time))+' UTC';}
export function elapsedLabel(time){const s=missionState(time).elapsedSeconds;return `T+${String(Math.floor(s/3600)).padStart(3,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}

export const HARDWARE = [
  {
    "id": "descent",
    "name": "Eagle descent stage",
    "zone": "Lunar surface",
    "status": "Left in place",
    "mass": "≈ 2,200 kg dry",
    "position": [
      0,
      0,
      0
    ],
    "kind": "lander",
    "since": "landing",
    "text": "Four landing legs, the descent engine, tanks, ladder and commemorative plaque. It served as the launch platform for the ascent stage."
  },
  {
    "id": "reflector",
    "name": "Laser retroreflector · LRRR",
    "zone": "Lunar surface",
    "status": "Still in use",
    "mass": "≈ 20 kg",
    "position": [
      14,
      0,
      -10
    ],
    "kind": "reflector",
    "since": "step",
    "text": "One hundred corner cubes return part of each incoming laser pulse to Earth. This passive instrument is still used for Earth–Moon ranging, without electrical power."
  },
  {
    "id": "seismic",
    "name": "Seismometer · PSEP",
    "zone": "Lunar surface",
    "status": "Inactive",
    "mass": "≈ 48 kg",
    "position": [
      -13,
      0,
      -14
    ],
    "kind": "seismic",
    "since": "step",
    "text": "The first seismometer placed on the Moon used solar panels. It stopped responding on 25 August 1969. The multiyear seismic records came from later Apollo missions."
  },
  {
    "id": "dust",
    "name": "Dust detector",
    "zone": "Lunar surface",
    "status": "Inactive",
    "mass": "Less than 1 kg",
    "position": [
      -13,
      1.1,
      -14
    ],
    "kind": "dust",
    "since": "step",
    "text": "A small detector mounted on the PSEP monitored changes to its solar cells and helped investigate dust deposition."
  },
  {
    "id": "flag",
    "name": "Flag and pole",
    "zone": "Lunar surface",
    "status": "Knocked over at liftoff",
    "mass": "≈ 2 kg",
    "position": [
      7,
      0,
      6
    ],
    "kind": "flag",
    "since": "step",
    "text": "A pole and horizontal rod supported the fabric in vacuum. Aldrin reported seeing the flag fall in the exhaust from Eagle at liftoff."
  },
  {
    "id": "antenna",
    "name": "Deployable S-band antenna",
    "zone": "Lunar surface",
    "status": "Inactive",
    "mass": "Mass not established",
    "position": [
      -8,
      0,
      7
    ],
    "kind": "antenna",
    "since": "step",
    "text": "A steerable surface antenna supported communications. It was separate from the antennas on the lunar module; its position in the local model is illustrative."
  },
  {
    "id": "camera",
    "name": "Westinghouse TV camera",
    "zone": "Lunar surface",
    "status": "Inactive",
    "mass": "≈ 3.3 kg, camera only",
    "position": [
      12,
      0,
      13
    ],
    "kind": "camera",
    "since": "step",
    "text": "Initially installed in the MESA compartment, then moved onto a tripod, it broadcast the first steps and moonwalk. It did not film the landing."
  },
  {
    "id": "tools",
    "name": "Sampling tools",
    "zone": "Lunar surface",
    "status": "Left in place",
    "mass": "Varies by tool",
    "position": [
      4,
      0,
      -6
    ],
    "kind": "tools",
    "since": "step",
    "text": "Unneeded tools and accessories were left to reduce return mass. Samples, some components and the solar-wind collector were brought back to Earth."
  },
  {
    "id": "bags",
    "name": "Discard bags and equipment",
    "zone": "Lunar surface",
    "status": "Left in place",
    "mass": "Not established",
    "position": [
      -4,
      0,
      3
    ],
    "kind": "bags",
    "since": "eva-end",
    "text": "Equipment, consumables and waste were discarded before liftoff. No Apollo 11 bag left on the Moon was recovered for laboratory analysis on Earth in 2019."
  },
  {
    "id": "blankets",
    "name": "Thermal insulation",
    "zone": "Lunar surface",
    "status": "Left in place",
    "mass": "Included in equipment masses",
    "position": [
      2,
      0,
      2
    ],
    "kind": "blankets",
    "since": "landing",
    "text": "Multilayer blankets protected structures from heat exchange. Blankets attached to the descent stage are part of that module and must not be counted twice."
  },
  {
    "id": "ascent",
    "name": "Eagle ascent stage",
    "zone": "Lunar orbit",
    "status": "Final fate unconfirmed",
    "mass": "≈ 2,400 kg dry",
    "since": "jettison",
    "text": "Jettisoned after rendezvous and crew transfer. A later impact has often been assumed, but no final location is confirmed."
  },
  {
    "id": "service",
    "name": "Service module · SM",
    "zone": "Earth atmosphere",
    "status": "Destroyed at reentry",
    "mass": "≈ 5,000 kg dry",
    "since": "separation",
    "text": "Provided propulsion, power and consumables. Separated from Columbia on 24 July and destroyed in the atmosphere; it is not still in lunar orbit."
  },
  {
    "id": "sivb",
    "name": "Third stage · S-IVB",
    "zone": "Heliocentric orbit",
    "status": "Solar trajectory",
    "mass": "≈ 13,500 kg dry",
    "since": "tli",
    "text": "After translunar injection and extraction of Eagle, the stage passed near the Moon onto a solar trajectory. Its present position is not simulated here."
  },
  {
    "id": "sla",
    "name": "Adapter panels · SLA",
    "zone": "Translunar trajectory",
    "status": "Jettisoned in flight",
    "mass": "Not established",
    "since": "tli",
    "text": "The four adapter panels were ejected to allow docking and extraction of the lunar module. Their final positions are not represented."
  }
];
export const MISSIONS=new Map([[APOLLO_11.id,APOLLO_11]]);
