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
 * - Integration with real parcels from API
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
   * Generate city structure that respects existing real parcels
   * This method integrates real parcel data with visual map generation
   */
  public static generateCityBlocksWithRealParcels(
    tiles: ExtendedTileData[][], 
    obstacles: Map<string, ObstacleInfo>,
    config: CityConfig,
    realParcels: ParcelInfo[]
  ): void {
    console.log('🏗️ Generating city with real parcels integration:', {
      parcelCount: realParcels.length,
      blockSize: config.blockSize
    });
    
    // 1. First generate basic street grid (this doesn't conflict with parcels)
    this.generateMainAvenues(tiles, config.avenueSpacing, config.mainStreetWidth);
    this.generateSecondaryStreets(tiles, config.blockSize, config.secondaryStreetWidth);
    
    // 2. For each real parcel, ensure the area is properly prepared
    realParcels.forEach(parcel => {
      this.prepareParcelandArea(tiles, obstacles, parcel, config);
    });
    
    // 3. Fill remaining areas with generated content
    this.fillRemainingAreasWithBuildings(tiles, obstacles, config, realParcels);
    
    console.log('✅ City generated with real parcels integrated!');
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
   * Prepare a specific parcel area on the map
   */
  private static prepareParcelandArea(
    tiles: ExtendedTileData[][],
    obstacles: Map<string, ObstacleInfo>,
    parcel: ParcelInfo,
    _config: CityConfig
  ): void {
    // Convert world coordinates to tile coordinates
    const startTileX = Math.floor(parcel.x / TILE_SIZE);
    const startTileY = Math.floor(parcel.y / TILE_SIZE);
    const endTileX = Math.min(MAP_WIDTH - 1, startTileX + Math.floor(parcel.width / TILE_SIZE));
    const endTileY = Math.min(MAP_HEIGHT - 1, startTileY + Math.floor(parcel.height / TILE_SIZE));
    
    // Validate bounds
    if (startTileX < 0 || startTileY < 0 || startTileX >= MAP_WIDTH || startTileY >= MAP_HEIGHT) {
      console.warn(`⚠️ Parcel ${parcel.number} is outside map bounds:`, { parcel, startTileX, startTileY });
      return;
    }
    
    // Fill parcel area based on its type
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        this.fillParcelTile(tiles, obstacles, x, y, parcel, startTileX, startTileY, endTileX - startTileX, endTileY - startTileY);
      }
    }
  }

  /**
   * Fill a single tile within a real parcel
   */
  private static fillParcelTile(
    tiles: ExtendedTileData[][], 
    obstacles: Map<string, ObstacleInfo>,
    x: number, 
    y: number, 
    parcel: ParcelInfo,
    parcelStartX: number,
    parcelStartY: number,
    parcelWidth: number,
    parcelHeight: number
  ): void {
    const relX = x - parcelStartX;
    const relY = y - parcelStartY;
    const isPerimeter = relX === 0 || relY === 0 || relX === parcelWidth - 1 || relY === parcelHeight - 1;
    const isCorner = (relX === 0 || relX === parcelWidth - 1) && (relY === 0 || relY === parcelHeight - 1);
    
    // Determine building type based on parcel type
    let buildingType: TileType;
    switch (parcel.type) {
      case 'residential':
        buildingType = TileType.RESIDENTIAL_BUILDING;
        break;
      case 'commercial':
        buildingType = TileType.COMMERCIAL_BUILDING;
        break;
      case 'office':
        buildingType = TileType.OFFICE_BUILDING;
        break;
      case 'mixed':
        buildingType = Math.random() < 0.5 ? TileType.COMMERCIAL_BUILDING : TileType.OFFICE_BUILDING;
        break;
      case 'public':
        buildingType = TileType.PARK_GRASS;
        break;
      case 'infrastructure':
        buildingType = TileType.BUILDING;
        break;
      default:
        buildingType = TileType.BUILDING;
    }
    
    if (isPerimeter && !isCorner && buildingType !== TileType.PARK_GRASS) {
      // Buildings on perimeter (but not corners for entrance)
      const obstacleId = `parcel_${parcel.number}_building_${x}_${y}`;
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
          name: `Parcela ${parcel.number} - Edificio`,
          type: parcel.type,
          interactive: true,
          description: `Edificio de la parcela ${parcel.number} (${parcel.type})`,
          canEnter: false,
          isOffice: parcel.type === 'office',
          isPark: parcel.type === 'public',
          floors: Math.floor(Math.random() * 5) + 1
        }
      });
    } else {
      // Interior area - walkable space or green area
      if (parcel.type === 'public') {
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
   * Fill areas not covered by real parcels with generated buildings
   */
  private static fillRemainingAreasWithBuildings(
    tiles: ExtendedTileData[][], 
    obstacles: Map<string, ObstacleInfo>,
    config: CityConfig,
    realParcels: ParcelInfo[]
  ): void {
    // Create a map of occupied areas
    const occupiedTiles = new Set<string>();
    
    realParcels.forEach(parcel => {
      const startTileX = Math.floor(parcel.x / TILE_SIZE);
      const startTileY = Math.floor(parcel.y / TILE_SIZE);
      const endTileX = Math.min(MAP_WIDTH, startTileX + Math.ceil(parcel.width / TILE_SIZE));
      const endTileY = Math.min(MAP_HEIGHT, startTileY + Math.ceil(parcel.height / TILE_SIZE));
      
      for (let y = Math.max(0, startTileY); y < endTileY; y++) {
        for (let x = Math.max(0, startTileX); x < endTileX; x++) {
          occupiedTiles.add(`${x},${y}`);
        }
      }
    });
    
    // Fill unoccupied areas with generated content
    const blockSpacing = config.blockSize + config.blockSpacing;
    
    for (let blockY = 0; blockY < Math.floor(MAP_HEIGHT / blockSpacing); blockY++) {
      for (let blockX = 0; blockX < Math.floor(MAP_WIDTH / blockSpacing); blockX++) {
        const startX = blockX * blockSpacing + config.secondaryStreetWidth;
        const startY = blockY * blockSpacing + config.secondaryStreetWidth;
        
        // Check if this block area is free
        let isBlockFree = true;
        for (let y = startY; y < startY + config.blockSize && y < MAP_HEIGHT && isBlockFree; y++) {
          for (let x = startX; x < startX + config.blockSize && x < MAP_WIDTH && isBlockFree; x++) {
            if (occupiedTiles.has(`${x},${y}`)) {
              isBlockFree = false;
            }
          }
        }
        
        // If block is free, fill it with generated content
        if (isBlockFree) {
          const districtType = this.getDistrictType(blockX, blockY, config);
          
          for (let y = startY; y < startY + config.blockSize && y < MAP_HEIGHT; y++) {
            for (let x = startX; x < startX + config.blockSize && x < MAP_WIDTH; x++) {
              this.fillBlockTile(tiles, obstacles, x, y, districtType, startX, startY, config.blockSize);
            }
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
        return 'SHOP';
      case 'residential':
        return 'HOUSE';
      case 'office':
        return 'OFFICE';
      case 'mixed':
        return Math.random() < 0.5 ? 'SHOP' : 'OFFICE';
      default:
        return 'CUSTOM';
    }
  }
}