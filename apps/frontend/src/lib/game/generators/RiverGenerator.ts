import type { ExtendedTileData, ObstacleInfo } from '@/types/game';
import { TileType, TileCategory } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';
import type { RiverConfig } from '@/lib/game/config/MapConfig';

/**
 * RiverGenerator handles the generation of water systems:
 * - Main river crossing the city
 * - Bridges for city connectivity
 * - Water-related obstacles and landmarks
 */
export class RiverGenerator {
  /**
   * Generate a river crossing the city with strategic bridges
   */
  public static generateRiver(
    tiles: ExtendedTileData[][], 
    obstacles: Map<string, ObstacleInfo>,
    config: RiverConfig
  ): void {
    console.log('🌊 Generating river with config:', {
      width: config.width,
      curviness: config.curviness,
      bridgeCount: config.bridgeCount
    });
    
    // Primero generar bordes de agua
    this.generateWaterBorders(tiles);
    
    // River flows diagonally through the city using config
    const riverStart = { x: 0, y: Math.floor(MAP_HEIGHT * config.startHeightRatio) };
    const riverEnd = { x: MAP_WIDTH - 1, y: Math.floor(MAP_HEIGHT * config.endHeightRatio) };
    
    // Calculate river path with configurable width
    const steps = MAP_WIDTH;
    
    for (let step = 0; step < steps; step++) {
      const progress = step / (steps - 1);
      const centerX = Math.floor(riverStart.x + (riverEnd.x - riverStart.x) * progress);
      const centerY = Math.floor(riverStart.y + (riverEnd.y - riverStart.y) * progress);
      
      // Add curves to make it more natural using config
      const curve = Math.sin(progress * Math.PI * config.curveFrequency) * config.curviness;
      const actualY = Math.floor(centerY + curve);
      
      // Create river width with some variation
      for (let offset = -config.width / 2; offset <= config.width / 2; offset++) {
        for (let widthVar = -1; widthVar <= 1; widthVar++) {
          const x = centerX + widthVar;
          const y = actualY + offset;
          
          if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && tiles[y] && tiles[y][x]) {
            tiles[y][x] = {
              ...tiles[y][x],
              type: TileType.WATER,
              walkable: false,
              category: TileCategory.NATURE,
              obstacleId: 'river_main',
            };
          }
        }
      }
    }

    // Add bridges using config for spacing and count
    this.generateBridges(tiles, obstacles, riverStart, riverEnd, config);

    // Register river as major obstacle
    this.registerRiverObstacle(obstacles, riverStart, riverEnd);
  }

  /**
   * Generate bridges across the river for city connectivity
   */
  private static generateBridges(
    tiles: ExtendedTileData[][],
    obstacles: Map<string, ObstacleInfo>,
    riverStart: { x: number; y: number },
    riverEnd: { x: number; y: number },
    config: RiverConfig
  ): void {
    // Generate bridge positions based on config
    const bridgePositions: number[] = [];
    for (let i = 0; i < config.bridgeCount; i++) {
      const position = (i + 1) * (MAP_WIDTH / (config.bridgeCount + 1));
      bridgePositions.push(Math.floor(position));
    }
    
    bridgePositions.forEach((bridgeX, index) => {
      if (bridgeX < MAP_WIDTH) {
        const progress = bridgeX / MAP_WIDTH;
        const centerY = Math.floor(riverStart.y + (riverEnd.y - riverStart.y) * progress);
        const curve = Math.sin(progress * Math.PI * config.curveFrequency) * config.curviness;
        const bridgeY = Math.floor(centerY + curve);
        
        const bridgeId = `bridge_${index}`;
        
        // Create bridge spanning the river width
        for (let by = bridgeY - config.width/2 - 3; by <= bridgeY + config.width/2 + 3; by++) {
          for (let bx = bridgeX - 4; bx <= bridgeX + 4; bx++) {
            if (bx >= 0 && bx < MAP_WIDTH && by >= 0 && by < MAP_HEIGHT && tiles[by] && tiles[by][bx]) {
              tiles[by][bx] = {
                ...tiles[by][bx],
                type: TileType.STREET,
                walkable: true,
                category: TileCategory.WALKABLE,
                obstacleId: bridgeId,
              };
            }
          }
        }
        
        // Register bridge as landmark
        obstacles.set(bridgeId, {
          id: bridgeId,
          position: { x: bridgeX - 4, y: bridgeY - config.width/2 - 3 },
          bounds: { x: bridgeX - 4, y: bridgeY - config.width/2 - 3, width: 9, height: config.width + 6 },
          metadata: {
            name: `Puente ${index + 1}`,
            type: 'bridge',
            interactive: false,
            description: `Puente sobre el río principal`,
            canEnter: true,
            isOffice: false,
            isPark: false,
            capacity: 200
          }
        });
      }
    });
  }

  /**
   * Register the river as a major obstacle in the map
   */
  private static registerRiverObstacle(
    obstacles: Map<string, ObstacleInfo>,
    riverStart: { x: number; y: number },
    riverEnd: { x: number; y: number }
  ): void {
    obstacles.set('river_main', {
      id: 'river_main',
      position: { x: riverStart.x, y: riverStart.y - 10 },
      bounds: { x: riverStart.x, y: riverStart.y - 10, width: MAP_WIDTH, height: riverEnd.y - riverStart.y + 20 },
      metadata: {
        name: 'Río Principal',
        type: 'water',
        interactive: false,
        description: 'Río que cruza la ciudad de este a oeste',
        canEnter: false,
        isOffice: false,
        isPark: false,
        capacity: 0
      }
    });
  }

  /**
   * Generate water borders around the map edges to create natural boundaries
   */
  private static generateWaterBorders(tiles: ExtendedTileData[][]): void {
    console.log('🌊 Generating water borders around map edges');
    const borderWidth = 3; // Ancho del borde de agua
    
    // Borde superior
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < borderWidth; y++) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x] = {
            ...tiles[y][x],
            type: TileType.WATER,
            walkable: false,
            category: TileCategory.NATURE,
            obstacleId: 'water_border_north',
          };
        }
      }
    }
    
    // Borde inferior
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = MAP_HEIGHT - borderWidth; y < MAP_HEIGHT; y++) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x] = {
            ...tiles[y][x],
            type: TileType.WATER,
            walkable: false,
            category: TileCategory.NATURE,
            obstacleId: 'water_border_south',
          };
        }
      }
    }
    
    // Borde izquierdo
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < borderWidth; x++) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x] = {
            ...tiles[y][x],
            type: TileType.WATER,
            walkable: false,
            category: TileCategory.NATURE,
            obstacleId: 'water_border_west',
          };
        }
      }
    }
    
    // Borde derecho
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = MAP_WIDTH - borderWidth; x < MAP_WIDTH; x++) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x] = {
            ...tiles[y][x],
            type: TileType.WATER,
            walkable: false,
            category: TileCategory.NATURE,
            obstacleId: 'water_border_east',
          };
        }
      }
    }
    
    console.log('✅ Water borders generated successfully');
  }
}