// Solara Bay Police Department (SBPD) 1-5 Star Wanted Level, Patrol Spawning, and Chase AI.

import { WORLD, WEAPONS } from './config.js';

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class PoliceSystem {
  constructor(game) {
    this.game = game;
    this.wantedLevel = 0; // 0..5
    this.heat = 0;
    this.evadeTimer = 0;
    this.lastCrime = '';
    this.officers = [];
    this.spawnTimer = 0;
    this.playerSeen = false;
  }

  reportCrime(minStars, x, y, reason = 'Disturbance') {
    const heatGain = minStars * 28;
    this.heat = Math.min(500, this.heat + heatGain);
    const heatStars = Math.min(5, Math.ceil(this.heat / 85));
    const newLevel = Math.max(this.wantedLevel, minStars, heatStars);
    if (newLevel > this.wantedLevel) {
      this.wantedLevel = newLevel;
      if (this.game.combat) {
        this.game.combat.addPopup(
          this.game.player.x,
          this.game.player.y - 34,
          `WANTED ${'★'.repeat(this.wantedLevel)}`,
          '#ff4757',
        );
      }
    }
    this.evadeTimer = 18 + this.wantedLevel * 4;
    this.lastCrime = reason;
    this.playerSeen = true;
  }

  setWantedLevel(stars) {
    this.wantedLevel = Math.max(0, Math.min(5, stars));
    this.heat = this.wantedLevel * 85;
    this.evadeTimer = this.wantedLevel > 0 ? 22 : 0;
    this.playerSeen = this.wantedLevel > 0;
  }

  clearWanted() {
    this.wantedLevel = 0;
    this.heat = 0;
    this.evadeTimer = 0;
    this.playerSeen = false;
    this.officers = [];
    if (this.game.vehicles) {
      for (let i = 0; i < this.game.vehicles.list.length; i += 1) {
        const v = this.game.vehicles.list[i];
        if (v.aiRole === 'police') {
          v.sirenOn = false;
          v.aiControl = { throttle: 0, steer: 0, handbrake: true };
        }
      }
    }
  }

  damageOfficer(off, amount) {
    if (!off.alive) return;
    off.hp -= amount;
    if (off.hp <= 0) {
      off.alive = false;
      this.game.player.stats.enemiesDefeated += 1;
      this.game.player.respect += 20;
      this.reportCrime(Math.min(5, this.wantedLevel + 1), off.x, off.y, 'Officer down');
      if (this.game.combat) {
        this.game.combat.addPopup(off.x, off.y - 16, '+20 REP', '#ffd166');
      }
    }
  }

  _activePoliceCars() {
    if (!this.game.vehicles) return [];
    return this.game.vehicles.list.filter((v) => v.aiRole === 'police' && !v.wrecked);
  }

  _spawnReinforcement() {
    const world = this.game.world;
    const p = this.game.player;
    const desiredCars = Math.min(5, this.wantedLevel + (this.wantedLevel >= 3 ? 1 : 0));
    const activeCars = this._activePoliceCars();

    if (activeCars.length < desiredCars && this.game.vehicles) {
      // Pick a road point 460-760 units from the player
      const angles = [0, Math.PI * 0.5, Math.PI, -Math.PI * 0.5, 0.7, -0.7, 2.3, -2.3];
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const a = angles[(attempt + Math.floor(Math.random() * angles.length)) % angles.length];
        const dist = 480 + Math.random() * 240;
        let sx = Math.max(180, Math.min(WORLD.beachStartX - 160, p.x + Math.cos(a) * dist));
        let sy = Math.max(180, Math.min(WORLD.harborWaterY - 160, p.y + Math.sin(a) * dist));

        // Snap to nearest avenue for clean pursuit entry
        let nearestX = world.avenuesX[0];
        let bestDx = Infinity;
        for (let i = 0; i < world.avenuesX.length; i += 1) {
          const d = Math.abs(world.avenuesX[i] - sx);
          if (d < bestDx) {
            bestDx = d;
            nearestX = world.avenuesX[i];
          }
        }
        let nearestY = world.avenuesY[0];
        let bestDy = Infinity;
        for (let i = 0; i < world.avenuesY.length; i += 1) {
          const d = Math.abs(world.avenuesY[i] - sy);
          if (d < bestDy) {
            bestDy = d;
            nearestY = world.avenuesY[i];
          }
        }
        if (bestDx < bestDy) sx = nearestX;
        else sy = nearestY;

        if (world.isSolidAt(sx, sy, 36) || Math.hypot(sx - p.x, sy - p.y) < 340) continue;

        const isSwat = this.wantedLevel >= 4 && activeCars.length % 2 === 1;
        this.game.vehicles.spawnVehicle(
          isSwat ? 'swat' : 'police',
          sx,
          sy,
          Math.atan2(p.y - sy, p.x - sx),
          {
            driver: 'police',
            aiRole: 'police',
            sirenOn: true,
            parked: false,
            isTraffic: false,
            stuckTimer: 0,
            reverseTimer: 0,
            deployTimer: 2.5,
          },
        );
        break;
      }
    }

    // Spawn on-foot officers when wanted >= 2 and player is on foot or slow
    const aliveOfficers = this.officers.filter((o) => o.alive).length;
    const desiredOfficers = this.wantedLevel >= 2 ? Math.min(6, this.wantedLevel + 1) : 0;
    if (aliveOfficers < desiredOfficers && activeCars.length > 0) {
      const car = activeCars[0];
      if (Math.hypot(car.x - p.x, car.y - p.y) < 420) {
        this.officers.push({
          x: car.x + Math.cos(car.angle + Math.PI * 0.5) * 32,
          y: car.y + Math.sin(car.angle + Math.PI * 0.5) * 32,
          angle: Math.atan2(p.y - car.y, p.x - car.x),
          hp: this.wantedLevel >= 4 ? 90 : 60,
          alive: true,
          fireCooldown: 0.7 + Math.random() * 0.5,
          speed: 148 + this.wantedLevel * 8,
        });
      }
    }
  }

  update(dt) {
    if (this.wantedLevel <= 0) return;

    const p = this.game.player;
    const world = this.game.world;

    // Periodic reinforcement checks
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(1.8, 4.6 - this.wantedLevel * 0.55);
      this._spawnReinforcement();
    }

    let anySight = false;

    // Update chasing police vehicles
    const cars = this._activePoliceCars();
    for (let i = 0; i < cars.length; i += 1) {
      const v = cars[i];
      v.sirenOn = true;
      const dist = Math.hypot(p.x - v.x, p.y - v.y);

      if (dist < 620 && world.hasLineOfSight(v.x, v.y, p.x, p.y)) {
        anySight = true;
      }

      // Despawn very distant cruisers so reinforcements stay near action
      if (dist > 1950) {
        const idx = this.game.vehicles.list.indexOf(v);
        if (idx >= 0) this.game.vehicles.list.splice(idx, 1);
        continue;
      }

      // Predict intercept point slightly ahead of moving player
      const lead = Math.min(0.65, dist / 650);
      const targetX = p.x + p.vx * lead + (i % 2 === 0 ? 18 : -18);
      const targetY = p.y + p.vy * lead + (i % 2 === 0 ? -18 : 18);

      const speed = Math.hypot(v.vx, v.vy);
      if (speed < 25) {
        v.stuckTimer = (v.stuckTimer || 0) + dt;
        if (v.stuckTimer > 1.0) {
          v.reverseTimer = 0.85;
          v.stuckTimer = 0;
        }
      } else {
        v.stuckTimer = 0;
      }

      if (v.reverseTimer > 0) {
        v.reverseTimer -= dt;
        v.aiControl = { throttle: -0.9, steer: i % 2 === 0 ? 1 : -1, handbrake: false };
      } else {
        const desiredAngle = Math.atan2(targetY - v.y, targetX - v.x);
        const diff = normalizeAngle(desiredAngle - v.angle);
        const steer = Math.max(-1, Math.min(1, diff * 2.5));
        const throttle = dist < 115 && !p.vehicle ? 0 : Math.abs(diff) > 1.25 ? 0.35 : 0.96;
        v.aiControl = { throttle, steer, handbrake: Math.abs(diff) > 1.35 && speed > 180 };
      }

      // Deploy officer when cruiser pulls close to an on-foot player
      if (!p.vehicle && dist < 240 && this.officers.filter((o) => o.alive).length < 6) {
        v.deployTimer = (v.deployTimer ?? 1.5) - dt;
        if (v.deployTimer <= 0) {
          v.deployTimer = 6.5;
          this.officers.push({
            x: v.x + Math.cos(v.angle - Math.PI * 0.5) * 34,
            y: v.y + Math.sin(v.angle - Math.PI * 0.5) * 34,
            angle: Math.atan2(p.y - v.y, p.x - v.x),
            hp: 65,
            alive: true,
            fireCooldown: 0.9,
            speed: 152,
          });
        }
      }
    }

    // Update on-foot police officers
    const policeWeapon = this.wantedLevel >= 4 ? WEAPONS[3] : WEAPONS[0];
    for (let i = this.officers.length - 1; i >= 0; i -= 1) {
      const off = this.officers[i];
      if (!off.alive) {
        this.officers.splice(i, 1);
        continue;
      }
      const dx = p.x - off.x;
      const dy = p.y - off.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1100) {
        this.officers.splice(i, 1);
        continue;
      }

      off.angle = Math.atan2(dy, dx);
      const hasLOS = dist < 480 && world.hasLineOfSight(off.x, off.y, p.x, p.y);
      if (hasLOS) anySight = true;

      if (dist > 145 || !hasLOS) {
        off.x += Math.cos(off.angle) * off.speed * dt;
        off.y += Math.sin(off.angle) * off.speed * dt;
        world.resolveCircleCollision(off, 12);
      }

      off.fireCooldown -= dt;
      if (hasLOS && dist < 390 && off.fireCooldown <= 0 && this.game.combat) {
        off.fireCooldown = Math.max(0.55, 1.35 - this.wantedLevel * 0.14);
        this.game.combat.fireProjectile(
          off.x,
          off.y,
          off.angle + (Math.random() - 0.5) * 0.16,
          { ...policeWeapon, damage: 9 + this.wantedLevel * 2, pellets: 1 },
          'police',
        );
        if (this.game.audio) this.game.audio.playGunshot('pistol');
      }
    }

    // Wanted cooldown when player escapes police sightlines
    this.playerSeen = anySight;
    if (anySight) {
      this.evadeTimer = Math.max(this.evadeTimer, 12 + this.wantedLevel * 3);
    } else {
      this.evadeTimer -= dt;
      if (this.evadeTimer <= 0) {
        this.wantedLevel = Math.max(0, this.wantedLevel - 1);
        this.heat = this.wantedLevel * 75;
        if (this.wantedLevel > 0) {
          this.evadeTimer = 10;
        } else {
          this.clearWanted();
          if (this.game.combat) {
            this.game.combat.addPopup(p.x, p.y - 34, 'HEAT EVADED!', '#36e2ec');
          }
        }
      }
    }
  }
}
