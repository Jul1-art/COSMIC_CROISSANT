/* French editorial copy. Orbital calculations use apollo11-data.js. */
export const {APOLLO_11,EVENTS,HARDWARE}={
  "APOLLO_11": {
    "id": "apollo-11",
    "name": "Apollo 11",
    "agency": "NASA",
    "programme": "Apollo",
    "site": {
      "name": "Base de la Tranquillité",
      "body": "moon",
      "latitude": 0.67409,
      "longitude": 23.47298
    },
    "crew": [
      [
        "Neil Armstrong",
        "Commandant"
      ],
      [
        "Buzz Aldrin",
        "Pilote du module lunaire"
      ],
      [
        "Michael Collins",
        "Pilote du module de commande"
      ]
    ],
    "summary": "Le premier alunissage habité. Huit jours de voyage, deux hommes sur la Lune et un patrimoine technique toujours présent à la surface.",
    "sources": [
      [
        "NASA · Modèle 3D du module lunaire (Michael D. Carbajal)",
        "https://science.nasa.gov/3d-resources/apollo-lunar-module/"
      ],
      [
        "NASA · Mission Apollo 11",
        "https://www.nasa.gov/mission/apollo-11/"
      ],
      [
        "NASA · Chronologie officielle SP-4029",
        "https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11i_Timeline.htm"
      ],
      [
        "NASA · Rapport de mission MSC-00171",
        "https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf"
      ],
      [
        "NASA · Lunar Surface Journal",
        "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11ov.html"
      ],
      [
        "NASA · Expérience sismique",
        "https://science.nasa.gov/resource/apollo-11-seismic-experiment/"
      ],
      [
        "NASA SVS · Reconstitution du site par LRO",
        "https://svs.gsfc.nasa.gov/4185/"
      ],
      [
        "NASA · Protection du patrimoine lunaire",
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
        "Préparatifs",
        "Décollage",
        "Voyage Terre–Lune",
        "Alunissage",
        "Sortie lunaire",
        "Retour sur Terre",
        "Récupération"
      ]
    }
  },
  "EVENTS": [
    {
      "id": "launch",
      "date": "1969-07-16T13:32:00Z",
      "time": -14552880000,
      "title": "Décollage",
      "text": "Saturn V décolle du Kennedy Space Center. L’équipage rejoint une orbite de stationnement terrestre."
    },
    {
      "id": "tli",
      "date": "1969-07-16T16:22:13Z",
      "time": -14542667000,
      "title": "Cap sur la Lune",
      "text": "Le S-IVB réalise l’injection translunaire. Columbia se retourne et extrait Eagle de son adaptateur."
    },
    {
      "id": "orbit",
      "date": "1969-07-19T17:21:50Z",
      "time": -14279890000,
      "title": "Orbite lunaire",
      "text": "Une mise à feu du moteur du module de service freine le vaisseau pour le placer en orbite lunaire."
    },
    {
      "id": "descent",
      "date": "1969-07-20T20:05:05Z",
      "time": -14183695000,
      "title": "La descente",
      "text": "Armstrong et Aldrin descendent dans Eagle. Collins reste en orbite à bord de Columbia."
    },
    {
      "id": "landing",
      "date": "1969-07-20T20:17:43Z",
      "time": -14182937000,
      "title": "Eagle s’est posé",
      "text": "Eagle atteint la mer de la Tranquillité. Son étage de descente restera sur la Lune."
    },
    {
      "id": "step",
      "date": "1969-07-21T02:56:15Z",
      "time": -14159025000,
      "title": "Le premier pas",
      "text": "Armstrong pose le pied sur le sol lunaire. Aldrin le rejoint ; les astronautes déploient les expériences et collectent des échantillons."
    },
    {
      "id": "eva-end",
      "date": "1969-07-21T05:11:12Z",
      "time": -14150928000,
      "title": "Retour dans Eagle",
      "text": "La sortie est terminée. Les échantillons et les films sont à bord ; les instruments, outils et équipements inutiles restent au sol."
    },
    {
      "id": "ascent",
      "date": "1969-07-21T17:54:00Z",
      "time": -14105160000,
      "title": "Décollage lunaire",
      "text": "L’étage d’ascension quitte la surface. L’étage de descente sert de plateforme et reste au site."
    },
    {
      "id": "dock",
      "date": "1969-07-21T21:35:00Z",
      "time": -14091900000,
      "title": "Retrouvailles en orbite",
      "text": "Eagle rejoint Columbia. Les astronautes et les échantillons sont transférés dans le module de commande."
    },
    {
      "id": "jettison",
      "date": "1969-07-21T23:41:31Z",
      "time": -14084309000,
      "title": "Eagle est largué",
      "text": "L’étage d’ascension est abandonné en orbite lunaire. Son devenir et son emplacement final ne sont pas confirmés."
    },
    {
      "id": "return",
      "date": "1969-07-22T04:55:42Z",
      "time": -14065458000,
      "title": "Retour vers la Terre",
      "text": "Le module de service propulse Columbia sur une trajectoire de retour."
    },
    {
      "id": "separation",
      "date": "1969-07-24T16:21:12Z",
      "time": -13851528000,
      "title": "Séparation du module de service",
      "text": "Le module de service est largué avant la rentrée et est détruit dans l’atmosphère terrestre."
    },
    {
      "id": "splash",
      "date": "1969-07-24T16:50:35Z",
      "time": -13849765000,
      "title": "Amerrissage",
      "text": "Columbia amerrit dans le Pacifique avec l’équipage et environ 21,55 kg d’échantillons lunaires."
    }
  ],
  "HARDWARE": [
    {
      "id": "descent",
      "name": "Étage de descente d’Eagle",
      "zone": "Surface lunaire",
      "status": "Laissé sur place",
      "mass": "≈ 2 200 kg à sec",
      "position": [
        0,
        0,
        0
      ],
      "kind": "lander",
      "since": "landing",
      "text": "Structure à quatre pieds, moteur de descente, réservoirs, échelle et plaque commémorative. Il a servi de plateforme au décollage de l’étage d’ascension."
    },
    {
      "id": "reflector",
      "name": "Rétroréflecteur laser · LRRR",
      "zone": "Surface lunaire",
      "status": "Toujours utilisé",
      "mass": "≈ 20 kg",
      "position": [
        14,
        0,
        -10
      ],
      "kind": "reflector",
      "since": "step",
      "text": "Cent coins de cube renvoient vers la Terre une partie des impulsions laser. Cet instrument passif permet encore la télémétrie Terre–Lune, sans alimentation électrique."
    },
    {
      "id": "seismic",
      "name": "Sismomètre · PSEP",
      "zone": "Surface lunaire",
      "status": "Inactif",
      "mass": "≈ 48 kg",
      "position": [
        -13,
        0,
        -14
      ],
      "kind": "seismic",
      "since": "step",
      "text": "Le premier sismomètre placé sur la Lune, alimenté par panneaux solaires. Il cesse de répondre le 25 août 1969. Les séries sismiques de plusieurs années proviennent des missions Apollo suivantes."
    },
    {
      "id": "dust",
      "name": "Détecteur de poussière",
      "zone": "Surface lunaire",
      "status": "Inactif",
      "mass": "Moins de 1 kg",
      "position": [
        -13,
        1.1,
        -14
      ],
      "kind": "dust",
      "since": "step",
      "text": "Petit détecteur monté sur le PSEP pour observer l’évolution de ses cellules solaires et étudier les dépôts de poussière."
    },
    {
      "id": "flag",
      "name": "Drapeau et mât",
      "zone": "Surface lunaire",
      "status": "Renversé au décollage",
      "mass": "≈ 2 kg",
      "position": [
        7,
        0,
        6
      ],
      "kind": "flag",
      "since": "step",
      "text": "Un mât et une barre horizontale déploient le tissu dans le vide. Aldrin rapporte avoir vu le drapeau tomber sous le souffle du décollage d’Eagle."
    },
    {
      "id": "antenna",
      "name": "Antenne bande S déployable",
      "zone": "Surface lunaire",
      "status": "Inactif",
      "mass": "Masse non consolidée",
      "position": [
        -8,
        0,
        7
      ],
      "kind": "antenna",
      "since": "step",
      "text": "Une antenne orientable déployée à la surface assure les communications. Elle est distincte des antennes du module lunaire ; sa position ici est illustrative."
    },
    {
      "id": "camera",
      "name": "Caméra TV Westinghouse",
      "zone": "Surface lunaire",
      "status": "Inactif",
      "mass": "≈ 3,3 kg, caméra seule",
      "position": [
        12,
        0,
        13
      ],
      "kind": "camera",
      "since": "step",
      "text": "Installée d’abord dans le compartiment MESA, puis déplacée sur un trépied, elle transmet les premiers pas et la sortie lunaire en direct. Elle ne filme pas l’alunissage."
    },
    {
      "id": "tools",
      "name": "Outils d’échantillonnage",
      "zone": "Surface lunaire",
      "status": "Laissés sur place",
      "mass": "Variable selon les outils",
      "position": [
        4,
        0,
        -6
      ],
      "kind": "tools",
      "since": "step",
      "text": "Des outils et accessoires devenus inutiles sont laissés pour réduire la masse au retour. Les échantillons, certaines pièces et le collecteur de vent solaire sont rapportés sur Terre."
    },
    {
      "id": "bags",
      "name": "Sacs de délestage et équipements",
      "zone": "Surface lunaire",
      "status": "Laissés sur place",
      "mass": "Non consolidée",
      "position": [
        -4,
        0,
        3
      ],
      "kind": "bags",
      "since": "eva-end",
      "text": "Des équipements, consommables et déchets sont abandonnés avant le décollage. Aucun sac d’Apollo 11 laissé sur la Lune n’a été récupéré pour une analyse terrestre en 2019."
    },
    {
      "id": "blankets",
      "name": "Isolation thermique",
      "zone": "Surface lunaire",
      "status": "Laissée sur place",
      "mass": "Incluse dans les équipements",
      "position": [
        2,
        0,
        2
      ],
      "kind": "blankets",
      "since": "landing",
      "text": "Les couvertures multicouches protègent les structures des échanges thermiques. Celles attachées à l’étage de descente font partie du module ; elles ne doivent pas être comptées deux fois."
    },
    {
      "id": "ascent",
      "name": "Étage d’ascension d’Eagle",
      "zone": "Orbite lunaire",
      "status": "Devenir non confirmé",
      "mass": "≈ 2 400 kg à sec",
      "since": "jettison",
      "text": "Largué après le rendez-vous et le transfert de l’équipage. Un impact ultérieur a souvent été supposé, mais il n’existe pas de localisation finale confirmée."
    },
    {
      "id": "service",
      "name": "Module de service · SM",
      "zone": "Atmosphère terrestre",
      "status": "Détruit à la rentrée",
      "mass": "≈ 5 000 kg à sec",
      "since": "separation",
      "text": "Il assure propulsion, énergie et consommables. Séparé de Columbia le 24 juillet, il est détruit dans l’atmosphère terrestre ; ce n’est pas un objet encore en orbite lunaire."
    },
    {
      "id": "sivb",
      "name": "Troisième étage · S-IVB",
      "zone": "Orbite héliocentrique",
      "status": "Trajectoire solaire",
      "mass": "≈ 13 500 kg à sec",
      "since": "tli",
      "text": "Après l’injection translunaire et l’extraction d’Eagle, l’étage est envoyé sur une trajectoire passant près de la Lune puis autour du Soleil. Sa position actuelle n’est pas simulée ici."
    },
    {
      "id": "sla",
      "name": "Panneaux de l’adaptateur · SLA",
      "zone": "Trajectoire translunaire",
      "status": "Largués en vol",
      "mass": "Non consolidée",
      "since": "tli",
      "text": "Les quatre panneaux de l’adaptateur sont éjectés pour permettre l’amarrage et l’extraction du module lunaire. Leurs positions finales ne sont pas représentées."
    }
  ]
};
export const formatUTC=time=>new Intl.DateTimeFormat('fr-FR',{timeZone:'UTC',dateStyle:'long',timeStyle:'medium',hour12:false}).format(new Date(time))+' UTC';
