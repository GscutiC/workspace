/**
 * TypeScript interfaces for component props and GameEngine integration
 * This file provides strong typing for components that interact with the game engine
 */

import type { ParcelInfo } from '@/lib/game/generators/CityGenerator';
import type { AvatarData, Position } from '@/types/game';

/**
 * Interface for GameEngine methods used by UI components
 */
export interface GameEngineInterface {
  // Parcel-related methods
  getAllParcels(): ParcelInfo[];
  getCurrentUserParcel(): ParcelInfo | undefined;
  getParcelAt(x: number, y: number): ParcelInfo | undefined;
  getParcelAtScreenPosition(screenX: number, screenY: number): ParcelInfo | undefined;

  // Toggle methods
  toggleParcels(): void;
  toggleDebugMode(): void;

  // Game state access
  gameState?: {
    avatars?: Map<string, AvatarData>;
    currentUser?: AvatarData;
    isInitialized: boolean;
    isRunning: boolean;
  };

  // Avatar methods
  getAvatar(userId: string): AvatarData | undefined;
  getAllAvatars(): AvatarData[];
  moveAvatar(userId: string, position: Position): void;

  // Debug methods
  getDebugInfo(): GameEngineDebugInfo;
  enableDebugMode(enabled: boolean): void;
}

/**
 * Debug information structure returned by GameEngine
 */
export interface GameEngineDebugInfo {
  gameState: {
    isInitialized: boolean;
    isRunning: boolean;
    avatarCount: number;
    currentUser: string;
    viewport: unknown;
  };
  layers: Record<string, {
    children: number;
    visible: boolean;
    alpha: number;
    x: number;
    y: number;
    scale: { x: number; y: number };
    bounds: unknown;
  }>;
  systems: {
    available: string[];
    renderSystem: boolean;
    movementSystem: boolean;
    inputSystem: boolean;
  };
  avatars: Array<{
    id: string;
    name: string;
    position: Position;
    direction: string;
    status: string;
  }>;
}

/**
 * Props for CurrentParcelInfo component
 */
export interface CurrentParcelInfoProps {
  gameEngine: GameEngineInterface | null;
  currentUserId: string;
}

/**
 * Props for ParcelAdminPanel component
 */
export interface ParcelAdminPanelProps {
  gameEngine: GameEngineInterface | null;
  onClose: () => void;
}

/**
 * Canvas reference interface for game initialization
 */
export interface GameCanvasRef {
  current: HTMLCanvasElement | null;
}

/**
 * User configuration for avatar creation
 */
export interface AvatarConfig {
  id: string;
  name: string;
  firstName?: string;
  username?: string;
  color?: number;
  position?: Position;
}

/**
 * VirtualOffice component event handlers
 */
export interface VirtualOfficeEventHandlers {
  onParcelSelect?: (parcel: ParcelInfo) => void;
  onAvatarMove?: (userId: string, position: Position) => void;
  onDebugToggle?: (enabled: boolean) => void;
  onStatusChange?: (userId: string, status: string) => void;
}

/**
 * Game initialization options
 */
export interface GameInitOptions {
  canvas: HTMLCanvasElement;
  user: AvatarConfig;
  options?: {
    enableDebug?: boolean;
    showParcels?: boolean;
    autoStart?: boolean;
  };
}

/**
 * Parcel statistics for admin panel
 */
export interface ParcelStats {
  total: number;
  byType: Record<string, number>;
  byDistrict: Record<string, number>;
  generated: number;
  synced: number;
}

/**
 * Extended GameEngine interface for admin operations
 */
export interface GameEngineAdminInterface extends GameEngineInterface {
  // Admin-specific methods
  regenerateMap?(preset?: string): Promise<void>;
  clearAllParcels?(): Promise<void>;
  syncParcelsToBackend?(): Promise<void>;

  // Statistics
  getParcelStats?(): ParcelStats;

  // Advanced debugging
  getRenderStats?(): {
    culling: { total: number; visible: number; hidden: number };
    viewport: { x: number; y: number; width: number; height: number };
    avatars: Array<{ id: string; name: string; position: Position }>;
  } | null;
}

/**
 * Type guard to check if GameEngine has admin capabilities
 */
export function isGameEngineAdmin(engine: GameEngineInterface): engine is GameEngineAdminInterface {
  return 'regenerateMap' in engine && typeof engine.regenerateMap === 'function';
}

/**
 * Type guard to check if GameEngine is properly initialized
 */
export function isGameEngineReady(engine: GameEngineInterface | null): engine is GameEngineInterface {
  return engine !== null &&
         engine.gameState !== undefined &&
         engine.gameState.isInitialized === true;
}