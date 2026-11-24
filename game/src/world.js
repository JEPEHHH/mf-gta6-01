// Procedural-deterministic Solara Bay city generator, road grid, landmarks, and collision helpers.

import { WORLD, LANDMARKS, createRng, getDistrictAt } from './config.js';

const AVENUES_X = [320, 960, 1600, 2240, 2880, 3520, 3860];
const AVENUES_Y = [320, 960, 1600, 2240, 2880];

const CORAL_SIGNS = [
  'HOTEL SOLARA',
  'AZURE CLUB',
  'PALM LOUNGE',
  'CORAL CAFE',
  'SUNSET SUITES',
  'FLAMINGO BAR',
  'NEON WAVE',
  'BAYSIDE SPA',
];

const DOWNTOWN_SIGNS = [
  'SOLARA TOWER',
  'PACIFIC BANK',
  'APEX MEDIA',
  'MERIDIAN HQ',
  'BAY EXCHANGE',
  'HORIZON CORP',
];

const PALMS_SIGNS = [
  'VANCE CUSTOMS',
  'BAYFRONT ARMORY',
  'PALMS DINER',
  'TROPIC MART',
  'SUNCOAST AUTO',
  'MOTEL VISTA',
];

export class CityWorld {
  constructor(seed = 2026) {
    this.seed = seed;
    this.rng = createRng(seed);
    this.width = WORLD.width;
    this.height = WORLD.height;
    this.roadWidth = WORLD.roadWidth;
    this.sidewalkWidth = WORLD.sidewalkWidth;
    this.avenuesX = AVENUES_X.slice();
    this.avenuesY = AVENUES_Y.slice();

    this.buildings = [];
    this.parks = [];
    this.palms = [];
    this.umbrellas = [];
    this.streetlamps = [];
    this.containers = [];
    this.boats = [];
    this.serviceZones = [];
    this.intersections = [];
    this.skidMarks = [];

    this._generateCity();
  }

  _generateCity() {
    const rw = this.roadWidth;
    const sw = this.sidewalkWidth;
    const halfRoad = rw * 0.5;
    const pad = halfRoad + sw + 10;

    // Intersections for traffic & police AI navigation
    for (let ix = 0; ix < this.avenuesX.length; ix += 1) {
      for (let iy = 0; iy < this.avenuesY.length; iy += 1) {
        this.intersections.push({
          x: this.avenuesX[ix],
          y: this.avenuesY[iy],
          ix,
          iy,
        });
      }
    }

    // Generate blocks between consecutive avenues
    const xEdges = [40, ...this.avenuesX];
    const yEdges = [40, ...this.avenuesY];

    let coralIdx = 0;
    let downIdx = 0;
    let palmsIdx = 0;

    for (let bx = 0; bx < xEdges.length - 1; bx += 1) {
      for (let by = 0; by < yEdges.length - 1; by += 1) {
        const left = bx === 0 ? 40 : xEdges[bx] + pad;
        const right = xEdges[bx + 1] - pad;
        const top = by === 0 ? 40 : yEdges[by] + pad;
        const bottom = yEdges[by + 1] - pad;

        const blockW = right - left;
        const blockH = bottom - top;
        if (blockW < 110 || blockH < 110) continue;

        const cx = (left + right) * 0.5;
        const cy = (top + bottom) * 0.5;
        const district = getDistrictAt(cx, cy);

        // Special city park blocks
        if ((bx === 2 && by === 1) || (bx === 4 && by === 2)) {
          this._addParkBlock(left, top, blockW, blockH, district.id);
          continue;
        }

        // Special service blocks (Vance Customs, Bayfront Armory, Clinic, Police HQ)
        if (bx === 1 && by === 1) {
          this._addLandmarkBuilding(left, top, blockW, blockH, 'VANCE CUSTOMS', '#ff9f43', '#273046', 54, 'garage');
          this.serviceZones.push({
            id: 'garage',
            name: 'Vance Customs — Repair & Repaint ($200)',
            x: left + blockW * 0.5,
            y: bottom + 14,
            radius: 62,
            color: '#ffb347',
          });
          continue;
        }
        if (bx === 1 && by === 2) {
          this._addLandmarkBuilding(left, top, blockW, blockH, 'BAYFRONT ARMORY', '#ff5e7e', '#2c2538', 58, 'armory');
          this.serviceZones.push({
            id: 'armory',
            name: 'Bayfront Armory — Full Ammo & Armor ($300)',
            x: left + blockW * 0.5,
            y: bottom + 14,
            radius: 62,
            color: '#ff5e7e',
          });
          continue;
        }
        if (bx === 3 && by === 1) {
          this._addLandmarkBuilding(left, top, blockW, blockH, 'SOLARA CLINIC', '#4be89a', '#d4f1ec', 78, 'clinic');
          continue;
        }
        if (bx === 3 && by === 2) {
          this._addLandmarkBuilding(left, top, blockW, blockH, 'SBPD HQ', '#36c5ff', '#273854', 94, 'police');
          continue;
        }

        // Harbor Docks industrial block
        if (district.id === 'harbor') {
          this._populateHarborBlock(left, top, blockW, blockH);
          continue;
        }

        // Subdivide standard city block into 2-4 crisp 2.5D buildings
        const cols = blockW > 360 ? 2 : 1;
        const rows = blockH > 360 ? 2 : 1;
        const gap = 22;
        const subW = (blockW - gap * (cols - 1)) / cols;
        const subH = (blockH - gap * (rows - 1)) / rows;

        for (let c = 0; c < cols; c += 1) {
          for (let r = 0; r < rows; r += 1) {
            const inset = 6 + this.rng() * 10;
            const x = left + c * (subW + gap) + inset;
            const y = top + r * (subH + gap) + inset;
            const w = subW - inset * 2;
            const h = subH - inset * 2;
            if (w < 68 || h < 68) continue;

            if (district.id === 'coral_strip') {
              const palettes = [
                { wall: '#f6d5c9', shade: '#c7968f', roof: '#f9e6dd', accent: '#ff5e7e' },
                { wall: '#bceae8', shade: '#7ab7ba', roof: '#dcf6f4', accent: '#36e2ec' },
                { wall: '#ffe0b5', shade: '#d4a66e', roof: '#fff0d6', accent: '#ff9a44' },
                { wall: '#e8c7f7', shade: '#b188c7', roof: '#f4e4fc', accent: '#ff63c3' },
              ];
              const p = palettes[Math.floor(this.rng() * palettes.length)];
              const hasNeon = this.rng() < 0.65;
              const neonText = hasNeon ? CORAL_SIGNS[coralIdx++ % CORAL_SIGNS.length] : '';
              this.buildings.push({
                x,
                y,
                w,
                h,
                height: 62 + Math.floor(this.rng() * 68),
                style: 'artdeco',
                wallColor: p.wall,
                shadeColor: p.shade,
                roofColor: p.roof,
                accentColor: p.accent,
                neonText,
                hasPool: this.rng() < 0.45,
                hasHelipad: false,
                windowHue: '#ffe49e',
              });
            } else if (district.id === 'downtown') {
              const palettes = [
                { wall: '#3c5a7a', shade: '#243a54', roof: '#2f4660', accent: '#36e2ec' },
                { wall: '#46647d', shade: '#2b4157', roof: '#375066', accent: '#ffb347' },
                { wall: '#555e7a', shade: '#353c54', roof: '#424b63', accent: '#ff5e7e' },
                { wall: '#4b6c7a', shade: '#2c4754', roof: '#3c5866', accent: '#52f0c4' },
              ];
              const p = palettes[Math.floor(this.rng() * palettes.length)];
              const height = 105 + Math.floor(this.rng() * 90);
              const neonText = height > 155 ? DOWNTOWN_SIGNS[downIdx++ % DOWNTOWN_SIGNS.length] : '';
              this.buildings.push({
                x,
                y,
                w,
                h,
                height,
                style: 'skyscraper',
                wallColor: p.wall,
                shadeColor: p.shade,
                roofColor: p.roof,
                accentColor: p.accent,
                neonText,
                hasPool: false,
                hasHelipad: height > 165 && w > 120 && h > 120,
                windowHue: this.rng() < 0.5 ? '#9cf6ff' : '#ffd88a',
              });
            } else {
              const palettes = [
                { wall: '#e2c9a6', shade: '#b59a74', roof: '#bfa989', accent: '#4be89a' },
                { wall: '#d9b5a0', shade: '#aa8672', roof: '#c49f8a', accent: '#ffb347' },
                { wall: '#c7d3c0', shade: '#96a58e', roof: '#aebca7', accent: '#36e2ec' },
              ];
              const p = palettes[Math.floor(this.rng() * palettes.length)];
              const neonText = this.rng() < 0.35 ? PALMS_SIGNS[palmsIdx++ % PALMS_SIGNS.length] : '';
              this.buildings.push({
                x,
                y,
                w,
                h,
                height: 44 + Math.floor(this.rng() * 44),
                style: 'midtown',
                wallColor: p.wall,
                shadeColor: p.shade,
                roofColor: p.roof,
                accentColor: p.accent,
                neonText,
                hasPool: this.rng() < 0.18,
                hasHelipad: false,
                windowHue: '#ffdf9e',
              });
            }
          }
        }
      }
    }

    // Coastal beachfront palms, umbrellas, pier, and boats
    this._generateCoastAndHarbor();
    this._generateStreetlampsAndPalms();
  }

  _addParkBlock(x, y, w, h, districtId) {
    this.parks.push({ x, y, w, h, districtId, hasPond: true });
    const palmCount = 12;
    for (let i = 0; i < palmCount; i += 1) {
      const px = x + 36 + this.rng() * (w - 72);
      const py = y + 36 + this.rng() * (h - 72);
      if (Math.hypot(px - (x + w * 0.5), py - (y + h * 0.5)) < 85) continue;
      this.palms.push({
        x: px,
        y: py,
        scale: 0.85 + this.rng() * 0.45,
        angle: this.rng() * Math.PI * 2,
      });
    }
  }

  _addLandmarkBuilding(x, y, w, h, neonText, accentColor, wallColor, height, tag) {
    const padX = 24;
    const padY = 24;
    this.buildings.push({
      x: x + padX,
      y: y + padY,
      w: w - padX * 2,
      h: h - padY * 2 - 22,
      height,
      style: 'landmark',
      tag,
      wallColor,
      shadeColor: '#1b2436',
      roofColor: '#253147',
      accentColor,
      neonText,
      hasPool: false,
      hasHelipad: tag === 'police' || tag === 'clinic',
      windowHue: accentColor,
    });
  }

  _populateHarborBlock(left, top, w, h) {
    // Large industrial warehouse + shipping containers
    const whW = w * 0.55;
    const whH = Math.min(h - 30, 190);
    this.buildings.push({
      x: left + 12,
      y: top + 14,
      w: whW,
      h: whH,
      height: 52,
      style: 'warehouse',
      wallColor: '#5c6b7a',
      shadeColor: '#3a4654',
      roofColor: '#485664',
      accentColor: '#ffb347',
      neonText: this.rng() < 0.45 ? 'SOLIS CARGO' : '',
      hasPool: false,
      hasHelipad: false,
      windowHue: '#ffca6b',
    });

    const containerColors = ['#e04f5f', '#2b7de9', '#e69f22', '#17a589', '#8e44ad'];
    const startX = left + whW + 30;
    const cols = Math.max(1, Math.floor((w - whW - 44) / 78));
    const rows = Math.max(1, Math.floor((h - 32) / 42));
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        if (this.rng() < 0.22) continue;
        this.containers.push({
          x: startX + c * 78,
          y: top + 18 + r * 42,
          w: 66,
          h: 28,
          height: 26,
          color: containerColors[Math.floor(this.rng() * containerColors.length)],
        });
      }
    }
  }

  _generateCoastAndHarbor() {
    // Beach palm trees along Coral Promenade
    for (let y = 140; y < WORLD.harborWaterY - 120; y += 150) {
      if (Math.abs(y - LANDMARKS.pier.y) < 110) continue;
      this.palms.push({
        x: WORLD.beachStartX + 26 + this.rng() * 44,
        y: y + (this.rng() - 0.5) * 35,
        scale: 0.95 + this.rng() * 0.4,
        angle: this.rng() * Math.PI * 2,
      });
    }

    // Colorful beach umbrellas on the golden sand
    const umbrellaColors = ['#ff5e7e', '#36e2ec', '#ffd166', '#ff9a44', '#a66cff', '#4be89a'];
    for (let y = 200; y < WORLD.harborWaterY - 220; y += 135) {
      if (Math.abs(y - LANDMARKS.pier.y) < 130) continue;
      const ux = WORLD.beachStartX + 125 + this.rng() * 130;
      const uy = y + (this.rng() - 0.5) * 40;
      this.umbrellas.push({
        x: ux,
        y: uy,
        radius: 20 + this.rng() * 7,
        color: umbrellaColors[Math.floor(this.rng() * umbrellaColors.length)],
        angle: this.rng() * Math.PI * 2,
      });
    }

    // Moored yachts & speedboats in eastern ocean & southern harbor
    for (let i = 0; i < 8; i += 1) {
      this.boats.push({
        x: WORLD.oceanStartX + 120 + this.rng() * 340,
        y: 340 + i * 330 + (this.rng() - 0.5) * 80,
        angle: -Math.PI * 0.5 + (this.rng() - 0.5) * 0.3,
        length: 62 + this.rng() * 36,
        width: 22 + this.rng() * 10,
        color: i % 2 === 0 ? '#f8fafc' : '#38bdf8',
        accent: i % 3 === 0 ? '#ff5e7e' : '#ffb347',
        phase: this.rng() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 6; i += 1) {
      this.boats.push({
        x: 560 + i * 580,
        y: WORLD.harborWaterY + 150 + this.rng() * 180,
        angle: (this.rng() - 0.5) * 0.25,
        length: 76 + this.rng() * 34,
        width: 26 + this.rng() * 10,
        color: '#f1f5f9',
        accent: '#ff5e7e',
        phase: this.rng() * Math.PI * 2,
      });
    }
  }

  _generateStreetlampsAndPalms() {
    const offset = this.roadWidth * 0.5 + 14;
    for (let ix = 0; ix < this.avenuesX.length; ix += 1) {
      const rx = this.avenuesX[ix];
      for (let y = 160; y < WORLD.harborWaterY - 80; y += 260) {
        if (this._nearRoadY(y, 90)) continue;
        this.streetlamps.push({ x: rx - offset, y, dir: 1 });
        this.streetlamps.push({ x: rx + offset, y, dir: -1 });
        if (rx >= 2880 && Math.floor(y / 260) % 2 === 0) {
          this.palms.push({
            x: rx + offset + 12,
            y: y + 115,
            scale: 0.9,
            angle: (ix + y) % 6.28,
          });
        }
      }
    }
  }

  _nearRoadY(y, margin) {
    for (let i = 0; i < this.avenuesY.length; i += 1) {
      if (Math.abs(y - this.avenuesY[i]) < margin) return true;
    }
    return false;
  }

  isPointInWater(x, y) {
    // Allow walking onto Coral Strip Pier
    if (
      x >= WORLD.oceanStartX - 20 &&
      x <= WORLD.oceanStartX + 270 &&
      Math.abs(y - LANDMARKS.pier.y) <= 44
    ) {
      return false;
    }
    if (x > WORLD.oceanStartX + 8) return true;
    if (y > WORLD.harborWaterY + 8) return true;
    return false;
  }

  /** Add persistent tire skid mark (capped for performance). */
  addSkidMark(x1, y1, x2, y2, alpha = 0.42) {
    this.skidMarks.push({ x1, y1, x2, y2, alpha });
    if (this.skidMarks.length > 420) {
      this.skidMarks.shift();
    }
  }

  /** Check whether a point is inside any solid building or shipping container. */
  isSolidAt(x, y, pad = 0) {
    for (let i = 0; i < this.buildings.length; i += 1) {
      const b = this.buildings[i];
      if (x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad) {
        return true;
      }
    }
    for (let i = 0; i < this.containers.length; i += 1) {
      const c = this.containers[i];
      if (x >= c.x - pad && x <= c.x + c.w + pad && y >= c.y - pad && y <= c.y + c.h + pad) {
        return true;
      }
    }
    return false;
  }

  /** Push a circular body (player, ped, vehicle collider) out of buildings, containers, and water bounds. */
  resolveCircleCollision(entity, radius) {
    let hit = false;
    const minX = 32 + radius;
    const minY = 32 + radius;
    const maxX = WORLD.oceanStartX - radius + 12;
    const maxY = WORLD.harborWaterY - radius + 12;

    const onPier =
      entity.x >= WORLD.oceanStartX - 30 &&
      entity.x <= WORLD.oceanStartX + 255 &&
      Math.abs(entity.y - LANDMARKS.pier.y) <= 36;

    if (!onPier) {
      if (entity.x < minX) {
        entity.x = minX;
        hit = true;
      }
      if (entity.x > maxX) {
        entity.x = maxX;
        hit = true;
      }
      if (entity.y < minY) {
        entity.y = minY;
        hit = true;
      }
      if (entity.y > maxY) {
        entity.y = maxY;
        hit = true;
      }
    } else {
      if (entity.x > WORLD.oceanStartX + 255) {
        entity.x = WORLD.oceanStartX + 255;
        hit = true;
      }
      if (entity.y < LANDMARKS.pier.y - 34) {
        entity.y = LANDMARKS.pier.y - 34;
        hit = true;
      }
      if (entity.y > LANDMARKS.pier.y + 34) {
        entity.y = LANDMARKS.pier.y + 34;
        hit = true;
      }
    }

    const pushOutRect = (rect) => {
      const closestX = Math.max(rect.x, Math.min(entity.x, rect.x + rect.w));
      const closestY = Math.max(rect.y, Math.min(entity.y, rect.y + rect.h));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq < radius * radius) {
        if (distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
        } else {
          const dLeft = Math.abs(entity.x - rect.x);
          const dRight = Math.abs(rect.x + rect.w - entity.x);
          const dTop = Math.abs(entity.y - rect.y);
          const dBottom = Math.abs(rect.y + rect.h - entity.y);
          const m = Math.min(dLeft, dRight, dTop, dBottom);
          if (m === dLeft) entity.x = rect.x - radius;
          else if (m === dRight) entity.x = rect.x + rect.w + radius;
          else if (m === dTop) entity.y = rect.y - radius;
          else entity.y = rect.y + rect.h + radius;
        }
        hit = true;
      }
    };

    for (let i = 0; i < this.buildings.length; i += 1) {
      pushOutRect(this.buildings[i]);
    }
    for (let i = 0; i < this.containers.length; i += 1) {
      pushOutRect(this.containers[i]);
    }
    return hit;
  }

  /** Line-of-sight check between two world points against buildings. */
  hasLineOfSight(x1, y1, x2, y2) {
    const steps = Math.max(4, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 36));
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      if (this.isSolidAt(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 0)) {
        return false;
      }
    }
    return true;
  }
}
