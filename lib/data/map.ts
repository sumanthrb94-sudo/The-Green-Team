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

// Hyderabad Outer Ring Road (ORR) — refined 158 km trace aligned to satellite road
export const ORR_PATH: LatLng[] = [
  [17.4218, 78.3412], // E1  Gachibowli SW
  [17.4150, 78.3250], // Narsingi W
  [17.4100, 78.3120], // Narsingi
  [17.4200, 78.2980], // Telecom Nagar
  [17.4380, 78.2860], // Patancheru approach
  [17.4580, 78.2800], // Patancheru S
  [17.4800, 78.2780], // E3  Patancheru (NH-65 junction)
  [17.5020, 78.2810], // Patancheru N
  [17.5200, 78.2880], // Bowrampet
  [17.5380, 78.2980], // Dundigal S
  [17.5520, 78.3100], // E4  Sultanpur
  [17.5640, 78.3280], // Dulapally junction
  [17.5720, 78.3480], // Kompally S
  [17.5790, 78.3700], // Kompally
  [17.5850, 78.3930], // Bollaram
  [17.5880, 78.4160], // E6  Medchal S (NH-44 N junction)
  [17.5880, 78.4420], // E6  Medchal
  [17.5840, 78.4660], // Medchal E
  [17.5770, 78.4890], // E7  Shamirpet
  [17.5660, 78.5150], // Keesara approach
  [17.5520, 78.5420], // E8  Keesara
  [17.5340, 78.5650], // Keesara E
  [17.5140, 78.5860], // Ghatkesar W
  [17.4960, 78.6040], // E9  Ghatkesar (NH-163 junction)
  [17.4760, 78.6220], // Ghatkesar E
  [17.4560, 78.6370], // Uppal approach
  [17.4350, 78.6490], // Uppal E
  [17.4130, 78.6580], // LB Nagar E N
  [17.3910, 78.6640], // E10 Taramatipet
  [17.3710, 78.6640], // Taramatipet S
  [17.3510, 78.6610], // Hayathnagar
  [17.3300, 78.6520], // E11 Pedda Amberpet
  [17.3090, 78.6370], // Pedda Amberpet S
  [17.2880, 78.6170], // Bongulur N
  [17.2690, 78.5960], // E12 Bongulur
  [17.2530, 78.5760], // Bongulur S
  [17.2390, 78.5560], // E13 Raviryal
  [17.2290, 78.5360], // Raviryal S
  [17.2240, 78.5130], // Tukkuguda N
  [17.2200, 78.4880], // E14 Tukkuguda
  [17.2200, 78.4630], // Tukkuguda W
  [17.2230, 78.4390], // Shamshabad N
  [17.2250, 78.4180], // E15 Shamshabad (NH-44 airport junction)
  [17.2310, 78.3980], // Shamshabad W
  [17.2430, 78.3810], // Rajendranagar S
  [17.2590, 78.3700], // E17 Rajendranagar
  [17.2780, 78.3630], // Rajendranagar N
  [17.2970, 78.3600], // Moinabad
  [17.3170, 78.3600], // Moinabad N
  [17.3360, 78.3610], // Shankarpally S
  [17.3550, 78.3620], // Shankarpally
  [17.3720, 78.3570], // Osman Sagar corridor
  [17.3870, 78.3470], // Gandipet
  [17.3970, 78.3380], // E18 Kokapet S
  [17.4040, 78.3300], // Kokapet
  [17.4130, 78.3320], // Kokapet N
  [17.4218, 78.3412], // Close at Gachibowli
];

// Hyderabad Regional Ring Road (RRR) — GPS-accurate outer trace
export const RRR_PATH: LatLng[] = [
  // Starting from north-west, going clockwise
  [17.5800, 78.0500], // Sangareddy west
  [17.6050, 78.0800], // Sangareddy north-west
  [17.6280, 78.1080], // Sangareddy junction
  [17.6500, 78.1350], // Sangareddy east
  [17.6730, 78.1600], // Patancheru north
  [17.6940, 78.1850], // Sadashivpet junction
  [17.7120, 78.2120], // Toopran corridor west
  [17.7320, 78.2430], // Toopran approach
  [17.7520, 78.2770], // Toopran west
  [17.7720, 78.3160], // Narsapur area
  [17.7910, 78.3580], // Toopran junction
  [17.8060, 78.4050], // Gajwel approach
  [17.8160, 78.4550], // Gajwel west
  [17.8210, 78.5060], // Gajwel
  [17.8200, 78.5580], // Gajwel east
  [17.8130, 78.6080], // Bibinagar corridor
  [17.8000, 78.6540], // Bibinagar
  [17.7820, 78.6960], // Bhongir approach
  [17.7580, 78.7360], // Bhongir west
  [17.7290, 78.7680], // Bhongir
  [17.6960, 78.7920], // Bhongir east
  [17.6600, 78.8100], // Choutuppal corridor
  [17.6220, 78.8200], // Choutuppal north
  [17.5820, 78.8240], // Choutuppal
  [17.5420, 78.8220], // Choutuppal south
  [17.5020, 78.8160], // Yadagirigutta approach
  [17.4620, 78.8060], // Ibrahimpatnam north
  [17.4200, 78.7900], // Ibrahimpatnam
  [17.3800, 78.7680], // Ibrahimpatnam south
  [17.3420, 78.7400], // Narketpally corridor
  [17.3080, 78.7080], // Choutuppal west approach
  [17.2780, 78.6720], // Sagar Highway south junction
  [17.2520, 78.6340], // Bongulur junction
  [17.2300, 78.5920], // Kandukur approach
  [17.2130, 78.5480], // Kandukur
  [17.2010, 78.5020], // Shadnagar approach
  [17.1940, 78.4540], // Shadnagar area
  [17.1940, 78.4040], // Shamshabad outer
  [17.2000, 78.3560], // Rajendranagar outer
  [17.2130, 78.3120], // Moinabad outer
  [17.2330, 78.2720], // Chevella approach
  [17.2600, 78.2360], // Chevella
  [17.2920, 78.2060], // Chevella north
  [17.3280, 78.1820], // Vikarabad approach
  [17.3680, 78.1660], // Vikarabad corridor
  [17.4080, 78.1580], // Shankarpally outer
  [17.4480, 78.1580], // Dundigal south approach
  [17.4880, 78.1620], // Patancheru outer south
  [17.5280, 78.0890], // Sangareddy south approach
  [17.5560, 78.0620], // Sangareddy south
  [17.5800, 78.0500], // Close at Sangareddy west
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
  { id: "exit-1",  type: 'exit', title: "ORR Exit 1",  location: "Gachibowli",      coords: [17.4218, 78.3412] as [number, number], aqi: 142 },
  { id: "exit-3",  type: 'exit', title: "ORR Exit 3",  location: "Patancheru",       coords: [17.4880, 78.3120] as [number, number], aqi: 156 },
  { id: "exit-4",  type: 'exit', title: "ORR Exit 4",  location: "Sultanpur",        coords: [17.5380, 78.3090] as [number, number], aqi: 128 },
  { id: "exit-6",  type: 'exit', title: "ORR Exit 6",  location: "Medchal",          coords: [17.5860, 78.4410] as [number, number], aqi: 115 },
  { id: "exit-7",  type: 'exit', title: "ORR Exit 7",  location: "Shamirpet",        coords: [17.5760, 78.4870] as [number, number], aqi: 98  },
  { id: "exit-8",  type: 'exit', title: "ORR Exit 8",  location: "Keesara",          coords: [17.5380, 78.5640] as [number, number], aqi: 85  },
  { id: "exit-9",  type: 'exit', title: "ORR Exit 9",  location: "Ghatkesar",        coords: [17.5020, 78.6020] as [number, number], aqi: 110 },
  { id: "exit-10", type: 'exit', title: "ORR Exit 10", location: "Taramatipet",      coords: [17.3900, 78.6730] as [number, number], aqi: 95  },
  { id: "exit-11", type: 'exit', title: "ORR Exit 11", location: "Pedda Amberpet",   coords: [17.3300, 78.6570] as [number, number], aqi: 105 },
  { id: "exit-12", type: 'exit', title: "ORR Exit 12", location: "Bongulur",         coords: [17.2720, 78.6060] as [number, number], aqi: 88  },
  { id: "exit-13", type: 'exit', title: "ORR Exit 13", location: "Raviryal",         coords: [17.2330, 78.5480] as [number, number], aqi: 72  },
  { id: "exit-14", type: 'exit', title: "ORR Exit 14", location: "Tukkuguda",        coords: [17.2240, 78.5050] as [number, number], aqi: 65  },
  { id: "exit-15", type: 'exit', title: "ORR Exit 15", location: "Shamshabad",       coords: [17.2290, 78.4350] as [number, number], aqi: 120 },
  { id: "exit-17", type: 'exit', title: "ORR Exit 17", location: "Rajendranagar",    coords: [17.2580, 78.3810] as [number, number], aqi: 135 },
  { id: "exit-18", type: 'exit', title: "ORR Exit 18", location: "Kokapet",          coords: [17.4000, 78.3390] as [number, number], aqi: 148 },
  { id: "rrr-exit-1", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Sangareddy",           coords: [17.6280, 78.1080] as [number, number], aqi: 45 },
  { id: "rrr-exit-2", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Toopran Junction",      coords: [17.7910, 78.3580] as [number, number], aqi: 38 },
  { id: "rrr-exit-3", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Gajwel Hub",            coords: [17.8210, 78.5060] as [number, number], aqi: 32 },
  { id: "rrr-exit-4", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Bhongir Junction",      coords: [17.7290, 78.7680] as [number, number], aqi: 42 },
  { id: "rrr-exit-5", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Choutuppal Hub",        coords: [17.5820, 78.8240] as [number, number], aqi: 48 },
  { id: "rrr-exit-6", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Ibrahimpatnam Junction", coords: [17.4200, 78.7900] as [number, number], aqi: 35 },
  { id: "rrr-exit-7", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Chevella Hub",          coords: [17.2600, 78.2360] as [number, number], aqi: 28 }
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
