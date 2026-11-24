// Solara Bay main game loop, core state, camera controller, and module coordinator.

import { WORLD, PLAYER_CONFIG, WEAPONS, getDistrictAt } from './config.js';
import { InputManager } from './input.js';
import { CityWorld } from './world.js';
import { WorldRenderer } from './render.js';
import { VehicleSystem } from './vehicles.js';
import { PedestrianSystem } from './pedestrians.js';

export class SolaraBayGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.input = new InputManager(this.canvas);
    this.world = new CityWorld(2026);
    this.renderer = new WorldRenderer(this.canvas);

    this.mode = 'menu'; // 'menu' | 'playing' | 'paused' | 'wasted'
    this.elapsed = 0;
    this.timeOfDay = 17.65; // Iconic golden-hour coastal sunset
    this.camera = {
      x: 3520,
      y: 1480,
      zoom: 1.0,
      shake: 0,
    };

    this.player = this._createInitialPlayer();
    this.vehicles = new VehicleSystem(this, 4041);
    this.pedestrians = new PedestrianSystem(this, 8821);
    this.police = null;
    this.combat = null;
    this.missions = null;
    this.audio = null;
    this.hud = null;
    this.save = null;

    this._lastTimestamp = 0;
    this._accumulator = 0;

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    this._bindBasicMenuFallback();
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
      ammo: WEAPONS.map((w) => ({ clip: w.magSize, reserve: Math.floor(w.reserveMax * 0.65) })),
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

  _resizeCanvas() {
    const w = Math.max(640, window.innerWidth);
    const h = Math.max(480, window.innerHeight);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  _bindBasicMenuFallback() {
    const playBtn = document.getElementById('btn-play');
    const menuOverlay = document.getElementById('menu-overlay');
    const hudEl = document.getElementById('hud');
    if (playBtn && !this.hud) {
      playBtn.addEventListener('click', () => {
        if (this.hud) return;
        this.mode = 'playing';
        menuOverlay?.classList.add('hidden');
        hudEl?.classList.remove('hidden');
      });
    }
  }

  addCameraShake(amount) {
    this.camera.shake = Math.min(18, Math.max(this.camera.shake, amount));
  }

  step(dt) {
    this.elapsed += dt;

    // Gentle sunlit city pan while in start menu
    if (this.mode === 'menu') {
      this.camera.x = 3420 + Math.cos(this.elapsed * 0.14) * 320;
      this.camera.y = 1440 + Math.sin(this.elapsed * 0.12) * 260;
      this.camera.zoom = 0.88;
      if (this.vehicles) this.vehicles.update(dt, true);
      if (this.pedestrians) this.pedestrians.update(dt, true);
      return;
    }

    if (this.mode !== 'playing') {
      return;
    }

    // Advance coastal time-of-day gently (1 game hour per 90 real seconds)
    this.timeOfDay = (this.timeOfDay + dt / 90) % 24;
    if (this.input.wasPressed('KeyT')) {
      this.timeOfDay = (this.timeOfDay + 4) % 24;
    }

    this.input.updateMouseWorld(this.camera, this.canvas.width, this.canvas.height);

    // Update player movement (on-foot when no vehicle)
    if (!this.player.vehicle) {
      this._updatePlayerOnFoot(dt);
    }

    if (this.vehicles) this.vehicles.update(dt, false);
    if (this.pedestrians) this.pedestrians.update(dt, false);
    if (this.police) this.police.update(dt);
    if (this.combat) this.combat.update(dt);
    if (this.missions) this.missions.update(dt);
    if (this.audio) this.audio.update(dt, this);

    this._updateCamera(dt);
    if (this.hud) this.hud.update(this);
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

    // Aim toward mouse cursor
    p.angle = Math.atan2(this.input.mouseWorld.y - p.y, this.input.mouseWorld.x - p.x);

    if (p.damageFlash > 0) {
      p.damageFlash = Math.max(0, p.damageFlash - dt * 2.5);
    }

    // Service zone quick interactions (Vance Customs / Armory) handled in combat/missions
    this.currentDistrict = getDistrictAt(p.x, p.y);
  }

  _updateCamera(dt) {
    const p = this.player;
    const targetX = p.vehicle ? p.vehicle.x : p.x;
    const targetY = p.vehicle ? p.vehicle.y : p.y;
    const speed = p.vehicle ? Math.hypot(p.vehicle.vx, p.vehicle.vy) : Math.hypot(p.vx, p.vy);

    // Look ahead in travel or aim direction
    const leadDist = p.vehicle ? Math.min(140, speed * 0.28) : 55;
    const leadAngle = p.vehicle ? p.vehicle.angle : p.angle;
    const desiredX = targetX + Math.cos(leadAngle) * leadDist;
    const desiredY = targetY + Math.sin(leadAngle) * leadDist;

    const smooth = 1 - Math.exp(-6.8 * dt);
    this.camera.x += (desiredX - this.camera.x) * smooth;
    this.camera.y += (desiredY - this.camera.y) * smooth;

    const desiredZoom = p.vehicle
      ? Math.max(0.72, 0.98 - (speed / 650) * 0.24)
      : 1.06;
    this.camera.zoom += (desiredZoom - this.camera.zoom) * (1 - Math.exp(-4.5 * dt));

    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - dt * 28);
    }
  }

  start() {
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
