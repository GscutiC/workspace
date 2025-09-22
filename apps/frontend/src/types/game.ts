import type { Application, Container, Sprite, Graphics } from 'pixi.js';

// Core Game Types
export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  antialias: boolean;
  autoDensity: boolean;
  resolution: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Avatar Types
export interface AvatarData {
  id: string;
  userId?: string;
  name: string;
  position: Position;
  direction: Direction;
  status: UserStatus;
  color: number;
  avatar: string;
  lastMessage?: ChatMessage;
}

export interface AvatarSprite extends Sprite {
  avatarData: AvatarData;
  nameLabel: Container;
  statusIndicator: Sprite;
  chatBubble?: Container;
  targetPosition?: Position;
  moveSpeed: number;
}

export enum Direction {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
}

export enum UserStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  AWAY = 'away',
  OFFLINE = 'offline',
}

// Animation Types
export interface AnimationFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Animation {
  name: string;
  frames: AnimationFrame[];
  duration: number;
  loop: boolean;
}

export interface AnimationSet {
  [Direction.UP]: Animation;
  [Direction.DOWN]: Animation;
  [Direction.LEFT]: Animation;
  [Direction.RIGHT]: Animation;
  idle: Animation;
}

// Movement Types
export interface MovementTarget {
  position: Position;
  isMoving: boolean;
  path?: Position[];
  currentPathIndex: number;
}

export interface PathNode {
  x: number;
  y: number;
  g: number; // Distance from start
  h: number; // Heuristic distance to end
  f: number; // Total cost (g + h)
  parent?: PathNode;
}

// Map Types
export interface TileData {
  id: number;
  x: number;
  y: number;
  type: TileType;
  walkable: boolean;
  sprite?: Graphics;
}

export enum TileType {
  FLOOR = 'floor',
  WALL = 'wall',
  DESK = 'desk',
  CHAIR = 'chair',
  PLANT = 'plant',
  DOOR = 'door',
  WINDOW = 'window',
}

export interface TileMap {
  width: number;
  height: number;
  tileSize: number;
  tiles: TileData[][];
  collisionMap: boolean[][];
}

// Chat Types
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  author: {
    id: string;
    name: string;
  };
}

// Input Types
export interface InputState {
  keys: Set<string>;
  mouse: {
    position: Position;
    isDown: boolean;
    target?: Position;
  };
}

export enum InputEvent {
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  MOUSE_CLICK = 'mouse_click',
  MOUSE_MOVE = 'mouse_move',
}

// Layer Types
export enum LayerType {
  BACKGROUND = 0,
  FLOOR = 1,
  OBJECTS = 2,
  CHARACTERS = 3,
  UI = 4,
}

export interface GameLayer {
  type: LayerType;
  container: Container;
  visible: boolean;
  zIndex: number;
}

// Viewport Types
export interface ViewportConfig {
  worldWidth: number;
  worldHeight: number;
  minZoom: number;
  maxZoom: number;
  zoom: number;
  center: Position;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  isDragging: boolean;
  lastPointerPosition?: Position;
}

// Game State Types
export interface GameState {
  isInitialized: boolean;
  isRunning: boolean;
  currentUser?: AvatarData;
  avatars: Map<string, AvatarData>;
  tileMap?: TileMap;
  viewport: ViewportState;
  input: InputState;
  deltaTime: number;
  lastFrameTime: number;
}

// Component Types
export interface GameComponent {
  id: string;
  type: string;
  entity: string;
  data: Record<string, unknown>;
}

export interface Entity {
  id: string;
  components: Map<string, GameComponent>;
  active: boolean;
}

// System Types
export interface GameSystem {
  name: string;
  priority: number;
  update(deltaTime: number, gameState: GameState): void;
  entities: Set<string>;
}

// Event Types
export interface GameEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export type GameEventHandler = (event: GameEvent) => void;

// Optimization Types
export interface CullingBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PooledObject {
  id: string;
  active: boolean;
  reset(): void;
}

// Texture Types
export interface TextureAtlasData {
  name: string;
  url: string;
  frames: Record<string, AnimationFrame>;
}

export interface LoadedTexture {
  name: string;
  texture: unknown; // PIXI.Texture
  atlas?: TextureAtlasData;
}

// Hook Types
export interface UsePixiAppReturn {
  app: Application | null;
  stage: Container | null;
  isReady: boolean;
  error: Error | null;
}

export interface UseMovementReturn {
  moveToPosition: (position: Position) => void;
  isMoving: boolean;
  currentPosition: Position;
  currentDirection: Direction;
}

export interface UseVirtualOfficeReturn {
  gameState: GameState;
  isLoading: boolean;
  error: Error | null;
  joinOffice: (userId: string) => Promise<void>;
  leaveOffice: () => void;
  sendMessage: (content: string) => void;
  updateStatus: (status: UserStatus) => void;
}