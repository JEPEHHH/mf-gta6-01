// Interactive Minimap, Wanted Stars, Weapon HUD, Mission Tracker, and Start/Pause/Save Menu UI.

import { WORLD, WEAPONS, RADIO_STATIONS, getDistrictAt, getLightingForHour } from './config.js';
import { STORY_MISSIONS } from './missions.js';

export class HudController {
  constructor(game) {
    this.game = game;
    this.hudEl = document.getElementById('hud');
    this.menuEl = document.getElementById('menu-overlay');
    this.respawnEl = document.getElementById('respawn-overlay');

    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    this.els = {
      missionTag: document.getElementById('mission-tag'),
      missionProgress: document.getElementById('mission-progress'),
      missionTitle: document.getElementById('mission-title'),
      missionObjective: document.getElementById('mission-objective'),
      missionTimer: document.getElementById('mission-timer'),
      actionBanner: document.getElementById('action-banner'),
      actionBannerTitle: document.getElementById('action-banner-title'),
      actionBannerSub: document.getElementById('action-banner-sub'),
      wantedStars: Array.from(document.querySelectorAll('#wanted-stars .star')),
      cash: document.getElementById('hud-cash'),
      respect: document.getElementById('hud-respect'),
      weaponName: document.getElementById('hud-weapon-name'),
      ammo: document.getElementById('hud-ammo'),
      weaponSlots: Array.from(document.querySelectorAll('#weapon-slots .slot')),
      clock: document.getElementById('hud-clock'),
      phase: document.getElementById('hud-phase'),
      district: document.getElementById('hud-district'),
      barHealth: document.getElementById('bar-health'),
      valHealth: document.getElementById('val-health'),
      barArmor: document.getElementById('bar-armor'),
      valArmor: document.getElementById('val-armor'),
      contextPrompt: document.getElementById('context-prompt'),
      dialogueBox: document.getElementById('dialogue-box'),
      dialogueSpeaker: document.getElementById('dialogue-speaker'),
      dialogueText: document.getElementById('dialogue-text'),
      radioName: document.getElementById('radio-name'),
      speedoCard: document.getElementById('speedo-card'),
      vehicleName: document.getElementById('vehicle-name'),
      speedVal: document.getElementById('speed-val'),
      vehicleHpFill: document.getElementById('vehicle-hp-fill'),
      saveSummary: document.getElementById('save-summary'),
      menuToast: document.getElementById('menu-toast'),
      btnPlay: document.getElementById('btn-play'),
      btnResume: document.getElementById('btn-resume'),
      btnContinue: document.getElementById('btn-continue'),
      btnSave: document.getElementById('btn-save'),
      btnNew: document.getElementById('btn-new'),
      btnAudio: document.getElementById('btn-audio'),
      btnRespawn: document.getElementById('btn-respawn'),
      respawnTitle: document.getElementById('respawn-title'),
      respawnSub: document.getElementById('respawn-sub'),
    };

    this._bindMenuControls();
    this.refreshMenu();
  }

  _bindMenuControls() {
    this.els.btnPlay?.addEventListener('click', () => {
      this.game.audio?.unlock();
      this.hideMenu();
      this.game.mode = 'playing';
    });

    this.els.btnResume?.addEventListener('click', () => {
      this.game.audio?.unlock();
      this.hideMenu();
      this.game.mode = 'playing';
    });

    this.els.btnContinue?.addEventListener('click', () => {
      this.game.audio?.unlock();
      if (this.game.save) {
        this.game.save.loadInto(this.game);
      }
      this.hideMenu();
      this.game.mode = 'playing';
    });

    this.els.btnSave?.addEventListener('click', () => {
      if (this.game.save && this.game.save.save(this.game)) {
        this.refreshMenu();
        this.els.menuToast?.classList.remove('hidden');
        this.els.menuToast.textContent = 'Career saved to localStorage!';
      }
    });

    this.els.btnNew?.addEventListener('click', () => {
      this.game.audio?.unlock();
      this.game.resetCareer();
      this.hideMenu();
      this.game.mode = 'playing';
    });

    this.els.btnAudio?.addEventListener('click', () => {
      if (!this.game.audio) return;
      const muted = this.game.audio.toggleMute();
      this.els.btnAudio.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
    });

    this.els.btnRespawn?.addEventListener('click', () => {
      this.respawnEl?.classList.add('hidden');
      this.game.combat?.respawnPlayer();
    });
  }

  showMenu(isPaused = false) {
    this.refreshMenu(isPaused);
    this.menuEl?.classList.remove('hidden');
    if (isPaused) {
      this.hudEl?.classList.remove('hidden');
    } else {
      this.hudEl?.classList.add('hidden');
    }
  }

  hideMenu() {
    this.menuEl?.classList.add('hidden');
    this.hudEl?.classList.remove('hidden');
    this.els.menuToast?.classList.add('hidden');
  }

  showRespawn(title, sub) {
    if (this.els.respawnTitle) this.els.respawnTitle.textContent = title;
    if (this.els.respawnSub) this.els.respawnSub.textContent = sub;
    this.respawnEl?.classList.remove('hidden');
  }

  refreshMenu(isPaused = false) {
    const hasSave = this.game.save ? this.game.save.hasSave() : false;
    if (this.els.saveSummary && this.game.save) {
      this.els.saveSummary.textContent = this.game.save.describeSave();
    }
    this.els.btnPlay?.classList.toggle('hidden', isPaused);
    this.els.btnResume?.classList.toggle('hidden', !isPaused);
    this.els.btnSave?.classList.toggle('hidden', !isPaused);
    this.els.btnContinue?.classList.toggle('hidden', !hasSave || isPaused);
  }

  update(game) {
    const p = game.player;

    // Economy & Vitals
    this.els.cash.textContent = `$${Math.floor(p.cash).toLocaleString()}`;
    this.els.respect.textContent = `REP ${Math.floor(p.respect)}`;

    const hpPct = Math.max(0, Math.min(100, (p.health / p.maxHealth) * 100));
    const armPct = Math.max(0, Math.min(100, (p.armor / p.maxArmor) * 100));
    this.els.barHealth.style.width = `${hpPct}%`;
    this.els.valHealth.textContent = `${Math.ceil(p.health)}`;
    this.els.barArmor.style.width = `${armPct}%`;
    this.els.valArmor.textContent = `${Math.ceil(p.armor)}`;

    // Weapon info
    const weapon = WEAPONS[p.weaponIndex];
    const ammo = p.ammo[p.weaponIndex];
    this.els.weaponName.textContent = weapon.name;
    this.els.ammo.textContent = p.reloadTimer > 0 ? 'RELOAD' : `${ammo.clip} / ${ammo.reserve}`;
    for (let i = 0; i < this.els.weaponSlots.length; i += 1) {
      this.els.weaponSlots[i].classList.toggle('active', i === p.weaponIndex);
    }

    // Wanted Stars with red/blue strobe when actively pursued
    const wanted = game.police ? game.police.wantedLevel : 0;
    const seen = game.police ? game.police.playerSeen : false;
    const strobe = Math.floor(game.elapsed * 8) % 2 === 0;
    for (let i = 0; i < this.els.wantedStars.length; i += 1) {
      const starEl = this.els.wantedStars[i];
      const active = i < wanted;
      starEl.classList.toggle('active', active && !seen);
      starEl.classList.toggle('flashing-red', active && seen && strobe);
      starEl.classList.toggle('flashing-blue', active && seen && !strobe);
    }

    // Time of Day & District
    const totalMins = Math.floor(game.timeOfDay * 60);
    const hh = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
    const mm = String(totalMins % 60).padStart(2, '0');
    this.els.clock.textContent = `${hh}:${mm}`;
    this.els.phase.textContent = getLightingForHour(game.timeOfDay).phase;
    this.els.district.textContent = getDistrictAt(p.x, p.y).name;

    // Radio
    const station = RADIO_STATIONS[p.radioIndex] || RADIO_STATIONS[0];
    this.els.radioName.textContent = station.name;

    // Speedometer & Context Prompt
    if (p.vehicle) {
      const v = p.vehicle;
      const kmh = Math.round(Math.hypot(v.vx, v.vy) * 0.36);
      this.els.speedoCard.classList.remove('hidden');
      this.els.vehicleName.textContent = v.name;
      this.els.speedVal.textContent = String(kmh);
      this.els.vehicleHpFill.style.width = `${Math.max(0, (v.hp / v.maxHp) * 100)}%`;
      this.els.contextPrompt.classList.add('hidden');
    } else {
      this.els.speedoCard.classList.add('hidden');
      const nearCar = game.vehicles ? game.vehicles.findNearestVehicle(p.x, p.y) : null;
      if (nearCar) {
        this.els.contextPrompt.textContent = `Press [E] to ${nearCar.driver ? 'steal' : 'drive'} ${nearCar.name}`;
        this.els.contextPrompt.classList.remove('hidden');
      } else {
        this.els.contextPrompt.classList.add('hidden');
      }
    }

    // Mission Panel, Banner & Dialogue
    if (game.missions) {
      const m = game.missions.getCurrentMission();
      const step = game.missions.getCurrentStep();
      this.els.missionTag.textContent = m.isSide ? 'SIDE CONTRACT' : 'STORY MISSION';
      this.els.missionProgress.textContent = m.isSide
        ? 'FREE ROAM'
        : `${Math.min(STORY_MISSIONS.length, game.missions.missionIndex + 1)} / ${STORY_MISSIONS.length}`;
      this.els.missionTitle.textContent = m.title;
      this.els.missionObjective.textContent = step ? step.objective : 'Explore Solara Bay';

      if (game.missions.hasTimer && game.missions.timer > 0) {
        const secs = Math.ceil(game.missions.timer);
        const mins = String(Math.floor(secs / 60)).padStart(2, '0');
        const rem = String(secs % 60).padStart(2, '0');
        this.els.missionTimer.textContent = `${mins}:${rem}`;
        this.els.missionTimer.classList.remove('hidden');
      } else {
        this.els.missionTimer.classList.add('hidden');
      }

      if (game.missions.banner) {
        this.els.actionBannerTitle.textContent = game.missions.banner.title;
        this.els.actionBannerSub.textContent = game.missions.banner.subtitle;
        this.els.actionBanner.classList.remove('hidden');
      } else {
        this.els.actionBanner.classList.add('hidden');
      }

      if (game.missions.dialogue) {
        this.els.dialogueSpeaker.textContent = `${game.missions.dialogue.speaker}:`;
        this.els.dialogueText.textContent = game.missions.dialogue.text;
        this.els.dialogueBox.classList.remove('hidden');
      } else {
        this.els.dialogueBox.classList.add('hidden');
      }
    }

    this._renderMinimap(game);
  }

  _renderMinimap(game) {
    const ctx = this.minimapCtx;
    const mw = this.minimapCanvas.width;
    const mh = this.minimapCanvas.height;
    const p = game.player;
    const world = game.world;
    const scale = 0.088;

    ctx.save();
    ctx.fillStyle = '#0d3f63';
    ctx.fillRect(0, 0, mw, mh);

    ctx.translate(mw * 0.5, mh * 0.5);
    ctx.scale(scale, scale);
    ctx.translate(-p.x, -p.y);

    // Land & beach
    ctx.fillStyle = '#1f293a';
    ctx.fillRect(0, 0, WORLD.oceanStartX, WORLD.harborWaterY);
    ctx.fillStyle = '#d4b47e';
    ctx.fillRect(WORLD.beachStartX, 0, WORLD.oceanStartX - WORLD.beachStartX, WORLD.harborWaterY);

    // Parks
    ctx.fillStyle = '#256c4b';
    for (let i = 0; i < world.parks.length; i += 1) {
      const pk = world.parks[i];
      ctx.fillRect(pk.x, pk.y, pk.w, pk.h);
    }

    // Roads
    ctx.fillStyle = '#475569';
    const rw = world.roadWidth;
    for (let i = 0; i < world.avenuesX.length; i += 1) {
      ctx.fillRect(world.avenuesX[i] - rw * 0.5, 0, rw, WORLD.harborWaterY);
    }
    for (let i = 0; i < world.avenuesY.length; i += 1) {
      ctx.fillRect(0, world.avenuesY[i] - rw * 0.5, WORLD.beachStartX, rw);
    }

    // Buildings
    ctx.fillStyle = '#334155';
    for (let i = 0; i < world.buildings.length; i += 1) {
      const b = world.buildings[i];
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Service zones (Garage / Armory)
    for (let i = 0; i < world.serviceZones.length; i += 1) {
      const z = world.serviceZones[i];
      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.arc(z.x, z.y, 46, 0, Math.PI * 2);
      ctx.fill();
    }

    // Police vehicles & officers (flashing red/blue blips)
    const flash = Math.floor(game.elapsed * 9) % 2 === 0;
    if (game.vehicles) {
      for (let i = 0; i < game.vehicles.list.length; i += 1) {
        const v = game.vehicles.list[i];
        if (v.wrecked) continue;
        if (v.isPolice && v.sirenOn) {
          ctx.fillStyle = flash ? '#ff3b5c' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(v.x, v.y, 44, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Mission Enemies
    if (game.missions && game.missions.enemies) {
      ctx.fillStyle = '#ff4757';
      for (let i = 0; i < game.missions.enemies.length; i += 1) {
        const e = game.missions.enemies[i];
        if (!e.alive) continue;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 38, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mission Waypoint (clamped to minimap border when far)
    const wp = game.missions ? game.missions.getActiveWaypoint() : null;
    if (wp) {
      ctx.fillStyle = wp.color || '#ffd166';
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 56, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player directional triangle
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0b1220';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(-44, -40);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-44, 40);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Edge direction indicator if waypoint is outside minimap viewport
    if (wp) {
      const sx = (wp.x - p.x) * scale;
      const sy = (wp.y - p.y) * scale;
      if (Math.abs(sx) > mw * 0.45 || Math.abs(sy) > mh * 0.45) {
        const ang = Math.atan2(sy, sx);
        const ex = mw * 0.5 + Math.cos(ang) * (mw * 0.44);
        const ey = mh * 0.5 + Math.sin(ang) * (mh * 0.42);
        ctx.fillStyle = wp.color || '#ffd166';
        ctx.beginPath();
        ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
