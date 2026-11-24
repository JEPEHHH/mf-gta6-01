// Vehicle physics, drift handling, traffic AI, carjacking, and collision system for Solara Bay.

import { WORLD, PLAYER_CONFIG, VEHICLE_TYPES, createRng } from './config.js';

const CIVILIAN_KEYS = ['sport', 'muscle', 'sedan', 'sedan', 'suv', 'truck'];

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class VehicleSystem {
  constructor(game, seed = 4041) {
    this.game = game;
    this.rng = createRng(seed);
    this.list = [];
    this.nextId = 1;
    this._spawnInitialFleet();
  }

  _spawnInitialFleet() {
    const world = this.game.world;

    // Hero parked cars near start & key landmarks
    this.spawnVehicle('sport', 3585, 1420, -Math.PI * 0.5, {
      color: '#ff3d68',
      parked: true,
      isTraffic: false,
    });
    this.spawnVehicle('muscle', 3495, 1555, Math.PI * 0.5, {
      color: '#00d9e8',
      parked: true,
      isTraffic: false,
    });
    this.spawnVehicle('sport', 2215, 1020, 0, {
      color: '#ffe14d',
      parked: true,
      isTraffic: false,
    });
    this.spawnVehicle('suv', 785, 1210, 0, {
      color: '#d97706',
      parked: true,
      isTraffic: false,
    });
    this.spawnVehicle('truck', 2740, 2860, 0, {
      color: '#ea580c',
      parked: true,
      isTraffic: false,
    });

    // Parked SBPD cruisers outside Police HQ
    this.spawnVehicle('police', 2160, 1875, 0, {
      parked: true,
      isTraffic: false,
      sirenOn: false,
    });
    this.spawnVehicle('police', 2265, 1930, Math.PI * 0.5, {
      parked: true,
      isTraffic: false,
      sirenOn: false,
    });

    // Dynamic ambient city traffic across avenues
    const targetTraffic = 34;
    let attempts = 0;
    while (this.list.length < targetTraffic + 7 && attempts < 220) {
      attempts += 1;
      const horizontal = this.rng() < 0.5;
      const laneOffset = 26;
      let x = 0;
      let y = 0;
      let angle = 0;
      let dir = 1;

      if (horizontal) {
        const ry = world.avenuesY[Math.floor(this.rng() * world.avenuesY.length)];
        dir = this.rng() < 0.5 ? 1 : -1;
        x = 260 + this.rng() * (WORLD.beachStartX - 520);
        y = ry + (dir === 1 ? laneOffset : -laneOffset);
        angle = dir === 1 ? 0 : Math.PI;
      } else {
        const rx = world.avenuesX[Math.floor(this.rng() * world.avenuesX.length)];
        dir = this.rng() < 0.5 ? 1 : -1;
        x = rx + (dir === 1 ? -laneOffset : laneOffset);
        y = 260 + this.rng() * (WORLD.harborWaterY - 520);
        angle = dir === 1 ? Math.PI * 0.5 : -Math.PI * 0.5;
      }

      if (this._isSpotOccupied(x, y, 105)) continue;
      const typeKey = CIVILIAN_KEYS[Math.floor(this.rng() * CIVILIAN_KEYS.length)];
      this.spawnVehicle(typeKey, x, y, angle, {
        isTraffic: true,
        parked: false,
        aiAxis: horizontal ? 'x' : 'y',
        aiDir: dir,
        aiRoadCoord: horizontal ? y - (dir === 1 ? laneOffset : -laneOffset) : x - (dir === 1 ? -laneOffset : laneOffset),
        aiCruiseSpeed: 155 + this.rng() * 95,
      });
    }
  }

  _isSpotOccupied(x, y, minDist) {
    for (let i = 0; i < this.list.length; i += 1) {
      if (Math.hypot(this.list[i].x - x, this.list[i].y - y) < minDist) return true;
    }
    return false;
  }

  spawnVehicle(typeId, x, y, angle = 0, overrides = {}) {
    const spec = VEHICLE_TYPES[typeId] || VEHICLE_TYPES.sedan;
    const color =
      overrides.color || spec.colors[Math.floor(this.rng() * spec.colors.length)];
    const v = {
      id: this.nextId++,
      typeId: spec.id,
      name: spec.name,
      x,
      y,
      vx: 0,
      vy: 0,
      angle,
      w: spec.w,
      h: spec.h,
      maxSpeed: spec.maxSpeed,
      reverseSpeed: spec.reverseSpeed,
      accel: spec.accel,
      brake: spec.brake,
      turnRate: spec.turnRate,
      grip: spec.grip,
      driftGrip: spec.driftGrip,
      hp: spec.hp,
      maxHp: spec.hp,
      mass: spec.mass,
      color,
      isPolice: Boolean(spec.isPolice),
      sirenOn: Boolean(overrides.sirenOn),
      driver: overrides.driver || (overrides.isTraffic ? 'npc' : null),
      isTraffic: Boolean(overrides.isTraffic),
      parked: Boolean(overrides.parked),
      wrecked: false,
      braking: false,
      smokeTimer: 0,
      turnCooldown: 0,
      aiAxis: overrides.aiAxis || 'x',
      aiDir: overrides.aiDir || 1,
      aiRoadCoord: overrides.aiRoadCoord || y,
      aiCruiseSpeed: overrides.aiCruiseSpeed || 185,
      aiPanicked: false,
      aiRole: overrides.aiRole || null,
      lastSkidL: null,
      lastSkidR: null,
      ...overrides,
    };
    this.list.push(v);
    return v;
  }

  findNearestVehicle(x, y, maxDist = PLAYER_CONFIG.enterVehicleRadius) {
    let best = null;
    let bestD = maxDist;
    for (let i = 0; i < this.list.length; i += 1) {
      const v = this.list[i];
      if (v.wrecked) continue;
      const d = Math.hypot(v.x - x, v.y - y);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  tryTogglePlayerVehicle() {
    const player = this.game.player;
    if (player.vehicle) {
      const v = player.vehicle;
      const exitAngle = v.angle - Math.PI * 0.5;
      const exitDist = v.h * 0.5 + PLAYER_CONFIG.radius + 10;
      player.x = v.x + Math.cos(exitAngle) * exitDist;
      player.y = v.y + Math.sin(exitAngle) * exitDist;
      this.game.world.resolveCircleCollision(player, PLAYER_CONFIG.radius);
      player.vx = v.vx * 0.35;
      player.vy = v.vy * 0.35;
      v.driver = null;
      v.parked = true;
      player.vehicle = null;
      if (this.game.audio) this.game.audio.playDoor();
      return true;
    }

    const nearest = this.findNearestVehicle(player.x, player.y, PLAYER_CONFIG.enterVehicleRadius);
    if (!nearest) return false;

    const wasOccupied = nearest.driver === 'npc' || nearest.driver === 'police';
    if (wasOccupied && this.game.pedestrians) {
      // Eject previous driver onto the road in panic
      const ejectAngle = nearest.angle + Math.PI * 0.5;
      this.game.pedestrians.spawnFleeingPed(
        nearest.x + Math.cos(ejectAngle) * 34,
        nearest.y + Math.sin(ejectAngle) * 34,
        nearest.x,
        nearest.y,
      );
    }

    nearest.driver = 'player';
    nearest.parked = false;
    nearest.isTraffic = false;
    nearest.aiRole = null;
    if (nearest.isPolice) {
      nearest.sirenOn = true;
    }
    player.vehicle = nearest;
    player.stats.carsStolen += 1;

    if (this.game.audio) this.game.audio.playEngineStart();
    if (this.game.police) {
      if (nearest.isPolice) {
        this.game.police.reportCrime(2, nearest.x, nearest.y, 'Stolen SBPD cruiser');
      } else if (wasOccupied) {
        this.game.police.reportCrime(1, nearest.x, nearest.y, 'Carjacking reported');
      }
    }
    return true;
  }

  damageVehicle(v, amount, source = 'impact') {
    if (v.wrecked) return;
    v.hp = Math.max(0, v.hp - amount);
    if (v.hp <= 0) {
      v.wrecked = true;
      v.sirenOn = false;
      v.isTraffic = false;
      if (v.driver === 'player') {
        // Eject player with heavy explosion damage
        this.tryTogglePlayerVehicle();
        if (this.game.combat) {
          this.game.combat.damagePlayer(45);
        }
      } else {
        v.driver = null;
      }
      if (this.game.combat) {
        this.game.combat.triggerExplosion(v.x, v.y, 130, 80, source);
      }
    }
  }

  update(dt, attractMode = false) {
    const player = this.game.player;

    if (!attractMode && (this.game.input.wasPressed('KeyE') || this.game.input.wasPressed('KeyF'))) {
      this.tryTogglePlayerVehicle();
    }

    for (let i = 0; i < this.list.length; i += 1) {
      const v = this.list[i];

      if (v.wrecked) {
        v.vx *= Math.exp(-3.5 * dt);
        v.vy *= Math.exp(-3.5 * dt);
        v.x += v.vx * dt;
        v.y += v.vy * dt;
        this._emitDamageSmoke(v, dt);
        continue;
      }

      if (v.driver === 'player' && !attractMode) {
        this._updatePlayerDriving(v, dt);
      } else if (v.aiRole === 'police' && !attractMode) {
        // Driven by PoliceSystem AI inputs stored on v.aiControl
        const ctrl = v.aiControl || { throttle: 0, steer: 0, handbrake: false };
        this._applyVehiclePhysics(v, ctrl.throttle, ctrl.steer, ctrl.handbrake, dt);
      } else if (v.isTraffic && v.driver === 'npc') {
        this._updateTrafficAI(v, dt);
      } else {
        // Coasting parked / unoccupied car
        v.braking = false;
        this._applyVehiclePhysics(v, 0, 0, true, dt);
      }

      this._emitDamageSmoke(v, dt);
    }

    // Vehicle-to-vehicle collisions
    this._resolveVehicleCollisions();

    // Sync player coordinates with active vehicle
    if (player.vehicle) {
      player.x = player.vehicle.x;
      player.y = player.vehicle.y;
      player.vx = player.vehicle.vx;
      player.vy = player.vehicle.vy;
      player.angle = player.vehicle.angle;
      const dist = Math.hypot(player.vx, player.vy) * dt;
      player.stats.distanceDriven += dist;
    }
  }

  _updatePlayerDriving(v, dt) {
    const ctrl = this.game.input.getDriveControls();
    this._applyVehiclePhysics(v, ctrl.throttle, ctrl.steer, ctrl.handbrake, dt);
  }

  _updateTrafficAI(v, dt) {
    const world = this.game.world;
    if (v.turnCooldown > 0) v.turnCooldown -= dt;

    // Check obstacle directly ahead (another car or player)
    const cos = Math.cos(v.angle);
    const sin = Math.sin(v.angle);
    let blocked = false;
    const lookAhead = v.aiPanicked ? 62 : 98;

    for (let i = 0; i < this.list.length; i += 1) {
      const other = this.list[i];
      if (other === v) continue;
      const dx = other.x - v.x;
      const dy = other.y - v.y;
      const forward = dx * cos + dy * sin;
      const side = Math.abs(-dx * sin + dy * cos);
      if (forward > 12 && forward < lookAhead && side < 30) {
        blocked = true;
        break;
      }
    }

    if (!blocked && !this.game.player.vehicle) {
      const dx = this.game.player.x - v.x;
      const dy = this.game.player.y - v.y;
      const forward = dx * cos + dy * sin;
      const side = Math.abs(-dx * sin + dy * cos);
      if (forward > 10 && forward < 75 && side < 26) {
        blocked = true;
      }
    }

    // Turn at intersections or reverse near city edges
    const laneOffset = 26;
    if (v.turnCooldown <= 0) {
      for (let i = 0; i < world.intersections.length; i += 1) {
        const inter = world.intersections[i];
        if (Math.hypot(inter.x - v.x, inter.y - v.y) < 34) {
          if (this.rng() < 0.34) {
            v.aiAxis = v.aiAxis === 'x' ? 'y' : 'x';
            v.aiDir = this.rng() < 0.5 ? 1 : -1;
            v.aiRoadCoord = v.aiAxis === 'x' ? inter.y : inter.x;
            v.turnCooldown = 2.6;
          } else {
            v.turnCooldown = 1.4;
          }
          break;
        }
      }
    }

    // Edge turnaround
    if (v.aiAxis === 'x') {
      if (v.x > WORLD.beachStartX - 180 && v.aiDir === 1) v.aiDir = -1;
      if (v.x < 210 && v.aiDir === -1) v.aiDir = 1;
    } else {
      if (v.y > WORLD.harborWaterY - 180 && v.aiDir === 1) v.aiDir = -1;
      if (v.y < 210 && v.aiDir === -1) v.aiDir = 1;
    }

    // Desired lane point
    let targetAngle = 0;
    let laneErr = 0;
    if (v.aiAxis === 'x') {
      targetAngle = v.aiDir === 1 ? 0 : Math.PI;
      const desiredY = v.aiRoadCoord + (v.aiDir === 1 ? laneOffset : -laneOffset);
      laneErr = (desiredY - v.y) * v.aiDir;
    } else {
      targetAngle = v.aiDir === 1 ? Math.PI * 0.5 : -Math.PI * 0.5;
      const desiredX = v.aiRoadCoord + (v.aiDir === 1 ? -laneOffset : laneOffset);
      laneErr = (v.x - desiredX) * v.aiDir;
    }

    const desiredAngle = targetAngle + Math.max(-0.45, Math.min(0.45, laneErr * 0.015));
    const angleDiff = normalizeAngle(desiredAngle - v.angle);
    const steer = Math.max(-1, Math.min(1, angleDiff * 2.4));

    const speed = Math.hypot(v.vx, v.vy);
    const targetSpeed = blocked ? 0 : v.aiPanicked ? v.maxSpeed * 0.72 : v.aiCruiseSpeed;
    const throttle = blocked ? -0.8 : speed < targetSpeed ? 0.62 : 0;

    this._applyVehiclePhysics(v, throttle, steer, blocked && speed < 35, dt);
  }

  _applyVehiclePhysics(v, throttle, steer, handbrake, dt) {
    const cos = Math.cos(v.angle);
    const sin = Math.sin(v.angle);
    let forwardVel = v.vx * cos + v.vy * sin;
    let lateralVel = -v.vx * sin + v.vy * cos;

    v.braking = false;
    if (throttle > 0) {
      if (forwardVel < -10) {
        forwardVel += v.brake * dt;
        v.braking = true;
      } else {
        forwardVel += v.accel * throttle * dt;
      }
    } else if (throttle < 0) {
      if (forwardVel > 14) {
        forwardVel -= v.brake * dt;
        v.braking = true;
      } else {
        forwardVel += v.accel * 0.65 * throttle * dt;
      }
    } else {
      forwardVel *= Math.exp(-1.55 * dt);
    }

    if (handbrake) {
      forwardVel *= Math.exp(-3.4 * dt);
      v.braking = true;
    }

    forwardVel = Math.max(-v.reverseSpeed, Math.min(v.maxSpeed, forwardVel));

    // Speed-sensitive responsive steering
    const absSpeed = Math.abs(forwardVel);
    if (absSpeed > 6) {
      const turnScale = Math.min(1, absSpeed / 120) * (handbrake ? 1.32 : 1);
      const dirSign = forwardVel >= 0 ? 1 : -1;
      v.angle = normalizeAngle(v.angle + steer * v.turnRate * turnScale * dirSign * dt);
    }

    // Lateral friction (low when handbrake drifting -> satisfying powerslides!)
    const latGrip = handbrake ? v.driftGrip : v.grip;
    lateralVel *= Math.exp(-latGrip * dt);

    const nCos = Math.cos(v.angle);
    const nSin = Math.sin(v.angle);
    v.vx = nCos * forwardVel - nSin * lateralVel;
    v.vy = nSin * forwardVel + nCos * lateralVel;

    v.x += v.vx * dt;
    v.y += v.vy * dt;

    // Emit tire skid marks & drift smoke when sliding hard
    const sliding = (Math.abs(lateralVel) > 68 || (handbrake && absSpeed > 150)) && !v.wrecked;
    if (sliding) {
      const rearX = v.x - nCos * (v.w * 0.34);
      const rearY = v.y - nSin * (v.w * 0.34);
      const sideX = -nSin * (v.h * 0.36);
      const sideY = nCos * (v.h * 0.36);
      const lx = rearX + sideX;
      const ly = rearY + sideY;
      const rx = rearX - sideX;
      const ry = rearY - sideY;
      if (v.lastSkidL && Math.hypot(lx - v.lastSkidL.x, ly - v.lastSkidL.y) < 36) {
        this.game.world.addSkidMark(v.lastSkidL.x, v.lastSkidL.y, lx, ly, 0.42);
        this.game.world.addSkidMark(v.lastSkidR.x, v.lastSkidR.y, rx, ry, 0.42);
      }
      v.lastSkidL = { x: lx, y: ly };
      v.lastSkidR = { x: rx, y: ry };
      if (this.game.combat && Math.random() < 0.45) {
        this.game.combat.spawnSmoke(rearX, rearY, 'rgba(220, 228, 238, 0.45)', 7);
      }
    } else {
      v.lastSkidL = null;
      v.lastSkidR = null;
    }

    // Building & boundary collision
    const radius = Math.min(v.w, v.h) * 0.56;
    const hitWall = this.game.world.resolveCircleCollision(v, radius);
    if (hitWall) {
      const impact = Math.hypot(v.vx, v.vy);
      if (impact > 180) {
        this.damageVehicle(v, (impact - 150) * 0.08, 'crash');
        if (v.driver === 'player') {
          this.game.addCameraShake(Math.min(10, impact * 0.018));
          if (this.game.audio) this.game.audio.playCrash(impact / 500);
        }
        if (this.game.combat) {
          this.game.combat.spawnSparks(v.x + nCos * 20, v.y + nSin * 20, 7);
        }
      }
      v.vx *= -0.32;
      v.vy *= -0.32;
    }
  }

  _resolveVehicleCollisions() {
    const n = this.list.length;
    for (let i = 0; i < n; i += 1) {
      const a = this.list[i];
      const ra = (a.w + a.h) * 0.25;
      for (let j = i + 1; j < n; j += 1) {
        const b = this.list[j];
        const rb = (b.w + b.h) * 0.25;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = ra + rb;
        const distSq = dx * dx + dy * dy;
        if (distSq >= minDist * minDist || distSq < 0.0001) continue;

        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const totalMass = a.mass + b.mass;

        a.x -= nx * overlap * (b.mass / totalMass);
        a.y -= ny * overlap * (b.mass / totalMass);
        b.x += nx * overlap * (a.mass / totalMass);
        b.y += ny * overlap * (a.mass / totalMass);

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const sepVel = rvx * nx + rvy * ny;
        if (sepVel < 0) {
          const impulse = (-1.45 * sepVel) / (1 / a.mass + 1 / b.mass);
          a.vx -= (impulse / a.mass) * nx;
          a.vy -= (impulse / a.mass) * ny;
          b.vx += (impulse / b.mass) * nx;
          b.vy += (impulse / b.mass) * ny;

          const impact = Math.abs(sepVel);
          if (impact > 160) {
            this.damageVehicle(a, (impact - 130) * 0.06, 'crash');
            this.damageVehicle(b, (impact - 130) * 0.06, 'crash');
            if (this.game.combat) {
              this.game.combat.spawnSparks((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 8);
            }
            if (a.driver === 'player' || b.driver === 'player') {
              this.game.addCameraShake(Math.min(11, impact * 0.02));
              if (this.game.audio) this.game.audio.playCrash(impact / 500);
              if ((a.isPolice || b.isPolice) && this.game.police) {
                this.game.police.reportCrime(1, a.x, a.y, 'Ramming SBPD cruiser');
              }
            }
          }
        }
      }
    }
  }

  _emitDamageSmoke(v, dt) {
    if (!this.game.combat) return;
    const ratio = v.hp / v.maxHp;
    if (ratio >= 0.45 && !v.wrecked) return;
    v.smokeTimer -= dt;
    if (v.smokeTimer <= 0) {
      v.smokeTimer = v.wrecked ? 0.14 : 0.08;
      const hoodX = v.x + Math.cos(v.angle) * (v.w * 0.28);
      const hoodY = v.y + Math.sin(v.angle) * (v.w * 0.28);
      if (ratio < 0.2 && !v.wrecked) {
        this.game.combat.spawnFire(hoodX, hoodY);
      } else {
        this.game.combat.spawnSmoke(hoodX, hoodY, 'rgba(55, 62, 74, 0.65)', 10);
      }
    }
  }
}
