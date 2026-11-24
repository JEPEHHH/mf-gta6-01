// Weapons, projectiles, explosions, particles, service zones, and combat damage for Solara Bay.

import { WEAPONS, LANDMARKS, PLAYER_CONFIG } from './config.js';

export class CombatSystem {
  constructor(game) {
    this.game = game;
    this.projectiles = [];
    this.particles = [];
    this.popups = [];
    this.serviceCooldown = 0;
  }

  addPopup(x, y, text, color = '#4be89a') {
    this.popups.push({ x, y, text, color, life: 1.4, maxLife: 1.4, vy: -34 });
  }

  spawnSparks(x, y, count = 6) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 70 + Math.random() * 190;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size: 2.2 + Math.random() * 2.5,
        color: i % 2 === 0 ? '#ffe082' : '#ff8a3d',
        life: 0.22 + Math.random() * 0.22,
        maxLife: 0.44,
        drag: 5,
      });
    }
  }

  spawnSmoke(x, y, color = 'rgba(85, 92, 108, 0.6)', size = 9) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 24,
      vy: (Math.random() - 0.5) * 24 - 12,
      size,
      color,
      life: 0.65 + Math.random() * 0.45,
      maxLife: 1.1,
      drag: 1.8,
      grow: true,
      alpha: 0.72,
    });
  }

  spawnFire(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 35,
      vy: (Math.random() - 0.5) * 35 - 18,
      size: 7 + Math.random() * 6,
      color: Math.random() < 0.5 ? '#ff5e3a' : '#ffcf40',
      life: 0.32 + Math.random() * 0.22,
      maxLife: 0.54,
      drag: 2.5,
    });
  }

  spawnHitBurst(x, y, color = '#ff4757', count = 8) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 130;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size: 2.5 + Math.random() * 3,
        color,
        life: 0.28 + Math.random() * 0.22,
        maxLife: 0.5,
        drag: 6,
      });
    }
  }

  spawnMuzzleFlash(x, y, angle, color = '#ffe082') {
    this.particles.push({
      x: x + Math.cos(angle) * 18,
      y: y + Math.sin(angle) * 18,
      vx: Math.cos(angle) * 40,
      vy: Math.sin(angle) * 40,
      size: 11,
      color,
      life: 0.07,
      maxLife: 0.07,
      drag: 0,
    });
  }

  triggerExplosion(x, y, radius = 135, damage = 90, source = 'player') {
    this.game.addCameraShake(14);
    if (this.game.audio) this.game.audio.playExplosion();
    if (this.game.pedestrians) this.game.pedestrians.triggerPanicNear(x, y, 540);

    // Core fiery blast + lingering smoke cloud
    for (let i = 0; i < 34; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 260;
      const isSmoke = i > 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size: isSmoke ? 14 + Math.random() * 14 : 8 + Math.random() * 12,
        color: isSmoke ? '#2c3240' : i % 3 === 0 ? '#fff3b0' : i % 2 === 0 ? '#ff9f1c' : '#ff3d5a',
        life: isSmoke ? 0.9 + Math.random() * 0.6 : 0.35 + Math.random() * 0.35,
        maxLife: isSmoke ? 1.5 : 0.7,
        drag: isSmoke ? 2.2 : 3.6,
        grow: isSmoke,
      });
    }

    // Splash damage to player, peds, enemies, police, and nearby vehicles
    const p = this.game.player;
    const dPlayer = Math.hypot(p.x - x, p.y - y);
    if (dPlayer < radius) {
      const scale = 1 - dPlayer / radius;
      this.damagePlayer(Math.round(damage * scale * 0.65));
    }

    if (this.game.vehicles) {
      for (let i = 0; i < this.game.vehicles.list.length; i += 1) {
        const v = this.game.vehicles.list[i];
        const d = Math.hypot(v.x - x, v.y - y);
        if (d > 5 && d < radius) {
          this.game.vehicles.damageVehicle(v, damage * (1 - d / radius), source);
        }
      }
    }

    if (this.game.pedestrians) {
      for (let i = 0; i < this.game.pedestrians.list.length; i += 1) {
        const ped = this.game.pedestrians.list[i];
        if (!ped.alive) continue;
        const d = Math.hypot(ped.x - x, ped.y - y);
        if (d < radius) {
          this.game.pedestrians.damagePed(ped, damage * (1 - d / radius), source);
        }
      }
    }

    if (this.game.police) {
      for (let i = 0; i < this.game.police.officers.length; i += 1) {
        const off = this.game.police.officers[i];
        if (!off.alive) continue;
        const d = Math.hypot(off.x - x, off.y - y);
        if (d < radius) {
          this.game.police.damageOfficer(off, damage * (1 - d / radius));
        }
      }
      if (source === 'player') {
        this.game.police.reportCrime(2, x, y, 'Explosive destruction');
      }
    }

    if (this.game.missions && this.game.missions.enemies) {
      for (let i = 0; i < this.game.missions.enemies.length; i += 1) {
        const e = this.game.missions.enemies[i];
        if (!e.alive) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d < radius) {
          this.game.missions.damageEnemy(e, damage * (1 - d / radius));
        }
      }
    }
  }

  fireProjectile(x, y, angle, weapon, owner = 'player') {
    const pellets = weapon.pellets || 1;
    const spread = weapon.spread || 0.04;

    this.spawnMuzzleFlash(x, y, angle, weapon.color);

    for (let i = 0; i < pellets; i += 1) {
      const a = angle + (Math.random() - 0.5) * spread * 2;
      const vx = Math.cos(a) * weapon.speed;
      const vy = Math.sin(a) * weapon.speed;
      this.projectiles.push({
        x: x + Math.cos(a) * 18,
        y: y + Math.sin(a) * 18,
        prevX: x + Math.cos(a) * 14,
        prevY: y + Math.sin(a) * 14,
        vx,
        vy,
        damage: weapon.damage,
        owner,
        color: weapon.color,
        traveled: 0,
        maxRange: weapon.range || 520,
      });
    }
  }

  damagePlayer(amount) {
    const p = this.game.player;
    if (this.game.mode !== 'playing' || amount <= 0) return;

    let remaining = amount;
    if (p.armor > 0) {
      const absorbed = Math.min(p.armor, remaining * 0.72);
      p.armor = Math.max(0, p.armor - absorbed);
      remaining -= absorbed;
    }
    p.health = Math.max(0, p.health - remaining);
    p.damageFlash = 1.0;
    this.game.addCameraShake(5.5);

    if (p.health <= 0) {
      this._triggerWasted();
    }
  }

  _triggerWasted() {
    const p = this.game.player;
    this.game.mode = 'wasted';
    if (p.vehicle && this.game.vehicles) {
      this.game.vehicles.tryTogglePlayerVehicle();
    }
    const fee = Math.min(p.cash, 250);
    p.cash -= fee;
    if (this.game.police) {
      this.game.police.clearWanted();
    }
    if (this.game.hud) {
      this.game.hud.showRespawn('WASTED', `Treated at Solara Bay Clinic (-$${fee})`);
    }
  }

  respawnPlayer() {
    const p = this.game.player;
    p.x = LANDMARKS.clinic.x + 190;
    p.y = LANDMARKS.clinic.y + 130;
    p.vx = 0;
    p.vy = 0;
    p.health = PLAYER_CONFIG.maxHealth;
    p.armor = 25;
    p.damageFlash = 0;
    this.game.mode = 'playing';
  }

  _handlePlayerWeapons(dt) {
    const p = this.game.player;
    const input = this.game.input;

    // Weapon hotkeys 1-4 & mouse wheel
    if (input.wasPressed('Digit1')) p.weaponIndex = 0;
    if (input.wasPressed('Digit2')) p.weaponIndex = 1;
    if (input.wasPressed('Digit3')) p.weaponIndex = 2;
    if (input.wasPressed('Digit4')) p.weaponIndex = 3;
    if (input.wheelDelta !== 0) {
      p.weaponIndex = (p.weaponIndex + Math.sign(input.wheelDelta) + WEAPONS.length) % WEAPONS.length;
    }

    // Quick heal hotkey Q ($150 for +50 HP)
    if (input.wasPressed('KeyQ') && p.health < p.maxHealth && p.cash >= 150) {
      p.cash -= 150;
      p.health = Math.min(p.maxHealth, p.health + 50);
      this.addPopup(p.x, p.y - 24, '+50 HP (-$150)', '#4be89a');
      if (this.game.audio) this.game.audio.playPickup();
    }

    const weapon = WEAPONS[p.weaponIndex];
    const slot = p.ammo[p.weaponIndex];

    if (p.fireCooldown > 0) p.fireCooldown -= dt;

    if (p.reloadTimer > 0) {
      p.reloadTimer -= dt;
      if (p.reloadTimer <= 0) {
        const needed = weapon.magSize - slot.clip;
        const load = Math.min(needed, slot.reserve);
        slot.clip += load;
        slot.reserve -= load;
      }
      return;
    }

    // Auto-reload when empty
    if (slot.clip <= 0 && slot.reserve > 0 && (input.mouseJustPressed || input.mouseDown)) {
      p.reloadTimer = weapon.reloadTime;
      this.addPopup(p.x, p.y - 24, 'RELOADING...', '#36e2ec');
      return;
    }

    const wantsFire = weapon.auto ? input.mouseDown : input.mouseJustPressed;
    if (wantsFire && p.fireCooldown <= 0 && slot.clip > 0) {
      slot.clip -= 1;
      p.fireCooldown = weapon.fireRate;
      const aimAngle = Math.atan2(input.mouseWorld.y - p.y, input.mouseWorld.x - p.x);
      this.fireProjectile(p.x, p.y, aimAngle, weapon, 'player');
      this.game.addCameraShake(weapon.id === 'shotgun' ? 6.5 : 2.6);
      if (this.game.audio) this.game.audio.playGunshot(weapon.id);
      if (this.game.pedestrians) this.game.pedestrians.triggerPanicNear(p.x, p.y, 420);
      if (this.game.police && Math.random() < 0.32) {
        this.game.police.reportCrime(1, p.x, p.y, 'Discharging firearm in public');
      }
    }
  }

  _checkServiceZones(dt) {
    if (this.serviceCooldown > 0) {
      this.serviceCooldown -= dt;
      return;
    }
    const p = this.game.player;
    const zones = this.game.world.serviceZones;
    for (let i = 0; i < zones.length; i += 1) {
      const z = zones[i];
      if (Math.hypot(p.x - z.x, p.y - z.y) > z.radius) continue;
      if (z.id === 'garage' && p.vehicle && p.cash >= 200) {
        const v = p.vehicle;
        const needsService = v.hp < v.maxHp || (this.game.police && this.game.police.wantedLevel > 0);
        if (needsService) {
          p.cash -= 200;
          v.hp = v.maxHp;
          if (!v.isPolice) {
            const paintPool = ['#ff3d68', '#00d9e8', '#ffb347', '#4be89a', '#a855f7'];
            v.color = paintPool[Math.floor(Math.random() * paintPool.length)];
          }
          if (this.game.police) this.game.police.clearWanted();
          this.addPopup(p.x, p.y - 30, 'REPAIRED & HEAT CLEARED (-$200)', '#ffb347');
          if (this.game.audio) this.game.audio.playPickup();
          this.serviceCooldown = 4.0;
        }
      } else if (z.id === 'armory' && p.cash >= 300) {
        const needsGear = p.armor < p.maxArmor || p.ammo.some((a, idx) => a.reserve < WEAPONS[idx].reserveMax);
        if (needsGear) {
          p.cash -= 300;
          p.armor = p.maxArmor;
          for (let w = 0; w < WEAPONS.length; w += 1) {
            p.ammo[w].clip = WEAPONS[w].magSize;
            p.ammo[w].reserve = WEAPONS[w].reserveMax;
          }
          this.addPopup(p.x, p.y - 30, 'FULL AMMO & ARMOR (-$300)', '#ff5e7e');
          if (this.game.audio) this.game.audio.playPickup();
          this.serviceCooldown = 4.0;
        }
      }
    }
  }

  update(dt) {
    this._handlePlayerWeapons(dt);
    this._checkServiceZones(dt);

    const world = this.game.world;
    const p = this.game.player;

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const b = this.projectiles[i];
      b.prevX = b.x;
      b.prevY = b.y;
      const stepX = b.vx * dt;
      const stepY = b.vy * dt;
      b.x += stepX;
      b.y += stepY;
      b.traveled += Math.hypot(stepX, stepY);

      let remove = b.traveled >= b.maxRange;

      // Building impact
      if (!remove && world.isSolidAt(b.x, b.y, 0)) {
        this.spawnSparks(b.x, b.y, 4);
        remove = true;
      }

      // Hit Player (enemy/police bullet)
      if (!remove && b.owner !== 'player') {
        const hitR = p.vehicle ? 28 : 15;
        if (Math.hypot(b.x - p.x, b.y - p.y) < hitR) {
          if (p.vehicle && this.game.vehicles) {
            this.game.vehicles.damageVehicle(p.vehicle, b.damage * 0.65, b.owner);
            this.damagePlayer(b.damage * 0.25);
          } else {
            this.damagePlayer(b.damage);
          }
          this.spawnSparks(b.x, b.y, 5);
          remove = true;
        }
      }

      // Hit Mission Enemies
      if (!remove && b.owner === 'player' && this.game.missions && this.game.missions.enemies) {
        const enemies = this.game.missions.enemies;
        for (let j = 0; j < enemies.length; j += 1) {
          const e = enemies[j];
          if (!e.alive) continue;
          if (Math.hypot(b.x - e.x, b.y - e.y) < 17) {
            this.game.missions.damageEnemy(e, b.damage);
            this.spawnHitBurst(b.x, b.y, '#ff4757', 6);
            remove = true;
            break;
          }
        }
      }

      // Hit Police Officers
      if (!remove && b.owner === 'player' && this.game.police) {
        const officers = this.game.police.officers;
        for (let j = 0; j < officers.length; j += 1) {
          const off = officers[j];
          if (!off.alive) continue;
          if (Math.hypot(b.x - off.x, b.y - off.y) < 17) {
            this.game.police.damageOfficer(off, b.damage);
            this.spawnHitBurst(b.x, b.y, '#36c5ff', 6);
            remove = true;
            break;
          }
        }
      }

      // Hit Pedestrians
      if (!remove && b.owner === 'player' && this.game.pedestrians) {
        const peds = this.game.pedestrians.list;
        for (let j = 0; j < peds.length; j += 1) {
          const ped = peds[j];
          if (!ped.alive) continue;
          if (Math.hypot(b.x - ped.x, b.y - ped.y) < 14) {
            this.game.pedestrians.damagePed(ped, b.damage, 'player');
            remove = true;
            break;
          }
        }
      }

      // Hit Vehicles
      if (!remove && this.game.vehicles) {
        const cars = this.game.vehicles.list;
        for (let j = 0; j < cars.length; j += 1) {
          const v = cars[j];
          if (b.owner === 'player' && v === p.vehicle) continue;
          if (b.owner === 'police' && v.isPolice) continue;
          if (Math.hypot(b.x - v.x, b.y - v.y) < 28) {
            this.game.vehicles.damageVehicle(v, b.damage * 0.9, b.owner);
            this.spawnSparks(b.x, b.y, 5);
            if (b.owner === 'player' && v.isPolice && this.game.police) {
              this.game.police.reportCrime(2, v.x, v.y, 'Firing on SBPD patrol');
            }
            remove = true;
            break;
          }
        }
      }

      if (remove) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.drag) {
        const factor = Math.exp(-pt.drag * dt);
        pt.vx *= factor;
        pt.vy *= factor;
      }
    }

    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i -= 1) {
      const pop = this.popups[i];
      pop.life -= dt;
      pop.y += pop.vy * dt;
      if (pop.life <= 0) {
        this.popups.splice(i, 1);
      }
    }
  }
}
