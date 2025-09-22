import type { GameConfig, ViewportConfig } from '@/types/game';
import { Direction, UserStatus, TileType, LayerType } from '@/types/game';

// Game Configuration
export const GAME_CONFIG: GameConfig = {
  width: 1200,
  height: 800,
  backgroundColor: 0x87CEEB, // Sky blue
  antialias: true,
  autoDensity: true,
  resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
};

// Viewport Configuration
export const VIEWPORT_CONFIG: ViewportConfig = {
  worldWidth: 2400,
  worldHeight: 1600,
  minZoom: 0.5,
  maxZoom: 2.0,
  zoom: 1.0,
  center: { x: 1200, y: 800 },
};

// Tile Configuration
export const TILE_SIZE = 32;
export const MAP_WIDTH = 75; // tiles
export const MAP_HEIGHT = 50; // tiles

// Avatar Configuration
export const AVATAR_CONFIG = {
  size: { width: 32, height: 48 },
  moveSpeed: 160, // Increased base speed for better responsiveness
  animationSpeed: 0.12, // Slightly faster animation
  nameOffset: { x: 0, y: -60 },
  statusOffset: { x: 20, y: -50 },
  chatOffset: { x: 0, y: -80 },
};

// Animation Configuration
export const ANIMATION_CONFIG = {
  frameSize: { width: 32, height: 48 },
  framesPerDirection: 4,
  frameDuration: 180, // Slightly faster animation
  idleFrame: 0, // Frame index for idle state
};

// Movement Configuration
export const MOVEMENT_CONFIG = {
  // Smoothing and interpolation
  smoothingFactor: 0.2, // Increased for more responsive movement
  interpolationSteps: 8, // Steps for smooth interpolation
  
  // Pathfinding
  pathfindingTolerance: 3, // Reduced for more precision
  maxPathLength: 150, // Increased for longer paths
  diagonalMovement: true, // Enable diagonal movement
  
  // Speed variations
  keyboardMoveSpeed: 180, // Faster keyboard movement
  pathfindingSpeed: 160, // Consistent with base speed
  minSpeed: 80, // Minimum speed for short distances
  maxSpeed: 240, // Maximum speed for long distances
  
  // Timing
  movementDuration: {
    short: 0.3, // < 50 pixels
    medium: 0.5, // 50-150 pixels  
    long: 0.8, // > 150 pixels
  },
  
  // Easing
  defaultEasing: 'avatarMovement', // Use custom easing by default
  keyboardEasing: 'easeOutQuart', // Smooth keyboard movement
  
  // Advanced
  predictiveMovement: true, // Enable movement prediction
  collisionPrediction: true, // Predict and avoid collisions
};

// Input Configuration
export const INPUT_CONFIG = {
  moveKeys: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
  },
  actionKeys: ['Space', 'Enter', 'KeyE', 'KeyF'],
  cameraKeys: ['Equal', 'Minus', 'KeyR'],
  keyRepeatDelay: 100, // milliseconds
  mouseClickTolerance: 5, // pixels
  dragThreshold: 10, // pixels
  clickCooldown: 100, // milliseconds
};

// Text Configuration
export const TEXT_CONFIG = {
  fontFamily: 'Arial, sans-serif',
  fontSize: {
    small: 12,
    medium: 16,
    large: 20,
  },
  colors: {
    primary: 0xFFFFFF,
    secondary: 0xCCCCCC,
    accent: 0x4F46E5,
    success: 0x10B981,
    warning: 0xF59E0B,
    error: 0xEF4444,
  },
};

// Chat Configuration
export const CHAT_CONFIG = {
  bubbleLifetime: 3000, // milliseconds
  maxMessageLength: 100,
  bubbleStyle: {
    backgroundColor: 0xFFFFFF,
    borderColor: 0x666666,
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    fontFamily: 'Arial',
    fill: 0x000000,
  },
};

// Status Colors
export const STATUS_COLORS = {
  [UserStatus.AVAILABLE]: 0x00FF00, // Green
  [UserStatus.BUSY]: 0xFF0000, // Red
  [UserStatus.AWAY]: 0xFFFF00, // Yellow
  [UserStatus.OFFLINE]: 0x666666, // Gray
};

// Tile Type Properties
export const TILE_PROPERTIES = {
  [TileType.FLOOR]: {
    walkable: true,
    color: 0xF5F5DC, // Beige
    zIndex: LayerType.FLOOR,
  },
  [TileType.WALL]: {
    walkable: false,
    color: 0x8B4513, // Brown
    zIndex: LayerType.OBJECTS,
  },
  [TileType.DESK]: {
    walkable: false,
    color: 0x654321, // Dark brown
    zIndex: LayerType.OBJECTS,
  },
  [TileType.CHAIR]: {
    walkable: false,
    color: 0x2F4F4F, // Dark slate gray
    zIndex: LayerType.OBJECTS,
  },
  [TileType.PLANT]: {
    walkable: false,
    color: 0x228B22, // Forest green
    zIndex: LayerType.OBJECTS,
  },
  [TileType.DOOR]: {
    walkable: true,
    color: 0x8B4513, // Brown
    zIndex: LayerType.OBJECTS,
  },
  [TileType.WINDOW]: {
    walkable: false,
    color: 0x87CEEB, // Sky blue
    zIndex: LayerType.OBJECTS,
  },
};

// Layer Configuration
export const LAYER_CONFIG = {
  [LayerType.BACKGROUND]: {
    zIndex: 0,
    name: 'background',
  },
  [LayerType.FLOOR]: {
    zIndex: 1,
    name: 'floor',
  },
  [LayerType.OBJECTS]: {
    zIndex: 2,
    name: 'objects',
  },
  [LayerType.CHARACTERS]: {
    zIndex: 3,
    name: 'characters',
  },
  [LayerType.UI]: {
    zIndex: 4,
    name: 'ui',
  },
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  cullingMargin: 100, // pixels
  maxPoolSize: 50,
  targetFPS: 60,
  frameSkipThreshold: 3,
  textureAtlasSize: 2048,
};

// Default Textures (placeholder data)
export const DEFAULT_TEXTURES = {
  avatar: {
    [Direction.UP]: [
      { x: 0, y: 144, width: 32, height: 48 },
      { x: 32, y: 144, width: 32, height: 48 },
      { x: 64, y: 144, width: 32, height: 48 },
      { x: 96, y: 144, width: 32, height: 48 },
    ],
    [Direction.DOWN]: [
      { x: 0, y: 0, width: 32, height: 48 },
      { x: 32, y: 0, width: 32, height: 48 },
      { x: 64, y: 0, width: 32, height: 48 },
      { x: 96, y: 0, width: 32, height: 48 },
    ],
    [Direction.LEFT]: [
      { x: 0, y: 48, width: 32, height: 48 },
      { x: 32, y: 48, width: 32, height: 48 },
      { x: 64, y: 48, width: 32, height: 48 },
      { x: 96, y: 48, width: 32, height: 48 },
    ],
    [Direction.RIGHT]: [
      { x: 0, y: 96, width: 32, height: 48 },
      { x: 32, y: 96, width: 32, height: 48 },
      { x: 64, y: 96, width: 32, height: 48 },
      { x: 96, y: 96, width: 32, height: 48 },
    ],
  },
  tiles: {
    [TileType.FLOOR]: { x: 0, y: 0, width: 32, height: 32 },
    [TileType.WALL]: { x: 32, y: 0, width: 32, height: 32 },
    [TileType.DESK]: { x: 64, y: 0, width: 32, height: 32 },
    [TileType.CHAIR]: { x: 96, y: 0, width: 32, height: 32 },
    [TileType.PLANT]: { x: 128, y: 0, width: 32, height: 32 },
    [TileType.DOOR]: { x: 160, y: 0, width: 32, height: 32 },
    [TileType.WINDOW]: { x: 192, y: 0, width: 32, height: 32 },
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  PIXI_INIT_FAILED: 'Failed to initialize Pixi.js application',
  CANVAS_NOT_FOUND: 'Canvas element not found',
  TEXTURE_LOAD_FAILED: 'Failed to load texture',
  PATHFINDING_FAILED: 'Pathfinding algorithm failed',
  INVALID_POSITION: 'Invalid position provided',
  USER_NOT_FOUND: 'User not found in game state',
  TILE_OUT_OF_BOUNDS: 'Tile position is out of bounds',
};

// Debug Configuration
export const DEBUG_CONFIG = {
  showFPS: false,
  showCollisionBoxes: false,
  showPathfinding: false,
  showViewportBounds: false,
  logMovement: false,
  logAnimations: false,
};

// Network Configuration (for future WebSocket integration)
export const NETWORK_CONFIG = {
  updateRate: 60, // Updates per second
  interpolationDelay: 100, // milliseconds
  maxLatency: 1000, // milliseconds
  reconnectAttempts: 5,
  reconnectDelay: 1000, // milliseconds
};