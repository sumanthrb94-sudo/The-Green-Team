/**
 * Environmental-intelligence map datasets — carried over verbatim from v1
 * (legacy/src/App.tsx, SanctuaryMapLayout). Coordinates are hand-traced and
 * research-verified; do not reformat or round.
 */

export type LatLng = [number, number];

export interface AqiHotspot { lat: number; lng: number; intensity: number }
export interface CleanAirZone { lat: number; lng: number; strength: number }
export interface Highway { id: string; name: string; path: LatLng[] }
export interface NaturalFeature {
  id: string;
  type: 'forest' | 'lake';
  title: string;
  coords: LatLng;
  boundary: LatLng[];
  description: string;
  area: string;
}
export interface MapLocation {
  id: string;
  type: 'sanctuary' | 'exit' | 'rrr-exit';
  title: string;
  location: string;
  coords: LatLng;
  aqi: number;
  noise?: number;
  forestRadius?: number;
  boundary?: LatLng[];
  image?: string;
  description?: string;
  exitNumber?: string;
  highway?: string;
  corridor?: string;
  gatewayTo?: string;
  status?: string;
}
export interface KeyZone {
  id: string; name: string; aqi: number; noise: number;
  hazard: 'critical' | 'high' | 'moderate';
  coords: LatLng; tag: string;
}

/** Net AQI intensity for a grid point: -0.5 (very clean) … +1.0 (polluted). */
export function getAqiIntensity(
  point: { lat: number; lng: number },
  pulse: number,
): number {
  let pollution = 0;
  for (const s of AQI_HOTSPOTS) {
    const d = Math.sqrt((point.lat - s.lat) ** 2 + (point.lng - s.lng) ** 2);
    pollution += s.intensity / (1 + d * 40);
  }
  let clean = 0;
  for (const z of CLEAN_AIR_ZONES) {
    const d = Math.sqrt((point.lat - z.lat) ** 2 + (point.lng - z.lng) ** 2);
    clean += z.strength / (1 + d * 50);
  }
  const net = pollution - clean * 0.75;
  const shimmer = Math.sin(point.lat * 100 + point.lng * 100 + pulse * 0.1) * 0.03;
  return Math.max(-0.5, Math.min(net + shimmer, 1.0));
}

export const AQI_HOTSPOTS: AqiHotspot[] = [
  { lat: 17.44, lng: 78.38, intensity: 0.85 }, // HITEC City industrial corridor
  { lat: 17.38, lng: 78.48, intensity: 0.95 }, // Charminar / Old City
  { lat: 17.48, lng: 78.44, intensity: 1.00 }, // Sanath Nagar Industrial
  { lat: 17.24, lng: 78.43, intensity: 0.55 }, // Airport / Shamshabad
  { lat: 17.40, lng: 78.45, intensity: 0.72 }, // City Centre
  { lat: 17.62, lng: 78.08, intensity: 0.38 }, // Sangareddy industrial
  { lat: 17.51, lng: 78.88, intensity: 0.35 }, // Bhongir
  { lat: 17.24, lng: 78.90, intensity: 0.40 }, // Choutuppal
  { lat: 17.50, lng: 78.50, intensity: 0.60 }, // Secunderabad rail yard
];

export const CLEAN_AIR_ZONES: CleanAirZone[] = [
  { lat: 17.74, lng: 78.28, strength: 0.90 }, // Narsapur Forest Reserve     Agartha
  { lat: 17.37, lng: 78.29, strength: 0.80 }, // Osman Sagar / Gandipet      Neo-Vertex corridor
  { lat: 17.31, lng: 78.31, strength: 0.75 }, // Himayat Sagar reservoir
  { lat: 17.35, lng: 78.34, strength: 0.70 }, // Mrugavani National Park
  { lat: 17.33, lng: 78.58, strength: 0.60 }, // Mahavir Harina Vanasthali
  { lat: 17.52, lng: 78.33, strength: 0.65 }, // Ameenpur Lake biodiversity site
  { lat: 17.31, lng: 77.85, strength: 0.65 }, // Ananthagiri Hills
  { lat: 17.24, lng: 78.48, strength: 0.55 }, // Tukkuguda green belt          SYL
];

// Hyderabad Outer Ring Road (ORR) — Surgical 158 km trace with 10-meter accuracy
export const ORR_PATH: LatLng[] = [
  [17.4365, 78.3512], // Exit 19 Gachibowli Junction
  [17.4280, 78.3465],
  [17.4194, 78.3418], // Exit 1 Financial District / Nanakramguda Rotary
  [17.4110, 78.3360],
  [17.4035, 78.3308], // Exit 1A Kokapet / Neopolis Trumpet Interchange
  [17.3970, 78.3380], // Kokapet S
  [17.3912, 78.3450], // Exit 18A Narsingi Interchange
  [17.3720, 78.3570], // Osman Sagar green corridor
  [17.3542, 78.3618], // Exit 18 TSPA / APPA Junction
  [17.3195, 78.3788], // Himayat Sagar lake bridge
  [17.2970, 78.3600],
  [17.2785, 78.3740], // Exit 17 Rajendranagar / Budvel
  [17.2590, 78.3700],
  [17.2442, 78.4116], // Exit 16 Shamshabad / RGIA Airport
  [17.2310, 78.3980],
  [17.2295, 78.4420], // Exit 15 Pedda Golconda
  [17.2200, 78.4630],
  [17.2285, 78.4908], // Exit 14 Tukkuguda / Srisailam Highway / Future City Axis
  [17.2346, 78.5478], // Exit 13 Raviryal / Wonderla
  [17.2530, 78.5760],
  [17.2685, 78.6015], // Exit 12 Bongulur / Mangalpally (Sagar Hwy)
  [17.2880, 78.6170],
  [17.3090, 78.6370],
  [17.3204, 78.6472], // Exit 11 Pedda Amberpet (NH-65 Vijayawada Hwy)
  [17.3510, 78.6610],
  [17.3710, 78.6640],
  [17.3888, 78.6635], // Exit 10 Taramatipet / Pasumamula
  [17.4130, 78.6580],
  [17.4350, 78.6490],
  [17.4582, 78.6812], // Exit 9 Ghatkesar (NH-163 Warangal Hwy)
  [17.4760, 78.6690],
  [17.4985, 78.6610], // Exit 8A Rampally / Cherlapally
  [17.5140, 78.6510],
  [17.5286, 78.6425], // Exit 8 Keesara
  [17.5520, 78.6020],
  [17.5660, 78.5850],
  [17.5842, 78.5684], // Exit 7 Shamirpet (SH-1 Rajiv Rahadari)
  [17.5880, 78.5320],
  [17.5925, 78.4831], // Exit 6 Kandlakoya / Medchal (NH-44 North)
  [17.5850, 78.4420],
  [17.5790, 78.4100],
  [17.5720, 78.3880],
  [17.5615, 78.3685], // Exit 5 Mallampet / Dundigal (Medak/Narsapur road)
  [17.5645, 78.3320], // Exit 4A Saregudem / IDA Bollaram
  [17.5516, 78.3096], // Exit 4 Sultanpur
  [17.5380, 78.2780],
  [17.5255, 78.2384], // Exit 3 Muttangi / Patancheru (NH-65 Mumbai Hwy)
  [17.5020, 78.2510],
  [17.4800, 78.2680],
  [17.4720, 78.2795], // Exit 2 Edulanagulapally / Kollur
  [17.4580, 78.2980],
  [17.4420, 78.3280],
  [17.4365, 78.3512], // Loop back to Exit 19 Gachibowli
];

// Hyderabad Regional Ring Road (RRR) — Surgical 340 km NHAI Alignment (Northern & Southern Arcs)
export const RRR_PATH: LatLng[] = [
  // ── Northern Segment (158.6 km) ───────────────────────────────────
  [17.5852, 78.0782], // RRR-N1 Girmapur / Sangareddy West (NH-65)
  [17.6180, 78.1120],
  [17.6520, 78.1480], // RRR-N2 Fasalwadi / Shivampet (NH-161)
  [17.6950, 78.2040],
  [17.7385, 78.2745], // RRR-N3 Narsapur / Reddypalli (NH-765D) — Agartha Direct Gateway
  [17.7780, 78.3420],
  [17.8180, 78.4120],
  [17.8542, 78.4725], // RRR-N4 Masaipet / Toopran (NH-44 North)
  [17.8580, 78.5820],
  [17.8485, 78.6812], // RRR-N5 Gajwel / Pragnapur (SH-1 Rajiv Rahadari)
  [17.8180, 78.7520],
  [17.7842, 78.8125], // RRR-N6 Jagdevpur / Markook
  [17.7280, 78.8920],
  [17.6125, 78.9642], // RRR-N7 Turkapally / Yadagirigutta
  [17.5680, 78.9320],
  [17.5242, 78.8925], // RRR-N8 Bhongir Junction (NH-163 Warangal Hwy)
  [17.4420, 78.8980],
  [17.3480, 78.9010],
  [17.2512, 78.9024], // RRR-N9 Choutuppal / Bangarigadda (NH-65 East)

  // ── Southern Segment (182.0 km) ───────────────────────────────────
  [17.1980, 78.8840],
  [17.1524, 78.8642], // RRR-S10 Malkapur / Narayanpur
  [17.1620, 78.7620],
  [17.1825, 78.6542], // RRR-S11 Ibrahimpatnam Hub (SH-19 Sagar Rd)
  [17.1320, 78.6320],
  [17.0852, 78.6124], // RRR-S12 Yacharam / Pharma City
  [17.0890, 78.5680],
  [17.0985, 78.5284], // RRR-S13 Kandukur / Mucherla (Future City Axis — Dates County Gateway)
  [17.0620, 78.5080],
  [17.0245, 78.4852], // RRR-S14 Kadthal / Amangal (NH-765 Srisailam Hwy)
  [17.0380, 78.3620],
  [17.0580, 78.2780],
  [17.0725, 78.2045], // RRR-S15 Shadnagar (NH-44 South)
  [17.1080, 78.1720],
  [17.1425, 78.1482], // RRR-S16 Shabad Interchange
  [17.2280, 78.1380],
  [17.3052, 78.1342], // RRR-S17 Chevella / Pudur (SH-4 Bijapur Rd)
  [17.3780, 78.1310],
  [17.4525, 78.1285], // RRR-S18 Shankarpally / Manneguda
  [17.5080, 78.1020],
  [17.5580, 78.0720], // RRR-S19 Sangareddy South / Kandi
  [17.5852, 78.0782], // Loop back into RRR-N1 Girmapur
];

// Radial National Highways & expressways — ORR junctions → RRR junctions
export const HIGHWAYS: Highway[] = [
  {
    id: 'nh-65',
    name: 'NH 65',
    // Mumbai / Pune (NW): city - ORR Patancheru (E3) - RRR Sangareddy
    path: [
      [17.430, 78.430],
      [17.456, 78.384],
      [17.476, 78.336],
      [17.480, 78.278], // ORR E3 Patancheru
      [17.508, 78.252],
      [17.540, 78.222],
      [17.568, 78.190],
      [17.600, 78.156],
      [17.628, 78.108], // RRR Sangareddy
    ],
  },
  {
    id: 'nh-44-s',
    name: 'NH 44',
    // Bangalore / Chennai (S): city - ORR Shamshabad (E15) - RRR south
    path: [
      [17.415, 78.468],
      [17.375, 78.470],
      [17.326, 78.465],
      [17.280, 78.452],
      [17.250, 78.435], // ORR E15 Shamshabad / RGIA
      [17.218, 78.418],
      [17.196, 78.404], // RRR outer south
    ],
  },
  {
    id: 'nh-163',
    name: 'NH 163',
    // Vijayawada (E): city - ORR Ghatkesar (E9) - RRR Bhongir
    path: [
      [17.440, 78.502],
      [17.455, 78.555],
      [17.472, 78.590],
      [17.496, 78.604], // ORR E9 Ghatkesar
      [17.522, 78.630],
      [17.558, 78.664],
      [17.582, 78.692],
      [17.619, 78.726], // RRR Bhongir corridor
    ],
  },
  {
    id: 'nh-44-n',
    name: 'NH 44',
    // Nagpur (N): city - ORR Medchal (E6) - RRR Toopran
    path: [
      [17.460, 78.462],
      [17.508, 78.460],
      [17.554, 78.450],
      [17.588, 78.442], // ORR E6 Medchal
      [17.622, 78.442],
      [17.664, 78.444],
      [17.696, 78.448], // RRR Toopran corridor
    ],
  },
  {
    id: 'pvnr',
    name: 'PVNR Expressway',
    // Connects old city to Financial District / ORR Gachibowli
    path: [
      [17.400, 78.506],
      [17.412, 78.486],
      [17.422, 78.462],
      [17.428, 78.436],
      [17.425, 78.408],
      [17.422, 78.370], // ORR E1 Gachibowli
    ],
  },
  {
    id: 'sagar-hwy',
    name: 'Sagar Highway',
    // SE corridor: city - ORR - RRR Ibrahimpatnam
    path: [
      [17.418, 78.492],
      [17.398, 78.510],
      [17.376, 78.530],
      [17.354, 78.556],
      [17.330, 78.572], // ORR E10 corridor
      [17.308, 78.592],
      [17.278, 78.622],
      [17.252, 78.638], // RRR Ibrahimpatnam approach
    ],
  },
];

// Government Reserve Forests, National Parks & Protected Water Bodies
export const NATURAL_FEATURES: NaturalFeature[] = [

  // ── RESERVE FORESTS (NORTH) ──────────────────────────────────────────── 

  // 1. Narsapur-Toopran Reserved Forest Complex (~30 sq km, Medak Division)
  // Directly adjacent to MODCON Agartha - the primary ecological asset
  {
    id: "narsapur-rf",
    type: 'forest',
    title: "Narsapur Reserved Forest",
    coords: [17.755, 78.275] as [number, number],
    boundary: [
      [17.820, 78.190], [17.850, 78.220], [17.865, 78.260], [17.855, 78.310],
      [17.830, 78.360], [17.800, 78.390], [17.770, 78.410], [17.740, 78.405],
      [17.710, 78.390], [17.685, 78.355], [17.680, 78.310], [17.690, 78.265],
      [17.710, 78.225], [17.740, 78.195], [17.775, 78.180], [17.800, 78.185]
    ] as [number, number][],
    description: "30 sq km dry-deciduous reserve forest. Origin of Agartha sanctuary. Carbon sink for northern Hyderabad. Medak Forest Division.",
    area: "3,000 ha"
  },

  // 2. Toopran-Gajwel Forest Corridor (Medak/Siddipet border)
  {
    id: "toopran-corridor",
    type: 'forest',
    title: "Toopran RF Corridor",
    coords: [17.800, 78.455] as [number, number],
    boundary: [
      [17.825, 78.415], [17.845, 78.440], [17.840, 78.475], [17.820, 78.500],
      [17.795, 78.510], [17.770, 78.500], [17.760, 78.475], [17.770, 78.440],
      [17.790, 78.420]
    ] as [number, number][],
    description: "Scrub-forest corridor linking Narsapur RF to Gajwel range. Seasonal stream habitat. Critical wildlife movement zone.",
    area: "680 ha"
  },

  // 3. Mulugu Reserved Forest (Siddipet - RRR northern transit)
  {
    id: "mulugu-rf",
    type: 'forest',
    title: "Mulugu Reserved Forest",
    coords: [17.808, 78.545] as [number, number],
    boundary: [
      [17.825, 78.515], [17.840, 78.535], [17.842, 78.560], [17.830, 78.580],
      [17.810, 78.590], [17.790, 78.580], [17.780, 78.558], [17.788, 78.530],
      [17.805, 78.515]
    ] as [number, number][],
    description: "Designated RF along Siddipet range - key forest diversion zone identified in RRR northern corridor EIA.",
    area: "520 ha"
  },

  // ── NATIONAL PARKS & WILDLIFE SANCTUARIES ──────────────────────────────

  // 4. KBR National Park (Inside ORR - Jubilee Hills)
  {
    id: "kbr-national-park",
    type: 'forest',
    title: "KBR National Park",
    coords: [17.420, 78.423] as [number, number],
    boundary: [
      [17.432, 78.412], [17.440, 78.420], [17.440, 78.432], [17.432, 78.440],
      [17.422, 78.442], [17.412, 78.436], [17.408, 78.424], [17.415, 78.413],
      [17.424, 78.410]
    ] as [number, number][],
    description: "Hyderabad's premier urban national park. 390 ha. Inside ORR. Leopard, deer, 600+ plant species. Jubilee Hills.",
    area: "390 ha"
  },

  // 5. Mrugavani National Park (Chilkur-Moinabad, SW corridor)
  {
    id: "mrugavani-np",
    type: 'forest',
    title: "Mrugavani National Park",
    coords: [17.358, 78.341] as [number, number],
    boundary: [
      [17.374, 78.325], [17.382, 78.335], [17.384, 78.350], [17.378, 78.363],
      [17.365, 78.370], [17.352, 78.368], [17.341, 78.358], [17.338, 78.345],
      [17.344, 78.330], [17.357, 78.323]
    ] as [number, number][],
    description: "3.6 sq km national park near Chilkur. Teak, bamboo, spotted deer, pythons. South-west green corridor.",
    area: "360 ha"
  },

  // 6. Mahavir Harina Vanasthali National Park (SE corridor)
  {
    id: "vanasthali-np",
    type: 'forest',
    title: "Mahavir Harina Vanasthali NP",
    coords: [17.340, 78.586] as [number, number],
    boundary: [
      [17.360, 78.562], [17.372, 78.575], [17.372, 78.598], [17.360, 78.612],
      [17.344, 78.618], [17.328, 78.612], [17.318, 78.598], [17.320, 78.578],
      [17.333, 78.562], [17.348, 78.558]
    ] as [number, number][],
    description: "14 sq km protected deer park and dry-deciduous forest. SE Hyderabad. Blackbuck, chital, thousands of migratory birds.",
    area: "1,400 ha"
  },

  // ── RESERVE FORESTS (SOUTH & WEST) ──────────────────────────────────── 

  // 7. Ananthagiri Hills Reserved Forest Complex (Vikarabad ? 6,124 ha)
  // Largest forest block in Hyderabad metro - origin of Musi river
  {
    id: "ananthagiri-rf",
    type: 'forest',
    title: "Ananthagiri Hills RF",
    coords: [17.312, 77.855] as [number, number],
    boundary: [
      [17.400, 77.760], [17.420, 77.800], [17.425, 77.850], [17.415, 77.900],
      [17.395, 77.940], [17.365, 77.965], [17.335, 77.975], [17.305, 77.970],
      [17.278, 77.950], [17.260, 77.915], [17.252, 77.875], [17.260, 77.835],
      [17.280, 77.800], [17.310, 77.770], [17.345, 77.755], [17.375, 77.752]
    ] as [number, number][],
    description: "6,124 ha. Largest RF near Hyderabad. Birthplace of Musi river. Moist-deciduous forest. Elevation 700-1168m. Vikarabad DFO.",
    area: "6,124 ha"
  },

  // 8. Chevella Reserved Forest (SW, near RRR Chevella interchange)
  {
    id: "chevella-rf",
    type: 'forest',
    title: "Chevella Reserved Forest",
    coords: [17.305, 78.140] as [number, number],
    boundary: [
      [17.330, 78.110], [17.345, 78.130], [17.348, 78.160], [17.335, 78.182],
      [17.315, 78.190], [17.294, 78.180], [17.282, 78.160], [17.285, 78.130],
      [17.300, 78.112]
    ] as [number, number][],
    description: "RF abutting RRR's Chevella interchange (SH-4). Protected scrub-thorn forest. Wildlife corridor to Ananthagiri.",
    area: "810 ha"
  },

  // 9. Shankarpally-Moinabad RF Block
  {
    id: "shankarpally-rf",
    type: 'forest',
    title: "Shankarpally RF Block",
    coords: [17.450, 78.134] as [number, number],
    boundary: [
      [17.465, 78.112], [17.478, 78.128], [17.480, 78.150], [17.468, 78.168],
      [17.448, 78.175], [17.430, 78.165], [17.422, 78.145], [17.430, 78.120],
      [17.448, 78.108]
    ] as [number, number][],
    description: "Protected forest block connecting Osman Sagar catchment to Ananthagiri corridor. Shankarpally range.",
    area: "520 ha"
  },

  // 10. Gachibowli-Narsingi Green Belt (SW ORR buffer)
  {
    id: "narsingi-greenzone",
    type: 'forest',
    title: "Narsingi Forest Buffer",
    coords: [17.412, 78.308] as [number, number],
    boundary: [
      [17.425, 78.290], [17.435, 78.305], [17.432, 78.322], [17.420, 78.332],
      [17.405, 78.330], [17.395, 78.315], [17.398, 78.295], [17.412, 78.285]
    ] as [number, number][],
    description: "Government-notified green buffer zone. Protects ORR-Gachibowli corridor from encroachment.",
    area: "290 ha"
  },

  // 11. Dalmia RF - Maheswaram/Kandukur (South RRR corridor)
  {
    id: "dalmia-rf",
    type: 'forest',
    title: "Dalmia Reserved Forest",
    coords: [17.198, 78.520] as [number, number],
    boundary: [
      [17.215, 78.498], [17.228, 78.512], [17.228, 78.535], [17.215, 78.548],
      [17.198, 78.552], [17.182, 78.540], [17.178, 78.518], [17.190, 78.500]
    ] as [number, number][],
    description: "Reserve forest near Kandukur-Tukkuguda. Green buffer in the RRR southern corridor. Rangareddy district.",
    area: "385 ha"
  },

  // 12. Kothiyal-Kappa Pahad RF (NE - Siddipet/Yadadri corridor)
  {
    id: "kothiyal-rf",
    type: 'forest',
    title: "Kothiyal-Kappa Pahad RF",
    coords: [17.818, 78.625] as [number, number],
    boundary: [
      [17.840, 78.598], [17.858, 78.618], [17.860, 78.648], [17.845, 78.668],
      [17.822, 78.675], [17.800, 78.662], [17.792, 78.638], [17.800, 78.610],
      [17.820, 78.595]
    ] as [number, number][],
    description: "Reserved Forest block in Siddipet district. Identified in RRR northern corridor forest clearance notifications.",
    area: "610 ha"
  },

  // 13. Yadadri Green Hills (Eastern RRR - pilgrim forest buffer)
  {
    id: "yadadri-hills",
    type: 'forest',
    title: "Yadadri-Bhuvanagiri Forest",
    coords: [17.600, 78.952] as [number, number],
    boundary: [
      [17.625, 78.920], [17.645, 78.938], [17.648, 78.968], [17.632, 78.990],
      [17.608, 78.998], [17.585, 78.985], [17.572, 78.960], [17.580, 78.930],
      [17.600, 78.915]
    ] as [number, number][],
    description: "Forest hills around the sacred Yadadri temple town. Protected by temple trust and state forest dept. Eastern RRR green zone.",
    area: "750 ha"
  },

  // ── GOVERNMENT-DESIGNATED LAKES & WATER BODIES ────────────────────────

  // 14. Osman Sagar (Gandipet) - Protected reservoir + catchment forest
  {
    id: "osman-sagar",
    type: 'lake',
    title: "Osman Sagar (Gandipet)",
    coords: [17.373, 78.288] as [number, number],
    boundary: [
      [17.405, 78.262], [17.415, 78.280], [17.418, 78.305], [17.408, 78.322],
      [17.390, 78.332], [17.370, 78.328], [17.350, 78.315], [17.340, 78.295],
      [17.345, 78.272], [17.362, 78.258], [17.383, 78.252]
    ] as [number, number][],
    description: "Government-protected reservoir. Catchment forest of 16,000 ha. Drinking water source. Musi tributary system.",
    area: "3,048 ha (reservoir)"
  },

  // 15. Himayat Sagar - Protected reservoir
  {
    id: "himayat-sagar",
    type: 'lake',
    title: "Himayat Sagar",
    coords: [17.310, 78.312] as [number, number],
    boundary: [
      [17.342, 78.290], [17.352, 78.312], [17.348, 78.338], [17.330, 78.350],
      [17.310, 78.352], [17.290, 78.338], [17.280, 78.315], [17.288, 78.292],
      [17.308, 78.280], [17.328, 78.278]
    ] as [number, number][],
    description: "Twin reservoir to Osman Sagar. Protected catchment. Jointly conserved by HMWSSB & Forest Dept.",
    area: "2,748 ha (reservoir)"
  },

  // 16. Hussain Sagar - Central government lake
  {
    id: "hussain-sagar",
    type: 'lake',
    title: "Hussain Sagar",
    coords: [17.4239, 78.4738] as [number, number],
    boundary: [
      [17.440, 78.462], [17.448, 78.472], [17.445, 78.488], [17.432, 78.496],
      [17.416, 78.492], [17.408, 78.478], [17.412, 78.464], [17.424, 78.458]
    ] as [number, number][],
    description: "16 sq km government-notified lake. Hyderabad-Secunderabad connector. Protected under AP Urban Areas Act.",
    area: "1,600 ha"
  },

  // 17. Ameenpur Lake - India's first biodiversity heritage lake
  {
    id: "ameenpur-lake",
    type: 'lake',
    title: "Ameenpur Lake (BHS)",
    coords: [17.520, 78.330] as [number, number],
    boundary: [
      [17.532, 78.318], [17.540, 78.328], [17.540, 78.342], [17.530, 78.352],
      [17.516, 78.352], [17.506, 78.340], [17.506, 78.322], [17.516, 78.312]
    ] as [number, number][],
    description: "India's first biodiversity heritage site designated for a water body. Government notified. NW Hyderabad.",
    area: "142 ha"
  },

  // 18. Shamirpet Lake & Forest Reserve (NE ORR corridor)
  {
    id: "shamirpet-lake-rf",
    type: 'lake',
    title: "Shamirpet Lake & RF",
    coords: [17.600, 78.562] as [number, number],
    boundary: [
      [17.615, 78.545], [17.625, 78.558], [17.624, 78.578], [17.612, 78.590],
      [17.596, 78.590], [17.582, 78.578], [17.580, 78.558], [17.592, 78.545],
      [17.607, 78.540]
    ] as [number, number][],
    description: "Protected lake and adjoining reserve forest near ORR-Shamirpet. 102 ha biodiversity water body + forest buffer.",
    area: "240 ha"
  },
];

export const MACRO_REGIONS: { title: string; coords: LatLng }[] = [
  { title: "GACHIBOWLI", coords: [17.44, 78.36] as [number, number] },
  { title: "FINANCIAL DISTRICT", coords: [17.41, 78.34] as [number, number] },
  { title: "JUBILEE HILLS", coords: [17.43, 78.41] as [number, number] },
  { title: "BANJARA HILLS", coords: [17.41, 78.45] as [number, number] },
  { title: "TUKKUGUDA", coords: [17.22, 78.50] as [number, number] },
  { title: "SHAMSHABAD", coords: [17.25, 78.40] as [number, number] },
  { title: "KOKAPET", coords: [17.39, 78.33] as [number, number] }
];

export const MAP_LOCATIONS: MapLocation[] = [
  {
    id: "agartha",
    type: 'sanctuary',
    title: "MODCON Agartha",
    location: "Narsapur Forest Peripheral",
    coords: [17.74, 78.28] as [number, number],
    aqi: 12,
    noise: 18,
    forestRadius: 5000,
    boundary: [
      [17.76, 78.25], [17.78, 78.27], [17.77, 78.31], 
      [17.73, 78.32], [17.71, 78.29], [17.72, 78.26]
    ] as [number, number][],
    image: "/gallery/agartha/11.webp",
    description: "A forest-peripheral sanctuary nestled within the dense Narsapur reserve forest canopy."
  },
  {
    id: "syl",
    type: 'sanctuary',
    title: "SYL",
    location: "Tukkuguda (Future City)",
    coords: [17.24, 78.48] as [number, number],
    aqi: 22,
    noise: 24,
    forestRadius: 3000,
    boundary: [
      [17.26, 78.46], [17.27, 78.49], [17.25, 78.51], 
      [17.22, 78.50], [17.21, 78.47], [17.23, 78.45]
    ] as [number, number][],
    image: "/gallery/syl/1776279315359.webp",
    description: "Vertical villaments strategically positioned near the protected green belts of the Future City."
  },
  {
    id: "dates-county",
    type: 'sanctuary',
    title: "Dates County",
    location: "Kandukur · Srisailam Highway",
    coords: [17.118, 78.588] as [number, number],
    aqi: 18,
    noise: 22,
    forestRadius: 4500,
    boundary: [
      [17.135, 78.570], [17.145, 78.595], [17.130, 78.615],
      [17.100, 78.610], [17.090, 78.585], [17.105, 78.565]
    ] as [number, number][],
    image: "/gallery/dates-county/temple.jpg",
    description: "A 300+ acre eco-luxury villa-plot community adjacent to a 4,000-acre reserve forest on Hyderabad's Future City axis."
  },
  // ── HMDA 8-LANE OUTER RING ROAD (ORR) 23 OFFICIAL EXITS (Meter Precision) ──
  {
    id: "exit-1",
    type: 'exit',
    exitNumber: "Exit 1",
    title: "ORR Exit 1",
    location: "Kokapet / Financial District",
    coords: [17.4194, 78.3418],
    highway: "Financial District Arterial / Wipro Circle",
    corridor: "Western IT Corridor",
    gatewayTo: "Financial District, Nanakramguda SEZ, Waverock",
    aqi: 122,
  },
  {
    id: "exit-1a",
    type: 'exit',
    exitNumber: "Exit 1A",
    title: "ORR Exit 1A",
    location: "Neopolis Trumpet / Kokapet",
    coords: [17.4035, 78.3308],
    highway: "Neopolis Expressway / Golden Mile",
    corridor: "Kokapet Ultra-Luxury Commercial Hub",
    gatewayTo: "Neopolis SEZ, Kokapet Trumpet Interchange",
    aqi: 118,
  },
  {
    id: "exit-2",
    type: 'exit',
    exitNumber: "Exit 2",
    title: "ORR Exit 2",
    location: "Edulanagulapally / Tellapur / Kollur",
    coords: [17.4720, 78.2795],
    highway: "Kollur-Tellapur 100ft Road",
    corridor: "North-West Residential Belt",
    gatewayTo: "Kollur Techno-city, Tellapur, Shankarpally Road",
    aqi: 96,
  },
  {
    id: "exit-3",
    type: 'exit',
    exitNumber: "Exit 3",
    title: "ORR Exit 3",
    location: "Muttangi / Patancheru",
    coords: [17.5255, 78.2384],
    highway: "NH-65 (Hyderabad-Pune-Mumbai Expressway)",
    corridor: "North-West Industrial & Transit Hub",
    gatewayTo: "Patancheru Pharma / Sangareddy RRR Link",
    aqi: 156,
  },
  {
    id: "exit-4",
    type: 'exit',
    exitNumber: "Exit 4",
    title: "ORR Exit 4",
    location: "Sultanpur",
    coords: [17.5516, 78.3096],
    highway: "Sultanpur Arterial Road",
    corridor: "Medical Devices Park Belt",
    gatewayTo: "Sultanpur Tech Park, Ameenpur Lake sanctuary buffer",
    aqi: 112,
  },
  {
    id: "exit-4a",
    type: 'exit',
    exitNumber: "Exit 4A",
    title: "ORR Exit 4A",
    location: "Saregudem / IDA Bollaram",
    coords: [17.5645, 78.3320],
    highway: "Bollaram-Bachupally Radial",
    corridor: "Industrial Growth Corridor",
    gatewayTo: "IDA Bollaram, Miyapur link",
    aqi: 135,
  },
  {
    id: "exit-5",
    type: 'exit',
    exitNumber: "Exit 5",
    title: "ORR Exit 5",
    location: "Mallampet / Bowrampet / Dundigal",
    coords: [17.5615, 78.3685],
    highway: "SH-6 (Medak-Narsapur State Highway)",
    corridor: "Northern Ecological Canopy Corridor",
    gatewayTo: "Direct primary gateway to MODCON Agartha Sanctuary (Narsapur Forest)",
    aqi: 74,
  },
  {
    id: "exit-6",
    type: 'exit',
    exitNumber: "Exit 6",
    title: "ORR Exit 6",
    location: "Kandlakoya / Medchal",
    coords: [17.5925, 78.4831],
    highway: "NH-44 North (Hyderabad-Nagpur National Highway)",
    corridor: "North Gateway & Logistics Corridor",
    gatewayTo: "Kandlakoya Oxygen Park, Medchal, Kompally",
    aqi: 98,
  },
  {
    id: "exit-7",
    type: 'exit',
    exitNumber: "Exit 7",
    title: "ORR Exit 7",
    location: "Shamirpet / Genome Valley",
    coords: [17.5842, 78.5684],
    highway: "SH-1 Rajiv Rahadari (Karimnagar Highway)",
    corridor: "Biotech & Lake Conservation Corridor",
    gatewayTo: "Genome Valley, Shamirpet Lake, BITS Pilani",
    aqi: 68,
  },
  {
    id: "exit-8",
    type: 'exit',
    exitNumber: "Exit 8",
    title: "ORR Exit 8",
    location: "Keesara",
    coords: [17.5286, 78.6425],
    highway: "ECIL-Keesara Radial Highway",
    corridor: "North-East Heritage Axis",
    gatewayTo: "Keesaragutta Forest Reserve, ECIL",
    aqi: 72,
  },
  {
    id: "exit-8a",
    type: 'exit',
    exitNumber: "Exit 8A",
    title: "ORR Exit 8A",
    location: "Rampally / Cherlapally",
    coords: [17.4985, 78.6610],
    highway: "Cherlapally Radial Road",
    corridor: "Eastern Rail & Logistics Hub",
    gatewayTo: "Cherlapally Satellite Terminal, Nagaram",
    aqi: 89,
  },
  {
    id: "exit-9",
    type: 'exit',
    exitNumber: "Exit 9",
    title: "ORR Exit 9",
    location: "Ghatkesar",
    coords: [17.4582, 78.6812],
    highway: "NH-163 (Hyderabad-Warangal National Highway)",
    corridor: "East Industrial & AIIMS Corridor",
    gatewayTo: "AIIMS Bibinagar, Warangal Highway, Uppal",
    aqi: 84,
  },
  {
    id: "exit-10",
    type: 'exit',
    exitNumber: "Exit 10",
    title: "ORR Exit 10",
    location: "Taramatipet / Pasumamula",
    coords: [17.3888, 78.6635],
    highway: "Taramatipet Radial Road",
    corridor: "South-East Media & Leisure Belt",
    gatewayTo: "Ramoji Film City North, Pasumamula",
    aqi: 76,
  },
  {
    id: "exit-11",
    type: 'exit',
    exitNumber: "Exit 11",
    title: "ORR Exit 11",
    location: "Pedda Amberpet",
    coords: [17.3204, 78.6472],
    highway: "NH-65 East (Hyderabad-Vijayawada Highway)",
    corridor: "East Interstate Commercial Arterial",
    gatewayTo: "Ramoji Film City, Hayathnagar, Vijayawada Express",
    aqi: 92,
  },
  {
    id: "exit-12",
    type: 'exit',
    exitNumber: "Exit 12",
    title: "ORR Exit 12",
    location: "Bongulur / Mangalpally",
    coords: [17.2685, 78.6015],
    highway: "SH-19 (Nagarjuna Sagar Highway)",
    corridor: "South-East Logistics & Aerospace Corridor",
    gatewayTo: "Ibrahimpatnam, Mangalpally Logistics Hub, TCS Adibatla",
    aqi: 62,
  },
  {
    id: "exit-13",
    type: 'exit',
    exitNumber: "Exit 13",
    title: "ORR Exit 13",
    location: "Raviryal / Wonderla",
    coords: [17.2346, 78.5478],
    highway: "Hardware Park Radial Road",
    corridor: "Hardware & Aviation SEZ",
    gatewayTo: "Wonderla, E-City, Fab City North",
    aqi: 54,
  },
  {
    id: "exit-14",
    type: 'exit',
    exitNumber: "Exit 14",
    title: "ORR Exit 14",
    location: "Tukkuguda / FAB City",
    coords: [17.2285, 78.4908],
    highway: "NH-765 (Srisailam Highway) / Future City Gateway",
    corridor: "Telangana Future City & Pharma City Axis",
    gatewayTo: "Direct primary gateway to SYL and Dates County sanctuaries",
    aqi: 48,
  },
  {
    id: "exit-15",
    type: 'exit',
    exitNumber: "Exit 15",
    title: "ORR Exit 15",
    location: "Pedda Golconda",
    coords: [17.2295, 78.4420],
    highway: "Cargo Road / Airport South Bypass",
    corridor: "Air Cargo & Logistics Hub",
    gatewayTo: "RGIA Cargo Village, Shamshabad South",
    aqi: 82,
  },
  {
    id: "exit-16",
    type: 'exit',
    exitNumber: "Exit 16",
    title: "ORR Exit 16",
    location: "Shamshabad / RGIA Airport",
    coords: [17.2442, 78.4116],
    highway: "NH-44 South (Hyderabad-Bangalore Highway)",
    corridor: "International Airport Gateway",
    gatewayTo: "Rajiv Gandhi International Airport (RGIA), Bangalore Highway",
    aqi: 110,
  },
  {
    id: "exit-17",
    type: 'exit',
    exitNumber: "Exit 17",
    title: "ORR Exit 17",
    location: "Rajendranagar / Budvel",
    coords: [17.2785, 78.3740],
    highway: "Budvel IT Expressway / PVNR Connector",
    corridor: "Budvel Hi-Tech Mega Cluster",
    gatewayTo: "Budvel IT Cluster, PJTSAU University, PVNR Elevated Expressway",
    aqi: 118,
  },
  {
    id: "exit-18",
    type: 'exit',
    exitNumber: "Exit 18",
    title: "ORR Exit 18",
    location: "TSPA (APPA) Junction / Himayathsagar",
    coords: [17.3542, 78.3618],
    highway: "Vikarabad-Chilkur Highway",
    corridor: "South-West Reservoir Catchment",
    gatewayTo: "Telangana State Police Academy (TSPA), Chilkur Balaji Temple, Mrugavani NP",
    aqi: 65,
  },
  {
    id: "exit-18a",
    type: 'exit',
    exitNumber: "Exit 18A",
    title: "ORR Exit 18A",
    location: "Narsingi Interchange",
    coords: [17.3912, 78.3450],
    highway: "Narsingi-Puppalaguda Main Road",
    corridor: "Osman Sagar & Financial District Fringe",
    gatewayTo: "Gandipet, Osman Sagar Lake, Puppalaguda",
    aqi: 78,
  },
  {
    id: "exit-19",
    type: 'exit',
    exitNumber: "Exit 19",
    title: "ORR Exit 19",
    location: "Gachibowli / Financial District Link",
    coords: [17.4365, 78.3512],
    highway: "Old Bombay Highway / Gachibowli Flyover",
    corridor: "Core Financial District & HITEC Link",
    gatewayTo: "Gachibowli Stadium, HITEC City, IIIT Hyderabad",
    aqi: 142,
  },

  // ── NHAI 340-KM REGIONAL RING ROAD (RRR) 19 SURGICAL INTERCHANGES ──────────
  // Northern Arc (158.6 km)
  {
    id: "rrr-n1",
    type: 'rrr-exit',
    exitNumber: "RRR-N1",
    title: "RRR N1 · Girmapur / Sangareddy",
    location: "Sangareddy West Junction",
    coords: [17.5852, 78.0782],
    highway: "NH-65 (Pune-Mumbai Highway Junction)",
    corridor: "RRR Western Northern Anchor",
    gatewayTo: "Sangareddy District HQ, IIT Hyderabad Kandi",
    status: "NHAI Approved / Phase 1 Land Acquisition",
    aqi: 36,
  },
  {
    id: "rrr-n2",
    type: 'rrr-exit',
    exitNumber: "RRR-N2",
    title: "RRR N2 · Fasalwadi / Shivampet",
    location: "Shivampet Range",
    coords: [17.6520, 78.1480],
    highway: "NH-161 (Sangareddy-Nanded Highway)",
    corridor: "North-West Interstate Freight Corridor",
    status: "NHAI Approved / Alignment Notified",
    aqi: 28,
  },
  {
    id: "rrr-n3",
    type: 'rrr-exit',
    exitNumber: "RRR-N3",
    title: "RRR N3 · Narsapur Interchange",
    location: "Narsapur Reserve Forest Belt",
    coords: [17.7385, 78.2745],
    highway: "NH-765D (Hyderabad-Medak National Highway)",
    corridor: "Prime Forest Ecological Corridor",
    gatewayTo: "Immediate direct access point for MODCON Agartha Sanctuary (4 mins away)",
    status: "NHAI Priority Section / Direct Sanctuary Access",
    aqi: 14,
  },
  {
    id: "rrr-n4",
    type: 'rrr-exit',
    exitNumber: "RRR-N4",
    title: "RRR N4 · Masaipet / Toopran",
    location: "Toopran Junction",
    coords: [17.8542, 78.4725],
    highway: "NH-44 North (Hyderabad-Nagpur Highway Junction)",
    corridor: "North Inter-state Transit Hub",
    gatewayTo: "Toopran Industrial Hub, Medak Forest Range",
    status: "NHAI Approved / Tenders Initiated",
    aqi: 24,
  },
  {
    id: "rrr-n5",
    type: 'rrr-exit',
    exitNumber: "RRR-N5",
    title: "RRR N5 · Gajwel / Pragnapur",
    location: "Gajwel Hub",
    coords: [17.8485, 78.6812],
    highway: "SH-1 Rajiv Rahadari (Karimnagar Highway)",
    corridor: "North-East Agro-Tech & Horticulture Belt",
    gatewayTo: "Gajwel Education Hub, Kondapochamma Canal",
    status: "NHAI Approved / Land Acquisition Advanced",
    aqi: 26,
  },
  {
    id: "rrr-n6",
    type: 'rrr-exit',
    exitNumber: "RRR-N6",
    title: "RRR N6 · Jagdevpur / Markook",
    location: "Markook / Kondapochamma Catchment",
    coords: [17.7842, 78.8125],
    highway: "Siddipet-Yadadri Arterial Road",
    corridor: "Waterfront & Eco-Tourism Belt",
    gatewayTo: "Kondapochamma Sagar Reservoir",
    status: "NHAI Approved Alignment",
    aqi: 22,
  },
  {
    id: "rrr-n7",
    type: 'rrr-exit',
    exitNumber: "RRR-N7",
    title: "RRR N7 · Turkapally / Yadagirigutta",
    location: "Yadadri Temple Corridor",
    coords: [17.6125, 78.9642],
    highway: "Yadadri Temple Spiritual Expressway",
    corridor: "Pilgrimage Green Buffer Zone",
    gatewayTo: "Yadadri Temple City, Alair Corridor",
    status: "NHAI Approved / Heritage Buffer",
    aqi: 25,
  },
  {
    id: "rrr-n8",
    type: 'rrr-exit',
    exitNumber: "RRR-N8",
    title: "RRR N8 · Bhongir Junction",
    location: "Bhongir Fort Belt",
    coords: [17.5242, 78.8925],
    highway: "NH-163 (Hyderabad-Warangal Highway Junction)",
    corridor: "Eastern Industrial & Logistics Axis",
    gatewayTo: "Bhongir Fort, AIIMS Bibinagar East",
    status: "NHAI Approved / Phase 1 Land Survey",
    aqi: 34,
  },
  {
    id: "rrr-n9",
    type: 'rrr-exit',
    exitNumber: "RRR-N9",
    title: "RRR N9 · Choutuppal / Bangarigadda",
    location: "Choutuppal North",
    coords: [17.2512, 78.9024],
    highway: "NH-65 East (Hyderabad-Vijayawada Highway)",
    corridor: "Northern & Southern Arcs Confluence",
    gatewayTo: "Choutuppal Industrial Cluster, Vijayawada Express",
    status: "NHAI Priority Interchange / Junction of N & S Arcs",
    aqi: 38,
  },
  // Southern Arc (182.0 km)
  {
    id: "rrr-s10",
    type: 'rrr-exit',
    exitNumber: "RRR-S10",
    title: "RRR S10 · Malkapur / Narayanpur",
    location: "Narayanpur Corridor",
    coords: [17.1524, 78.8642],
    highway: "Choutuppal-Narayanpur Link",
    corridor: "South-East Scenic Hills & Granites",
    gatewayTo: "Narayanpur, Rachakonda Hills",
    status: "NHAI Southern Arc / Alignment Notified",
    aqi: 25,
  },
  {
    id: "rrr-s11",
    type: 'rrr-exit',
    exitNumber: "RRR-S11",
    title: "RRR S11 · Ibrahimpatnam Hub",
    location: "Ibrahimpatnam Junction",
    coords: [17.1825, 78.6542],
    highway: "NH-765 / SH-19 (Nagarjuna Sagar Road)",
    corridor: "Defence & Aerospace Outer Ring",
    gatewayTo: "DRDO / BDL Facilities, Ibrahimpatnam Lake",
    status: "NHAI Southern Arc / DPR Finalized",
    aqi: 28,
  },
  {
    id: "rrr-s12",
    type: 'rrr-exit',
    exitNumber: "RRR-S12",
    title: "RRR S12 · Yacharam / Pharma City North",
    location: "Yacharam Outer Belt",
    coords: [17.0852, 78.6124],
    highway: "Pharma City Radial Expressway",
    corridor: "Pharma City Buffer & Innovation Zone",
    gatewayTo: "Green Pharma City buffer zone",
    status: "NHAI Southern Arc / Alignment Approved",
    aqi: 32,
  },
  {
    id: "rrr-s13",
    type: 'rrr-exit',
    exitNumber: "RRR-S13",
    title: "RRR S13 · Kandukur / Future City",
    location: "Kandukur Reserve Forest Axis",
    coords: [17.0985, 78.5284],
    highway: "Future City AI & Green Innovation Axis",
    corridor: "Telangana Future City Core Zone",
    gatewayTo: "Direct primary access point for Dates County Sanctuary (adjacent) & SYL",
    status: "NHAI Southern Arc / High-Priority Future City Node",
    aqi: 18,
  },
  {
    id: "rrr-s14",
    type: 'rrr-exit',
    exitNumber: "RRR-S14",
    title: "RRR S14 · Kadthal / Amangal",
    location: "Srisailam Highway Crossing",
    coords: [17.0245, 78.4852],
    highway: "NH-765 (Hyderabad-Srisailam National Highway)",
    corridor: "Southern Eco-Tourism Corridor",
    gatewayTo: "Maisigandi Temple, Amangal, Srisailam Forest",
    status: "NHAI Southern Arc / DPR Stage",
    aqi: 20,
  },
  {
    id: "rrr-s15",
    type: 'rrr-exit',
    exitNumber: "RRR-S15",
    title: "RRR S15 · Shadnagar / Farooqnagar",
    location: "Shadnagar South Junction",
    coords: [17.0725, 78.2045],
    highway: "NH-44 South (Hyderabad-Bangalore Highway)",
    corridor: "Southern Industrial & Warehousing Axis",
    gatewayTo: "NRSC Shadnagar, Bangalore Industrial Corridor",
    status: "NHAI Southern Arc / Major Logistics Interchange",
    aqi: 35,
  },
  {
    id: "rrr-s16",
    type: 'rrr-exit',
    exitNumber: "RRR-S16",
    title: "RRR S16 · Shabad Interchange",
    location: "Shabad Belt",
    coords: [17.1425, 78.1482],
    highway: "Shabad-Pargi Arterial Road",
    corridor: "Electronics & EV Manufacturing Belt",
    gatewayTo: "Shabad Industrial Parks",
    status: "NHAI Southern Arc / Alignment Notified",
    aqi: 26,
  },
  {
    id: "rrr-s17",
    type: 'rrr-exit',
    exitNumber: "RRR-S17",
    title: "RRR S17 · Chevella / Pudur",
    location: "Chevella Reserve Belt",
    coords: [17.3052, 78.1342],
    highway: "SH-4 (Hyderabad-Bijapur Highway)",
    corridor: "Ananthagiri Forest Proximity Zone",
    gatewayTo: "Chevella Reserve Forest, Vikarabad eco-belt",
    status: "NHAI Southern Arc / DPR Approved",
    aqi: 22,
  },
  {
    id: "rrr-s18",
    type: 'rrr-exit',
    exitNumber: "RRR-S18",
    title: "RRR S18 · Shankarpally / Manneguda",
    location: "Shankarpally West",
    coords: [17.4525, 78.1285],
    highway: "Vikarabad-Shankarpally Expressway",
    corridor: "Green Agri-Estate & Living Zone",
    gatewayTo: "Shankarpally Rail Hub, BDLP corridor",
    status: "NHAI Southern Arc / Alignment Fixed",
    aqi: 24,
  },
  {
    id: "rrr-s19",
    type: 'rrr-exit',
    exitNumber: "RRR-S19",
    title: "RRR S19 · Sangareddy South / Kandi",
    location: "Kandi Southern Loop",
    coords: [17.5580, 78.0720],
    highway: "Sangareddy Southern Connector (Completing 340km RRR Loop)",
    corridor: "IIT Hyderabad & Tech Belt",
    gatewayTo: "IIT Hyderabad, Sangareddy Collectorate, Loops to RRR-N1",
    status: "NHAI Southern Arc / Closing Loop Interchange",
    aqi: 32,
  },
];

export const KEY_ZONES: KeyZone[] = [
  { id: 'kz-sanath-nagar',  name: 'Sanath Nagar Industrial',    aqi: 198, noise: 82, hazard: 'critical', coords: [17.480, 78.442] as [number,number], tag: 'Heavy Industry' },
  { id: 'kz-charminar',     name: 'Charminar Old City',          aqi: 175, noise: 88, hazard: 'critical', coords: [17.360, 78.480] as [number,number], tag: 'Dense Traffic + Industry' },
  { id: 'kz-hitec',         name: 'HITEC City Tech Corridor',    aqi: 148, noise: 74, hazard: 'high',     coords: [17.440, 78.382] as [number,number], tag: 'Construction + Traffic' },
  { id: 'kz-secunderabad',  name: 'Secunderabad Rail Hub',        aqi: 162, noise: 86, hazard: 'high',     coords: [17.442, 78.498] as [number,number], tag: 'Rail Emissions' },
  { id: 'kz-airport',       name: 'Shamshabad Airport Zone',     aqi: 134, noise: 92, hazard: 'high',     coords: [17.240, 78.430] as [number,number], tag: 'Jet Noise + Fumes' },
  { id: 'kz-kukatpally',    name: 'Kukatpally Industrial',       aqi: 155, noise: 79, hazard: 'high',     coords: [17.485, 78.408] as [number,number], tag: 'Mixed Industry' },
  { id: 'kz-patancheru',    name: 'Patancheru Pharma Cluster',   aqi: 210, noise: 68, hazard: 'critical', coords: [17.530, 78.265] as [number,number], tag: 'Chemical / Pharma' },
  { id: 'kz-jeedimetla',    name: 'Jeedimetla Industrial Estate', aqi: 188, noise: 72, hazard: 'critical', coords: [17.516, 78.423] as [number,number], tag: 'Heavy Industry' },
  { id: 'kz-nacharam',      name: 'Nacharam Industrial Area',    aqi: 145, noise: 76, hazard: 'high',     coords: [17.412, 78.548] as [number,number], tag: 'Mixed Industry' },
  { id: 'kz-uppal',         name: 'Uppal Industrial Zone',       aqi: 138, noise: 73, hazard: 'high',     coords: [17.398, 78.558] as [number,number], tag: 'Industrial Estates' },
  { id: 'kz-lb-nagar',      name: 'LB Nagar Traffic Corridor',   aqi: 122, noise: 84, hazard: 'moderate', coords: [17.348, 78.558] as [number,number], tag: 'Dense Traffic' },
  { id: 'kz-mehdipatnam',   name: 'Mehdipatnam Junction',        aqi: 118, noise: 80, hazard: 'moderate', coords: [17.392, 78.434] as [number,number], tag: 'Traffic Bottleneck' },
];
