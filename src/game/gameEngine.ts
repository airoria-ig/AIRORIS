import {
  GameState,
  Player,
  Projectile,
  Enemy,
  Asteroid,
  PowerUp,
  Particle,
  FloatingText,
} from '../types';
import { ProceduralBackground, SECTOR_CONFIGS } from './proceduralBackground';
import { GameRenderer } from './renderer';
import { LevelGenerator } from './levelGenerator';
import { soundEngine } from '../audio/soundEngine';

export interface GameEngineCallbacks {
  onStateChange: (state: GameState) => void;
  onPlayerUpdate: (player: Player) => void;
  onSectorProgress: (progress: number, distance: number, maxDistance: number, sectorName: string) => void;
  onBossAlert: (name: string) => void;
  onGameOver: (stats: { score: number; highscore: number; enemiesKilled: number; asteroidsDestroyed: number; sectorReached: number }) => void;
  onSectorCleared: (sectorNum: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 1280;
  private height = 720;

  private state: GameState = 'menu';
  private callbacks: GameEngineCallbacks;

  private background: ProceduralBackground;
  private levelGen: LevelGenerator;

  // Entities
  private player!: Player;
  private projectiles: Projectile[] = [];
  private enemies: Enemy[] = [];
  private asteroids: Asteroid[] = [];
  private powerUps: PowerUp[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Stats & Progress
  private sectorIndex = 0;
  private sectorDistance = 0;
  private enemiesKilled = 0;
  private asteroidsDestroyed = 0;
  private highScore = 0;
  private bossWarningTimer = 0;
  private warpTimer = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  private mousePos = { x: 0, y: 0, isDown: false, isRightDown: false };
  private touchActive = false;
  private touchPos = { x: 0, y: 0 };
  private virtualJoystick: { x: number; y: number } | null = null;
  private touchFiring = false;
  private touchBoosting = false;
  private controlMode: 'keyboard' | 'mouse' = 'keyboard';

  // Loop & Timing
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private isRunning = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.callbacks = callbacks;

    this.width = canvas.width;
    this.height = canvas.height;

    this.background = new ProceduralBackground(this.width, this.height);
    this.levelGen = new LevelGenerator(this.width, this.height);

    // Load highscore
    try {
      this.highScore = parseInt(localStorage.getItem('space_scroller_highscore') || '0', 10);
    } catch {
      this.highScore = 0;
    }

    this.initPlayer();
    this.setupListeners();
  }

  public setControlMode(mode: 'keyboard' | 'mouse') {
    this.controlMode = mode;
  }

  public getControlMode() {
    return this.controlMode;
  }

  public setVirtualJoystick(vector: { x: number; y: number } | null) {
    this.virtualJoystick = vector;
  }

  public setTouchFiring(firing: boolean) {
    this.touchFiring = firing;
  }

  public setTouchBoosting(boosting: boolean) {
    this.touchBoosting = boosting;
  }

  public resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.background.resize(w, h);
    this.levelGen.resize(w, h);
  }

  private initPlayer() {
    this.player = {
      x: this.width * 0.15,
      y: this.height * 0.5,
      vx: 0,
      vy: 0,
      width: 48,
      height: 32,
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      shieldRegenDelay: 0,
      boost: 100,
      maxBoost: 100,
      isBoosting: false,
      weaponLevel: 1,
      bombs: 2,
      maxBombs: 4,
      score: 0,
      combo: 1,
      comboTimer: 0,
      invulnerableTime: 0,
      tiltAngle: 0,
      targetY: this.height * 0.5,
      fireCooldown: 0,
      secondaryCooldown: 0,
    };
  }

  public startGame() {
    this.state = 'playing';
    this.callbacks.onStateChange('playing');
    this.sectorIndex = 0;
    this.sectorDistance = 0;
    this.enemiesKilled = 0;
    this.asteroidsDestroyed = 0;
    this.bossWarningTimer = 0;
    this.warpTimer = 0;

    this.initPlayer();
    this.projectiles = [];
    this.enemies = [];
    this.asteroids = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];

    this.background.setSector(0);
    this.levelGen.reset();

    soundEngine.ensureReady();
    soundEngine.startSynthMusic();

    this.startLoop();
  }

  public pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.callbacks.onStateChange('paused');
    }
  }

  public resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.callbacks.onStateChange('playing');
      this.lastTime = performance.now();
    }
  }

  public triggerBomb() {
    if (this.player.bombs <= 0 || this.state !== 'playing') return;

    this.player.bombs--;
    soundEngine.playBomb();

    // Shockwave particle covering entire screen
    this.particles.push({
      x: this.player.x,
      y: this.player.y,
      vx: 0,
      vy: 0,
      size: 10,
      color: '#fbbf24',
      alpha: 1.0,
      life: 0.8,
      maxLife: 0.8,
      decay: 1.2,
      type: 'shockwave',
    });

    // Clear all enemy projectiles
    this.projectiles = this.projectiles.filter((p) => !p.isEnemy);

    // Damage all on-screen enemies
    for (const enemy of this.enemies) {
      enemy.health -= 300;
      this.addExplosion(enemy.x, enemy.y, 'medium');
    }

    // Destroy all on-screen asteroids
    for (const ast of this.asteroids) {
      ast.health -= 300;
      this.addExplosion(ast.x, ast.y, 'small');
    }
  }

  private startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (this.state === 'playing' || this.state === 'warping') {
        this.update(dt);
      }
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Update Game State
  private update(dt: number) {
    const config = this.background.getSectorConfig();
    const isWarping = this.state === 'warping';

    // 1. Warp jump sequence
    if (isWarping) {
      this.warpTimer += dt;
      this.background.update(4.0, true, true);
      this.player.x += dt * 350;

      // Spawn warp speed particles
      this.particles.push({
        x: this.player.x - 30,
        y: this.player.y + (Math.random() - 0.5) * 20,
        vx: -(Math.random() * 400 + 300),
        vy: (Math.random() - 0.5) * 30,
        size: Math.random() * 3 + 2,
        color: '#38bdf8',
        alpha: 1.0,
        life: 0.4,
        maxLife: 0.4,
        decay: 2.5,
        type: 'flame',
      });

      if (this.warpTimer >= 2.5) {
        // Warp complete! Advance sector
        this.sectorIndex = (this.sectorIndex + 1) % SECTOR_CONFIGS.length;
        this.sectorDistance = 0;
        this.background.setSector(this.sectorIndex);
        this.levelGen.reset();
        this.state = 'playing';
        this.callbacks.onStateChange('playing');
        this.callbacks.onSectorCleared(this.sectorIndex + 1);

        // Reset player position with health/shield boost
        this.player.x = this.width * 0.15;
        this.player.shield = this.player.maxShield;
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
        this.player.bombs = Math.min(this.player.maxBombs, this.player.bombs + 1);
      }
      return;
    }

    // 2. Normal gameplay progression
    const scrollSpeed = this.player.isBoosting ? 2.2 : 1.0;
    this.sectorDistance += dt * 100 * scrollSpeed;
    const sectorProgress = Math.min(1.0, this.sectorDistance / config.distanceToBoss);

    this.callbacks.onSectorProgress(
      sectorProgress,
      Math.floor(this.sectorDistance),
      config.distanceToBoss,
      config.name
    );

    // Update Parallax Background
    this.background.update(1.2, this.player.isBoosting, false);

    // 3. Player Input & Movement
    this.handlePlayerInput(dt);

    // Shield regeneration
    if (this.player.shieldRegenDelay > 0) {
      this.player.shieldRegenDelay -= dt;
    } else if (this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + dt * 15);
    }

    // Boost meter recharge
    if (this.player.isBoosting) {
      this.player.boost = Math.max(0, this.player.boost - dt * 45);
      if (this.player.boost <= 0) this.player.isBoosting = false;
    } else {
      this.player.boost = Math.min(this.player.maxBoost, this.player.boost + dt * 25);
    }

    // Combo timer decay
    if (this.player.comboTimer > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) {
        this.player.combo = 1;
      }
    }

    // Invulnerability timer
    if (this.player.invulnerableTime > 0) {
      this.player.invulnerableTime -= dt;
    }

    // Weapon cooldowns
    if (this.player.fireCooldown > 0) this.player.fireCooldown -= dt;
    if (this.player.secondaryCooldown > 0) this.player.secondaryCooldown -= dt;

    // Automatic primary firing if holding trigger
    const isFiring =
      this.touchFiring ||
      this.keys['Space'] ||
      this.keys['KeyJ'] ||
      (this.controlMode === 'mouse' && this.mousePos.isDown);

    if (isFiring && this.player.fireCooldown <= 0) {
      this.firePlayerWeapons();
    }

    // Secondary homing missile firing (automatic every 1.5s when upgraded to weapon lvl 4+)
    if (this.player.weaponLevel >= 4 && this.player.secondaryCooldown <= 0) {
      this.fireHomingMissile();
      this.player.secondaryCooldown = 1.4;
    }

    // 4. Procedural Wave Spawning
    this.levelGen.update(
      dt,
      sectorProgress,
      config,
      this.enemies.length,
      (enemy) => this.enemies.push(enemy),
      (ast) => this.asteroids.push(ast),
      () => {
        this.bossWarningTimer = 3.0;
        soundEngine.playAlarm();
        this.callbacks.onBossAlert(config.bossName);
      }
    );

    if (this.bossWarningTimer > 0) {
      this.bossWarningTimer -= dt;
    }

    // 5. Update Entities
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateAsteroids(dt);
    this.updatePowerUps(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // 6. Collision Detections
    this.handleCollisions();

    // 7. Check Game Over
    if (this.player.health <= 0) {
      this.triggerGameOver();
    }

    // Notify UI of player metrics
    this.callbacks.onPlayerUpdate({ ...this.player });
  }

  private handlePlayerInput(dt: number) {
    const p = this.player;
    const baseSpeed = p.isBoosting ? 440 : 280;

    let moveX = 0;
    let moveY = 0;

    if (this.virtualJoystick) {
      moveX = this.virtualJoystick.x;
      moveY = this.virtualJoystick.y;
      p.isBoosting = Boolean((this.touchBoosting || this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.mousePos.isRightDown) && p.boost > 5);
    } else if (this.controlMode === 'keyboard') {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

      // Boost key
      p.isBoosting = Boolean((this.touchBoosting || this.keys['ShiftLeft'] || this.keys['ShiftRight']) && p.boost > 5);
    } else {
      // Mouse/Touch follow mode
      const dx = this.mousePos.x - p.x;
      const dy = this.mousePos.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        moveX = dx / dist;
        moveY = dy / dist;
      }
      p.isBoosting = Boolean((this.touchBoosting || this.mousePos.isRightDown) && p.boost > 5);
    }

    // Normalize diagonal
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    p.vx = moveX * baseSpeed;
    p.vy = moveY * baseSpeed;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Boundaries
    const marginX = p.width * 0.5;
    const marginY = p.height * 0.5;
    p.x = Math.max(marginX, Math.min(this.width - marginX - 50, p.x));
    p.y = Math.max(marginY, Math.min(this.height - marginY, p.y));

    // Pitch tilt angle based on vertical movement
    const targetTilt = moveY * 18;
    p.tiltAngle += (targetTilt - p.tiltAngle) * dt * 10;

    // Thruster exhaust particles
    if (Math.random() < (p.isBoosting ? 0.9 : 0.45)) {
      this.particles.push({
        x: p.x - p.width * 0.45,
        y: p.y + (Math.random() - 0.5) * 10,
        vx: -(Math.random() * 120 + 80),
        vy: (Math.random() - 0.5) * 20,
        size: Math.random() * (p.isBoosting ? 5 : 3) + 1,
        color: p.isBoosting ? '#38bdf8' : '#f59e0b',
        alpha: 0.8,
        life: 0.3,
        maxLife: 0.3,
        decay: 3.0,
        type: 'flame',
      });
    }
  }

  // Player Weapon Firing System
  private firePlayerWeapons() {
    const p = this.player;
    const lvl = p.weaponLevel;

    if (lvl === 1) {
      // Level 1: Dual forward lasers
      p.fireCooldown = 0.16;
      soundEngine.playLaser('single');
      [-8, 8].forEach((offsetY) => {
        this.projectiles.push({
          id: `p_${Date.now()}_${Math.random()}`,
          x: p.x + p.width * 0.3,
          y: p.y + offsetY,
          vx: 800,
          vy: 0,
          radius: 3.5,
          damage: 18,
          isEnemy: false,
          type: 'laser',
          color: '#38bdf8',
          glowColor: '#0284c7',
          life: 1.5,
          maxLife: 1.5,
        });
      });
    } else if (lvl === 2) {
      // Level 2: Triple spread
      p.fireCooldown = 0.15;
      soundEngine.playLaser('spread');
      [-12, 0, 12].forEach((offsetY, idx) => {
        const spreadVy = (idx - 1) * 70;
        this.projectiles.push({
          id: `p_${Date.now()}_${idx}`,
          x: p.x + p.width * 0.3,
          y: p.y + offsetY,
          vx: 820,
          vy: spreadVy,
          radius: 4,
          damage: 22,
          isEnemy: false,
          type: 'laser',
          color: '#38bdf8',
          glowColor: '#38bdf8',
          life: 1.5,
          maxLife: 1.5,
        });
      });
    } else if (lvl === 3) {
      // Level 3: Quad heavy plasma
      p.fireCooldown = 0.14;
      soundEngine.playLaser('plasma');
      [-15, -5, 5, 15].forEach((offsetY, idx) => {
        const angle = (idx - 1.5) * 0.08;
        this.projectiles.push({
          id: `p_${Date.now()}_${idx}`,
          x: p.x + p.width * 0.3,
          y: p.y + offsetY,
          vx: Math.cos(angle) * 850,
          vy: Math.sin(angle) * 850,
          radius: 5,
          damage: 28,
          isEnemy: false,
          type: 'plasma',
          color: '#818cf8',
          glowColor: '#6366f1',
          life: 1.5,
          maxLife: 1.5,
        });
      });
    } else {
      // Level 4 & 5: Overcharge Hyper Stream
      p.fireCooldown = 0.11;
      soundEngine.playLaser('beam');
      [-16, -6, 6, 16].forEach((offsetY, idx) => {
        const angle = (idx - 1.5) * 0.09;
        this.projectiles.push({
          id: `p_${Date.now()}_${idx}`,
          x: p.x + p.width * 0.35,
          y: p.y + offsetY,
          vx: Math.cos(angle) * 900,
          vy: Math.sin(angle) * 900,
          radius: 6,
          damage: 34,
          isEnemy: false,
          type: 'plasma',
          color: '#c084fc',
          glowColor: '#a855f7',
          life: 1.5,
          maxLife: 1.5,
        });
      });
    }
  }

  // Homing Swarm Missile
  private fireHomingMissile() {
    soundEngine.playMissileLaunch();
    [-18, 18].forEach((offsetY) => {
      this.projectiles.push({
        id: `missile_${Date.now()}_${offsetY}`,
        x: this.player.x,
        y: this.player.y + offsetY,
        vx: 300,
        vy: offsetY * 8,
        radius: 5,
        damage: 60,
        isEnemy: false,
        type: 'missile',
        color: '#ef4444',
        glowColor: '#f97316',
        life: 2.5,
        maxLife: 2.5,
        homing: true,
      });
    });
  }

  // Update Projectiles
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // Homing missile logic
      if (p.homing && !p.isEnemy) {
        // Find closest target
        let nearestTarget: { x: number; y: number } | null = null;
        let minDist = 700;

        for (const e of this.enemies) {
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < minDist) {
            minDist = dist;
            nearestTarget = e;
          }
        }
        if (!nearestTarget) {
          for (const ast of this.asteroids) {
            const dist = Math.hypot(ast.x - p.x, ast.y - p.y);
            if (dist < minDist) {
              minDist = dist;
              nearestTarget = ast;
            }
          }
        }

        if (nearestTarget) {
          const targetAngle = Math.atan2(nearestTarget.y - p.y, nearestTarget.x - p.x);
          const currentAngle = Math.atan2(p.vy, p.vx);
          let diff = targetAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          const turnRate = 6.0 * dt;
          const newAngle = currentAngle + Math.max(-turnRate, Math.min(turnRate, diff));
          const speed = Math.hypot(p.vx, p.vy) + dt * 150;
          p.vx = Math.cos(newAngle) * speed;
          p.vy = Math.sin(newAngle) * speed;
        }

        // Smoke trail
        if (Math.random() < 0.6) {
          this.particles.push({
            x: p.x - p.vx * 0.02,
            y: p.y - p.vy * 0.02,
            vx: -30,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 3 + 2,
            color: 'rgba(203, 213, 225, 0.6)',
            alpha: 0.6,
            life: 0.35,
            maxLife: 0.35,
            decay: 2.0,
            type: 'smoke',
          });
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Remove if off screen or expired
      if (
        p.life <= 0 ||
        p.x < -40 ||
        p.x > this.width + 60 ||
        p.y < -40 ||
        p.y > this.height + 40
      ) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Update Enemies & Enemy Weapons
  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.patternTimer += dt;

      // AI Movement behaviors
      if (e.patternType === 'sine') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.patternTimer * 3 + e.patternSeed) * 140 * dt;
      } else if (e.patternType === 'hover') {
        // Frigate advances then hovers near right screen
        if (e.x > this.width * 0.75) {
          e.x += e.vx * dt;
        } else {
          e.y += Math.sin(e.patternTimer * 1.5) * 80 * dt;
        }
      } else if (e.patternType === 'boss_patrol') {
        // Boss moves into position and patrols vertically
        if (e.x > this.width * 0.72) {
          e.x += e.vx * dt;
        } else {
          e.y += Math.sin(e.patternTimer * 1.2) * 110 * dt;
        }
      } else {
        // Straight / Dive
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }

      // Enemy weapons fire
      e.shootCooldown -= dt;
      if (e.shootCooldown <= 0 && e.x < this.width - 20) {
        if (e.isBoss) {
          // Boss multi-turret attack pattern
          e.shootCooldown = 1.2;
          this.fireBossAttack(e);
        } else {
          // Regular enemy fire
          e.shootCooldown = Math.random() * 1.8 + 1.2;
          this.projectiles.push({
            id: `ep_${Date.now()}_${i}`,
            x: e.x - e.width * 0.5,
            y: e.y,
            vx: -380,
            vy: (Math.random() - 0.5) * 60,
            radius: 4,
            damage: 15,
            isEnemy: true,
            type: 'plasma',
            color: '#f43f5e',
            glowColor: '#e11d48',
            life: 3.0,
            maxLife: 3.0,
          });
        }
      }

      // Check if dead
      if (e.health <= 0) {
        this.handleEnemyDefeated(e);
        this.enemies.splice(i, 1);
        continue;
      }

      // Out of bounds cleanup
      if (e.x < -e.width * 2) {
        this.enemies.splice(i, 1);
      }
    }
  }

  // Boss attack patterns
  private fireBossAttack(boss: Enemy) {
    soundEngine.playLaser('plasma');

    // Quad spread orbs
    [-40, -15, 15, 40].forEach((dy, idx) => {
      const angle = Math.PI - 0.2 + idx * 0.13;
      this.projectiles.push({
        id: `boss_p_${Date.now()}_${idx}`,
        x: boss.x - boss.width * 0.4,
        y: boss.y + dy,
        vx: Math.cos(angle) * 360,
        vy: Math.sin(angle) * 360,
        radius: 6,
        damage: 22,
        isEnemy: true,
        type: 'orb',
        color: '#ef4444',
        glowColor: '#dc2626',
        life: 4.0,
        maxLife: 4.0,
      });
    });

    // Targeted shot at player
    const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
    this.projectiles.push({
      id: `boss_aim_${Date.now()}`,
      x: boss.x - boss.width * 0.4,
      y: boss.y,
      vx: Math.cos(angleToPlayer) * 420,
      vy: Math.sin(angleToPlayer) * 420,
      radius: 7,
      damage: 28,
      isEnemy: true,
      type: 'plasma',
      color: '#f97316',
      glowColor: '#ea580c',
      life: 3.5,
      maxLife: 3.5,
    });
  }

  // Defeating Enemy
  private handleEnemyDefeated(e: Enemy) {
    this.enemiesKilled++;
    const scoreGain = e.points * this.player.combo;
    this.player.score += scoreGain;
    this.checkHighScore();

    // Increment combo
    this.player.combo = Math.min(5, this.player.combo + 1);
    this.player.comboTimer = 3.5;

    // Floating score popup
    this.floatingTexts.push({
      id: `txt_${Date.now()}`,
      x: e.x,
      y: e.y - 15,
      text: `+${scoreGain}`,
      color: e.isBoss ? '#f59e0b' : '#38bdf8',
      size: e.isBoss ? 24 : 15,
      alpha: 1.0,
      life: 1.0,
      maxLife: 1.0,
    });

    // Explosions
    this.addExplosion(e.x, e.y, e.isBoss ? 'boss' : e.type === 'frigate' ? 'medium' : 'small');
    soundEngine.playExplosion(e.isBoss ? 'boss' : 'medium');

    // Power-up roll
    const drop = LevelGenerator.rollPowerUp(e.x, e.y, e.isBoss);
    if (drop) this.powerUps.push(drop);

    // If boss defeated: Trigger Hyperspace Sector Warp Jump!
    if (e.isBoss) {
      this.state = 'warping';
      this.callbacks.onStateChange('warping');
      this.warpTimer = 0;
      soundEngine.playWarp();
    }
  }

  // Update Asteroids
  private updateAsteroids(dt: number) {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rotation += a.rotationSpeed * dt;

      if (a.health <= 0) {
        this.asteroidsDestroyed++;
        const pts = a.points * this.player.combo;
        this.player.score += pts;
        this.checkHighScore();

        this.addExplosion(a.x, a.y, 'small');
        soundEngine.playExplosion('small');

        // Chance to spawn crystal power-up
        if (a.type === 'crystal' || Math.random() < 0.25) {
          const p = LevelGenerator.rollPowerUp(a.x, a.y);
          if (p) this.powerUps.push(p);
        }

        this.asteroids.splice(i, 1);
        continue;
      }

      if (a.x < -a.radius * 2) {
        this.asteroids.splice(i, 1);
      }
    }
  }

  // Update Power-Ups
  private updatePowerUps(dt: number) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.bobTimer += dt;
      p.life -= dt;

      // Gravitational attraction toward player if close
      const dx = this.player.x - p.x;
      const dy = this.player.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 180) {
        p.vx += (dx / dist) * 350 * dt;
        p.vy += (dy / dist) * 350 * dt;
      }

      // Collect power-up
      if (dist < p.radius + this.player.width * 0.45) {
        this.applyPowerUp(p.type);
        this.powerUps.splice(i, 1);
        continue;
      }

      if (p.life <= 0 || p.x < -40) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private applyPowerUp(type: PowerUp['type']) {
    soundEngine.playPowerUp();

    let text = '+UPGRADE';
    let color = '#38bdf8';

    switch (type) {
      case 'shield':
        this.player.shield = this.player.maxShield;
        text = 'SHIELD RESTORED';
        color = '#38bdf8';
        break;
      case 'multishot':
        this.player.weaponLevel = Math.min(5, this.player.weaponLevel + 1);
        text = `WEAPON LVL ${this.player.weaponLevel}`;
        color = '#ec4899';
        break;
      case 'missiles':
        this.player.weaponLevel = Math.max(4, this.player.weaponLevel);
        text = 'HOMING MISSILES';
        color = '#f97316';
        break;
      case 'repair':
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
        text = '+40 HULL REPAIR';
        color = '#22c55e';
        break;
      case 'bomb':
        this.player.bombs = Math.min(this.player.maxBombs, this.player.bombs + 1);
        text = '+1 SMART BOMB';
        color = '#eab308';
        break;
      case 'overcharge':
        this.player.weaponLevel = 5;
        this.player.shield = this.player.maxShield;
        text = 'OVERCHARGE ACTIVATED!';
        color = '#a855f7';
        break;
      case 'crystal':
        this.player.score += 500 * this.player.combo;
        text = '+500 CRYSTAL BONUS';
        color = '#06b6d4';
        break;
    }

    this.floatingTexts.push({
      id: `pu_${Date.now()}`,
      x: this.player.x,
      y: this.player.y - 25,
      text,
      color,
      size: 16,
      alpha: 1.0,
      life: 1.2,
      maxLife: 1.2,
    });
  }

  // Update Particles
  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'shockwave') {
        p.size += dt * 380;
      }
      if (p.rotation !== undefined && p.rotSpeed !== undefined) {
        p.rotation += p.rotSpeed * dt;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Update Floating Texts
  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= dt * 35;
      t.life -= dt;
      t.alpha = Math.max(0, t.life / t.maxLife);

      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Collisions
  private handleCollisions() {
    const p = this.player;

    // 1. Player Projectiles vs Enemies & Asteroids
    for (const proj of this.projectiles) {
      if (proj.isEnemy) continue;

      // Check vs Enemies
      for (const e of this.enemies) {
        const dist = Math.hypot(e.x - proj.x, e.y - proj.y);
        const hitDist = (e.width + e.height) * 0.35 + proj.radius;

        if (dist < hitDist) {
          e.health -= proj.damage;
          proj.life = 0; // consume bullet

          // Hit spark particles
          this.particles.push({
            x: proj.x,
            y: proj.y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            size: Math.random() * 3 + 1,
            color: proj.color,
            alpha: 1.0,
            life: 0.25,
            maxLife: 0.25,
            decay: 4.0,
            type: 'spark',
          });
          break;
        }
      }

      // Check vs Asteroids
      for (const a of this.asteroids) {
        const dist = Math.hypot(a.x - proj.x, a.y - proj.y);
        if (dist < a.radius + proj.radius) {
          a.health -= proj.damage;
          proj.life = 0;

          // Rock chip debris
          this.particles.push({
            x: proj.x,
            y: proj.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            size: 2,
            color: '#78716c',
            alpha: 1.0,
            life: 0.3,
            maxLife: 0.3,
            decay: 3.0,
            type: 'debris',
          });
          break;
        }
      }
    }

    // 2. Enemy Projectiles vs Player
    if (p.invulnerableTime <= 0) {
      for (const proj of this.projectiles) {
        if (!proj.isEnemy) continue;

        const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
        const hitRadius = p.width * 0.45;

        if (dist < hitRadius + proj.radius) {
          this.damagePlayer(proj.damage);
          proj.life = 0;
          break;
        }
      }

      // 3. Enemies physical collision with Player
      for (const e of this.enemies) {
        const dist = Math.hypot(p.x - e.x, p.y - e.y);
        if (dist < (p.width + e.width) * 0.4) {
          this.damagePlayer(35);
          e.health -= 50;
          break;
        }
      }

      // 4. Asteroids physical collision with Player
      for (const a of this.asteroids) {
        const dist = Math.hypot(p.x - a.x, p.y - a.y);
        if (dist < p.width * 0.4 + a.radius) {
          this.damagePlayer(25);
          a.health -= 40;
          break;
        }
      }
    }
  }

  // Damage Player (Shield absorbs first)
  private damagePlayer(amount: number) {
    const p = this.player;
    p.shieldRegenDelay = 3.5; // delay shield recharge
    soundEngine.playShieldHit();

    if (p.shield > 0) {
      if (p.shield >= amount) {
        p.shield -= amount;
      } else {
        const remainder = amount - p.shield;
        p.shield = 0;
        p.health = Math.max(0, p.health - remainder);
      }
    } else {
      p.health = Math.max(0, p.health - amount);
    }

    // Camera shake & hit sparks
    p.invulnerableTime = 0.5;

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        size: Math.random() * 3 + 2,
        color: '#38bdf8',
        alpha: 1.0,
        life: 0.35,
        maxLife: 0.35,
        decay: 3.0,
        type: 'spark',
      });
    }
  }

  // Particle Explosions
  private addExplosion(x: number, y: number, size: 'small' | 'medium' | 'boss') {
    const count = size === 'boss' ? 45 : size === 'medium' ? 22 : 12;
    const colors = ['#f97316', '#ef4444', '#fbbf24', '#ffffff', '#78716c'];

    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 5,
      color: size === 'boss' ? '#f59e0b' : '#f97316',
      alpha: 1.0,
      life: size === 'boss' ? 0.8 : 0.4,
      maxLife: size === 'boss' ? 0.8 : 0.4,
      decay: 2.5,
      type: 'shockwave',
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (size === 'boss' ? 260 : 150) + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (size === 'boss' ? 7 : 4) + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        life: Math.random() * 0.4 + 0.3,
        maxLife: 0.7,
        decay: 2.0,
        type: Math.random() < 0.3 ? 'debris' : 'spark',
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  private checkHighScore() {
    if (this.player.score > this.highScore) {
      this.highScore = this.player.score;
      try {
        localStorage.setItem('space_scroller_highscore', this.highScore.toString());
      } catch {
        // ignore
      }
    }
  }

  private triggerGameOver() {
    this.state = 'gameover';
    this.callbacks.onStateChange('gameover');
    soundEngine.playExplosion('boss');
    this.addExplosion(this.player.x, this.player.y, 'boss');

    this.callbacks.onGameOver({
      score: this.player.score,
      highscore: this.highScore,
      enemiesKilled: this.enemiesKilled,
      asteroidsDestroyed: this.asteroidsDestroyed,
      sectorReached: this.sectorIndex + 1,
    });
  }

  // Render Frame
  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const isWarping = this.state === 'warping';

    // 1. Procedural Multi-Layer Parallax Background
    this.background.render(ctx, this.player?.isBoosting || false, isWarping);

    // 2. Asteroids
    for (const a of this.asteroids) {
      GameRenderer.renderAsteroid(ctx, a);
    }

    // 3. Power-Ups
    for (const p of this.powerUps) {
      GameRenderer.renderPowerUp(ctx, p);
    }

    // 4. Enemies
    for (const e of this.enemies) {
      GameRenderer.renderEnemy(ctx, e);
    }

    // 5. Player Starfighter
    if (this.state === 'playing' || this.state === 'warping') {
      GameRenderer.renderPlayer(ctx, this.player, isWarping);
    }

    // 6. Projectiles
    for (const proj of this.projectiles) {
      GameRenderer.renderProjectile(ctx, proj);
    }

    // 7. Particles & Shockwaves
    for (const part of this.particles) {
      GameRenderer.renderParticle(ctx, part);
    }

    // 8. Floating Score Numbers
    for (const txt of this.floatingTexts) {
      GameRenderer.renderFloatingText(ctx, txt);
    }

    // 9. Boss Red Alert Banner
    if (this.bossWarningTimer > 0) {
      ctx.save();
      const alpha = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.25})`;
      ctx.fillRect(0, this.height * 0.2, this.width, 60);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, this.height * 0.2, this.width, 60);

      ctx.fillStyle = '#fecaca';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠ WARNING: CAPITAL DREADNOUGHT FLAGSHIP APPROACHING ⚠', this.width * 0.5, this.height * 0.2 + 30);
      ctx.restore();
    }
  }

  // Setup Event Listeners
  private setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Quick key shortcuts
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'playing') this.pauseGame();
        else if (this.state === 'paused') this.resumeGame();
      }
      if (e.code === 'KeyE' || e.code === 'KeyQ' || e.code === 'KeyB') {
        this.triggerBomb();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mousePos.x = (e.clientX - rect.left) * scaleX;
      this.mousePos.y = (e.clientY - rect.top) * scaleY;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mousePos.isDown = true;
      if (e.button === 2) this.mousePos.isRightDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mousePos.isDown = false;
      if (e.button === 2) this.mousePos.isRightDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      this.touchActive = true;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mousePos.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
      this.mousePos.isDown = true;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mousePos.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
    });

    window.addEventListener('touchend', () => {
      this.mousePos.isDown = false;
    });
  }
}
