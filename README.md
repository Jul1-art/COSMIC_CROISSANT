# Hackathon NASA

Atlas interactif du système solaire en 3D. La vue d’ensemble présente les huit planètes. Les reliefs et destinations de la Terre, de Mars et de la Lune utilisent des données NASA. Pour que le zoom terrestre reste net près du sol, la couche satellite détaillée utilise Esri et la vue photoréaliste 3D de Google est disponible via le quota gratuit Cesium ion ; les couches NASA restent disponibles.

## Démarrer

```sh
python3 -m pip install numpy Pillow requests scipy
python3 terrain_server.py
```

Le serveur Python sert les pages, les tuiles d’altitude, `/api/places` et `/api/live/atlas` sur le port 8000. `python3 -m http.server` ne convient pas : il renvoie 404 pour les tuiles d’altitude et la recherche de lieux. Le port peut être changé avec `NASA_ATLAS_PORT`.

Ouvrir `http://localhost:8000/` ou, depuis un appareil connecté au même tailnet, **[https://gx10-d70e.tail4b17ec.ts.net/hackathon-nasa/](https://gx10-d70e.tail4b17ec.ts.net/hackathon-nasa/)**. Cette adresse utilise Tailscale Serve sur HTTPS/443 et préserve le service déjà présent à la racine du domaine.

Sur ce serveur, `hackathon-nasa.service` est activé comme service utilisateur systemd et redémarre automatiquement. Vérifier son état avec `systemctl --user status hackathon-nasa.service`.

## Explorer

- Cliquer ou toucher une planète, son nom, ou le Soleil pour s’en approcher. La Terre ouvre un globe Cesium avec relief NASA SRTM, imagerie satellite Esri détaillée, destinations NASA et recherche par coordonnées décimales.
- Glisser pour tourner autour de la scène ou se déplacer sur un monde. La vitesse du déplacement suit l’altitude : elle devient précise près du sol. Utiliser la molette ou le geste de pincement pour zoomer. Toucher de nouveau l’astre sélectionné pour recadrer sa vue.
- Le bandeau des astres permet de passer directement d’un monde à l’autre. Sur Terre, le bouton d’imagerie en bas à gauche ouvre les choix **Satellite**, **Blue Marble**, **MODIS / Terra** et **Google 3D**. La vue de relief terrestre permet aussi de passer de Satellite à Blue Marble.
- La recherche compacte en bas de l’écran s’ouvre pour trouver villes, adresses et lieux avec [Photon/OpenStreetMap](https://github.com/komoot/photon), ainsi que les sites NASA et les coordonnées `latitude, longitude`. Les suggestions se sélectionnent au clic ou avec les flèches et Entrée ; `/` ouvre la recherche au clavier. Elle se referme après le choix d’un lieu ou avec son bouton de fermeture. Sur Mars et la Lune, elle recherche les sites NASA et les coordonnées.
- **Jezero** ouvre un relief stéréo HiRISE à 1 m par pixel ; **Apollo 11** et le pic central de **Tycho** ouvrent des reliefs LROC NAC à 2 m par pixel. Tycho possède aussi une orthophoto LROC NAC locale à 2 m. Ces données ne couvrent que leurs zones mesurées. La planète sélectionnée cesse de tourner pendant son exploration.
- La vue de relief utilise un angle oblique : glisser pour tourner, clic droit ou deux doigts pour déplacer, double clic pour recentrer, flèches pour avancer et reculer. Les commandes permettent aussi une vue du dessus, un cadrage global et une amplification du relief de ×1 à ×2.
- Le bouton **Vue globale** recadre le système solaire. Les fiches peuvent être réduites pour laisser plus de place au globe.
- L’interface démarre en mode nuit. Le bouton soleil/lune dans l’en-tête bascule entre les modes nuit et jour ; le choix est conservé dans le navigateur.

Les distances et les tailles dans la scène sont adaptées à l’exploration visuelle. L’angle des planètes vient des vecteurs calculés par NASA/JPL Horizons ; le rayon des orbites reste comprimé pour la lisibilité. La vitesse et la distance affichées viennent également de Horizons et sont recalculées toutes les 10 minutes. Le vent solaire NOAA est une **mesure près de la Terre**, actualisée toutes les 2 minutes ; l’application ne l’attribue pas aux autres planètes. Il n’existe pas ici de mesure en direct de la vitesse du vent ou de l’impact solaire à la surface de chaque planète. Si une source échoue, l’interface indique la dernière valeur connue et son heure, ou l’indisponibilité.

Les cartes globales de la Terre, Mars et la Lune sont stockées localement dans `assets/` ; Three.js et Cesium sont dans `vendor/`. Les couches Esri, GIBS et Trek nécessitent une connexion. Les tuiles d’altitude mesurées sont produites par le serveur et conservées dans `~/.cache/hackathon-nasa/`. Le globe terrestre et la vue de terrain utilisent le relief SRTM là où il existe, avec amplification verticale ×2 par défaut et ×1 à Manhattan, Paris et Nice pour limiter les bosses dues aux objets détectés par le radar. Les sites Jezero, Apollo 11 et Tycho démarrent à ×1 pour montrer leur forme mesurée. La caméra vise l'altitude du site et un angle oblique pour montrer le volume du terrain. L'imagerie Esri a une résolution variable selon la région ; Blue Marble est une mosaïque composite historique, limitée à environ 500 m par pixel ; MODIS / Terra est une observation datée, limitée à environ 250 m par pixel et parfois partielle ou nuageuse. Les images très détaillées de Jezero, Apollo 11 et Tycho ne couvrent qu'une petite zone ; ailleurs, une mosaïque globale NASA comble les lacunes.

Les pistes revêtues documentées utilisent un complément aux altitudes radar SRTM : leurs surfaces suivent les coordonnées, largeurs et altitudes des extrémités du jeu public [OurAirports](https://ourairports.com/data/), avec un raccord progressif au relief SRTM sur 75 m au-delà des bords. Le jeu local contient 9 285 pistes dont les données sont complètes et plausibles ; il ne remplace pas le relief NASA ailleurs. À **Nice**, les deux pistes sont recalées avec les coordonnées et altitudes officielles du [Service de l’Information Aéronautique](https://www.sia.aviation-civile.gouv.fr/documents/download/f/d/15031542/) en priorité. Ainsi, les fluctuations radar de plusieurs mètres ne créent plus des dos d’âne sur ces pistes. Les pistes sans données fiables restent sur SRTM.

Les tuiles Google 3D remplacent entièrement la surface visible lorsqu’elles sont activées ; le relief SRTM et sa correction des pistes restent disponibles en désactivant Google 3D. Le site ne construit plus de bâtiments depuis les contours OpenStreetMap. Sur ce serveur, le jeton fourni est dans `/home/jules/.config/hackathon-nasa.env` et les deux vues terrestres activent Google 3D automatiquement. Pour une autre installation, créer un compte [Cesium ion Community](https://cesium.com/platform/cesium-ion/pricing/), obtenir un [jeton Cesium ion](https://ion.cesium.com/tokens), puis définir `NASA_ATLAS_CESIUM_ION_TOKEN` côté serveur ou le coller dans la boîte ouverte par le bouton **Google 3D**. La saisie manuelle est conservée dans le stockage local du navigateur. Comme le navigateur utilise directement les tuiles, le jeton est visible dans les requêtes réseau ; limiter les URL autorisées dans les réglages Cesium ion pour un site public. L’offre Community a un quota gratuit et des conditions d’éligibilité ; elle ne fournit pas un accès illimité. Le mode NASA/Esri fonctionne sans jeton. Aucun compte Google Cloud facturé n’est requis avec l’accès Cesium ion.

Pour actualiser le jeu de pistes local : `python3 tools/build_runway_assets.py` (source OurAirports, domaine public). Le rendu ne télécharge pas ce CSV pendant l’exploration.

Les terrains terrestres utilisent **SRTMGL1** (~30 m entre échantillons). Les neuf extraits préconstruits conservent leurs images NASA, dont **Landsat WELD 1999** pour la Terre. Dans la vue libre, Mars utilise **MOLA MEGDR** (jusqu’à 128 pixels par degré, environ 460 m entre échantillons), complété à Jezero par le **DTM HiRISE de 1 m**. La Lune utilise **LOLA** (64 pixels par degré, environ 475 m entre échantillons à l'équateur), complété près d’**Apollo 11** et du pic central de **Tycho** par les **DTM LROC NAC de 2 m**. Les trous des DTM locaux se raccordent progressivement au terrain global. Le zoom au-delà de ces résolutions agrandit les données existantes ; il n'ajoute pas de détails mesurés. Les produits PDS bruts sont téléchargés une seule fois dans `~/.cache/hackathon-nasa/` : environ 381 Mo pour Jezero, 1,51 Go pour le DTM Tycho et 378 Mo pour son orthophoto. Le téléchargement initial peut durer ; ensuite seules de petites tuiles sont servies au navigateur.

Pour régénérer les neuf extraits depuis les sources NASA : `python3 tools/build_terrain_assets.py` (dépendances Python `numpy`, `Pillow`, `requests`). Le script conserve ses téléchargements bruts dans `/tmp/nasa-terrain` et publie les sources et limites de chaque extrait dans `assets/terrain/catalog.json`.

Pour vérifier les contrats des sources réelles et le repli du cache :

```sh
python3 -m unittest discover -s tests -v
```

Les API JPL Horizons et NOAA SWPC ne demandent aucune clé. L’imagerie NASA Trek n’en demande pas non plus. [JPL exige toutefois](https://ssd-api.jpl.nasa.gov/doc/index.php) un `User-Agent` contenant le nom et la version du logiciel ainsi qu’un vrai contact, et limite les clients automatisés à une requête simultanée. Renseigner `NASA_ATLAS_CONTACT` avec une adresse e-mail ou une URL publique de contact **côté serveur seulement** (voir `.env.example`). Sur cette machine, le service systemd lit `/home/jules/.config/hackathon-nasa.env` si le fichier existe, avec la ligne `NASA_ATLAS_CONTACT=...`. Tant que cette variable manque, l’API affiche les dernières positions en cache comme périmées et cesse d’appeler JPL. Les tests JPL sont alors ignorés pour respecter cette condition. Les accès aux API de données passent par le serveur Python ; les couches d’imagerie publiques GIBS et Trek sont chargées directement par Cesium. Il faut conserver ce serveur Python sur l’hébergeur pour bénéficier du relief et des mesures actualisées.

La résolution de rendu s’ajuste automatiquement quand la cadence baisse. Les tuiles NASA déjà affichées sont réutilisées pendant le déplacement pour éviter des téléchargements et des reconstructions inutiles.

## Cartes utilisées

- Terre, globe et surface : [NASA Blue Marble](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/) et [NASA GIBS](https://data.nasa.gov/dataset/gibs-web-map-tile-service-wmts). Observation datée : [MODIS / Terra](https://gis.earthdata.nasa.gov/portal/home/item.html?id=780c03ffe3dc42e8bb03ca3b07bb283e). Zoom détaillé : [Esri World Imagery](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer), crédit et fournisseurs affichés dans Cesium.
- Bâtiments et surface terrestre photoréalistes : [Google Photorealistic 3D Tiles via Cesium ion](https://cesium.com/learn/cesiumjs-learn/cesiumjs-photorealistic-3d-tiles/). Les crédits des tuiles sont affichés dans la vue 3D.
- Mars : [NASA Trek, mosaïque globale Viking](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars).
- Lune : [LROC WAC et relief LOLA](https://svs.gsfc.nasa.gov/4720/).
- Mercure, Vénus, Jupiter, Saturne, Uranus, Neptune, Soleil et anneaux de Saturne : [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/), sous [licence CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Les textures ont été adaptées en WebP pour réduire leur poids.
- Jezero : mosaïque [MRO HiRISE 25 cm](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) et [DTM stéréo HiRISE 1 m](https://www.uahirise.org/dtm/ESP_045994_1985) ; Apollo 11 : mosaïque [LROC NAC 26 cm](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon).
- Relief terrestre : [NASA SRTMGL1 v003](https://lpdaac.usgs.gov/products/srtmgl1v003/) ; imagerie des extraits locaux : [NASA GIBS Landsat WELD](https://gibs.earthdata.nasa.gov/).
- Relief martien : [NASA PDS MOLA MEGDR](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html).
- Relief lunaire : [NASA SVS LOLA](https://svs.gsfc.nasa.gov/4720/), [NASA PDS LROC NAC DTM Apollo 11](https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DATA/SDP/NAC_DTM/APOLLO11/) et [DTM et orthophoto LROC NAC Tycho](https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_DTM_TYCHOPK).

Les coordonnées des destinations sont rassemblées dans `nasa-worlds.js` avec leur source. Les six destinations terrestres pointent vers des lieux photographiés ou documentés par NASA ou vers les données aéronautiques officielles de Nice. Les coordonnées d'Apollo 11 proviennent du [NSSDC](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html). Les autres textures du système solaire restent attribuées séparément à Solar System Scope.
