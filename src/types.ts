export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory' | 'warping';

export type WeaponType = 'laser' | 'spread' | 'missiles' | 'beam';

export type EnemyType = 'scout' | 'frigate' | 'interceptor' | 'driller' | 'cruiser' | 'boss';

export type PowerUpType = 'shield' | 'multishot' | 'missiles' | 'bomb' | 'repair' | 'overcharge' | 'crystal';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRegenDelay: number;
  boost: number;
  maxBoost: number;
  isBoosting: boolean;
  weaponLevel: number;
  bombs: number;
  maxBombs: number;
  score: number;
  combo: number;
  comboTimer: number;
  invulnerableTime: number;
  tiltAngle: number;
  targetY: number;
  fireCooldown: number;
  secondaryCooldown: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isEnemy: boolean;
  type: 'laser' | 'plasma' | 'missile' | 'beam' | 'orb' | 'boss_laser';
  color: string;
  glowColor: string;
  life: number;
  maxLife: number;
  homing?: boolean;
  targetEnemyId?: string;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  points: number;
  shootCooldown: number;
  patternTimer: number;
  patternType: 'straight' | 'sine' | 'dive' | 'hover' | 'boss_patrol';
  patternSeed: number;
  isBoss?: boolean;
  bossPhase?: number;
  bossMaxPhases?: number;
  name?: string;
  turrets?: {
    xOffset: number;
    yOffset: number;
    angle: number;
    cooldown: number;
  }[];
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  vertices: { x: number; y: number }[];
  type: 'rock' | 'ice' | 'crystal' | 'metal';
  health: number;
  maxHealth: number;
  points: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: PowerUpType;
  radius: number;
  life: number;
  bobTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  decay: number;
  type: 'spark' | 'smoke' | 'shockwave' | 'flame' | 'debris' | 'star_streak';
  rotation?: number;
  rotSpeed?: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  brightness: number;
  twinkleSpeed: number;
  layer: number;
}

export interface NebulaCloud {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: string;
  secondaryColor: string;
  speed: number;
  opacity: number;
}

export interface CelestialBody {
  x: number;
  y: number;
  radius: number;
  speed: number;
  type: 'ringed_planet' | 'gas_giant' | 'moon' | 'neutron_star' | 'station';
  primaryColor: string;
  secondaryColor: string;
  ringColor?: string;
  hasRings?: boolean;
  craterSeeds?: { x: number; y: number; r: number }[];
  lightAngle?: number;
}

export interface SpaceStructure {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'relay' | 'derelict_station' | 'solar_array' | 'warp_gate';
  lights: { x: number; y: number; color: string; blinkOffset: number }[];
}

export interface SectorConfig {
  number: number;
  name: string;
  subtitle: string;
  bgGradient: [string, string, string];
  nebulaPalette: string[];
  planetPalette: { primary: string; secondary: string; ring?: string }[];
  asteroidDensity: number;
  hazardFrequency: number;
  bossName: string;
  bossHealth: number;
  distanceToBoss: number; // e.g. 10000 distance units
}

export interface AudioTrackInfo {
  name: string;
  isCustom: boolean;
  duration?: number;
}
