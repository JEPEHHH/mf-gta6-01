// LocalStorage save & load persistence for Solara Bay career progress.

import { WEAPONS, getDistrictAt } from './config.js';
import { STORY_MISSIONS } from './missions.js';

const SAVE_KEY = 'solara_bay_save_v1';

export class SaveManager {
  hasSave() {
    return this.readRaw() !== null;
  }

  readRaw() {
    try {
      const text = window.localStorage.getItem(SAVE_KEY);
      if (!text) return null;
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  save(game) {
    const p = game.player;
    const payload = {
      version: 1,
      savedAt: Date.now(),
      timeOfDay: game.timeOfDay,
      missionIndex: game.missions ? game.missions.missionIndex : 0,
      player: {
        x: Math.round(p.x),
        y: Math.round(p.y),
        health: Math.round(p.health),
        armor: Math.round(p.armor),
        cash: Math.round(p.cash),
        respect: Math.round(p.respect),
        weaponIndex: p.weaponIndex,
        ammo: p.ammo.map((a) => ({ clip: a.clip, reserve: a.reserve })),
        radioIndex: p.radioIndex,
        stats: { ...p.stats },
      },
    };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  loadInto(game) {
    const data = this.readRaw();
    if (!data || !data.player) return false;
    const p = game.player;
    const sp = data.player;

    if (p.vehicle && game.vehicles) {
      game.vehicles.tryTogglePlayerVehicle();
    }

    p.x = typeof sp.x === 'number' ? sp.x : p.x;
    p.y = typeof sp.y === 'number' ? sp.y : p.y;
    p.health = typeof sp.health === 'number' ? Math.max(25, sp.health) : 100;
    p.armor = typeof sp.armor === 'number' ? sp.armor : 50;
    p.cash = typeof sp.cash === 'number' ? sp.cash : 1250;
    p.respect = typeof sp.respect === 'number' ? sp.respect : 100;
    p.weaponIndex = typeof sp.weaponIndex === 'number' ? sp.weaponIndex % WEAPONS.length : 0;
    p.radioIndex = typeof sp.radioIndex === 'number' ? sp.radioIndex : 0;
    if (Array.isArray(sp.ammo) && sp.ammo.length === WEAPONS.length) {
      p.ammo = sp.ammo.map((a, idx) => ({
        clip: Math.min(WEAPONS[idx].magSize, Math.max(0, a.clip ?? WEAPONS[idx].magSize)),
        reserve: Math.min(WEAPONS[idx].reserveMax, Math.max(0, a.reserve ?? 60)),
      }));
    }
    if (sp.stats) {
      p.stats = { ...p.stats, ...sp.stats };
    }
    if (typeof data.timeOfDay === 'number') {
      game.timeOfDay = data.timeOfDay;
    }
    if (game.police) {
      game.police.clearWanted();
    }
    if (game.missions && typeof data.missionIndex === 'number') {
      game.missions.startMission(data.missionIndex, true);
    }
    return true;
  }

  describeSave() {
    const data = this.readRaw();
    if (!data || !data.player) {
      return 'No saved career yet — start fresh in Coral Strip.';
    }
    const sp = data.player;
    const district = getDistrictAt(sp.x || 3560, sp.y || 1490);
    const total = STORY_MISSIONS.length;
    const mDone = Math.min(total, data.missionIndex || 0);
    const mLabel = mDone >= total ? 'All Story Missions Cleared' : `Mission ${mDone + 1} / ${total}`;
    return `${mLabel} · $${(sp.cash || 0).toLocaleString()} · ${sp.respect || 0} REP · ${district.name}`;
  }
}
