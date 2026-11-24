// 2.5D Perspective-Extruded Canvas Renderer for Solara Bay.
// Renders coastal ocean waves, golden beaches, roads, sidewalks, perspective-extruded skyscrapers
// with shaded facades, glowing neon signs, rooftop pools, palms, vehicles, characters, and FX.

import { WORLD, LANDMARKS, getLightingForHour } from './config.js';

const EXTRUDE_FACTOR = 0.00195;

export class WorldRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(game) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cam = game.camera;
    const lighting = getLightingForHour(game.timeOfDay);
    const t = game.elapsed;

    ctx.save();
    ctx.fillStyle = lighting.waterDeep;
    ctx.fillRect(0, 0, width, height);

    // Camera transform (with screen shake)
    const shakeX = (Math.sin(t * 63.1) * cam.shake) || 0;
    const shakeY = (Math.cos(t * 51.7) * cam.shake) || 0;
    ctx.translate(width * 0.5 + shakeX, height * 0.5 + shakeY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    const viewHalfW = (width * 0.5) / cam.zoom + 240;
    const viewHalfH = (height * 0.5) / cam.zoom + 240;
    const bounds = {
      minX: cam.x - viewHalfW,
      maxX: cam.x + viewHalfW,
      minY: cam.y - viewHalfH,
      maxY: cam.y + viewHalfH,
    };

    this._drawOceanAndBeach(ctx, game.world, lighting, t, bounds);
    this._drawGroundAndParks(ctx, game.world, bounds);
    this._drawRoadsAndMarkings(ctx, game.world, bounds);
    this._drawSkidMarks(ctx, game.world, bounds);
    this._drawServiceZones(ctx, game.world, t);
    this._drawMissionMarkers(ctx, game.missions, t);
    this._drawBoats(ctx, game.world, t, bounds);
    this._drawUmbrellas(ctx, game.world, lighting, bounds);
    this._drawContainers(ctx, game.world, cam, lighting, bounds);

    // Pedestrians & Enemies (on foot)
    if (game.pedestrians) {
      this._drawPedestrians(ctx, game.pedestrians.list, lighting, bounds);
    }
    if (game.police && game.police.officers) {
      this._drawPoliceOfficers(ctx, game.police.officers, lighting, bounds);
    }
    if (game.missions && game.missions.enemies) {
      this._drawMissionEnemies(ctx, game.missions.enemies, lighting, bounds);
    }

    // Player (when on foot)
    if (!game.player.vehicle) {
      this._drawPlayerOnFoot(ctx, game.player, lighting, t);
    }

    // Vehicles (civilian, parked, stolen, police cruisers, SWAT)
    if (game.vehicles) {
      this._drawVehicles(ctx, game.vehicles.list, lighting, t, bounds);
    }

    // Combat projectiles, explosions & particles
    if (game.combat) {
      this._drawProjectilesAndEffects(ctx, game.combat, bounds);
    }

    // 2.5D Extruded Buildings (sorted far-to-near relative to camera center for proper overlap)
    this._drawBuildings25D(ctx, game.world, cam, lighting, t, bounds);

    // Palm Trees & Streetlamp Glows
    this._drawPalms(ctx, game.world, lighting, t, bounds);
    this._drawStreetlamps(ctx, game.world, lighting, bounds);

    // Floating Damage / Reward popups
    if (game.combat && game.combat.popups) {
      this._drawFloatingPopups(ctx, game.combat.popups);
    }

    ctx.restore();

    // Post-process coastal lighting grade & subtle cinematic vignette
    this._drawAtmosphereOverlay(ctx, width, height, lighting, game);
  }

  _drawOceanAndBeach(ctx, world, lighting, t, bounds) {
    // Base city land mass
    ctx.fillStyle = '#252c3b';
    ctx.fillRect(0, 0, WORLD.oceanStartX + 10, WORLD.harborWaterY + 10);

    // Coastal beachfront sand
    const sandGrad = ctx.createLinearGradient(WORLD.beachStartX, 0, WORLD.oceanStartX + 20, 0);
    sandGrad.addColorStop(0, '#ebd3a4');
    sandGrad.addColorStop(0.75, '#e2be84');
    sandGrad.addColorStop(1, '#c7a268');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(WORLD.beachStartX, 0, WORLD.oceanStartX - WORLD.beachStartX + 22, WORLD.harborWaterY + 12);

    // Ocean waters (East + South)
    const oceanGrad = ctx.createLinearGradient(WORLD.oceanStartX, 0, WORLD.width, 0);
    oceanGrad.addColorStop(0, lighting.waterTop);
    oceanGrad.addColorStop(0.35, '#1382ad');
    oceanGrad.addColorStop(1, lighting.waterDeep);
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(WORLD.oceanStartX, 0, WORLD.width - WORLD.oceanStartX + 400, WORLD.height + 400);

    const harborGrad = ctx.createLinearGradient(0, WORLD.harborWaterY, 0, WORLD.height);
    harborGrad.addColorStop(0, lighting.waterTop);
    harborGrad.addColorStop(1, lighting.waterDeep);
    ctx.fillStyle = harborGrad;
    ctx.fillRect(-300, WORLD.harborWaterY, WORLD.width + 600, WORLD.height - WORLD.harborWaterY + 400);

    // Animated shore surf foam along the beach
    ctx.save();
    for (let layer = 0; layer < 2; layer += 1) {
      const waveShift = Math.sin(t * 1.9 + layer * 2.1) * 9;
      ctx.beginPath();
      const startY = Math.max(0, Math.floor(bounds.minY / 40) * 40);
      const endY = Math.min(WORLD.harborWaterY, bounds.maxY + 40);
      for (let y = startY; y <= endY; y += 36) {
        const x = WORLD.oceanStartX + 6 + layer * 24 + waveShift + Math.sin(y * 0.015 + t * 2.2) * 8;
        if (y === startY) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = layer === 0 ? 'rgba(240, 252, 255, 0.72)' : 'rgba(180, 240, 255, 0.36)';
      ctx.lineWidth = layer === 0 ? 7 : 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Subtle ocean shimmer lines
    ctx.strokeStyle = 'rgba(255, 238, 195, 0.22)';
    ctx.lineWidth = 2;
    for (let y = 120; y < WORLD.height; y += 110) {
      if (y < bounds.minY || y > bounds.maxY) continue;
      for (let x = WORLD.oceanStartX + 90; x < WORLD.width; x += 180) {
        if (x < bounds.minX || x > bounds.maxX) continue;
        const sway = Math.sin(t * 1.6 + x * 0.01 + y * 0.02) * 14;
        ctx.beginPath();
        ctx.moveTo(x + sway, y);
        ctx.lineTo(x + sway + 46, y);
        ctx.stroke();
      }
    }

    // Harbor concrete seawall & dock piers
    ctx.fillStyle = '#5c6675';
    ctx.fillRect(0, WORLD.harborWaterY - 14, WORLD.oceanStartX, 22);
    ctx.fillStyle = '#3b4350';
    for (let px = 420; px < 3400; px += 640) {
      ctx.fillRect(px, WORLD.harborWaterY, 84, 175);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(px + 6, WORLD.harborWaterY + 10, 8, 155);
      ctx.fillRect(px + 70, WORLD.harborWaterY + 10, 8, 155);
      ctx.fillStyle = '#5c6675';
    }

    // Coral Strip Wooden Pier with neon archway
    const pierY = LANDMARKS.pier.y;
    ctx.fillStyle = '#8b6546';
    ctx.fillRect(WORLD.beachStartX + 40, pierY - 40, WORLD.oceanStartX - WORLD.beachStartX + 230, 80);
    ctx.strokeStyle = 'rgba(56, 36, 20, 0.45)';
    ctx.lineWidth = 2;
    for (let x = WORLD.beachStartX + 50; x < WORLD.oceanStartX + 266; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, pierY - 38);
      ctx.lineTo(x, pierY + 38);
      ctx.stroke();
    }
    // Pier neon railings
    ctx.strokeStyle = '#ff5e7e';
    ctx.lineWidth = 3;
    ctx.strokeRect(WORLD.beachStartX + 42, pierY - 38, WORLD.oceanStartX - WORLD.beachStartX + 226, 76);

    ctx.restore();
  }

  _drawGroundAndParks(ctx, world, bounds) {
    // District subtle ground tinting
    ctx.fillStyle = '#363f52';
    ctx.fillRect(0, 0, 1440, 2400); // Old Palms
    ctx.fillStyle = '#2d3647';
    ctx.fillRect(1440, 0, 1440, 2400); // Downtown
    ctx.fillStyle = '#40485b';
    ctx.fillRect(2880, 0, WORLD.beachStartX - 2880, 2400); // Coral Strip
    ctx.fillStyle = '#323942';
    ctx.fillRect(0, 2400, WORLD.beachStartX, WORLD.harborWaterY - 2400); // Harbor

    // Sidewalk aprons around blocks
    for (let i = 0; i < world.parks.length; i += 1) {
      const p = world.parks[i];
      if (p.x + p.w < bounds.minX || p.x > bounds.maxX || p.y + p.h < bounds.minY || p.y > bounds.maxY) {
        continue;
      }
      ctx.fillStyle = '#2e7d57';
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Walkways crossing the park
      ctx.fillStyle = '#cbbca3';
      ctx.fillRect(p.x + p.w * 0.5 - 16, p.y, 32, p.h);
      ctx.fillRect(p.x, p.y + p.h * 0.5 - 16, p.w, 32);

      // Central coastal fountain pond
      const cx = p.x + p.w * 0.5;
      const cy = p.y + p.h * 0.5;
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(cx, cy, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c7e0';
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  _drawRoadsAndMarkings(ctx, world, bounds) {
    const rw = world.roadWidth;
    const sw = world.sidewalkWidth;
    const halfR = rw * 0.5;

    // Sidewalks first
    ctx.fillStyle = '#9aa3b2';
    for (let i = 0; i < world.avenuesX.length; i += 1) {
      const rx = world.avenuesX[i];
      if (rx + halfR + sw < bounds.minX || rx - halfR - sw > bounds.maxX) continue;
      ctx.fillRect(rx - halfR - sw, 0, rw + sw * 2, WORLD.harborWaterY);
    }
    for (let i = 0; i < world.avenuesY.length; i += 1) {
      const ry = world.avenuesY[i];
      if (ry + halfR + sw < bounds.minY || ry - halfR - sw > bounds.maxY) continue;
      ctx.fillRect(0, ry - halfR - sw, WORLD.beachStartX, rw + sw * 2);
    }

    // Asphalt roadways
    ctx.fillStyle = '#1f2530';
    for (let i = 0; i < world.avenuesX.length; i += 1) {
      const rx = world.avenuesX[i];
      if (rx + halfR < bounds.minX || rx - halfR > bounds.maxX) continue;
      ctx.fillRect(rx - halfR, 0, rw, WORLD.harborWaterY);
    }
    for (let i = 0; i < world.avenuesY.length; i += 1) {
      const ry = world.avenuesY[i];
      if (ry + halfR < bounds.minY || ry - halfR > bounds.maxY) continue;
      ctx.fillRect(0, ry - halfR, WORLD.beachStartX, rw);
    }

    // Double yellow centerlines & dashed lane dividers
    ctx.save();
    for (let i = 0; i < world.avenuesX.length; i += 1) {
      const rx = world.avenuesX[i];
      if (rx + halfR < bounds.minX || rx - halfR > bounds.maxX) continue;
      ctx.strokeStyle = '#f6c343';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(rx - 3, Math.max(0, bounds.minY));
      ctx.lineTo(rx - 3, Math.min(WORLD.harborWaterY, bounds.maxY));
      ctx.moveTo(rx + 3, Math.max(0, bounds.minY));
      ctx.lineTo(rx + 3, Math.min(WORLD.harborWaterY, bounds.maxY));
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.setLineDash([18, 22]);
      ctx.beginPath();
      ctx.moveTo(rx - 28, Math.max(0, bounds.minY));
      ctx.lineTo(rx - 28, Math.min(WORLD.harborWaterY, bounds.maxY));
      ctx.moveTo(rx + 28, Math.max(0, bounds.minY));
      ctx.lineTo(rx + 28, Math.min(WORLD.harborWaterY, bounds.maxY));
      ctx.stroke();
    }

    for (let i = 0; i < world.avenuesY.length; i += 1) {
      const ry = world.avenuesY[i];
      if (ry + halfR < bounds.minY || ry - halfR > bounds.maxY) continue;
      ctx.strokeStyle = '#f6c343';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(Math.max(0, bounds.minX), ry - 3);
      ctx.lineTo(Math.min(WORLD.beachStartX, bounds.maxX), ry - 3);
      ctx.moveTo(Math.max(0, bounds.minX), ry + 3);
      ctx.lineTo(Math.min(WORLD.beachStartX, bounds.maxX), ry + 3);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.setLineDash([18, 22]);
      ctx.beginPath();
      ctx.moveTo(Math.max(0, bounds.minX), ry - 28);
      ctx.lineTo(Math.min(WORLD.beachStartX, bounds.maxX), ry - 28);
      ctx.moveTo(Math.max(0, bounds.minX), ry + 28);
      ctx.lineTo(Math.min(WORLD.beachStartX, bounds.maxX), ry + 28);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Intersection asphalt patch + crisp zebra crosswalks
    for (let i = 0; i < world.intersections.length; i += 1) {
      const inter = world.intersections[i];
      if (
        inter.x + halfR + 30 < bounds.minX ||
        inter.x - halfR - 30 > bounds.maxX ||
        inter.y + halfR + 30 < bounds.minY ||
        inter.y - halfR - 30 > bounds.maxY
      ) {
        continue;
      }
      ctx.fillStyle = '#222936';
      ctx.fillRect(inter.x - halfR, inter.y - halfR, rw, rw);

      ctx.fillStyle = 'rgba(240, 245, 255, 0.72)';
      for (let s = -42; s <= 36; s += 16) {
        ctx.fillRect(inter.x + s, inter.y - halfR - 14, 9, 12);
        ctx.fillRect(inter.x + s, inter.y + halfR + 2, 9, 12);
        ctx.fillRect(inter.x - halfR - 14, inter.y + s, 12, 9);
        ctx.fillRect(inter.x + halfR + 2, inter.y + s, 12, 9);
      }
    }
    ctx.restore();
  }

  _drawSkidMarks(ctx, world, bounds) {
    if (!world.skidMarks.length) return;
    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < world.skidMarks.length; i += 1) {
      const m = world.skidMarks[i];
      if (m.x1 < bounds.minX || m.x1 > bounds.maxX || m.y1 < bounds.minY || m.y1 > bounds.maxY) continue;
      ctx.strokeStyle = `rgba(12, 14, 20, ${m.alpha})`;
      ctx.beginPath();
      ctx.moveTo(m.x1, m.y1);
      ctx.lineTo(m.x2, m.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawServiceZones(ctx, world, t) {
    for (let i = 0; i < world.serviceZones.length; i += 1) {
      const z = world.serviceZones[i];
      const pulse = 1 + Math.sin(t * 4 + i) * 0.08;
      ctx.save();
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius * 0.65 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = z.color;
      ctx.globalAlpha = 0.14;
      ctx.fill();
      ctx.restore();
    }
  }

  _drawMissionMarkers(ctx, missions, t) {
    if (!missions) return;
    const target = missions.getActiveWaypoint ? missions.getActiveWaypoint() : null;
    if (!target) return;

    const pulse = 1 + Math.sin(t * 5.2) * 0.14;
    ctx.save();
    ctx.translate(target.x, target.y);

    // Outer pulsing beacon ring
    ctx.strokeStyle = target.color || '#ffd166';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, (target.radius || 46) * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = target.color || '#ffd166';
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, (target.radius || 46) * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Inner chevron
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(target.label || 'OBJECTIVE', 0, -((target.radius || 46) + 10));
    ctx.restore();
  }

  _drawBoats(ctx, world, t, bounds) {
    for (let i = 0; i < world.boats.length; i += 1) {
      const b = world.boats[i];
      if (b.x < bounds.minX || b.x > bounds.maxX || b.y < bounds.minY || b.y > bounds.maxY) continue;
      const bob = Math.sin(t * 2.1 + b.phase) * 3;
      ctx.save();
      ctx.translate(b.x, b.y + bob);
      ctx.rotate(b.angle + Math.sin(t * 1.4 + b.phase) * 0.03);

      // Wake halo
      ctx.fillStyle = 'rgba(210, 248, 255, 0.24)';
      ctx.beginPath();
      ctx.ellipse(0, 0, b.length * 0.62, b.width * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hull
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(b.length * 0.55, 0);
      ctx.quadraticCurveTo(b.length * 0.25, b.width * 0.52, -b.length * 0.45, b.width * 0.45);
      ctx.lineTo(-b.length * 0.5, -b.width * 0.45);
      ctx.quadraticCurveTo(b.length * 0.25, -b.width * 0.52, b.length * 0.55, 0);
      ctx.closePath();
      ctx.fill();

      // Cabin & stripe
      ctx.fillStyle = b.accent;
      ctx.fillRect(-b.length * 0.25, -b.width * 0.26, b.length * 0.44, b.width * 0.52);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.length * 0.06, -b.width * 0.22, b.length * 0.16, b.width * 0.44);
      ctx.restore();
    }
  }

  _drawUmbrellas(ctx, world, lighting, bounds) {
    for (let i = 0; i < world.umbrellas.length; i += 1) {
      const u = world.umbrellas[i];
      if (u.x < bounds.minX || u.x > bounds.maxX || u.y < bounds.minY || u.y > bounds.maxY) continue;
      ctx.save();
      // Shadow
      ctx.fillStyle = lighting.shadowColor;
      ctx.beginPath();
      ctx.arc(u.x + lighting.sunDx * 12, u.y + lighting.sunDy * 12, u.radius, 0, Math.PI * 2);
      ctx.fill();
      // Canopy
      ctx.translate(u.x, u.y);
      ctx.rotate(u.angle);
      ctx.fillStyle = u.color;
      ctx.beginPath();
      ctx.arc(0, 0, u.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let s = 0; s < 4; s += 1) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, u.radius, s * Math.PI * 0.5, s * Math.PI * 0.5 + 0.45);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawContainers(ctx, world, cam, lighting, bounds) {
    for (let i = 0; i < world.containers.length; i += 1) {
      const c = world.containers[i];
      if (c.x + c.w < bounds.minX || c.x > bounds.maxX || c.y + c.h < bounds.minY || c.y > bounds.maxY) continue;
      ctx.fillStyle = lighting.shadowColor;
      ctx.fillRect(c.x + lighting.sunDx * 14, c.y + lighting.sunDy * 14, c.w, c.h);

      const ox = (c.x + c.w * 0.5 - cam.x) * c.height * EXTRUDE_FACTOR;
      const oy = (c.y + c.h * 0.5 - cam.y) * c.height * EXTRUDE_FACTOR;
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x + ox, c.y + oy, c.w, c.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      for (let rx = 8; rx < c.w; rx += 10) {
        ctx.beginPath();
        ctx.moveTo(c.x + ox + rx, c.y + oy);
        ctx.lineTo(c.x + ox + rx, c.y + oy + c.h);
        ctx.stroke();
      }
    }
  }

  _drawPlayerOnFoot(ctx, player, lighting, t) {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Ground shadow
    ctx.fillStyle = lighting.shadowColor;
    ctx.beginPath();
    ctx.ellipse(lighting.sunDx * 6, lighting.sunDy * 6, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle player locator ring
    ctx.strokeStyle = 'rgba(54, 226, 236, 0.72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 17 + Math.sin(t * 6) * 1.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(player.angle);
    // Shoulders (Mateo's signature tropical teal/coral jacket)
    ctx.fillStyle = '#17c3b2';
    ctx.beginPath();
    ctx.roundRect(-8, -12, 16, 24, 7);
    ctx.fill();

    // Weapon arm & barrel
    ctx.fillStyle = '#f0c49b';
    ctx.fillRect(4, 4, 11, 5);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 4.5, 13, 4);

    // Head & hair
    ctx.fillStyle = '#e8b68c';
    ctx.beginPath();
    ctx.arc(0, 0, 7.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#231b18';
    ctx.beginPath();
    ctx.arc(-1.8, 0, 6.2, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();

    ctx.restore();
  }

  _drawPedestrians(ctx, peds, lighting, bounds) {
    for (let i = 0; i < peds.length; i += 1) {
      const p = peds[i];
      if (!p.alive) continue;
      if (p.x < bounds.minX || p.x > bounds.maxX || p.y < bounds.minY || p.y > bounds.maxY) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = lighting.shadowColor;
      ctx.beginPath();
      ctx.arc(lighting.sunDx * 4, lighting.sunDy * 4, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(p.angle);
      ctx.fillStyle = p.shirtColor;
      ctx.beginPath();
      ctx.roundRect(-6, -10, 12, 20, 5);
      ctx.fill();
      ctx.fillStyle = p.skinColor;
      ctx.beginPath();
      ctx.arc(1, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawPoliceOfficers(ctx, officers, lighting, bounds) {
    for (let i = 0; i < officers.length; i += 1) {
      const o = officers[i];
      if (!o.alive) continue;
      if (o.x < bounds.minX || o.x > bounds.maxX || o.y < bounds.minY || o.y > bounds.maxY) continue;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.fillStyle = lighting.shadowColor;
      ctx.beginPath();
      ctx.arc(lighting.sunDx * 5, lighting.sunDy * 5, 11, 0, Math.PI * 2);
      ctx.fill();

      // Alert ring
      ctx.strokeStyle = 'rgba(54, 197, 255, 0.7)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(o.angle);
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(-7, -11, 14, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.fillRect(7, 3, 12, 3.5);
      ctx.fillStyle = '#e5b892';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      // Police cap
      ctx.fillStyle = '#172554';
      ctx.beginPath();
      ctx.arc(-1, 0, 5.5, Math.PI * 0.4, Math.PI * 1.6);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawMissionEnemies(ctx, enemies, lighting, bounds) {
    for (let i = 0; i < enemies.length; i += 1) {
      const e = enemies[i];
      if (!e.alive) continue;
      if (e.x < bounds.minX || e.x > bounds.maxX || e.y < bounds.minY || e.y > bounds.maxY) continue;
      ctx.save();
      ctx.translate(e.x, e.y);

      ctx.fillStyle = lighting.shadowColor;
      ctx.beginPath();
      ctx.arc(lighting.sunDx * 5, lighting.sunDy * 5, 11, 0, Math.PI * 2);
      ctx.fill();

      // Hostile crimson indicator
      ctx.strokeStyle = 'rgba(255, 71, 87, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(e.angle);
      ctx.fillStyle = '#9f1239';
      ctx.beginPath();
      ctx.roundRect(-7, -11, 14, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.fillRect(7, 3, 13, 4);
      ctx.fillStyle = '#e4b792';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Health bar above enemy
      if (e.hp < e.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(e.x - 16, e.y - 24, 32, 4);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(e.x - 16, e.y - 24, 32 * Math.max(0, e.hp / e.maxHp), 4);
      }
    }
  }

  _drawVehicles(ctx, vehicles, lighting, t, bounds) {
    for (let i = 0; i < vehicles.length; i += 1) {
      const v = vehicles[i];
      if (v.x < bounds.minX || v.x > bounds.maxX || v.y < bounds.minY || v.y > bounds.maxY) continue;
      ctx.save();
      ctx.translate(v.x, v.y);

      // Ground shadow
      ctx.save();
      ctx.translate(lighting.sunDx * 7, lighting.sunDy * 7);
      ctx.rotate(v.angle);
      ctx.fillStyle = lighting.shadowColor;
      ctx.beginPath();
      ctx.roundRect(-v.w * 0.5, -v.h * 0.5, v.w, v.h, 7);
      ctx.fill();
      ctx.restore();

      ctx.rotate(v.angle);

      // Headlight beams at golden hour / night
      if ((lighting.headlights || v.isPolice || v.driver) && !v.wrecked) {
        const beamGrad = ctx.createLinearGradient(v.w * 0.45, 0, v.w * 0.45 + 145, 0);
        beamGrad.addColorStop(0, 'rgba(255, 246, 200, 0.34)');
        beamGrad.addColorStop(1, 'rgba(255, 246, 200, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(v.w * 0.45, -v.h * 0.34);
        ctx.lineTo(v.w * 0.45 + 145, -v.h * 1.4);
        ctx.lineTo(v.w * 0.45 + 145, v.h * 1.4);
        ctx.lineTo(v.w * 0.45, v.h * 0.34);
        ctx.closePath();
        ctx.fill();
      }

      // Wheels
      ctx.fillStyle = '#0f131a';
      ctx.fillRect(v.w * 0.18, -v.h * 0.55, 13, 5);
      ctx.fillRect(v.w * 0.18, v.h * 0.55 - 5, 13, 5);
      ctx.fillRect(-v.w * 0.36, -v.h * 0.55, 13, 5);
      ctx.fillRect(-v.w * 0.36, v.h * 0.55 - 5, 13, 5);

      // Main chassis body
      ctx.fillStyle = v.wrecked ? '#2c2f36' : v.color;
      ctx.beginPath();
      ctx.roundRect(-v.w * 0.5, -v.h * 0.5, v.w, v.h, 7);
      ctx.fill();

      // Police white doors & hood trim
      if (v.isPolice && !v.wrecked) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-v.w * 0.22, -v.h * 0.47, v.w * 0.44, v.h * 0.94);
        ctx.fillStyle = '#111827';
        ctx.fillRect(-v.w * 0.16, -v.h * 0.36, v.w * 0.32, v.h * 0.72);
      }

      // Racing stripe for sports / muscle cars
      if ((v.typeId === 'sport' || v.typeId === 'muscle') && !v.wrecked) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
        ctx.fillRect(-v.w * 0.48, -3, v.w * 0.96, 6);
      }

      // Windshield & rear glass
      ctx.fillStyle = '#152538';
      ctx.beginPath();
      ctx.roundRect(-v.w * 0.26, -v.h * 0.38, v.w * 0.54, v.h * 0.76, 4);
      ctx.fill();

      // Roof panel
      ctx.fillStyle = v.wrecked ? '#1e2026' : v.isPolice ? '#f8fafc' : v.color;
      ctx.beginPath();
      ctx.roundRect(-v.w * 0.18, -v.h * 0.33, v.w * 0.32, v.h * 0.66, 3);
      ctx.fill();

      // Headlights & brake lights
      if (!v.wrecked) {
        ctx.fillStyle = '#fff9d6';
        ctx.fillRect(v.w * 0.45, -v.h * 0.38, 4, 6);
        ctx.fillRect(v.w * 0.45, v.h * 0.38 - 6, 4, 6);

        ctx.fillStyle = v.braking ? '#ff2a4b' : '#991b1b';
        ctx.fillRect(-v.w * 0.5, -v.h * 0.38, 3.5, 6);
        ctx.fillRect(-v.w * 0.5, v.h * 0.38 - 6, 3.5, 6);
      }

      // Active Police Siren Lightbar + Bloom Pools on Asphalt
      if (v.isPolice && v.sirenOn && !v.wrecked) {
        const flash = Math.floor(t * 10 + i) % 2 === 0;
        const redAlpha = flash ? 0.95 : 0.25;
        const blueAlpha = flash ? 0.25 : 0.95;

        // Bloom on ground
        const rGrad = ctx.createRadialGradient(0, -10, 2, 0, -10, 56);
        rGrad.addColorStop(0, `rgba(255, 45, 75, ${flash ? 0.45 : 0.08})`);
        rGrad.addColorStop(1, 'rgba(255, 45, 75, 0)');
        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.arc(0, -10, 56, 0, Math.PI * 2);
        ctx.fill();

        const bGrad = ctx.createRadialGradient(0, 10, 2, 0, 10, 56);
        bGrad.addColorStop(0, `rgba(45, 175, 255, ${flash ? 0.08 : 0.45})`);
        bGrad.addColorStop(1, 'rgba(45, 175, 255, 0)');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(0, 10, 56, 0, Math.PI * 2);
        ctx.fill();

        // Physical lightbar
        ctx.fillStyle = `rgba(255, 40, 70, ${redAlpha})`;
        ctx.fillRect(-3, -10, 6, 9);
        ctx.fillStyle = `rgba(45, 180, 255, ${blueAlpha})`;
        ctx.fillRect(-3, 1, 6, 9);
      }

      ctx.restore();
    }
  }

  _drawProjectilesAndEffects(ctx, combat, bounds) {
    // Bullets / tracers
    ctx.save();
    for (let i = 0; i < combat.projectiles.length; i += 1) {
      const b = combat.projectiles[i];
      if (b.x < bounds.minX || b.x > bounds.maxX || b.y < bounds.minY || b.y > bounds.maxY) continue;
      ctx.strokeStyle = b.color || '#ffe082';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.prevX, b.prevY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles (sparks, fire, smoke, blood, shell flashes)
    for (let i = 0; i < combat.particles.length; i += 1) {
      const p = combat.particles[i];
      if (p.x < bounds.minX || p.x > bounds.maxX || p.y < bounds.minY || p.y > bounds.maxY) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha * (p.alpha ?? 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.grow ? 1 + (1 - alpha) * 1.4 : 0.4 + alpha * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawBuildings25D(ctx, world, cam, lighting, t, bounds) {
    // Filter visible buildings and sort far-to-near from camera center
    const visible = [];
    for (let i = 0; i < world.buildings.length; i += 1) {
      const b = world.buildings[i];
      if (b.x + b.w + 180 < bounds.minX || b.x - 180 > bounds.maxX || b.y + b.h + 180 < bounds.minY || b.y - 180 > bounds.maxY) {
        continue;
      }
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5;
      const distSq = (cx - cam.x) * (cx - cam.x) + (cy - cam.y) * (cy - cam.y);
      visible.push({ b, cx, cy, distSq });
    }
    visible.sort((a, c) => c.distSq - a.distSq);

    // 1) Cast building shadows on the ground first
    ctx.fillStyle = lighting.shadowColor;
    for (let i = 0; i < visible.length; i += 1) {
      const { b } = visible[i];
      const sx = lighting.sunDx * b.height * 0.42;
      const sy = lighting.sunDy * b.height * 0.42;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.w, b.y);
      ctx.lineTo(b.x + b.w + sx, b.y + sy);
      ctx.lineTo(b.x + b.w + sx, b.y + b.h + sy);
      ctx.lineTo(b.x + sx, b.y + b.h + sy);
      ctx.lineTo(b.x, b.y + b.h);
      ctx.closePath();
      ctx.fill();
    }

    // 2) Draw 2.5D perspective-extruded facades and rooftops
    for (let i = 0; i < visible.length; i += 1) {
      const { b, cx, cy } = visible[i];
      const ox = (cx - cam.x) * b.height * EXTRUDE_FACTOR;
      const oy = (cy - cam.y) * b.height * EXTRUDE_FACTOR;

      const x0 = b.x;
      const y0 = b.y;
      const x1 = b.x + b.w;
      const y1 = b.y + b.h;

      const rx0 = x0 + ox;
      const ry0 = y0 + oy;
      const rx1 = x1 + ox;
      const ry1 = y1 + oy;

      // Visible side walls (only faces facing toward the camera)
      if (oy > 0) {
        this._drawFacadeQuad(ctx, x0, y0, x1, y0, rx1, ry0, rx0, ry0, b.wallColor, b, lighting);
      } else {
        this._drawFacadeQuad(ctx, x0, y1, x1, y1, rx1, ry1, rx0, ry1, b.shadeColor, b, lighting);
      }
      if (ox > 0) {
        this._drawFacadeQuad(ctx, x0, y0, x0, y1, rx0, ry1, rx0, ry0, b.wallColor, b, lighting);
      } else {
        this._drawFacadeQuad(ctx, x1, y0, x1, y1, rx1, ry1, rx1, ry0, b.shadeColor, b, lighting);
      }

      // Rooftop deck
      ctx.fillStyle = b.roofColor;
      ctx.fillRect(rx0, ry0, b.w, b.h);

      // Rooftop parapet trim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx0 + 4, ry0 + 4, b.w - 8, b.h - 8);

      // Neon roof rim on Coral Strip & Landmarks
      if (b.style === 'artdeco' || b.style === 'landmark') {
        ctx.save();
        ctx.strokeStyle = b.accentColor;
        ctx.globalAlpha = lighting.neonAlpha;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(rx0 + 2, ry0 + 2, b.w - 4, b.h - 4);
        ctx.restore();
      }

      // Rooftop swimming pool with lounge deck & water shimmer
      if (b.hasPool && b.w > 84 && b.h > 84) {
        const pw = Math.min(58, b.w * 0.46);
        const ph = Math.min(34, b.h * 0.34);
        const px = rx0 + b.w * 0.5 - pw * 0.5;
        const py = ry0 + b.h * 0.5 - ph * 0.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.fillRect(px - 8, py - 8, pw + 16, ph + 16);
        ctx.fillStyle = '#18c6e0';
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(180, 250, 255, 0.42)';
        ctx.fillRect(px + 6, py + 6, pw * 0.45, 5);
        ctx.fillRect(px + pw * 0.35, py + ph - 12, pw * 0.48, 4);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);
      } else if (b.hasHelipad) {
        const hx = rx0 + b.w * 0.5;
        const hy = ry0 + b.h * 0.5;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.beginPath();
        ctx.arc(hx, hy, 31, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx, hy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffd166';
        ctx.font = '900 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', hx, hy + 1);
      } else {
        // Rooftop AC units, vents & glass skylight detail
        ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
        ctx.fillRect(rx0 + 12, ry0 + 12, 24, 16);
        ctx.fillRect(rx0 + 42, ry0 + 14, 15, 14);
        ctx.fillStyle = 'rgba(125, 211, 252, 0.28)';
        ctx.fillRect(rx0 + b.w - 36, ry0 + 14, 22, 18);
      }

      // Glowing Neon Roof Sign
      if (b.neonText) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 14, 26, 0.78)';
        const labelW = Math.min(b.w - 14, b.neonText.length * 8.5 + 16);
        ctx.fillRect(rx0 + (b.w - labelW) * 0.5, ry0 + b.h - 28, labelW, 20);
        ctx.strokeStyle = b.accentColor;
        ctx.globalAlpha = 0.65 + lighting.neonAlpha * 0.35;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx0 + (b.w - labelW) * 0.5, ry0 + b.h - 28, labelW, 20);

        ctx.fillStyle = b.accentColor;
        ctx.font = '800 10.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.neonText, rx0 + b.w * 0.5, ry0 + b.h - 17.5);
        ctx.restore();
      }
    }
  }

  _drawFacadeQuad(ctx, ax, ay, bx, by, cx, cy, dx, dy, color, b, lighting) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.lineTo(dx, dy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 16, 28, 0.38)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lit architectural floor bands / windows along the facade
    const floors = Math.max(2, Math.min(7, Math.floor(b.height / 26)));
    ctx.strokeStyle = b.windowHue || '#ffe29c';
    ctx.globalAlpha = 0.16 + lighting.neonAlpha * 0.38;
    ctx.lineWidth = 2;
    for (let f = 1; f < floors; f += 1) {
      const ratio = f / floors;
      const lx = ax + (dx - ax) * ratio;
      const ly = ay + (dy - ay) * ratio;
      const rx = bx + (cx - bx) * ratio;
      const ry = by + (cy - by) * ratio;
      ctx.beginPath();
      ctx.moveTo(lx + (rx - lx) * 0.08, ly + (ry - ly) * 0.08);
      ctx.lineTo(rx - (rx - lx) * 0.08, ry - (ry - ly) * 0.08);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _drawPalms(ctx, world, lighting, t, bounds) {
    for (let i = 0; i < world.palms.length; i += 1) {
      const p = world.palms[i];
      if (p.x < bounds.minX || p.x > bounds.maxX || p.y < bounds.minY || p.y > bounds.maxY) continue;
      const sway = Math.sin(t * 1.8 + p.x * 0.02 + p.y * 0.01) * 0.08;
      const r = 24 * p.scale;

      ctx.save();
      // Palm shadow
      ctx.fillStyle = lighting.shadowColor;
      ctx.beginPath();
      ctx.arc(p.x + lighting.sunDx * 18 * p.scale, p.y + lighting.sunDy * 18 * p.scale, r * 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle + sway);

      // Trunk dot
      ctx.fillStyle = '#6f4e37';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5 * p.scale, 0, Math.PI * 2);
      ctx.fill();

      // 6 lush palm fronds
      for (let f = 0; f < 6; f += 1) {
        ctx.save();
        ctx.rotate((f * Math.PI) / 3);
        ctx.fillStyle = f % 2 === 0 ? '#27ae60' : '#2ecc71';
        ctx.beginPath();
        ctx.ellipse(r * 0.55, 0, r * 0.56, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  _drawStreetlamps(ctx, world, lighting, bounds) {
    if (lighting.neonAlpha < 0.45) return;
    ctx.save();
    for (let i = 0; i < world.streetlamps.length; i += 1) {
      const l = world.streetlamps[i];
      if (l.x < bounds.minX || l.x > bounds.maxX || l.y < bounds.minY || l.y > bounds.maxY) continue;
      const grad = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 44);
      grad.addColorStop(0, `rgba(255, 212, 130, ${0.32 * lighting.neonAlpha})`);
      grad.addColorStop(1, 'rgba(255, 212, 130, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 44, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff5cc';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawFloatingPopups(ctx, popups) {
    ctx.save();
    ctx.font = '800 14px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < popups.length; i += 1) {
      const p = popups[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.fillStyle = '#000';
      ctx.fillText(p.text, p.x + 1, p.y + 1);
      ctx.fillStyle = p.color || '#4be89a';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.restore();
  }

  _drawAtmosphereOverlay(ctx, width, height, lighting, game) {
    // Golden-hour / night color grade wash
    ctx.fillStyle = lighting.ambientTint;
    ctx.fillRect(0, 0, width, height);

    // Subtle red damage flash when player is hurt
    if (game.player.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 42, 68, ${Math.min(0.45, game.player.damageFlash * 0.5)})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Subtle cinematic corner vignette
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      height * 0.36,
      width * 0.5,
      height * 0.5,
      width * 0.72,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(6, 10, 20, 0.36)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }
}
