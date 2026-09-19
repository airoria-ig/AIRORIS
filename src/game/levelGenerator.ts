import { Enemy, Asteroid, PowerUp, SectorConfig } from '../types';

export class LevelGenerator {
  private width: number;
  private height: number;
  private waveTimer = 0;
  private asteroidTimer = 0;
  private bossSpawned = false;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public reset() {
    this.waveTimer = 0;
    this.asteroidTimer = 0;
    this.bossSpawned = false;
  }

  public hasBossSpawned(): boolean {
    return this.bossSpawned;
  }

  public update(
    dt: number,
    sectorProgress: number, // 0.0 to 1.0
    sectorConfig: SectorConfig,
    activeEnemiesCount: number,
    onSpawnEnemy: (enemy: Enemy) => void,
    onSpawnAsteroid: (asteroid: Asteroid) => void,
    onSpawnBossAlert: () => void
  ) {
    // 1. Check if it's time for Boss Fight
    if (sectorProgress >= 1.0 && !this.bossSpawned) {
      this.bossSpawned = true;
      onSpawnBossAlert();
      this.spawnBoss(sectorConfig, onSpawnEnemy);
      return;
    }

    // If boss is active, regular procedural wave frequency is reduced
    const waveInterval = this.bossSpawned ? 7.0 : Math.max(1.8, 3.8 - sectorProgress * 1.5);
    this.waveTimer += dt;

    if (this.waveTimer >= waveInterval && activeEnemiesCount < (this.bossSpawned ? 4 : 14)) {
      this.waveTimer = 0;
      this.spawnProceduralWave(sectorProgress, sectorConfig, onSpawnEnemy);
    }

    // 2. Procedural Asteroid Field Spawning
    this.asteroidTimer += dt;
    const asteroidInterval = Math.max(1.2, 2.5 / sectorConfig.asteroidDensity);
    if (this.asteroidTimer >= asteroidInterval) {
      this.asteroidTimer = 0;
      this.spawnAsteroid(sectorConfig, onSpawnAsteroid);
    }
  }

  private spawnProceduralWave(
    progress: number,
    config: SectorConfig,
    onSpawnEnemy: (enemy: Enemy) => void
  ) {
    const waveTypes = ['v_scouts', 'sine_interceptors', 'frigate_patrol', 'driller_strike', 'pincer_flank'];
    const chosenWave = waveTypes[Math.floor(Math.random() * waveTypes.length)];

    const startX = this.width + 60;
    const centerY = Math.random() * (this.height * 0.6) + this.height * 0.2;

    switch (chosenWave) {
      case 'v_scouts': {
        // V-formation of 3 or 5 scouts
        const count = progress > 0.4 ? 5 : 3;
        for (let i = 0; i < count; i++) {
          const offsetIdx = i - Math.floor(count / 2);
          const x = startX + Math.abs(offsetIdx) * 35;
          const y = centerY + offsetIdx * 45;
          onSpawnEnemy({
            id: `scout_${Date.now()}_${Math.random()}`,
            type: 'scout',
            x,
            y: Math.max(40, Math.min(this.height - 40, y)),
            vx: -(190 + Math.random() * 40),
            vy: 0,
            width: 32,
            height: 24,
            health: 25 + config.number * 8,
            maxHealth: 25 + config.number * 8,
            points: 100,
            shootCooldown: Math.random() * 1.5 + 1.0,
            patternTimer: 0,
            patternType: 'straight',
            patternSeed: Math.random() * 10,
          });
        }
        break;
      }

      case 'sine_interceptors': {
        // Interceptors undulating in waves
        const count = 3;
        for (let i = 0; i < count; i++) {
          onSpawnEnemy({
            id: `int_${Date.now()}_${i}`,
            type: 'interceptor',
            x: startX + i * 50,
            y: centerY + (i - 1) * 30,
            vx: -(160 + Math.random() * 30),
            vy: 0,
            width: 36,
            height: 28,
            health: 45 + config.number * 10,
            maxHealth: 45 + config.number * 10,
            points: 200,
            shootCooldown: Math.random() * 1.8 + 1.2,
            patternTimer: i * 0.5,
            patternType: 'sine',
            patternSeed: Math.random() * 10,
          });
        }
        break;
      }

      case 'frigate_patrol': {
        // Heavy Frigate with escort
        onSpawnEnemy({
          id: `frigate_${Date.now()}`,
          type: 'frigate',
          x: startX,
          y: centerY,
          vx: -90,
          vy: 0,
          width: 58,
          height: 42,
          health: 140 + config.number * 40,
          maxHealth: 140 + config.number * 40,
          points: 450,
          shootCooldown: 1.2,
          patternTimer: 0,
          patternType: 'hover',
          patternSeed: Math.random() * 5,
        });

        // Flanking escort
        [-35, 35].forEach((dy, idx) => {
          onSpawnEnemy({
            id: `escort_${Date.now()}_${idx}`,
            type: 'scout',
            x: startX + 40,
            y: Math.max(30, Math.min(this.height - 30, centerY + dy)),
            vx: -90,
            vy: 0,
            width: 30,
            height: 22,
            health: 25,
            maxHealth: 25,
            points: 100,
            shootCooldown: 2.0,
            patternTimer: 0,
            patternType: 'straight',
            patternSeed: idx,
          });
        });
        break;
      }

      case 'driller_strike': {
        // Fast driller charging forward
        onSpawnEnemy({
          id: `driller_${Date.now()}`,
          type: 'driller',
          x: startX,
          y: centerY,
          vx: -(220 + Math.random() * 50),
          vy: (Math.random() - 0.5) * 40,
          width: 50,
          height: 32,
          health: 80 + config.number * 20,
          maxHealth: 80 + config.number * 20,
          points: 300,
          shootCooldown: 2.5,
          patternTimer: 0,
          patternType: 'dive',
          patternSeed: Math.random() * 10,
        });
        break;
      }

      case 'pincer_flank': {
        // Top and bottom simultaneous ambush
        [this.height * 0.15, this.height * 0.85].forEach((y, idx) => {
          onSpawnEnemy({
            id: `pincer_${Date.now()}_${idx}`,
            type: 'interceptor',
            x: startX,
            y,
            vx: -180,
            vy: idx === 0 ? 30 : -30,
            width: 36,
            height: 28,
            health: 40 + config.number * 10,
            maxHealth: 40 + config.number * 10,
            points: 180,
            shootCooldown: 1.0,
            patternTimer: 0,
            patternType: 'straight',
            patternSeed: idx,
          });
        });
        break;
      }
    }
  }

  // Spawn Asteroid with procedural vertices & mineral classification
  private spawnAsteroid(config: SectorConfig, onSpawnAsteroid: (asteroid: Asteroid) => void) {
    const types: ('rock' | 'ice' | 'crystal' | 'metal')[] = ['rock', 'rock', 'ice', 'crystal', 'metal'];
    const type = types[Math.floor(Math.random() * types.length)];

    const radius = Math.random() * 26 + 14;
    const y = Math.random() * (this.height - radius * 2) + radius;

    // Generate jagged procedural polygonal vertices
    const vertexCount = Math.floor(Math.random() * 4) + 7;
    const vertices: { x: number; y: number }[] = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const dist = radius * (0.75 + Math.random() * 0.45);
      vertices.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      });
    }

    const health = Math.floor(radius * 1.5 * (type === 'metal' ? 2 : 1));
    const points = type === 'crystal' ? 250 : type === 'metal' ? 150 : 80;

    onSpawnAsteroid({
      id: `ast_${Date.now()}_${Math.random()}`,
      x: this.width + radius + 10,
      y,
      vx: -(Math.random() * 110 + 60),
      vy: (Math.random() - 0.5) * 40,
      radius,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2.5,
      vertices,
      type,
      health,
      maxHealth: health,
      points,
    });
  }

  // Spawn Sector Boss
  private spawnBoss(config: SectorConfig, onSpawnEnemy: (enemy: Enemy) => void) {
    const bossWidth = 140;
    const bossHeight = 110;

    onSpawnEnemy({
      id: `boss_sector_${config.number}`,
      type: 'boss',
      name: config.bossName,
      x: this.width + bossWidth + 50,
      y: this.height * 0.5,
      vx: -60,
      vy: 0,
      width: bossWidth,
      height: bossHeight,
      health: config.bossHealth,
      maxHealth: config.bossHealth,
      points: 5000,
      shootCooldown: 1.0,
      patternTimer: 0,
      patternType: 'boss_patrol',
      patternSeed: 42,
      isBoss: true,
      bossPhase: 1,
      bossMaxPhases: 3,
      turrets: [
        { xOffset: -bossWidth * 0.2, yOffset: -bossHeight * 0.35, angle: Math.PI, cooldown: 1.2 },
        { xOffset: -bossWidth * 0.2, yOffset: bossHeight * 0.35, angle: Math.PI, cooldown: 1.2 },
        { xOffset: bossWidth * 0.1, yOffset: -bossHeight * 0.4, angle: Math.PI * 0.9, cooldown: 2.0 },
        { xOffset: bossWidth * 0.1, yOffset: bossHeight * 0.4, angle: Math.PI * 1.1, cooldown: 2.0 },
      ],
    });
  }

  // Drop table calculation for defeated enemies / shattered asteroids
  public static rollPowerUp(x: number, y: number, isBoss = false): PowerUp | null {
    if (isBoss) {
      // Boss always drops high tier overcharge or bomb
      return {
        id: `drop_${Date.now()}`,
        x,
        y,
        vx: -40,
        vy: 0,
        type: 'overcharge',
        radius: 14,
        life: 20,
        bobTimer: 0,
      };
    }

    const dropChance = Math.random();
    if (dropChance > 0.32) return null; // 32% drop chance

    const roll = Math.random();
    let type: PowerUp['type'] = 'crystal';

    if (roll < 0.25) type = 'multishot';
    else if (roll < 0.45) type = 'shield';
    else if (roll < 0.65) type = 'missiles';
    else if (roll < 0.8) type = 'repair';
    else if (roll < 0.92) type = 'bomb';
    else type = 'crystal';

    return {
      id: `drop_${Date.now()}_${Math.random()}`,
      x,
      y,
      vx: -45,
      vy: (Math.random() - 0.5) * 20,
      type,
      radius: 12,
      life: 18,
      bobTimer: Math.random() * Math.PI * 2,
    };
  }
}
