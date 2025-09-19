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
  moveSpeed: 120, // pixels per second
  animationSpeed: 0.1,
  nameOffset: { x: 0, y: -60 },
  statusOffset: { x: 20, y: -50 },
  chatOffset: { x: 0, y: -80 },
};

// Animation Configuration
export const ANIMATION_CONFIG = {
  frameSize: { width: 32, height: 48 },
  framesPerDirection: 4,
  frameDuration: 200, // milliseconds
  idleFrame: 1, // Frame index for idle state
};

// Movement Configuration
export const MOVEMENT_CONFIG = {
  smoothingFactor: 0.15,
  pathfindingTolerance: 5, // pixels
  maxPathLength: 100,
  diagonalMovement: false,
};

// Input Configuration
export const INPUT_CONFIG = {
  moveKeys: {
    up: ['w', 'W', 'ArrowUp'],
    down: ['s', 'S', 'ArrowDown'],
    left: ['a', 'A', 'ArrowLeft'],
    right: ['d', 'D', 'ArrowRight'],
  },
  keyRepeatDelay: 100, // milliseconds
  mouseClickTolerance: 5, // pixels
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