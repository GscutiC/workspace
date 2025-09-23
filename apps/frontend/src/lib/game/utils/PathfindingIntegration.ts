import type { ExtendedTileData } from '@/types/game';
import { TileCategory } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';

/**
 * PathfindingIntegration handles the integration between tile data and pathfinding systems:
 * - Collision map generation
 * - Walkable areas calculation
 * - Pathfinding data structures maintenance
 */
export class PathfindingIntegration {
  /**
   * Update collision and walkable maps based on tile data
   */
  public static updateCollisionMaps(
    tiles: ExtendedTileData[][], 
    collisionMap: boolean[][], 
    walkableAreas: boolean[][]
  ): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = tiles[y][x];
        collisionMap[y][x] = !tile.walkable;
        walkableAreas[y][x] = tile.walkable && tile.category === TileCategory.WALKABLE;
      }
    }
  }

  /**
   * Check if a specific position is walkable
   */
  public static isPositionWalkable(tiles: ExtendedTileData[][], x: number, y: number): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return false;
    }
    
    const tile = tiles[y][x];
    return tile.walkable && tile.category === TileCategory.WALKABLE;
  }

  /**
   * Get collision state for a specific position
   */
  public static isPositionBlocked(tiles: ExtendedTileData[][], x: number, y: number): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return true;
    }
    
    return !tiles[y][x].walkable;
  }

  /**
   * Generate a collision map from tile data
   */
  public static generateCollisionMap(tiles: ExtendedTileData[][]): boolean[][] {
    const collisionMap: boolean[][] = [];
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
      collisionMap[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        collisionMap[y][x] = !tiles[y][x].walkable;
      }
    }
    
    return collisionMap;
  }

  /**
   * Generate a walkable areas map from tile data
   */
  public static generateWalkableAreasMap(tiles: ExtendedTileData[][]): boolean[][] {
    const walkableAreas: boolean[][] = [];
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
      walkableAreas[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = tiles[y][x];
        walkableAreas[y][x] = tile.walkable && tile.category === TileCategory.WALKABLE;
      }
    }
    
    return walkableAreas;
  }
}