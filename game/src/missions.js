// Original 6-mission Solara Bay story campaign, syndicate enemy AI, and endless side contracts.

import { LANDMARKS, WEAPONS } from './config.js';

export const STORY_MISSIONS = [
  {
    id: 'coastal_drop',
    title: 'Coastal Drop',
    rewardCash: 1500,
    rewardRep: 120,
    steps: [
      {
        type: 'goto',
        x: 3960,
        y: 1500,
        radius: 68,
        label: 'ELENA',
        objective: 'Meet Elena Vance at Coral Strip Pier',
        dialogue: { speaker: 'ELENA', text: 'Mateo! Grab a fast ride and meet me by Coral Strip Pier.' },
      },
      {
        type: 'goto_vehicle',
        x: 760,
        y: 1200,
        radius: 75,
        label: 'VANCE CUSTOMS',
        objective: 'Deliver the encrypted ledger to Vance Customs in Old Palms',
        dialogue: { speaker: 'ELENA', text: 'Viktor Solis has eyes everywhere. Drive the ledger straight to Vance Customs!' },
        triggerWanted: 1,
      },
    ],
  },
  {
    id: 'neon_repo',
    title: 'Neon Repo',
    rewardCash: 2400,
    rewardRep: 180,
    steps: [
      {
        type: 'goto',
        x: 2240,
        y: 1020,
        radius: 90,
        label: 'TARGET GT',
        objective: 'Reach Solara Downtown Plaza and boost Solis’s yellow Solara GT',
        dialogue: { speaker: 'ELENA', text: 'Solis parked his prized yellow Solara GT in Downtown. Steal it.' },
        spawnGuards: [
          { x: 2180, y: 980, hp: 70 },
          { x: 2290, y: 1050, hp: 70 },
        ],
      },
      {
        type: 'clear_and_escape',
        x: 760,
        y: 1200,
        radius: 80,
        label: 'GARAGE DROP',
        objective: 'Escape the SBPD chase and bring a vehicle to Vance Customs',
        dialogue: { speaker: 'MATEO', text: 'Sirens already! Time to drift through Downtown and shake the heat.' },
        triggerWanted: 2,
      },
    ],
  },
  {
    id: 'pier_ambush',
    title: 'Coral Strip Ambush',
    rewardCash: 3200,
    rewardRep: 250,
    steps: [
      {
        type: 'eliminate',
        x: 3360,
        y: 1600,
        radius: 110,
        label: 'SYNDICATE',
        objective: 'Eliminate the Marlin Syndicate crew holding Coral Strip Boulevard',
        dialogue: { speaker: 'ELENA', text: 'Solis sent enforcers to lock down Coral Strip. Clear them out on foot or drive-by!' },
        spawnGuards: [
          { x: 3310, y: 1540, hp: 80 },
          { x: 3420, y: 1550, hp: 80 },
          { x: 3360, y: 1650, hp: 85 },
          { x: 3440, y: 1640, hp: 85 },
          { x: 3280, y: 1620, hp: 90 },
        ],
        triggerWanted: 2,
      },
    ],
  },
  {
    id: 'harbor_heist',
    title: 'Harbor Vault Heist',
    rewardCash: 5000,
    rewardRep: 350,
    steps: [
      {
        type: 'eliminate',
        x: 2740,
        y: 2820,
        radius: 120,
        label: 'HARBOR VAULT',
        objective: 'Raid Solis’s Harbor Container Yard and clear the dock guards',
        dialogue: { speaker: 'ELENA', text: 'Bearer bonds are locked in the Harbor Container Yard. Heavy resistance expected.' },
        spawnGuards: [
          { x: 2660, y: 2780, hp: 90 },
          { x: 2740, y: 2760, hp: 95 },
          { x: 2830, y: 2820, hp: 95 },
          { x: 2710, y: 2880, hp: 100 },
          { x: 2820, y: 2890, hp: 100 },
        ],
      },
      {
        type: 'goto_vehicle',
        x: 3560,
        y: 1490,
        radius: 85,
        label: 'SAFEHOUSE',
        objective: 'Escape the 3-Star SBPD pursuit back to Coral Strip Safehouse',
        dialogue: { speaker: 'DISPATCH', text: 'All SBPD units: armed heist at Harbor Docks! Establish roadblocks!' },
        triggerWanted: 3,
      },
    ],
  },
  {
    id: 'coastal_sprint',
    title: 'Golden Hour Getaway',
    rewardCash: 6500,
    rewardRep: 450,
    steps: [
      {
        type: 'goto_vehicle',
        x: 1600,
        y: 960,
        radius: 75,
        label: 'RELAY 1',
        objective: 'Hit Downtown Relay 1 before the syndicate jammer locks',
        dialogue: { speaker: 'ELENA', text: 'Floor it! Hit all three relay intersections across Solara Bay!' },
        timer: 75,
        triggerWanted: 2,
      },
      {
        type: 'goto_vehicle',
        x: 960,
        y: 2240,
        radius: 75,
        label: 'RELAY 2',
        objective: 'Race south to Old Palms Relay 2',
        dialogue: { speaker: 'MATEO', text: 'Relay one cleared! Heading south toward Old Palms!' },
      },
      {
        type: 'goto_vehicle',
        x: 3520,
        y: 2240,
        radius: 85,
        label: 'FINISH',
        objective: 'Cross the Coral Strip Promenade finish line',
        dialogue: { speaker: 'ELENA', text: 'Last stretch — bring it home to the oceanfront!' },
      },
    ],
  },
  {
    id: 'solis_takedown',
    title: 'King of Solara Bay',
    rewardCash: 12000,
    rewardRep: 800,
    steps: [
      {
        type: 'eliminate',
        x: 2040,
        y: 2780,
        radius: 135,
        label: 'VIKTOR SOLIS',
        objective: 'Take down Viktor Solis and his elite Harbor Syndicate squad',
        dialogue: { speaker: 'SOLIS', text: 'You think you can run Solara Bay, Cruz? Finish him!' },
        spawnGuards: [
          { x: 1960, y: 2740, hp: 110 },
          { x: 2040, y: 2720, hp: 160, boss: true },
          { x: 2120, y: 2750, hp: 110 },
          { x: 1990, y: 2840, hp: 115 },
          { x: 2100, y: 2840, hp: 115 },
          { x: 2040, y: 2880, hp: 120 },
        ],
        triggerWanted: 4,
      },
    ],
  },
];

export class MissionSystem {
  constructor(game) {
    this.game = game;
    this.missionIndex = 0;
    this.stepIndex = 0;
    this.enemies = [];
    this.timer = 0;
    this.hasTimer = false;
    this.dialogue = null;
    this.dialogueTimer = 0;
    this.banner = null;
    this.bannerTimer = 0;
    this.freeRoamTarget = null;
    this.startMission(0, false);
  }

  getCurrentMission() {
    if (this.missionIndex < STORY_MISSIONS.length) {
      return STORY_MISSIONS[this.missionIndex];
    }
    return {
      id: 'side_contract',
      title: 'Free Roam: Coastal Contract',
      rewardCash: 1800,
      rewardRep: 120,
      isSide: true,
      steps: [
        {
          type: 'goto',
          x: this.freeRoamTarget ? this.freeRoamTarget.x : LANDMARKS.pier.x,
          y: this.freeRoamTarget ? this.freeRoamTarget.y : LANDMARKS.pier.y,
          radius: 75,
          label: 'STASH',
          objective: 'Collect the syndicate cash drop or explore Solara Bay freely',
        },
      ],
    };
  }

  getCurrentStep() {
    const m = this.getCurrentMission();
    return m.steps[Math.min(this.stepIndex, m.steps.length - 1)];
  }

  getActiveWaypoint() {
    const step = this.getCurrentStep();
    if (!step) return null;
    if (step.type === 'eliminate') {
      const alive = this.enemies.find((e) => e.alive);
      if (alive) {
        return { x: alive.x, y: alive.y, radius: 44, label: 'TARGET', color: '#ff4757' };
      }
    }
    return {
      x: step.x,
      y: step.y,
      radius: step.radius || 58,
      label: step.label || 'OBJECTIVE',
      color: '#ffd166',
    };
  }

  showDialogue(speaker, text, duration = 6.5) {
    this.dialogue = { speaker, text };
    this.dialogueTimer = duration;
  }

  showBanner(title, subtitle, duration = 4.2) {
    this.banner = { title, subtitle };
    this.bannerTimer = duration;
  }

  startMission(index, showIntro = true) {
    this.missionIndex = index;
    this.stepIndex = 0;
    this.enemies = [];
    this.hasTimer = false;
    this.timer = 0;

    if (this.missionIndex >= STORY_MISSIONS.length) {
      this._rollFreeRoamDrop();
      if (showIntro) {
        this.showDialogue('ELENA', 'Solara Bay is ours, Mateo! Keep hitting side contracts across the city.');
      }
      return;
    }

    this._activateCurrentStep(showIntro);
  }

  _rollFreeRoamDrop() {
    const spots = [
      { x: 3820, y: 960 },
      { x: 2240, y: 1600 },
      { x: 960, y: 960 },
      { x: 2880, y: 2880 },
      { x: 1600, y: 2240 },
    ];
    this.freeRoamTarget = spots[Math.floor(Math.random() * spots.length)];
  }

  _activateCurrentStep(announce = true) {
    const step = this.getCurrentStep();
    if (!step) return;
    this.enemies = [];

    if (step.spawnGuards) {
      for (let i = 0; i < step.spawnGuards.length; i += 1) {
        const g = step.spawnGuards[i];
        this.enemies.push({
          x: g.x,
          y: g.y,
          angle: 0,
          hp: g.hp || 80,
          maxHp: g.hp || 80,
          boss: Boolean(g.boss),
          alive: true,
          fireCooldown: 0.7 + i * 0.25,
          speed: g.boss ? 132 : 122,
        });
      }
    }

    if (step.timer) {
      this.hasTimer = true;
      this.timer = step.timer;
    }

    if (step.triggerWanted && this.game.police) {
      this.game.police.reportCrime(step.triggerWanted, this.game.player.x, this.game.player.y, 'Mission heat');
    }

    if (announce && step.dialogue) {
      this.showDialogue(step.dialogue.speaker, step.dialogue.text);
    }
  }

  damageEnemy(e, amount) {
    if (!e.alive) return;
    e.hp -= amount;
    if (e.hp <= 0) {
      e.alive = false;
      this.game.player.stats.enemiesDefeated += 1;
      const bounty = e.boss ? 500 : 120;
      this.game.player.cash += bounty;
      this.game.player.respect += e.boss ? 100 : 25;
      if (this.game.combat) {
        this.game.combat.addPopup(e.x, e.y - 14, `+$${bounty}`, '#ffd166');
      }
    }
  }

  _advanceStep() {
    const m = this.getCurrentMission();
    if (m.isSide) {
      this.game.player.cash += m.rewardCash;
      this.game.player.respect += m.rewardRep;
      this.showBanner('CONTRACT COMPLETE', `+$${m.rewardCash} · +${m.rewardRep} RESPECT`);
      if (this.game.audio) this.game.audio.playMissionPassed();
      this._rollFreeRoamDrop();
      if (this.game.save) this.game.save.save(this.game);
      return;
    }

    this.stepIndex += 1;
    if (this.stepIndex < m.steps.length) {
      this._activateCurrentStep(true);
      if (this.game.audio) this.game.audio.playPickup();
    } else {
      this.game.player.cash += m.rewardCash;
      this.game.player.respect += m.rewardRep;
      this.game.player.stats.missionsCompleted = Math.max(
        this.game.player.stats.missionsCompleted,
        this.missionIndex + 1,
      );
      this.showBanner('MISSION PASSED', `${m.title.toUpperCase()} · +$${m.rewardCash} · +${m.rewardRep} REP`);
      if (this.game.audio) this.game.audio.playMissionPassed();
      this.startMission(this.missionIndex + 1, true);
      if (this.game.save) this.game.save.save(this.game);
    }
  }

  update(dt) {
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= dt;
      if (this.dialogueTimer <= 0) this.dialogue = null;
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.banner = null;
    }

    const p = this.game.player;
    const world = this.game.world;

    // Update active syndicate enemies
    const enemyWeapon = WEAPONS[1];
    for (let i = 0; i < this.enemies.length; i += 1) {
      const e = this.enemies[i];
      if (!e.alive) continue;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 640) continue;

      e.angle = Math.atan2(dy, dx);
      const hasLOS = world.hasLineOfSight(e.x, e.y, p.x, p.y);
      if (dist > 175 || !hasLOS) {
        e.x += Math.cos(e.angle) * e.speed * dt;
        e.y += Math.sin(e.angle) * e.speed * dt;
        world.resolveCircleCollision(e, 12);
      }

      e.fireCooldown -= dt;
      if (hasLOS && dist < 430 && e.fireCooldown <= 0 && this.game.combat) {
        e.fireCooldown = e.boss ? 0.52 : 0.95;
        this.game.combat.fireProjectile(
          e.x,
          e.y,
          e.angle + (Math.random() - 0.5) * 0.14,
          { ...enemyWeapon, damage: e.boss ? 15 : 10, pellets: 1, color: '#ff5e7e' },
          'enemy',
        );
        if (this.game.audio) this.game.audio.playGunshot('smg');
      }
    }

    const step = this.getCurrentStep();
    if (!step) return;

    if (this.hasTimer) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.showBanner('TIME EXPIRED', 'Restarting current mission...');
        this.startMission(this.missionIndex, true);
        return;
      }
    }

    const distToGoal = Math.hypot(p.x - step.x, p.y - step.y);
    if (step.type === 'goto' && distToGoal <= (step.radius || 68)) {
      this._advanceStep();
    } else if (step.type === 'goto_vehicle' && p.vehicle && distToGoal <= (step.radius || 75)) {
      this._advanceStep();
    } else if (step.type === 'clear_and_escape' && p.vehicle && distToGoal <= (step.radius || 80)) {
      if (this.game.police) this.game.police.clearWanted();
      this._advanceStep();
    } else if (step.type === 'eliminate') {
      const remaining = this.enemies.filter((e) => e.alive).length;
      if (remaining === 0) {
        this._advanceStep();
      }
    }
  }
}
