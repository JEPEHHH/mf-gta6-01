// Solara Bay configuration: world geometry, districts, vehicles, weapons, lighting, and PRNG.

export const WORLD = {
  width: 4800,
  height: 3600,
  roadWidth: 112,
  sidewalkWidth: 26,
  beachStartX: 3920,
  oceanStartX: 4230,
  harborWaterY: 3120,
  fixedStep: 1 / 60,
};

export const DISTRICTS = [
  {
    id: 'coral_strip',
    name: 'CORAL STRIP',
    subtitle: 'Art-Deco Beachfront & Nightlife',
    x: 2880,
    y: 0,
    w: 1920,
    h: 2400,
    accent: '#ff5e7e',
  },
  {
    id: 'downtown',
    name: 'SOLARA DOWNTOWN',
    subtitle: 'Financial Skyline & Police HQ',
    x: 1440,
    y: 0,
    w: 1440,
    h: 2400,
    accent: '#36e2ec',
  },
  {
    id: 'old_palms',
    name: 'OLD PALMS',
    subtitle: 'Midtown Strips & Vance Customs',
    x: 0,
    y: 0,
    w: 1440,
    h: 2400,
    accent: '#4be89a',
  },
  {
    id: 'harbor',
    name: 'HARBOR DOCKS',
    subtitle: 'Industrial Port & Smuggler Piers',
    x: 0,
    y: 2400,
    w: 4800,
    h: 1200,
    accent: '#ffb347',
  },
];

export const PLAYER_CONFIG = {
  radius: 13,
  walkSpeed: 190,
  sprintSpeed: 290,
  dodgeSpeed: 420,
  dodgeDuration: 0.24,
  maxHealth: 100,
  maxArmor: 100,
  enterVehicleRadius: 72,
};

export const WEAPONS = [
  {
    id: 'pistol',
    name: '9mm Coastal Pistol',
    slot: 1,
    damage: 28,
    fireRate: 0.24,
    speed: 980,
    spread: 0.035,
    pellets: 1,
    magSize: 15,
    reserveMax: 120,
    reloadTime: 1.0,
    range: 520,
    color: '#ffe082',
    auto: false,
  },
  {
    id: 'smg',
    name: 'Viper Micro-SMG',
    slot: 2,
    damage: 17,
    fireRate: 0.085,
    speed: 1040,
    spread: 0.085,
    pellets: 1,
    magSize: 32,
    reserveMax: 240,
    reloadTime: 1.25,
    range: 460,
    color: '#ff9a52',
    auto: true,
  },
  {
    id: 'shotgun',
    name: 'Harbor Pump 12G',
    slot: 3,
    damage: 20,
    fireRate: 0.68,
    speed: 880,
    spread: 0.22,
    pellets: 6,
    magSize: 8,
    reserveMax: 48,
    reloadTime: 1.5,
    range: 310,
    color: '#ff647f',
    auto: false,
  },
  {
    id: 'carbine',
    name: 'Solara Tactical Carbine',
    slot: 4,
    damage: 34,
    fireRate: 0.13,
    speed: 1220,
    spread: 0.03,
    pellets: 1,
    magSize: 30,
    reserveMax: 180,
    reloadTime: 1.4,
    range: 660,
    color: '#5cf2ff',
    auto: true,
  },
];

export const VEHICLE_TYPES = {
  sport: {
    id: 'sport',
    name: 'Solara GT',
    w: 58,
    h: 28,
    maxSpeed: 640,
    reverseSpeed: 190,
    accel: 460,
    brake: 640,
    turnRate: 3.1,
    grip: 7.4,
    driftGrip: 2.3,
    hp: 150,
    mass: 1.15,
    colors: ['#ff3d68', '#ff8c24', '#00d9e8', '#ffe14d', '#b84dff'],
  },
  muscle: {
    id: 'muscle',
    name: 'Tropic V8',
    w: 62,
    h: 30,
    maxSpeed: 575,
    reverseSpeed: 180,
    accel: 430,
    brake: 560,
    turnRate: 2.8,
    grip: 6.1,
    driftGrip: 1.9,
    hp: 190,
    mass: 1.35,
    colors: ['#ff5733', '#22b8cf', '#f7b731', '#2ed573', '#f5f6fa'],
  },
  sedan: {
    id: 'sedan',
    name: 'Bayline Cruiser',
    w: 56,
    h: 27,
    maxSpeed: 470,
    reverseSpeed: 165,
    accel: 330,
    brake: 500,
    turnRate: 2.65,
    grip: 7.2,
    driftGrip: 2.8,
    hp: 165,
    mass: 1.25,
    colors: ['#e2e8f0', '#60a5fa', '#fbbf24', '#34d399', '#f472b6', '#94a3b8'],
  },
  suv: {
    id: 'suv',
    name: 'Palms Rancher',
    w: 64,
    h: 32,
    maxSpeed: 455,
    reverseSpeed: 165,
    accel: 320,
    brake: 490,
    turnRate: 2.4,
    grip: 6.8,
    driftGrip: 2.9,
    hp: 250,
    mass: 1.75,
    colors: ['#334155', '#d97706', '#0f766e', '#e11d48', '#f1f5f9'],
  },
  truck: {
    id: 'truck',
    name: 'Port Hauler',
    w: 78,
    h: 34,
    maxSpeed: 375,
    reverseSpeed: 135,
    accel: 245,
    brake: 420,
    turnRate: 2.0,
    grip: 6.0,
    driftGrip: 3.1,
    hp: 340,
    mass: 2.6,
    colors: ['#ea580c', '#0284c7', '#475569', '#ca8a04'],
  },
  police: {
    id: 'police',
    name: 'SBPD Interceptor',
    w: 60,
    h: 29,
    maxSpeed: 625,
    reverseSpeed: 195,
    accel: 475,
    brake: 650,
    turnRate: 3.15,
    grip: 7.6,
    driftGrip: 2.4,
    hp: 210,
    mass: 1.45,
    colors: ['#111827'],
    isPolice: true,
  },
  swat: {
    id: 'swat',
    name: 'SBPD Tactical Van',
    w: 72,
    h: 34,
    maxSpeed: 500,
    reverseSpeed: 160,
    accel: 360,
    brake: 520,
    turnRate: 2.35,
    grip: 6.9,
    driftGrip: 2.9,
    hp: 420,
    mass: 2.5,
    colors: ['#0f172a'],
    isPolice: true,
  },
};

export const RADIO_STATIONS = [
  { id: 'solara_wave', name: 'SOLARA WAVE FM 98.4', bpm: 112, style: 'synthwave' },
  { id: 'palm_pulse', name: 'PALM PULSE 103.7', bpm: 124, style: 'house' },
  { id: 'harbor_bass', name: 'HARBOR BASS 89.1', bpm: 96, style: 'funk' },
  { id: 'off', name: 'RADIO OFF', bpm: 0, style: 'off' },
];

export const LANDMARKS = {
  clinic: { x: 2040, y: 1140, name: 'Solara Bay Clinic' },
  policeHQ: { x: 2040, y: 1860, name: 'SBPD Headquarters' },
  customs: { x: 760, y: 1140, name: 'Vance Customs Garage' },
  armory: { x: 760, y: 1860, name: 'Bayfront Armory' },
  pier: { x: 4080, y: 1500, name: 'Coral Strip Pier' },
  harborVault: { x: 2760, y: 2860, name: 'Solis Container Yard' },
};

/** Deterministic Mulberry32 PRNG for consistent city generation and reproducible shots. */
export function createRng(seed = 1337) {
  let state = seed >>> 0;
  return function nextRandom() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Determine the district object at world coordinate (x, y). */
export function getDistrictAt(x, y) {
  for (let i = 0; i < DISTRICTS.length; i += 1) {
    const d = DISTRICTS[i];
    if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) {
      return d;
    }
  }
  return DISTRICTS[0];
}

/** Lighting preset interpolated smoothly from hour of day (0..24). */
export function getLightingForHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 6 && h < 11) {
    return {
      phase: 'COASTAL DAWN',
      sunDx: -1.1,
      sunDy: 0.75,
      ambientTint: 'rgba(255, 195, 145, 0.11)',
      shadowColor: 'rgba(20, 26, 52, 0.36)',
      neonAlpha: 0.35,
      headlights: false,
      waterTop: '#16a3c7',
      waterDeep: '#0c5c85',
    };
  }
  if (h >= 11 && h < 16.5) {
    return {
      phase: 'SUNLIT NOON',
      sunDx: 0.45,
      sunDy: 0.55,
      ambientTint: 'rgba(255, 246, 210, 0.06)',
      shadowColor: 'rgba(12, 22, 42, 0.30)',
      neonAlpha: 0.25,
      headlights: false,
      waterTop: '#14bddb',
      waterDeep: '#09739c',
    };
  }
  if (h >= 16.5 && h < 20) {
    return {
      phase: 'GOLDEN HOUR',
      sunDx: 1.25,
      sunDy: 0.72,
      ambientTint: 'rgba(255, 134, 78, 0.14)',
      shadowColor: 'rgba(26, 14, 46, 0.44)',
      neonAlpha: 0.88,
      headlights: true,
      waterTop: '#1ca6be',
      waterDeep: '#12466e',
    };
  }
  return {
    phase: 'NEON NIGHT',
    sunDx: 0.75,
    sunDy: 0.9,
    ambientTint: 'rgba(14, 24, 62, 0.34)',
    shadowColor: 'rgba(6, 8, 22, 0.54)',
    neonAlpha: 1.0,
    headlights: true,
    waterTop: '#105478',
    waterDeep: '#082542',
  };
}
