import { Player, Projectile, Enemy, Asteroid, PowerUp, Particle, FloatingText } from '../types';

export class GameRenderer {
  // Render Player Starfighter
  public static renderPlayer(ctx: CanvasRenderingContext2D, player: Player, isWarping: boolean) {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Dynamic bank tilt angle
    ctx.rotate((player.tiltAngle * Math.PI) / 180);

    // Invulnerability blink
    if (player.invulnerableTime > 0 && Math.floor(player.invulnerableTime * 15) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    const w = player.width;
    const h = player.height;

    // 1. Thruster Plasma Jets
    const thrusterLength = player.isBoosting || isWarping ? 45 + Math.random() * 20 : 25 + Math.random() * 10;
    const thrusterColor = player.isBoosting || isWarping ? '#38bdf8' : '#f59e0b';
    const thrusterCore = player.isBoosting || isWarping ? '#ffffff' : '#fef08a';

    // Top & Bottom Engine Nozzles
    [-h * 0.22, h * 0.22].forEach((offsetY) => {
      // Outer flame
      const flameGrad = ctx.createLinearGradient(-w * 0.5, offsetY, -w * 0.5 - thrusterLength, offsetY);
      flameGrad.addColorStop(0, thrusterColor);
      flameGrad.addColorStop(0.7, thrusterColor);
      flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-w * 0.45, offsetY - 5);
      ctx.lineTo(-w * 0.5 - thrusterLength, offsetY);
      ctx.lineTo(-w * 0.45, offsetY + 5);
      ctx.closePath();
      ctx.fill();

      // Inner white-hot core
      const coreGrad = ctx.createLinearGradient(-w * 0.5, offsetY, -w * 0.5 - thrusterLength * 0.5, offsetY);
      coreGrad.addColorStop(0, thrusterCore);
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.moveTo(-w * 0.45, offsetY - 2);
      ctx.lineTo(-w * 0.5 - thrusterLength * 0.5, offsetY);
      ctx.lineTo(-w * 0.45, offsetY + 2);
      ctx.closePath();
      ctx.fill();
    });

    // 2. Spaceship Main Hull
    // Wing sweeps & primary armored chassis
    const hullGrad = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
    hullGrad.addColorStop(0, '#0f172a'); // slate-900
    hullGrad.addColorStop(0.5, '#1e293b'); // slate-800
    hullGrad.addColorStop(1, '#334155'); // slate-700

    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#38bdf8'; // neon cyan outline accent
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0); // Nose
    ctx.lineTo(w * 0.1, -h * 0.18);
    ctx.lineTo(-w * 0.2, -h * 0.48); // Top wing tip
    ctx.lineTo(-w * 0.4, -h * 0.45);
    ctx.lineTo(-w * 0.35, -h * 0.15); // Top engine mount
    ctx.lineTo(-w * 0.48, -h * 0.1);
    ctx.lineTo(-w * 0.48, h * 0.1);
    ctx.lineTo(-w * 0.35, h * 0.15); // Bottom engine mount
    ctx.lineTo(-w * 0.4, h * 0.45);
    ctx.lineTo(-w * 0.2, h * 0.48); // Bottom wing tip
    ctx.lineTo(w * 0.1, h * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Wing Inset Accents & Weapon Mounts
    ctx.fillStyle = '#0284c7';
    // Top wing panel
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.2);
    ctx.lineTo(-w * 0.2, -h * 0.42);
    ctx.lineTo(-w * 0.32, -h * 0.38);
    ctx.lineTo(-w * 0.15, -h * 0.18);
    ctx.closePath();
    ctx.fill();

    // Bottom wing panel
    ctx.beginPath();
    ctx.moveTo(0, h * 0.2);
    ctx.lineTo(-w * 0.2, h * 0.42);
    ctx.lineTo(-w * 0.32, h * 0.38);
    ctx.lineTo(-w * 0.15, h * 0.18);
    ctx.closePath();
    ctx.fill();

    // Wing Cannons
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-w * 0.1, -h * 0.46, w * 0.22, 3);
    ctx.fillRect(-w * 0.1, h * 0.46 - 3, w * 0.22, 3);

    // Cannon Muzzle glow
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w * 0.1, -h * 0.46, 3, 3);
    ctx.fillRect(w * 0.1, h * 0.46 - 3, 3, 3);

    // 4. Cockpit Canopy Glass
    const cockpitGrad = ctx.createLinearGradient(0, -5, w * 0.3, 5);
    cockpitGrad.addColorStop(0, '#38bdf8');
    cockpitGrad.addColorStop(0.5, '#0284c7');
    cockpitGrad.addColorStop(1, '#075985');

    ctx.fillStyle = cockpitGrad;
    ctx.beginPath();
    ctx.ellipse(w * 0.1, 0, w * 0.18, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy glass specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(w * 0.14, -h * 0.04, w * 0.08, h * 0.03, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Shield Bubble Effect
    if (player.shield > 0) {
      const shieldRatio = player.shield / player.maxShield;
      const pulse = Math.sin(Date.now() * 0.006) * 0.1 + 0.9;
      const shieldRadius = Math.max(w, h) * 0.65 * pulse;

      const shieldGrad = ctx.createRadialGradient(0, 0, shieldRadius * 0.7, 0, 0, shieldRadius);
      shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      shieldGrad.addColorStop(0.8, `rgba(56, 189, 248, ${0.15 * shieldRatio})`);
      shieldGrad.addColorStop(1, `rgba(125, 211, 252, ${0.6 * shieldRatio})`);

      ctx.fillStyle = shieldGrad;
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.8 * shieldRatio})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hexagonal / Tech shield ring details
      ctx.save();
      ctx.rotate(Date.now() * 0.001);
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 * shieldRatio})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const hx = Math.cos(angle) * shieldRadius;
        const hy = Math.sin(angle) * shieldRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // Render Enemy Units
  public static renderEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    const w = enemy.width;
    const h = enemy.height;

    switch (enemy.type) {
      case 'scout': {
        // Void Scout: Crimson razor raider
        ctx.fillStyle = '#881337'; // rose-900
        ctx.strokeStyle = '#f43f5e'; // rose-500
        ctx.lineWidth = 1.5;

        // Thruster flame
        const tLen = 14 + Math.random() * 8;
        const thrusterGrad = ctx.createLinearGradient(w * 0.4, 0, w * 0.4 + tLen, 0);
        thrusterGrad.addColorStop(0, '#fb7185');
        thrusterGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = thrusterGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.4, -3);
        ctx.lineTo(w * 0.4 + tLen, 0);
        ctx.lineTo(w * 0.4, 3);
        ctx.fill();

        // Hull
        ctx.fillStyle = '#4c0519';
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 0); // Prow facing left
        ctx.lineTo(w * 0.4, -h * 0.45);
        ctx.lineTo(w * 0.2, 0);
        ctx.lineTo(w * 0.4, h * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing red optic eye
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-w * 0.1, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      case 'interceptor': {
        // Phantom Interceptor: Sleek violet delta wing
        ctx.fillStyle = '#3b0764';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;

        // Twin engines
        [-h * 0.3, h * 0.3].forEach((ey) => {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(w * 0.4, ey, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Delta wing body
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 0);
        ctx.lineTo(w * 0.35, -h * 0.5);
        ctx.lineTo(w * 0.45, -h * 0.2);
        ctx.lineTo(w * 0.1, 0);
        ctx.lineTo(w * 0.45, h * 0.2);
        ctx.lineTo(w * 0.35, h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit / sensors
        ctx.fillStyle = '#e879f9';
        ctx.fillRect(-w * 0.2, -2, w * 0.2, 4);
        break;
      }

      case 'frigate': {
        // Armored Plasma Gunboat
        ctx.fillStyle = '#1c1917'; // stone-900
        ctx.strokeStyle = '#f97316'; // amber/orange
        ctx.lineWidth = 2;

        // Heavy chassis
        ctx.beginPath();
        ctx.moveTo(-w * 0.45, -h * 0.2);
        ctx.lineTo(-w * 0.3, -h * 0.45);
        ctx.lineTo(w * 0.35, -h * 0.45);
        ctx.lineTo(w * 0.45, -h * 0.2);
        ctx.lineTo(w * 0.45, h * 0.2);
        ctx.lineTo(w * 0.35, h * 0.45);
        ctx.lineTo(-w * 0.3, h * 0.45);
        ctx.lineTo(-w * 0.45, h * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Hazard stripes
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.lineWidth = 3;
        for (let i = -15; i <= 15; i += 10) {
          ctx.beginPath();
          ctx.moveTo(i, -h * 0.25);
          ctx.lineTo(i - 8, h * 0.25);
          ctx.stroke();
        }

        // Turret mount
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(-w * 0.05, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'driller': {
        // Asteroid Driller: Spiked industrial vessel with spinning bit
        ctx.fillStyle = '#292524';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;

        // Chassis
        ctx.fillRect(-w * 0.2, -h * 0.4, w * 0.6, h * 0.8);
        ctx.strokeRect(-w * 0.2, -h * 0.4, w * 0.6, h * 0.8);

        // Rotating drill cone at front
        const rot = Date.now() * 0.015;
        ctx.save();
        ctx.translate(-w * 0.2, 0);
        ctx.fillStyle = '#a8a29e';
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.35);
        ctx.lineTo(-w * 0.3, 0);
        ctx.lineTo(0, h * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Drill teeth shimmer
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w * 0.15, Math.sin(rot) * (h * 0.2));
        ctx.lineTo(-w * 0.25, Math.cos(rot) * (h * 0.1));
        ctx.stroke();
        ctx.restore();

        // Glowing crystal cargo in bed
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fillRect(w * 0.1, -h * 0.2, w * 0.2, h * 0.4);
        ctx.shadowBlur = 0;
        break;
      }

      case 'cruiser': {
        // Capital cruiser
        ctx.fillStyle = '#1e1b4b'; // indigo-950
        ctx.strokeStyle = '#6366f1'; // indigo-500
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 0);
        ctx.lineTo(-w * 0.2, -h * 0.4);
        ctx.lineTo(w * 0.4, -h * 0.35);
        ctx.lineTo(w * 0.5, -h * 0.15);
        ctx.lineTo(w * 0.5, h * 0.15);
        ctx.lineTo(w * 0.4, h * 0.35);
        ctx.lineTo(-w * 0.2, h * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Energy shield ribbing
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
        ctx.lineWidth = 1.5;
        [-h * 0.2, 0, h * 0.2].forEach(y => {
          ctx.beginPath();
          ctx.moveTo(-w * 0.2, y);
          ctx.lineTo(w * 0.3, y);
          ctx.stroke();
        });
        break;
      }

      case 'boss': {
        // Colossal Titan Flagship
        const now = Date.now() * 0.004;

        // Base Dreadnought Armor
        ctx.fillStyle = '#09090b';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;

        // Multi-faceted flagship hull
        ctx.beginPath();
        ctx.moveTo(-w * 0.48, 0); // Prow ram
        ctx.lineTo(-w * 0.35, -h * 0.25);
        ctx.lineTo(-w * 0.15, -h * 0.48); // Forward wing
        ctx.lineTo(w * 0.2, -h * 0.45);
        ctx.lineTo(w * 0.45, -h * 0.3); // Rear engine bay
        ctx.lineTo(w * 0.48, 0);
        ctx.lineTo(w * 0.45, h * 0.3);
        ctx.lineTo(w * 0.2, h * 0.45);
        ctx.lineTo(-w * 0.15, h * 0.48);
        ctx.lineTo(-w * 0.35, h * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Heavy armor plates
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-w * 0.1, -h * 0.35, w * 0.35, h * 0.7);
        ctx.strokeRect(-w * 0.1, -h * 0.35, w * 0.35, h * 0.7);

        // Core Reactor (Pulsing Energy Core)
        const corePulse = Math.sin(now) * 0.2 + 0.8;
        const coreRadius = Math.min(w, h) * 0.16 * corePulse;

        const coreGrad = ctx.createRadialGradient(-w * 0.05, 0, 2, -w * 0.05, 0, coreRadius);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, '#ef4444');
        coreGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(-w * 0.05, 0, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Shield Nodes
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-w * 0.05, 0, coreRadius * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        // Dual Engine Blasts
        [-h * 0.2, h * 0.2].forEach((ey) => {
          const engGrad = ctx.createLinearGradient(w * 0.45, ey, w * 0.45 + 30, ey);
          engGrad.addColorStop(0, '#f97316');
          engGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = engGrad;
          ctx.fillRect(w * 0.45, ey - 8, 30 + Math.random() * 15, 16);
        });

        // Boss Turret Pods
        if (enemy.turrets) {
          ctx.fillStyle = '#dc2626';
          for (const t of enemy.turrets) {
            ctx.save();
            ctx.translate(t.xOffset, t.yOffset);
            ctx.rotate(t.angle);
            ctx.fillRect(0, -3, 14, 6);
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        break;
      }
    }

    // Health bar for high health enemies or boss
    if (enemy.health < enemy.maxHealth || enemy.isBoss) {
      const barW = Math.max(w * 0.8, 32);
      const barH = enemy.isBoss ? 6 : 4;
      const barY = -h * 0.55 - 8;
      const ratio = Math.max(0, enemy.health / enemy.maxHealth);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW * 0.5, barY, barW, barH);

      ctx.fillStyle = enemy.isBoss ? '#ef4444' : '#22c55e';
      ctx.fillRect(-barW * 0.5, barY, barW * ratio, barH);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW * 0.5, barY, barW, barH);
    }

    ctx.restore();
  }

  // Render Asteroids
  public static renderAsteroid(ctx: CanvasRenderingContext2D, ast: Asteroid) {
    ctx.save();
    ctx.translate(ast.x, ast.y);
    ctx.rotate(ast.rotation);

    const r = ast.radius;

    // Determine colors based on mineral type
    let strokeColor = '#78716c';
    let baseColor1 = '#44403c';
    let baseColor2 = '#1c1917';

    if (ast.type === 'crystal') {
      strokeColor = '#06b6d4';
      baseColor1 = '#155e75';
      baseColor2 = '#083344';
    } else if (ast.type === 'metal') {
      strokeColor = '#f59e0b';
      baseColor1 = '#78350f';
      baseColor2 = '#292524';
    } else if (ast.type === 'ice') {
      strokeColor = '#93c5fd';
      baseColor1 = '#3b82f6';
      baseColor2 = '#1e3a8a';
    }

    // 3D Spherical/Specular gradient
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, strokeColor);
    grad.addColorStop(0.5, baseColor1);
    grad.addColorStop(1, baseColor2);

    ctx.fillStyle = grad;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    // Draw procedural vertices
    ctx.beginPath();
    ast.vertices.forEach((v, idx) => {
      if (idx === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crystal specular facets
    if (ast.type === 'crystal') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.4);
      ctx.lineTo(r * 0.1, -r * 0.2);
      ctx.lineTo(-r * 0.1, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // Render Projectiles
  public static renderProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.type === 'beam') {
      // Hyper beam
      const beamGrad = ctx.createLinearGradient(0, -p.radius, 0, p.radius);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      beamGrad.addColorStop(0.5, '#ffffff');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = beamGrad;
      ctx.fillRect(-15, -p.radius, 50, p.radius * 2);
    } else if (p.type === 'missile') {
      // Homing missile
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);

      // Rocket body
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-10, -3, 20, 6);

      // Warhead
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(10, -3);
      ctx.lineTo(16, 0);
      ctx.lineTo(10, 3);
      ctx.closePath();
      ctx.fill();

      // Exhaust glow
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-14, -2, 4, 4);
    } else {
      // Laser or Plasma bolt
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);

      const boltLength = p.radius * 3.5;
      const grad = ctx.createLinearGradient(-boltLength, 0, boltLength, 0);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.4, p.color);
      grad.addColorStop(0.8, '#ffffff');
      grad.addColorStop(1, p.color);

      ctx.fillStyle = grad;
      ctx.shadowColor = p.glowColor;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.ellipse(0, 0, boltLength, p.radius, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Render Power-Up Pods
  public static renderPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp) {
    ctx.save();
    ctx.translate(p.x, p.y + Math.sin(p.bobTimer * 4) * 4);

    const r = p.radius;
    const rot = p.bobTimer * 2;

    // Glowing container sphere
    let col = '#38bdf8';
    let label = 'S';
    if (p.type === 'multishot') { col = '#ec4899'; label = 'W'; }
    if (p.type === 'missiles') { col = '#f97316'; label = 'M'; }
    if (p.type === 'bomb') { col = '#eab308'; label = 'B'; }
    if (p.type === 'repair') { col = '#22c55e'; label = '+'; }
    if (p.type === 'overcharge') { col = '#a855f7'; label = 'O'; }
    if (p.type === 'crystal') { col = '#06b6d4'; label = '★'; }

    ctx.shadowColor = col;
    ctx.shadowBlur = 12;

    // Rotating outer ring
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.2, r * 0.6, rot, 0, Math.PI * 2);
    ctx.stroke();

    // Inner core orb
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center icon
    ctx.shadowBlur = 0;
    ctx.fillStyle = col;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);

    ctx.restore();
  }

  // Render Particle
  public static renderParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'shockwave') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === 'debris') {
      ctx.translate(p.x, p.y);
      if (p.rotation !== undefined) ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
    } else if (p.type === 'smoke') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // spark or flame
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Render Floating Text (Scores & Damage)
  public static renderFloatingText(ctx: CanvasRenderingContext2D, t: FloatingText) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, t.alpha);
    ctx.fillStyle = t.color;
    ctx.font = `bold ${t.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
}
