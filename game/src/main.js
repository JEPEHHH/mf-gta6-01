// Solara Bay main entry: game loop, state management, camera, module wiring, and deterministic shot staging.

import { WORLD, PLAYER_CONFIG, WEAPONS, RADIO_STATIONS, getDistrictAt } from './config.js';
import { InputManager } from './input.js';
import { CityWorld } from './world.js';
import { WorldRenderer } from './render.js';
import { VehicleSystem } from './vehicles.js';
import { PedestrianSystem } from './pedestrians.js';
import { PoliceSystem } from './police.js';
import { CombatSystem } from './combat.js';
import { MissionSystem } from './missions.js';
import { AudioEngine } from './audio.js';
import { SaveManager } from './save.js';
import { HudController } from './hud.js';

export class SolaraBayGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.input = new InputManager(this.canvas);
    this.world = new CityWorld(2026);
    this.renderer = new WorldRenderer(this.canvas);

    this.mode = 'menu'; // 'menu' | 'playing' | 'paused' | 'wasted'
    this.elapsed = 0;
    this.timeOfDay = 17.65; // Lush golden-hour sunset lighting
    this.camera = {
      x: 3440,
      y: 1460,
      zoom: 0.9,
      shake: 0,
    };

    this.player = this._createInitialPlayer();
    this.vehicles = new VehicleSystem(this, 4041);
    this.pedestrians = new PedestrianSystem(this, 8821);
    this.police = new PoliceSystem(this);
    this.combat = new CombatSystem(this);
    this.missions = new MissionSystem(this);
    this.audio = new AudioEngine();
    this.save = new SaveManager();
    this.hud = new HudController(this);

    this._lastTimestamp = 0;
    this._accumulator = 0;
    this._isShotMode = false;

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    this._checkQueryShot();
  }

  _createInitialPlayer() {
    return {
      x: 3560,
      y: 1490,
      vx: 0,
      vy: 0,
      angle: 0,
      health: PLAYER_CONFIG.maxHealth,
      maxHealth: PLAYER_CONFIG.maxHealth,
      armor: 50,
      maxArmor: PLAYER_CONFIG.maxArmor,
      cash: 1250,
      respect: 100,
      vehicle: null,
      weaponIndex: 0,
      ammo: WEAPONS.map((w) => ({ clip: w.magSize, reserve: Math.floor(w.reserveMax * 0.7) })),
      fireCooldown: 0,
      reloadTimer: 0,
      dodgeTimer: 0,
      damageFlash: 0,
      radioIndex: 0,
      stats: {
        missionsCompleted: 0,
        carsStolen: 0,
        distanceDriven: 0,
        enemiesDefeated: 0,
      },
    };
  }

  resetCareer() {
    this.world = new CityWorld(2026);
    this.player = this._createInitialPlayer();
    this.vehicles = new VehicleSystem(this, 4041);
    this.pedestrians = new PedestrianSystem(this, 8821);
    this.police = new PoliceSystem(this);
    this.combat = new CombatSystem(this);
    this.missions = new MissionSystem(this);
    this.timeOfDay = 17.65;
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.camera.zoom = 1.0;
  }

  _resizeCanvas() {
    const w = Math.max(640, window.innerWidth);
    const h = Math.max(480, window.innerHeight);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  addCameraShake(amount) {
    this.camera.shake = Math.min(18, Math.max(this.camera.shake, amount));
  }

  /** Stage deterministic showcase scenes via ?shot=chase|combat|heist|menu using the real game simulation. */
  _checkQueryShot() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return;
    this._isShotMode = true;

    if (shot === 'chase') {
      // Cover shot: high-speed Golden Hour Solara GT chase along Coral Strip with 3-Star SBPD pursuit, traffic, oceanfront & HUD
      this.mode = 'playing';
      this.hud.hideMenu();
      this.timeOfDay = 17.75;
      this.player.cash = 6850;
      this.player.respect = 420;
      this.player.weaponIndex = 1;
      this.missions.startMission(1, true);
      this.missions.stepIndex = 1;
      this.missions.showDialogue('MATEO', 'Three cruisers on my bumper down Coral Strip — hold tight!');

      const heroCar = this.vehicles.spawnVehicle('sport', 3520, 1520, -Math.PI * 0.5, {
        color: '#ff3d68',
        driver: 'player',
        parked: false,
        vx: 0,
        vy: -380,
      });
      this.player.vehicle = heroCar;
      this.player.x = heroCar.x;
      this.player.y = heroCar.y;

      this.police.setWantedLevel(3);
      const c1 = this.vehicles.spawnVehicle('police', 3494, 1690, -Math.PI * 0.48, {
        driver: 'police',
        aiRole: 'police',
        sirenOn: true,
        vx: 20,
        vy: -350,
      });
      const c2 = this.vehicles.spawnVehicle('police', 3554, 1735, -Math.PI * 0.53, {
        driver: 'police',
        aiRole: 'police',
        sirenOn: true,
        vx: -25,
        vy: -340,
      });
      this.vehicles.spawnVehicle('swat', 3518, 1845, -Math.PI * 0.5, {
        driver: 'police',
        aiRole: 'police',
        sirenOn: true,
        vx: 0,
        vy: -280,
      });
      // Nearby sports traffic & drifting tire marks
      this.vehicles.spawnVehicle('muscle', 3550, 1340, -Math.PI * 0.5, { color: '#00d9e8', isTraffic: true });
      this.vehicles.spawnVehicle('sedan', 3488, 1295, Math.PI * 0.5, { color: '#fbbf24', isTraffic: true });
      this.world.addSkidMark(3506, 1640, 3508, 1555, 0.55);
      this.world.addSkidMark(3532, 1640, 3534, 1555, 0.55);
      this.combat.spawnSparks(c1.x + 12, c1.y - 22, 10);
      this.combat.spawnSmoke(c2.x, c2.y + 18, 'rgba(220,230,240,0.55)', 11);

      for (let i = 0; i < 18; i += 1) {
        this.step(WORLD.fixedStep);
      }
      this.camera.x = heroCar.x + 130;
      this.camera.y = heroCar.y - 20;
      this.camera.zoom = 0.86;
      this.hud.update(this);
      this.renderer.render(this);
    } else if (shot === 'combat') {
      // On-foot gunfight in Coral Strip Plaza against Marlin Syndicate crew with muzzle flash, tracers, pedestrians & cover cars
      this.mode = 'playing';
      this.hud.hideMenu();
      this.timeOfDay = 18.4;
      this.player.x = 3355;
      this.player.y = 1485;
      this.player.angle = Math.PI * 0.45;
      this.player.weaponIndex = 3;
      this.player.cash = 4320;
      this.player.respect = 310;
      this.player.armor = 78;
      this.missions.startMission(2, true);
      this.police.setWantedLevel(2);

      // Parked cover vehicles + exploding syndicate car
      this.vehicles.spawnVehicle('muscle', 3255, 1530, 0.25, { color: '#ff8c24', parked: true });
      this.vehicles.spawnVehicle('police', 3515, 1595, Math.PI * 0.85, { driver: 'police', aiRole: 'police', sirenOn: true });
      this.police.officers.push({ x: 3485, y: 1625, angle: -2.4, hp: 65, alive: true, fireCooldown: 0.4, speed: 150 });

      // Live gunfire tracers & explosion sparks
      this.combat.fireProjectile(this.player.x, this.player.y, 1.38, WEAPONS[3], 'player');
      this.combat.fireProjectile(this.player.x, this.player.y, 1.68, WEAPONS[3], 'player');
      this.combat.fireProjectile(3360, 1650, -1.55, WEAPONS[1], 'enemy');
      this.combat.triggerExplosion(3435, 1640, 60, 10, 'mission');
      this.combat.addPopup(3310, 1525, '+$120', '#ffd166');

      for (let i = 0; i < 6; i += 1) {
        this.step(WORLD.fixedStep);
      }
      this.camera.x = 3385;
      this.camera.y = 1560;
      this.camera.zoom = 1.04;
      this.hud.update(this);
      this.renderer.render(this);
    } else if (shot === 'heist') {
      // Harbor Vault Heist: sunlit afternoon container docks, syndicate ambush, getaway supercar & active mission beacon
      this.mode = 'playing';
      this.hud.hideMenu();
      this.timeOfDay = 14.5;
      this.player.x = 2645;
      this.player.y = 2855;
      this.player.angle = -0.15;
      this.player.weaponIndex = 2;
      this.player.cash = 9450;
      this.player.respect = 680;
      this.missions.startMission(3, true);
      this.police.setWantedLevel(2);

      const getaway = this.vehicles.spawnVehicle('sport', 2580, 2880, 0.1, { color: '#00d9e8', parked: true });
      this.vehicles.spawnVehicle('truck', 2890, 2860, Math.PI, { color: '#ea580c', parked: true });
      this.vehicles.spawnVehicle('police', 2880, 2670, Math.PI * 0.65, { driver: 'police', aiRole: 'police', sirenOn: true });
      this.combat.fireProjectile(this.player.x, this.player.y, -0.15, WEAPONS[2], 'player');
      this.combat.spawnSparks(2740, 2765, 12);
      this.combat.addPopup(getaway.x, getaway.y - 34, 'GETAWAY READY', '#36e2ec');

      for (let i = 0; i < 4; i += 1) {
        this.step(WORLD.fixedStep);
      }
      this.camera.x = 2735;
      this.camera.y = 2835;
      this.camera.zoom = 0.96;
      this.hud.update(this);
      this.renderer.render(this);
    } else if (shot === 'menu') {
      // Start / Save Menu Overview showcasing live sun-soaked Coral Strip & Downtown skyline behind translucent card
      this.player.cash = 6850;
      this.player.respect = 420;
      this.missions.missionIndex = 3;
      this.save.save(this);
      this.mode = 'menu';
      this.timeOfDay = 17.65;
      this.camera.x = 3480;
      this.camera.y = 1480;
      this.camera.zoom = 0.84;
      this.hud.showMenu(false);
      this.renderer.render(this);
    }
  }

  step(dt) {
    this.elapsed += dt;

    if (this.input.wasPressed('Escape')) {
      if (this.mode === 'playing') {
        this.mode = 'paused';
        this.hud.showMenu(true);
      } else if (this.mode === 'paused') {
        this.mode = 'playing';
        this.hud.hideMenu();
      }
    }

    if (this.mode === 'menu') {
      this.camera.x = 3420 + Math.cos(this.elapsed * 0.14) * 320;
      this.camera.y = 1440 + Math.sin(this.elapsed * 0.12) * 260;
      this.camera.zoom = 0.86;
      this.vehicles.update(dt, true);
      this.pedestrians.update(dt, true);
      return;
    }

    if (this.mode !== 'playing') {
      return;
    }

    this.timeOfDay = (this.timeOfDay + dt / 90) % 24;
    if (this.input.wasPressed('KeyT')) {
      this.timeOfDay = (this.timeOfDay + 4) % 24;
    }
    if (this.input.wasPressed('KeyR')) {
      this.player.radioIndex = (this.player.radioIndex + 1) % RADIO_STATIONS.length;
    }
    if (this.input.mouseJustPressed || this.input.keys.size > 0) {
      this.audio.unlock();
    }

    this.input.updateMouseWorld(this.camera, this.canvas.width, this.canvas.height);

    if (!this.player.vehicle) {
      this._updatePlayerOnFoot(dt);
    }

    this.vehicles.update(dt, false);
    this.pedestrians.update(dt, false);
    this.police.update(dt);
    this.combat.update(dt);
    this.missions.update(dt);
    this.audio.update(dt, this);

    this._updateCamera(dt);
    this.hud.update(this);
  }

  _updatePlayerOnFoot(dt) {
    const p = this.player;
    const move = this.input.getMoveVector();
    const sprinting = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight');

    if (this.input.wasPressed('Space') && p.dodgeTimer <= 0 && (move.x !== 0 || move.y !== 0)) {
      p.dodgeTimer = PLAYER_CONFIG.dodgeDuration;
    }

    let speed = sprinting ? PLAYER_CONFIG.sprintSpeed : PLAYER_CONFIG.walkSpeed;
    if (p.dodgeTimer > 0) {
      p.dodgeTimer = Math.max(0, p.dodgeTimer - dt);
      speed = PLAYER_CONFIG.dodgeSpeed;
    }

    p.vx = move.x * speed;
    p.vy = move.y * speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    this.world.resolveCircleCollision(p, PLAYER_CONFIG.radius);

    p.angle = Math.atan2(this.input.mouseWorld.y - p.y, this.input.mouseWorld.x - p.x);

    if (p.damageFlash > 0) {
      p.damageFlash = Math.max(0, p.damageFlash - dt * 2.5);
    }

    this.currentDistrict = getDistrictAt(p.x, p.y);
  }

  _updateCamera(dt) {
    const p = this.player;
    const targetX = p.vehicle ? p.vehicle.x : p.x;
    const targetY = p.vehicle ? p.vehicle.y : p.y;
    const speed = p.vehicle ? Math.hypot(p.vehicle.vx, p.vehicle.vy) : Math.hypot(p.vx, p.vy);

    const leadDist = p.vehicle ? Math.min(140, speed * 0.28) : 55;
    const leadAngle = p.vehicle ? p.vehicle.angle : p.angle;
    const desiredX = targetX + Math.cos(leadAngle) * leadDist;
    const desiredY = targetY + Math.sin(leadAngle) * leadDist;

    const smooth = 1 - Math.exp(-6.8 * dt);
    this.camera.x += (desiredX - this.camera.x) * smooth;
    this.camera.y += (desiredY - this.camera.y) * smooth;

    const desiredZoom = p.vehicle
      ? Math.max(0.74, 0.98 - (speed / 650) * 0.22)
      : 1.06;
    this.camera.zoom += (desiredZoom - this.camera.zoom) * (1 - Math.exp(-4.5 * dt));

    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - dt * 28);
    }
  }

  start() {
    if (this._isShotMode) {
      return;
    }
    const loop = (timestamp) => {
      if (!this._lastTimestamp) this._lastTimestamp = timestamp;
      const frameDt = Math.min(0.05, (timestamp - this._lastTimestamp) / 1000);
      this._lastTimestamp = timestamp;

      this._accumulator += frameDt;
      while (this._accumulator >= WORLD.fixedStep) {
        this.step(WORLD.fixedStep);
        this.input.endFrame();
        this._accumulator -= WORLD.fixedStep;
      }

      this.renderer.render(this);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

const game = new SolaraBayGame();
window.__SOLARA_BAY__ = game;
game.start();
