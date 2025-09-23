import type { ExtendedTileData, ObstacleInfo } from '@/types/game';
import { TileType, TileCategory } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';
import type { ParksConfig } from '../config/MapConfig';

/**
 * ParksGenerator handles the generation of green spaces:
 * - Large parks distributed across the city
 * - Park features (trees, fountains, benches, paths)
 * - Park obstacles and landmarks registration
 */
export class ParksGenerator {
  /**
   * Generate large parks (3-8 tiles) distributed across the city
   */
  public static generateLargeParks(tiles: ExtendedTileData[][], obstacles: Map<string, ObstacleInfo>, config: ParksConfig): void {
    const parks = this.generateParkPositions(config);

    parks.forEach((park, index) => {
      this.generateSinglePark(tiles, obstacles, park, index, config);
    });
  }

  /**
   * Generate park positions based on configuration
   */
  private static generateParkPositions(config: ParksConfig): Array<{ x: number; y: number; width: number; height: number }> {
    const parks: Array<{ x: number; y: number; width: number; height: number }> = [];
    
    // Calculate number of parks within the configured range
    const parkCount = Math.floor(Math.random() * (config.maxParks - config.minParks + 1)) + config.minParks;
    
    // Generate parks with configured size ranges
    for (let i = 0; i < parkCount; i++) {
      const width = Math.floor(Math.random() * (config.maxParkSize - config.minParkSize + 1)) + config.minParkSize;
      const height = Math.floor(Math.random() * (config.maxParkSize - config.minParkSize + 1)) + config.minParkSize;
      
      // Use center bias to determine position
      let x: number, y: number;
      
      if (Math.random() < config.centerBias) {
        // Bias towards center of map
        const centerX = MAP_WIDTH / 2;
        const centerY = MAP_HEIGHT / 2;
        const maxOffset = Math.min(MAP_WIDTH, MAP_HEIGHT) * 0.3;
        x = Math.max(0, Math.min(MAP_WIDTH - width, centerX + (Math.random() - 0.5) * maxOffset));
        y = Math.max(0, Math.min(MAP_HEIGHT - height, centerY + (Math.random() - 0.5) * maxOffset));
      } else {
        // Random distribution across the map
        x = Math.floor(Math.random() * (MAP_WIDTH - width));
        y = Math.floor(Math.random() * (MAP_HEIGHT - height));
      }
      
      parks.push({ x: Math.floor(x), y: Math.floor(y), width, height });
    }
    
    return parks;
  }

  /**
   * Generate a single park with features
   */
  private static generateSinglePark(
    tiles: ExtendedTileData[][],
    obstacles: Map<string, ObstacleInfo>,
    park: { x: number; y: number; width: number; height: number },
    index: number,
    config: ParksConfig
  ): void {
    const parkId = `park_${index}`;
    
    // Register park as obstacle
    this.registerParkObstacle(obstacles, park, parkId, index);

    // Generate park tiles
    for (let y = park.y; y < park.y + park.height && y < MAP_HEIGHT; y++) {
      for (let x = park.x; x < park.x + park.width && x < MAP_WIDTH; x++) {
        if (x < MAP_WIDTH && y < MAP_HEIGHT) {
          const tileType = this.determineParkTileType(x, y, park, config);
          const walkable = this.isParkTileWalkable(tileType);

          tiles[y][x] = {
            ...tiles[y][x],
            type: tileType,
            walkable,
            category: TileCategory.NATURE,
            obstacleId: parkId,
          };
        }
      }
    }
  }

  /**
   * Register park as an obstacle in the map
   */
  private static registerParkObstacle(
    obstacles: Map<string, ObstacleInfo>,
    park: { x: number; y: number; width: number; height: number },
    parkId: string,
    index: number
  ): void {
    obstacles.set(parkId, {
      id: parkId,
      position: { x: park.x, y: park.y },
      bounds: { x: park.x, y: park.y, width: park.width, height: park.height },
      metadata: {
        name: `Parque Central ${index + 1}`,
        type: 'park',
        interactive: true,
        description: `Gran parque de ${park.width}x${park.height} tiles`,
        canEnter: true,
        isOffice: false,
        isPark: true,
        capacity: park.width * park.height * 10
      }
    });
  }

  /**
   * Determine the type of tile for a specific position in the park
   */
  private static determineParkTileType(
    x: number,
    y: number,
    park: { x: number; y: number; width: number; height: number },
    config: ParksConfig
  ): TileType {
    const relX = x - park.x;
    const relY = y - park.y;
    const isEdge = relX === 0 || relY === 0 || relX === park.width - 1 || relY === park.height - 1;
    const isCenter = Math.abs(relX - park.width / 2) < 2 && Math.abs(relY - park.height / 2) < 2;

    // Trees on edges using configured probability
    if (isEdge && Math.random() < config.treeProbability) {
      return TileType.TREE;
    }
    
    // Fountains in center using configured probability
    if (isCenter && Math.random() < config.fountainProbability) {
      return TileType.FOUNTAIN;
    }
    
    // Random benches using configured probability
    if (Math.random() < config.benchProbability) {
      return TileType.PARK_BENCH;
    }
    
    // Random paths using configured probability
    if (Math.random() < config.pathProbability) {
      return TileType.PARK_PATH;
    }

    // Default to grass
    return TileType.PARK_GRASS;
  }

  /**
   * Determine if a park tile type is walkable
   */
  private static isParkTileWalkable(tileType: TileType): boolean {
    switch (tileType) {
      case TileType.TREE:
      case TileType.FOUNTAIN:
      case TileType.PARK_BENCH:
        return false;
      case TileType.PARK_GRASS:
      case TileType.PARK_PATH:
      default:
        return true;
    }
  }
}