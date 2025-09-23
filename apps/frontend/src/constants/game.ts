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
  worldWidth: 1200, // Canvas width (screen size)
  worldHeight: 800, // Canvas height (screen size)
  minZoom: 0.3, // Increased minimum zoom to prevent too much zoom out
  maxZoom: 2.0, // Reduced maximum zoom for better control
  zoom: 0.8, // Start with better zoom level to see content properly
  center: { x: 3200, y: 2400 }, // Center of the world map
};

// Tile Configuration
export const TILE_SIZE = 32;
export const MAP_WIDTH = 200; // tiles - Increased for city design
export const MAP_HEIGHT = 150; // tiles - Increased for city design

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
  // Áreas caminables - COLORES MÁS BRILLANTES PARA DEBUG
  [TileType.STREET]: {
    walkable: true,
    color: 0x808080, // Gris más claro
    zIndex: LayerType.FLOOR,
  },
  [TileType.SIDEWALK]: {
    walkable: true,
    color: 0xC0C0C0, // Gris plateado
    zIndex: LayerType.FLOOR,
  },
  [TileType.PARK_PATH]: {
    walkable: true,
    color: 0xD2B48C, // Tan claro
    zIndex: LayerType.FLOOR,
  },
  
  // Edificios
  [TileType.BUILDING]: {
    walkable: false,
    color: 0x696969, // Gris oscuro - edificio genérico
    zIndex: LayerType.OBJECTS,
  },
  [TileType.OFFICE_BUILDING]: {
    walkable: false,
    color: 0x4169E1, // Azul real
    zIndex: LayerType.OBJECTS,
  },
  [TileType.RESIDENTIAL_BUILDING]: {
    walkable: false,
    color: 0xB22222, // Rojo ladrillo
    zIndex: LayerType.OBJECTS,
  },
  [TileType.COMMERCIAL_BUILDING]: {
    walkable: false,
    color: 0x32CD32, // Verde lima
    zIndex: LayerType.OBJECTS,
  },
  
  // Naturaleza/Parques
  [TileType.TREE]: {
    walkable: false,
    color: 0x006400, // Verde oscuro
    zIndex: LayerType.OBJECTS,
  },
  [TileType.PARK_GRASS]: {
    walkable: true,
    color: 0x90EE90, // Verde claro
    zIndex: LayerType.FLOOR,
  },
  [TileType.FOUNTAIN]: {
    walkable: false,
    color: 0x00CED1, // Turquesa oscuro
    zIndex: LayerType.OBJECTS,
  },
  [TileType.WATER]: {
    walkable: false,
    color: 0x1E90FF, // Azul profundo para agua
    zIndex: LayerType.FLOOR,
  },
  
  // Mobiliario urbano
  [TileType.STREET_LIGHT]: {
    walkable: false,
    color: 0xFFD700, // Dorado
    zIndex: LayerType.OBJECTS,
  },
  [TileType.TRAFFIC_LIGHT]: {
    walkable: false,
    color: 0xFF4500, // Rojo naranja
    zIndex: LayerType.OBJECTS,
  },
  [TileType.ROAD_SIGN]: {
    walkable: false,
    color: 0x0000FF, // Azul para señales viales
    zIndex: LayerType.OBJECTS,
  },
  
  // Tipos de oficina legacy (para compatibilidad)
  [TileType.FLOOR]: {
    walkable: true,
    color: 0xF5F5DC, // Beige
    zIndex: LayerType.FLOOR,
  },
  [TileType.WALL]: {
    walkable: false,
    color: 0x8B4513, // Marrón
    zIndex: LayerType.OBJECTS,
  },
  [TileType.DESK]: {
    walkable: false,
    color: 0x654321, // Marrón oscuro
    zIndex: LayerType.OBJECTS,
  },
  [TileType.CHAIR]: {
    walkable: false,
    color: 0x2F4F4F, // Gris pizarra oscuro
    zIndex: LayerType.OBJECTS,
  },
  [TileType.PLANT]: {
    walkable: false,
    color: 0x228B22, // Verde bosque
    zIndex: LayerType.OBJECTS,
  },
  [TileType.DOOR]: {
    walkable: true,
    color: 0x8B4513, // Marrón
    zIndex: LayerType.OBJECTS,
  },
  [TileType.WINDOW]: {
    walkable: false,
    color: 0x87CEEB, // Azul cielo
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