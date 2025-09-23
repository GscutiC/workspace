import type { ExtendedTileData, ObstacleInfo } from '@/types/game';
import { TileType, TileCategory } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '@/constants/game';
import type { CityConfig } from '@/lib/game/config/MapConfig';

// Interface for parcel information generated during city creation
export interface ParcelInfo {
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'residential' | 'commercial' | 'office' | 'mixed' | 'public' | 'infrastructure';
  districtType: 'commercial' | 'residential' | 'office' | 'mixed';
  buildingType?: string;
  preset?: string;
  configSnapshot?: string;
}

/**
 * CityGenerator handles the generation of urban structures:
 * - Main avenues and secondary streets
 * - City blocks with different districts
 * - Buildings distribution by district type
 */
export class CityGenerator {
  /**
   * Generate complete city structure with blocks, streets and districts
   */
  public static generateCityBlocks(
    tiles: ExtendedTileData[][], 
    obstacles: Map<string, ObstacleInfo>,
    config: CityConfig,
    parcelsOutput?: ParcelInfo[]
  ): void {
    console.log('🏗️ Generating structured city blocks with config:', {
      blockSize: config.blockSize,
      avenueSpacing: config.avenueSpacing,
      mainStreetWidth: config.mainStreetWidth
    });
    
    // 1. Create main avenue grid
    this.generateMainAvenues(tiles, config.avenueSpacing, config.mainStreetWidth);
    
    // 2. Create secondary street grid
    this.generateSecondaryStreets(tiles, config.blockSize, config.secondaryStreetWidth);
    
    // 3. Fill blocks with buildings and districts (and collect parcel data)
    this.generateDistrictBlocks(tiles, obstacles, config, parcelsOutput);
    
    console.log('✅ Structured city blocks generated!');
    if (parcelsOutput) {
      console.log(`📦 Generated ${parcelsOutput.length} parcels`);
    }
  }
  
  /**
   * Generate main avenues that cross the entire city
   */
  private static generateMainAvenues(tiles: ExtendedTileData[][], spacing: number, width: number): void {
    // Horizontal main avenues
    for (let y = spacing; y < MAP_HEIGHT; y += spacing) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        for (let w = 0; w < width && y + w < MAP_HEIGHT; w++) {
          tiles[y + w][x] = {
            ...tiles[y + w][x],
            type: TileType.STREET,
            walkable: true,
            category: TileCategory.WALKABLE,
          };
        }
      }
    }
    
    // Vertical main avenues  
    for (let x = spacing; x < MAP_WIDTH; x += spacing) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let w = 0; w < width && x + w < MAP_WIDTH; w++) {
          tiles[y][x + w] = {
            ...tiles[y][x + w],
            type: TileType.STREET,
            walkable: true,
            category: TileCategory.WALKABLE,
          };
        }
      }
    }
  }
  
  /**
   * Generate secondary streets for districts
   */
  private static generateSecondaryStreets(tiles: ExtendedTileData[][], blockSize: number, width: number): void {
    const streetSpacing = blockSize + width;
    
    // Horizontal secondary streets
    for (let y = 0; y < MAP_HEIGHT; y += streetSpacing) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        for (let w = 0; w < width && y + w < MAP_HEIGHT; w++) {
          tiles[y + w][x] = {
            ...tiles[y + w][x],
            type: TileType.STREET,
            walkable: true,
            category: TileCategory.WALKABLE,
          };
        }
      }
    }
    
    // Vertical secondary streets
    for (let x = 0; x < MAP_WIDTH; x += streetSpacing) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let w = 0; w < width && x + w < MAP_WIDTH; w++) {
          tiles[y][x + w] = {
            ...tiles[y][x + w],
            type: TileType.STREET,
            walkable: true,
            category: TileCategory.WALKABLE,
          };
        }
      }
    }
  }
  
  /**
   * Generate city blocks with different districts
   */
  private static generateDistrictBlocks(
    tiles: ExtendedTileData[][], 
    obstacles: Map<string, ObstacleInfo>, 
    config: CityConfig,
    parcelsOutput?: ParcelInfo[]
  ): void {
    const blockSpacing = config.blockSize + config.blockSpacing;
    let parcelNumber = 1;
    
    for (let blockY = 0; blockY < Math.floor(MAP_HEIGHT / blockSpacing); blockY++) {
      for (let blockX = 0; blockX < Math.floor(MAP_WIDTH / blockSpacing); blockX++) {
        const startX = blockX * blockSpacing + config.secondaryStreetWidth;
        const startY = blockY * blockSpacing + config.secondaryStreetWidth;
        
        // Determine district type based on position and config
        const districtType = this.getDistrictType(blockX, blockY, config);
        
        // Create parcel info if parcels collection is provided
        if (parcelsOutput && this.isValidBuildableBlock(startX, startY, config.blockSize)) {
          const parcelInfo: ParcelInfo = {
            number: parcelNumber++,
            x: startX,
            y: startY,
            width: config.blockSize,
            height: config.blockSize,
            type: this.mapDistrictToParcelType(districtType),
            districtType: districtType,
            buildingType: this.getBuildingTypeForDistrict(districtType)
          };
          parcelsOutput.push(parcelInfo);
        }
        
        // Fill the block
        for (let y = startY; y < startY + config.blockSize && y < MAP_HEIGHT; y++) {
          for (let x = startX; x < startX + config.blockSize && x < MAP_WIDTH; x++) {
            this.fillBlockTile(tiles, obstacles, x, y, districtType, startX, startY, config.blockSize);
          }
        }
      }
    }
  }
  
  /**
   * Determine district type based on block position and configuration
   */
  private static getDistrictType(
    blockX: number, 
    blockY: number, 
    config: CityConfig
  ): 'commercial' | 'residential' | 'office' | 'mixed' {
    const centerX = Math.floor(MAP_WIDTH / (config.avenueSpacing * 2)); // Center based on avenue spacing
    const centerY = Math.floor(MAP_HEIGHT / (config.avenueSpacing * 1.5));
    
    const distanceFromCenter = Math.sqrt((blockX - centerX) ** 2 + (blockY - centerY) ** 2);
    
    // Use config to determine district distribution
    const centerThreshold = config.urbanDensityCenter * 10;
    const edgeThreshold = config.urbanDensityEdge * 15;
    
    if (distanceFromCenter < centerThreshold * 0.3) return 'commercial'; // Downtown commercial
    if (distanceFromCenter < centerThreshold * 0.6) return 'office'; // Business district  
    if (distanceFromCenter < edgeThreshold) return 'mixed'; // Mixed use
    return 'residential'; // Outer residential
  }
  
  /**
   * Fill individual block tile based on district and position
   */
  private static fillBlockTile(tiles: ExtendedTileData[][], obstacles: Map<string, ObstacleInfo>, x: number, y: number, district: string, blockStartX: number, blockStartY: number, blockSize: number): void {
    const relX = x - blockStartX;
    const relY = y - blockStartY;
    const isPerimeter = relX === 0 || relY === 0 || relX === blockSize - 1 || relY === blockSize - 1;
    
    if (isPerimeter) {
      // Buildings on perimeter
      let buildingType: TileType;
      switch (district) {
        case 'commercial':
          buildingType = TileType.COMMERCIAL_BUILDING;
          break;
        case 'office':
          buildingType = TileType.OFFICE_BUILDING;
          break;
        case 'residential':
          buildingType = TileType.RESIDENTIAL_BUILDING;
          break;
        default:
          buildingType = Math.random() < 0.5 ? TileType.COMMERCIAL_BUILDING : TileType.OFFICE_BUILDING;
      }
      
      const obstacleId = `building_${x}_${y}`;
      tiles[y][x] = {
        ...tiles[y][x],
        type: buildingType,
        walkable: false,
        category: TileCategory.BUILDING,
        obstacleId,
      };
      
      obstacles.set(obstacleId, {
        id: obstacleId,
        position: { x, y },
        bounds: { x, y, width: 1, height: 1 },
        metadata: {
          name: `Edificio ${x}-${y}`,
          type: buildingType.replace('_building', ''),
          interactive: false,
          description: `Edificio en posición ${x}, ${y}`,
          canEnter: false,
          isOffice: buildingType === TileType.OFFICE_BUILDING,
          isPark: false,
          floors: Math.floor(Math.random() * 10) + 1
        }
      });
    } else {
      // Interior courtyard/parking
      if (Math.random() < 0.3) {
        tiles[y][x] = {
          ...tiles[y][x],
          type: TileType.PARK_GRASS,
          walkable: true,
          category: TileCategory.WALKABLE,
        };
      } else {
        tiles[y][x] = {
          ...tiles[y][x],
          type: TileType.SIDEWALK,
          walkable: true,
          category: TileCategory.WALKABLE,
        };
      }
    }
  }

  /**
   * Check if a block position and size would create a valid buildable parcel
   */
  private static isValidBuildableBlock(startX: number, startY: number, blockSize: number): boolean {
    // Check boundaries
    if (startX + blockSize > MAP_WIDTH || startY + blockSize > MAP_HEIGHT) {
      return false;
    }
    
    // Check minimum size
    if (blockSize < 4) {
      return false;
    }
    
    return true;
  }

  /**
   * Map district type to parcel type for database storage
   */
  private static mapDistrictToParcelType(districtType: 'commercial' | 'residential' | 'office' | 'mixed'): ParcelInfo['type'] {
    switch (districtType) {
      case 'commercial':
        return 'commercial';
      case 'residential':
        return 'residential';
      case 'office':
        return 'commercial'; // Office buildings are considered commercial
      case 'mixed':
        return 'mixed';
      default:
        return 'mixed';
    }
  }

  /**
   * Get building type for district for parcel information
   */
  private static getBuildingTypeForDistrict(districtType: 'commercial' | 'residential' | 'office' | 'mixed'): string {
    switch (districtType) {
      case 'commercial':
        return Math.random() < 0.5 ? 'shop' : 'restaurant';
      case 'residential':
        return Math.random() < 0.3 ? 'house' : 'apartment';
      case 'office':
        return 'office';
      case 'mixed':
        const types = ['shop', 'office', 'apartment', 'restaurant'];
        return types[Math.floor(Math.random() * types.length)];
      default:
        return 'mixed';
    }
  }

  /**
   * Generate city structure using real parcels from API
   * This creates the visual city environment around real parcel data
   */
  public static generateCityBlocksWithRealParcels(
    tiles: ExtendedTileData[][], 
    obstacles: Map<string, ObstacleInfo>,
    config: CityConfig,
    realParcels: ParcelInfo[]
  ): void {
    console.log('🏗️ Generating city blocks with real parcels:', {
      realParcelsCount: realParcels.length,
      blockSize: config.blockSize,
      avenueSpacing: config.avenueSpacing,
      mainStreetWidth: config.mainStreetWidth
    });
    
    // 1. Create main avenue grid (same as normal generation)
    this.generateMainAvenues(tiles, config.avenueSpacing, config.mainStreetWidth);
    
    // 2. Create secondary street grid (same as normal generation)  
    this.generateSecondaryStreets(tiles, config.blockSize, config.secondaryStreetWidth);
    
    // 3. Place real parcels in their exact positions
    this.placeRealParcelsOnMap(tiles, obstacles, realParcels);
    
    // 4. Fill remaining areas with appropriate city elements
    this.fillEmptyAreasWithCityElements(tiles, obstacles, config);
    
    console.log(`✅ City blocks generated with ${realParcels.length} real parcels!`);
  }

  /**
   * Place real parcels from API onto the map tiles
   */
  private static placeRealParcelsOnMap(
    tiles: ExtendedTileData[][],
    obstacles: Map<string, ObstacleInfo>,
    parcels: ParcelInfo[]
  ): void {
    console.log('📍 Placing real parcels on map...');
    
    parcels.forEach(parcel => {
      // Convert world coordinates to tile coordinates
      const tileX = Math.floor(parcel.x / TILE_SIZE);
      const tileY = Math.floor(parcel.y / TILE_SIZE);
      const tileWidth = Math.floor(parcel.width / TILE_SIZE);
      const tileHeight = Math.floor(parcel.height / TILE_SIZE);
      
      // Place parcel tiles
      for (let y = tileY; y < tileY + tileHeight && y < MAP_HEIGHT; y++) {
        for (let x = tileX; x < tileX + tileWidth && x < MAP_WIDTH; x++) {
          if (tiles[y] && tiles[y][x]) {
            const buildingType = this.getParcelBuildingType(parcel);
            
            tiles[y][x] = {
              ...tiles[y][x],
              type: buildingType,
              walkable: false,
              category: TileCategory.BUILDING,
            };
          }
        }
      }
    });
    
    console.log(`✅ Placed ${parcels.length} real parcels on map`);
  }

  /**
   * Convert parcel building type to tile type
   */
  private static getParcelBuildingType(parcel: ParcelInfo): TileType {
    if (parcel.buildingType && parcel.buildingType !== 'EMPTY') {
      const buildingType = parcel.buildingType.toLowerCase();
      
      switch (buildingType) {
        case 'house':
        case 'apartment':
          return TileType.BUILDING;
        case 'shop':
        case 'restaurant':
          return TileType.BUILDING;
        case 'office':
          return TileType.BUILDING;
        case 'factory':
        case 'warehouse':
          return TileType.BUILDING;
        case 'park':
        case 'plaza':
          return TileType.PARK_GRASS;
        case 'hospital':
        case 'school':
          return TileType.BUILDING;
        default:
          return TileType.BUILDING;
      }
    }
    
    // Default based on parcel type
    switch (parcel.type) {
      case 'residential':
        return TileType.RESIDENTIAL_BUILDING;
      case 'commercial':
        return TileType.COMMERCIAL_BUILDING;
      case 'office':
        return TileType.OFFICE_BUILDING;
      case 'mixed':
        return TileType.BUILDING;
      default:
        return TileType.BUILDING;
    }
  }

  /**
   * Fill empty areas with appropriate city elements
   */
  private static fillEmptyAreasWithCityElements(
    tiles: ExtendedTileData[][],
    obstacles: Map<string, ObstacleInfo>,
    config: CityConfig
  ): void {
    console.log('🏗️ Filling empty areas with city elements...');
    
    // Add some random buildings in empty spaces to make the city look more complete
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = tiles[y][x];
        
        // If it's still a floor tile and not near streets, potentially add a building
        if (tile.type === TileType.FLOOR && Math.random() < 0.1) {
          // Check if it's not too close to streets (basic spacing)
          const nearStreet = this.isNearStreet(tiles, x, y, 2);
          
          if (!nearStreet) {
            tiles[y][x] = {
              ...tile,
              type: TileType.BUILDING,
              walkable: false,
              category: TileCategory.BUILDING,
            };
          }
        }
      }
    }
    
    console.log('✅ Filled empty areas with city elements');
  }

  /**
   * Check if a position is near a street
   */
  private static isNearStreet(tiles: ExtendedTileData[][], x: number, y: number, radius: number): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
          const checkTile = tiles[checkY][checkX];
          if (checkTile.type === TileType.STREET) {
            return true;
          }
        }
      }
    }
    return false;
  }
}