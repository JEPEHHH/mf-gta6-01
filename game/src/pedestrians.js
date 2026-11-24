// Pedestrian crowd AI, sidewalk wandering, panic/flee reactions, and cash drops in Solara Bay.

import { WORLD, createRng } from './config.js';

const SHIRT_COLORS = [
  '#ff6b81',
  '#36e2ec',
  '#ffd166',
  '#f8fafc',
  '#a78bfa',
  '#fb923c',
  '#34d399',
  '#60a5fa',
  '#f472b6',
];

const SKIN_TONES = ['#f2c9a6', '#e0ac80', '#c98e63', '#8d5524', '#f6d7bc'];

export class PedestrianSystem {
  constructor(game, seed = 8821) {
    this.game = game;
    this.rng = createRng(seed);
    this.list = [];
    this._spawnInitialCrowd(68);
  }

  _spawnInitialCrowd(count) {
    const world = this.game.world;
    const sidewalkDist = world.roadWidth * 0.5 + 14;
    let attempts = 0;

    while (this.list.length < count && attempts < 500) {
      attempts += 1;
      let x = 0;
      let y = 0;
      let angle = this.rng() * Math.PI * 2;

      if (this.rng() < 0.22) {
        // Coral Strip beachfront walkers
        x = WORLD.beachStartX + 36 + this.rng() * 210;
        y = 180 + this.rng() * (WORLD.harborWaterY - 360);
      } else if (this.rng() < 0.5) {
        const rx = world.avenuesX[Math.floor(this.rng() * world.avenuesX.length)];
        const side = this.rng() < 0.5 ? -1 : 1;
        x = rx + side * sidewalkDist;
        y = 140 + this.rng() * (WORLD.harborWaterY - 280);
        angle = this.rng() < 0.5 ? Math.PI * 0.5 : -Math.PI * 0.5;
      } else {
        const ry = world.avenuesY[Math.floor(this.rng() * world.avenuesY.length)];
        const side = this.rng() < 0.5 ? -1 : 1;
        x = 140 + this.rng() * (WORLD.beachStartX - 280);
        y = ry + side * sidewalkDist;
        angle = this.rng() < 0.5 ? 0 : Math.PI;
      }

      if (world.isSolidAt(x, y, 14) || world.isPointInWater(x, y)) continue;
      this.list.push(this._makePed(x, y, angle));
    }
  }

  _makePed(x, y, angle) {
    return {
      x,
      y,
      angle,
      speed: 44 + this.rng() * 28,
      hp: 40,
      alive: true,
      panicTimer: 0,
      fleeFromX: 0,
      fleeFromY: 0,
      wanderTimer: 1.5 + this.rng() * 4.0,
      shirtColor: SHIRT_COLORS[Math.floor(this.rng() * SHIRT_COLORS.length)],
      skinColor: SKIN_TONES[Math.floor(this.rng() * SKIN_TONES.length)],
      respawnTimer: 0,
    };
  }

  spawnFleeingPed(x, y, threatX, threatY) {
    const ped = this._makePed(x, y, Math.atan2(y - threatY, x - threatX));
    ped.panicTimer = 9;
    ped.fleeFromX = threatX;
    ped.fleeFromY = threatY;
    this.list.push(ped);
    if (this.list.length > 90) {
      this.list.shift();
    }
    return ped;
  }

  triggerPanicNear(x, y, radius = 380) {
    for (let i = 0; i < this.list.length; i += 1) {
      const p = this.list[i];
      if (!p.alive) continue;
      if (Math.hypot(p.x - x, p.y - y) <= radius) {
        p.panicTimer = 7 + this.rng() * 4;
        p.fleeFromX = x;
        p.fleeFromY = y;
      }
    }
  }

  damagePed(p, amount, attacker = 'player') {
    if (!p.alive) return;
    p.hp -= amount;
    p.panicTimer = 8;
    p.fleeFromX = this.game.player.x;
    p.fleeFromY = this.game.player.y;
    if (p.hp <= 0) {
      p.alive = false;
      p.respawnTimer = 18;
      if (attacker === 'player') {
        const drop = 25 + Math.floor(this.rng() * 55);
        this.game.player.cash += drop;
        if (this.game.combat) {
          this.game.combat.addPopup(p.x, p.y - 12, `+$${drop}`, '#4be89a');
          this.game.combat.spawnHitBurst(p.x, p.y, '#ff4757', 8);
        }
        if (this.game.police) {
          this.game.police.reportCrime(1, p.x, p.y, 'Assault on civilian');
        }
      }
    }
  }

  update(dt, attractMode = false) {
    const world = this.game.world;
    const vehicles = this.game.vehicles ? this.game.vehicles.list : [];

    for (let i = 0; i < this.list.length; i += 1) {
      const p = this.list[i];
      if (!p.alive) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          // Respawn away from camera
          const rx = world.avenuesX[Math.floor(this.rng() * world.avenuesX.length)];
          p.x = rx + (this.rng() < 0.5 ? -70 : 70);
          p.y = 200 + this.rng() * (WORLD.harborWaterY - 400);
          p.hp = 40;
          p.alive = true;
          p.panicTimer = 0;
        }
        continue;
      }

      let moveSpeed = p.speed;
      if (p.panicTimer > 0) {
        p.panicTimer -= dt;
        p.angle = Math.atan2(p.y - p.fleeFromY, p.x - p.fleeFromX);
        moveSpeed = 165;
      } else {
        p.wanderTimer -= dt;
        if (p.wanderTimer <= 0) {
          p.wanderTimer = 2.5 + this.rng() * 4.5;
          p.angle += (this.rng() - 0.5) * 1.4;
        }
      }

      p.x += Math.cos(p.angle) * moveSpeed * dt;
      p.y += Math.sin(p.angle) * moveSpeed * dt;

      if (world.resolveCircleCollision(p, 10)) {
        p.angle += Math.PI * 0.65;
      }

      // Check vehicle impact on pedestrian
      if (!attractMode) {
        for (let vIdx = 0; vIdx < vehicles.length; vIdx += 1) {
          const v = vehicles[vIdx];
          const vSpeed = Math.hypot(v.vx, v.vy);
          if (vSpeed < 55) continue;
          const dist = Math.hypot(v.x - p.x, v.y - p.y);
          if (dist < 28) {
            if (vSpeed > 135) {
              this.damagePed(p, 50, v.driver === 'player' ? 'player' : 'traffic');
            } else {
              p.panicTimer = 5;
              p.fleeFromX = v.x;
              p.fleeFromY = v.y;
            }
            break;
          }
        }
      }
    }
  }
}
