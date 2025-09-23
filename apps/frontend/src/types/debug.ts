/**
 * TypeScript interfaces for debug functionality
 * Provides strong typing for debugging tools and emergency reset functions
 */

import type { Position } from '@/types/game';
import type { ParcelInfo } from '@/lib/game/generators/CityGenerator';

/**
 * Debug information structure returned by game engine
 */
export interface GameEngineDebugInfo {
  engine: {
    isInitialized: boolean;
    isRunning: boolean;
    version: string;
  };
  viewport: {
    x: number;
    y: number;
    scale: { x: number; y: number };
    worldWidth: number;
    worldHeight: number;
    bounds: { x: number; y: number; width: number; height: number };
  };
  layers: Record<string, {
    children: number;
    visible: boolean;
    alpha: number;
    x: number;
    y: number;
    scale: { x: number; y: number };
  }>;
  gameState: {
    avatarCount: number;
    currentUser: string | null;
    avatars: Array<{
      id: string;
      name: string;
      position: Position;
      direction: string;
      status: string;
      visible: boolean;
    }>;
  };
}

/**
 * Viewport interface for debug operations
 */
export interface DebugViewport {
  setZoom(zoom: number): void;
  moveTo(position: Position, immediate?: boolean): void;
  getZoom(): number;
  getPosition(): Position;
  getBounds(): { x: number; y: number; width: number; height: number };
}

/**
 * Avatar data for debug operations
 */
export interface DebugAvatarData {
  id: string;
  name: string;
  position: Position;
  direction: string;
  status: string;
  color?: number;
  visible?: boolean;
}

/**
 * Game Engine interface specifically for debug operations
 */
export interface GameEngineDebugInterface {
  // Core debug methods
  getGameDebugInfo(): GameEngineDebugInfo;
  getViewport(): DebugViewport | null;
  getCurrentUser(): DebugAvatarData | null;
  getAllAvatars(): DebugAvatarData[];

  // Avatar management for debug
  addAvatar(avatar: DebugAvatarData): void;
  removeAvatar(userId: string): void;
  moveAvatar(userId: string, position: Position): void;

  // System control for debug
  start(): void;
  stop(): void;
  restart(): void;
  isInitialized(): boolean;
  isRunning(): boolean;

  // Parcel system debug
  getAllParcels?(): ParcelInfo[];
  getParcelAt?(x: number, y: number): ParcelInfo | undefined;
  toggleParcels?(): void;

  // Layer management for debug
  getLayers?(): Map<string, unknown> | Record<string, unknown>;
  toggleLayer?(layerName: string): void;

  // Performance debug
  getRenderStats?(): {
    fps: number;
    frameTime: number;
    drawCalls: number;
    culled: number;
    visible: number;
  };
}

/**
 * API Response interface for parcel sync
 */
export interface ParcelAPIResponse {
  id: string;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'residential' | 'commercial' | 'office' | 'mixed' | 'public' | 'infrastructure';
  districtType: 'commercial' | 'residential' | 'office' | 'mixed';
  buildingType?: string;
  preset?: string;
  organizationId?: string;
  spaceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Emergency reset result interface
 */
export interface EmergencyResetResult {
  success: boolean;
  actions: string[];
  errors: string[];
  stats?: {
    avatarsReset: number;
    layersFixed: number;
    parcelsSynced: number;
  };
}

/**
 * Avatar debug result interface
 */
export interface AvatarDebugResult {
  found: boolean;
  visible: boolean;
  position: Position;
  issues: string[];
  fixes: string[];
}

/**
 * Global window extensions for debug functions
 */
declare global {
  interface Window {
    // Game engine reference
    gameEngine?: GameEngineDebugInterface;

    // Avatar debug functions
    debugAvatar?: () => AvatarDebugResult;
    forceVisible?: () => boolean;

    // Camera controls
    centerCamera?: () => void;

    // Emergency functions
    fixEverything?: () => EmergencyResetResult;
    quickFix?: () => EmergencyResetResult;
    showStats?: () => GameEngineDebugInfo;

    // Parcel functions
    teleportToParcels?: () => void;
    getCurrentParcel?: () => ParcelInfo | undefined;
    getParcelAt?: (x: number, y: number) => ParcelInfo | undefined;
    getAllParcels?: () => ParcelInfo[];
    onMouseParcel?: (event: MouseEvent) => ParcelInfo | undefined;

    // Development utilities
    devMode?: boolean;
    debugMode?: boolean;
  }
}

/**
 * Type guard to check if engine has debug capabilities
 */
export function isDebugCapableEngine(engine: unknown): engine is GameEngineDebugInterface {
  return engine !== null &&
         typeof engine === 'object' &&
         'getGameDebugInfo' in engine &&
         typeof (engine as GameEngineDebugInterface).getGameDebugInfo === 'function';
}

/**
 * Type guard to validate debug viewport
 */
export function isValidDebugViewport(viewport: unknown): viewport is DebugViewport {
  return viewport !== null &&
         typeof viewport === 'object' &&
         'setZoom' in viewport &&
         'moveTo' in viewport &&
         typeof (viewport as DebugViewport).setZoom === 'function';
}

/**
 * Type guard to validate avatar data
 */
export function isValidAvatarData(avatar: unknown): avatar is DebugAvatarData {
  return avatar !== null &&
         typeof avatar === 'object' &&
         'id' in avatar &&
         'name' in avatar &&
         'position' in avatar &&
         typeof (avatar as DebugAvatarData).id === 'string';
}