import { Star, NebulaCloud, CelestialBody, SpaceStructure, SectorConfig } from '../types';

export const SECTOR_CONFIGS: SectorConfig[] = [
  {
    number: 1,
    name: 'Sector Alpha: Orion Nebula',
    subtitle: 'Outer Perimeter & Asteroid Belt',
    bgGradient: ['#04050d', '#080d22', '#0c1236'],
    nebulaPalette: ['rgba(56, 189, 248, 0.15)', 'rgba(129, 140, 248, 0.12)', 'rgba(168, 85, 247, 0.15)', 'rgba(236, 72, 153, 0.1)'],
    planetPalette: [
      { primary: '#1e3a8a', secondary: '#3b82f6', ring: 'rgba(147, 197, 253, 0.6)' },
      { primary: '#4c1d95', secondary: '#8b5cf6' },
    ],
    asteroidDensity: 1.0,
    hazardFrequency: 1.0,
    bossName: 'Apex Corsair Dreadnought',
    bossHealth: 1200,
    distanceToBoss: 6500,
  },
  {
    number: 2,
    name: 'Sector Beta: Cygnus Dark Rift',
    subtitle: 'Derelict Shipyard & Ion Storms',
    bgGradient: ['#06040a', '#130924', '#1f0d3d'],
    nebulaPalette: ['rgba(236, 72, 153, 0.18)', 'rgba(217, 70, 239, 0.15)', 'rgba(99, 102, 241, 0.14)', 'rgba(244, 63, 94, 0.12)'],
    planetPalette: [
      { primary: '#831843', secondary: '#f43f5e', ring: 'rgba(251, 113, 133, 0.5)' },
      { primary: '#0f766e', secondary: '#14b8a6' },
    ],
    asteroidDensity: 1.3,
    hazardFrequency: 1.3,
    bossName: 'Oblivion Leviathan Flagship',
    bossHealth: 1800,
    distanceToBoss: 8000,
  },
  {
    number: 3,
    name: 'Sector Gamma: Solar Flare Anomaly',
    subtitle: 'Plasma Belts & Dyson Ruins',
    bgGradient: ['#0b0404', '#210c05', '#381608'],
    nebulaPalette: ['rgba(249, 115, 22, 0.2)', 'rgba(234, 88, 12, 0.16)', 'rgba(239, 68, 68, 0.15)', 'rgba(250, 204, 21, 0.12)'],
    planetPalette: [
      { primary: '#7c2d12', secondary: '#ea580c', ring: 'rgba(253, 186, 116, 0.7)' },
      { primary: '#854d0e', secondary: '#eab308' },
    ],
    asteroidDensity: 1.6,
    hazardFrequency: 1.6,
    bossName: 'Solaris Core Destroyer',
    bossHealth: 2500,
    distanceToBoss: 9500,
  },
  {
    number: 4,
    name: 'Sector Omega: Chrono-Singularity',
    subtitle: 'Deep Void Hive Nexus',
    bgGradient: ['#02040a', '#051923', '#002b36'],
    nebulaPalette: ['rgba(20, 184, 166, 0.22)', 'rgba(6, 182, 212, 0.18)', 'rgba(16, 185, 129, 0.15)', 'rgba(56, 189, 248, 0.12)'],
    planetPalette: [
      { primary: '#064e3b', secondary: '#10b981', ring: 'rgba(110, 231, 183, 0.6)' },
      { primary: '#083344', secondary: '#06b6d4' },
    ],
    asteroidDensity: 2.0,
    hazardFrequency: 2.0,
    bossName: 'Omega Sovereign Colossus',
    bossHealth: 3500,
    distanceToBoss: 11000,
  },
];

export class ProceduralBackground {
  private width: number;
  private height: number;
  private stars: Star[] = [];
  private nebulae: NebulaCloud[] = [];
  private celestialBodies: CelestialBody[] = [];
  private structures: SpaceStructure[] = [];
  private currentSectorIndex = 0;
  private warpStreaks: { x: number; y: number; length: number; speed: number; alpha: number }[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initScene(0);
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initScene(this.currentSectorIndex);
  }

  public setSector(index: number) {
    this.currentSectorIndex = index % SECTOR_CONFIGS.length;
    this.initScene(this.currentSectorIndex);
  }

  public getSectorConfig(): SectorConfig {
    return SECTOR_CONFIGS[this.currentSectorIndex];
  }

  private initScene(sectorIdx: number) {
    const config = SECTOR_CONFIGS[sectorIdx];
    this.stars = [];
    this.nebulae = [];
    this.celestialBodies = [];
    this.structures = [];
    this.warpStreaks = [];

    // 1. Generate multi-depth starfields (Layers 1, 2, 3)
    const starColors = ['#ffffff', '#e0f2fe', '#fed7aa', '#fbcfe8', '#bfdbfe', '#c7d2fe'];

    // Deep distant stars (layer 0, tiny, slow)
    for (let i = 0; i < 180; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.2 + 0.5,
        speed: Math.random() * 0.2 + 0.1,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        brightness: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.05 + 0.01,
        layer: 0,
      });
    }

    // Midfield stars (layer 1, medium, twinkling)
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.8 + 1.0,
        speed: Math.random() * 0.6 + 0.3,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        brightness: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.08 + 0.02,
        layer: 1,
      });
    }

    // Nearfield bright stars & cosmic dust particles (layer 2)
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2.5 + 1.5,
        speed: Math.random() * 1.2 + 0.8,
        color: '#ffffff',
        brightness: Math.random() * 0.9 + 0.1,
        twinkleSpeed: Math.random() * 0.12 + 0.04,
        layer: 2,
      });
    }

    // 2. Procedural Nebulae clouds
    for (let i = 0; i < 6; i++) {
      const color = config.nebulaPalette[i % config.nebulaPalette.length];
      const secColor = config.nebulaPalette[(i + 1) % config.nebulaPalette.length];
      this.nebulae.push({
        x: (i / 6) * this.width + (Math.random() * 200 - 100),
        y: Math.random() * this.height,
        radiusX: Math.random() * 260 + 200,
        radiusY: Math.random() * 180 + 120,
        color,
        secondaryColor: secColor,
        speed: 0.15 + (i % 3) * 0.05,
        opacity: Math.random() * 0.4 + 0.6,
      });
    }

    // 3. Celestial Bodies (Ringed Giant, Moons, or Star)
    const p1 = config.planetPalette[0];
    this.celestialBodies.push({
      x: this.width * 0.75,
      y: this.height * 0.3,
      radius: Math.min(this.width, this.height) * 0.16 + 50,
      speed: 0.18,
      type: 'ringed_planet',
      primaryColor: p1.primary,
      secondaryColor: p1.secondary,
      ringColor: p1.ring || 'rgba(255, 255, 255, 0.4)',
      hasRings: true,
      lightAngle: Math.PI * 0.25,
    });

    if (config.planetPalette[1]) {
      const p2 = config.planetPalette[1];
      this.celestialBodies.push({
        x: this.width * 0.25,
        y: this.height * 0.75,
        radius: Math.min(this.width, this.height) * 0.09 + 25,
        speed: 0.25,
        type: 'moon',
        primaryColor: p2.primary,
        secondaryColor: p2.secondary,
        craterSeeds: [
          { x: -0.2, y: -0.1, r: 0.2 },
          { x: 0.3, y: 0.2, r: 0.15 },
          { x: -0.1, y: 0.4, r: 0.12 },
          { x: 0.1, y: -0.3, r: 0.18 },
        ],
        lightAngle: Math.PI * 0.3,
      });
    }

    // 4. Space Megastructures / Derelicts (Midfield Parallax, speed ~0.45)
    this.structures.push(
      {
        x: this.width * 0.4,
        y: this.height * 0.18,
        width: 140,
        height: 70,
        speed: 0.45,
        type: 'derelict_station',
        lights: [
          { x: 10, y: 15, color: '#ef4444', blinkOffset: 0 },
          { x: 70, y: 35, color: '#06b6d4', blinkOffset: 0.5 },
          { x: 130, y: 20, color: '#22c55e', blinkOffset: 1.0 },
        ],
      },
      {
        x: this.width * 0.9,
        y: this.height * 0.82,
        width: 160,
        height: 50,
        speed: 0.52,
        type: 'solar_array',
        lights: [
          { x: 15, y: 25, color: '#38bdf8', blinkOffset: 0.2 },
          { x: 80, y: 25, color: '#38bdf8', blinkOffset: 0.7 },
          { x: 145, y: 25, color: '#eab308', blinkOffset: 0.4 },
        ],
      }
    );

    // 5. Warp Streaks pool
    for (let i = 0; i < 60; i++) {
      this.warpStreaks.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: Math.random() * 60 + 20,
        speed: Math.random() * 25 + 15,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }
  }

  public update(baseSpeed: number, isBoosting: boolean, isWarping: boolean) {
    const boostMultiplier = isWarping ? 8.0 : isBoosting ? 2.5 : 1.0;
    const speed = baseSpeed * boostMultiplier;

    // Stars
    for (const star of this.stars) {
      star.x -= star.speed * speed;
      if (star.x < -10) {
        star.x = this.width + 10;
        star.y = Math.random() * this.height;
      }
      star.brightness += Math.sin(Date.now() * star.twinkleSpeed) * 0.03;
      star.brightness = Math.max(0.15, Math.min(1.0, star.brightness));
    }

    // Nebulae (very slow parallax)
    for (const neb of this.nebulae) {
      neb.x -= neb.speed * speed * 0.3;
      if (neb.x < -neb.radiusX * 2) {
        neb.x = this.width + neb.radiusX * 2;
        neb.y = Math.random() * this.height;
      }
    }

    // Celestial bodies (planets, moons)
    for (const body of this.celestialBodies) {
      body.x -= body.speed * speed * 0.4;
      if (body.x < -body.radius * 3) {
        body.x = this.width + body.radius * 3;
        body.y = Math.random() * (this.height * 0.8) + this.height * 0.1;
      }
    }

    // Structures (mid-speed)
    for (const struct of this.structures) {
      struct.x -= struct.speed * speed * 0.7;
      if (struct.x < -struct.width - 50) {
        struct.x = this.width + Math.random() * 400 + 100;
        struct.y = Math.random() * (this.height * 0.7) + this.height * 0.15;
      }
    }

    // Warp streaks if boosting or warping
    if (isBoosting || isWarping) {
      for (const streak of this.warpStreaks) {
        streak.x -= streak.speed * (isWarping ? 2.5 : 1.4);
        if (streak.x < -streak.length) {
          streak.x = this.width + 50;
          streak.y = Math.random() * this.height;
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, isBoosting: boolean, isWarping: boolean) {
    const config = SECTOR_CONFIGS[this.currentSectorIndex];

    // 1. Cosmic Void Gradient Base
    const bgGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
    bgGrad.addColorStop(0, config.bgGradient[0]);
    bgGrad.addColorStop(0.5, config.bgGradient[1]);
    bgGrad.addColorStop(1, config.bgGradient[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Parallax Nebulae (Soft blending)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const neb of this.nebulae) {
      const grad = ctx.createRadialGradient(neb.x, neb.y, 10, neb.x, neb.y, neb.radiusX);
      grad.addColorStop(0, neb.color);
      grad.addColorStop(0.6, neb.secondaryColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.translate(neb.x, neb.y);
      ctx.scale(1, neb.radiusY / neb.radiusX);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, neb.radiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // 3. Deep Starfield (Layer 0)
    for (const star of this.stars) {
      if (star.layer === 0) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.brightness;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
    }
    ctx.globalAlpha = 1.0;

    // 4. Celestial Bodies (Far Planets & Moons)
    for (const body of this.celestialBodies) {
      this.renderCelestialBody(ctx, body);
    }

    // 5. Midfield Stars (Layer 1)
    for (const star of this.stars) {
      if (star.layer === 1) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.brightness;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle cross diffraction spike for bright stars
        if (star.size > 2.0) {
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 2, star.y);
          ctx.lineTo(star.x + star.size * 2, star.y);
          ctx.moveTo(star.x, star.y - star.size * 2);
          ctx.lineTo(star.x, star.y + star.size * 2);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1.0;

    // 6. Midfield Space Structures
    for (const struct of this.structures) {
      this.renderSpaceStructure(ctx, struct);
    }

    // 7. Nearfield Stars & Cosmic Dust (Layer 2)
    for (const star of this.stars) {
      if (star.layer === 2) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.brightness * 0.9;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    // 8. Warp Streaks when boosting or warping
    if (isBoosting || isWarping) {
      ctx.save();
      ctx.lineWidth = isWarping ? 3 : 1.5;
      for (const streak of this.warpStreaks) {
        const grad = ctx.createLinearGradient(streak.x, streak.y, streak.x + streak.length, streak.y);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(1, isWarping ? 'rgba(255, 255, 255, 0.9)' : 'rgba(147, 197, 253, 0.7)');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(streak.x, streak.y);
        ctx.lineTo(streak.x + streak.length * (isWarping ? 2.5 : 1.2), streak.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private renderCelestialBody(ctx: CanvasRenderingContext2D, body: CelestialBody) {
    ctx.save();
    ctx.translate(body.x, body.y);

    const r = body.radius;

    // Outer atmospheric halo
    const haloGrad = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.35);
    haloGrad.addColorStop(0, body.secondaryColor);
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // Planet sphere with 3D spherical shadow
    const lx = -r * 0.35;
    const ly = -r * 0.35;
    const planetGrad = ctx.createRadialGradient(lx, ly, r * 0.1, 0, 0, r);
    planetGrad.addColorStop(0, body.secondaryColor);
    planetGrad.addColorStop(0.5, body.primaryColor);
    planetGrad.addColorStop(0.85, '#020617');
    planetGrad.addColorStop(1, '#000000');

    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Planet cloud/band texture
    if (body.type === 'ringed_planet' || body.type === 'gas_giant') {
      ctx.save();
      ctx.clip(); // clip to planet sphere
      ctx.strokeStyle = body.secondaryColor;
      ctx.globalAlpha = 0.2;
      for (let y = -r + 15; y < r; y += 18) {
        ctx.lineWidth = 6 + (Math.sin(y) * 4);
        ctx.beginPath();
        ctx.moveTo(-r, y);
        ctx.lineTo(r, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Moon craters
    if (body.type === 'moon' && body.craterSeeds) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      for (const c of body.craterSeeds) {
        const cx = c.x * r;
        const cy = c.y * r;
        const cr = c.r * r;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Rings (for ringed planets)
    if (body.hasRings && body.ringColor) {
      ctx.save();
      ctx.rotate(-0.35); // tilt angle

      // Draw outer rings ellipse
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 2.2, r * 0.45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = body.ringColor;
      ctx.lineWidth = r * 0.35;
      ctx.stroke();

      // Ring gap / Cassini division
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.8, r * 0.36, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Shadow of planet cutting across ring
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.95, 0, Math.PI * 0.1, Math.PI * 0.9);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  private renderSpaceStructure(ctx: CanvasRenderingContext2D, struct: SpaceStructure) {
    ctx.save();
    ctx.translate(struct.x, struct.y);

    const now = Date.now() / 1000;

    if (struct.type === 'derelict_station') {
      // Silhouette station chassis
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;

      // Central core
      ctx.beginPath();
      ctx.arc(struct.width * 0.5, struct.height * 0.5, struct.height * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Solar trusses
      ctx.fillRect(0, struct.height * 0.4, struct.width, struct.height * 0.2);
      ctx.strokeRect(0, struct.height * 0.4, struct.width, struct.height * 0.2);

      // Antenna spires
      ctx.beginPath();
      ctx.moveTo(struct.width * 0.5, 0);
      ctx.lineTo(struct.width * 0.5, struct.height);
      ctx.stroke();
    } else {
      // Solar array wing
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;

      ctx.fillRect(0, 0, struct.width, struct.height);
      ctx.strokeRect(0, 0, struct.width, struct.height);

      // Panel grids
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      const cols = 5;
      const colWidth = struct.width / cols;
      for (let i = 1; i < cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * colWidth, 0);
        ctx.lineTo(i * colWidth, struct.height);
        ctx.stroke();
      }
    }

    // Blinking lights
    for (const light of struct.lights) {
      const isBlinking = Math.sin((now + light.blinkOffset) * 4) > 0;
      if (isBlinking) {
        ctx.fillStyle = light.color;
        ctx.shadowColor = light.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(light.x, light.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }
}
