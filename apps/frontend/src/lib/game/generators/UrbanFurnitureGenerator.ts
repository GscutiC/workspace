import type { ExtendedTileData, ObstacleInfo } from '@/types/game';
import { TileType, TileCategory } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';
import type { UrbanFurnitureConfig } from '../config/MapConfig';

/**
 * UrbanFurnitureGenerator handles the generation of urban infrastructure:
 * - Street lights and road signs
 * - Urban furniture distribution across streets
 * - Furniture obstacle registration
 */
export class UrbanFurnitureGenerator {
  /**
   * Add urban furniture (street lights, signs, etc.) to street tiles
   */
  public static addUrbanFurniture(tiles: ExtendedTileData[][], obstacles: Map<string, ObstacleInfo>, config: UrbanFurnitureConfig): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (tiles[y][x].type === TileType.STREET) {
          // Check if we should place furniture based on density
          if (Math.random() < config.streetLightDensity + config.signDensity) {
            // Check minimum spacing requirement
            if (this.hasMinimumSpacing(tiles, x, y, config.minSpacing)) {
              this.placeFurnitureItem(tiles, obstacles, x, y, config);
            }
          }
        }
      }
    }
  }

  /**
   * Check if a position has minimum spacing from other furniture
   */
  private static hasMinimumSpacing(tiles: ExtendedTileData[][], x: number, y: number, minSpacing: number): boolean {
    for (let dy = -minSpacing; dy <= minSpacing; dy++) {
      for (let dx = -minSpacing; dx <= minSpacing; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
          const tile = tiles[checkY][checkX];
          if (tile.category === TileCategory.URBAN_FURNITURE) {
            return false; // Too close to existing furniture
          }
        }
      }
    }
    return true;
  }

  /**
   * Place a single furniture item at the specified position
   */
  private static placeFurnitureItem(
    tiles: ExtendedTileData[][],
    obstacles: Map<string, ObstacleInfo>,
    x: number,
    y: number,
    config: UrbanFurnitureConfig
  ): void {
    // Determine furniture type based on configuration ratio
    const furnitureType = Math.random() < config.streetLightRatio ? TileType.STREET_LIGHT : TileType.ROAD_SIGN;
    const obstacleId = `furniture_${x}_${y}`;

    tiles[y][x] = {
      ...tiles[y][x],
      type: furnitureType,
      walkable: false,
      category: TileCategory.URBAN_FURNITURE,
      obstacleId,
    };

    obstacles.set(obstacleId, {
      id: obstacleId,
      position: { x, y },
      bounds: { x, y, width: 1, height: 1 },
      metadata: {
        name: furnitureType === TileType.STREET_LIGHT ? 'Poste de Luz' : 'Señal de Tráfico',
        type: 'urban_furniture',
        interactive: false,
        description: `Mobiliario urbano en posición ${x}, ${y}`,
        canEnter: false,
        isOffice: false,
        isPark: false,
      }
    });
  }
}