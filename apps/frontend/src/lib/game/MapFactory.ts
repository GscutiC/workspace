import type { ExtendedTileData, ObstacleInfo } from '@/types/game';
import { TileType, TileCategory } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';
import {
  type TerrainConfig,
  AVAILABLE_PRESETS,
  validateConfig
} from './config/MapConfig';
import { CityGenerator, type ParcelInfo } from './generators/CityGenerator';
import { RiverGenerator } from './generators/RiverGenerator';
import { ParksGenerator } from './generators/ParksGenerator';
import { UrbanFurnitureGenerator } from './generators/UrbanFurnitureGenerator';
import { NewParcelLoader } from './NewParcelLoader';

/**
 * MapFactory provides a high-level interface for generating complete maps
 * using predefined configuration presets or custom configurations.
 * 
 * This factory encapsulates the complex process of coordinating multiple
 * generators to create cohesive city environments.
 */
export class MapFactory {
  /**
   * Generate a complete map using a preset configuration
   */
  public static generateMap(
    presetName: string = 'default'
  ): { tiles: ExtendedTileData[][], obstacles: Map<string, ObstacleInfo>, parcels: ParcelInfo[] } {
    const config = this.getPresetConfig(presetName);
    return this.generateMapWithConfig(config, presetName);
  }

  /**
   * Generate a complete map using real parcels from the API
   * This method loads parcels from the Districts GraphQL system
   */
  public static async generateMapWithRealParcels(
    presetName: string = 'default'
  ): Promise<{ tiles: ExtendedTileData[][], obstacles: Map<string, ObstacleInfo>, parcels: ParcelInfo[] }> {
    const config = this.getPresetConfig(presetName);
    
    // Validate configuration
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid configuration: ${validationErrors.join(', ')}`);
    }

    // Initialize empty map
    const { tiles, obstacles } = this.initializeMap();
    
    // Load parcels from District system only
    let parcels: ParcelInfo[];
    try {
      parcels = await NewParcelLoader.loadDistrictParcels();
      
      if (parcels.length === 0) {
        console.warn('⚠️ No parcels found in district system, creating default layout');
        parcels = this.createDefaultParcels();
      }
    } catch (error) {
      console.error('❌ Failed to load district parcels:', error);
      parcels = this.createDefaultParcels();
    }

    // Generate map features in order of dependency
    
    // Generate basic city structure (streets, buildings) around district parcels
    CityGenerator.generateCityBlocksWithRealParcels(tiles, obstacles, config.city, parcels);
    
    // Add parks (green spaces)
    ParksGenerator.generateLargeParks(tiles, obstacles, config.parks);
    
    // Add river and water borders
    RiverGenerator.generateRiver(tiles, obstacles, config.river);
    
    // Add urban furniture (final details)
    UrbanFurnitureGenerator.addUrbanFurniture(tiles, obstacles, config.furniture);

    // Add preset information to parcels
    parcels.forEach(parcel => {
      if (!parcel.preset) {
        parcel.preset = presetName;
      }
      if (!parcel.configSnapshot) {
        parcel.configSnapshot = JSON.stringify(config);
      }
    });

    return { tiles, obstacles, parcels };
  }

  /**
   * Generate a complete map using a custom configuration
   */
  public static generateMapWithConfig(
    config: TerrainConfig,
    presetName?: string
  ): { tiles: ExtendedTileData[][], obstacles: Map<string, ObstacleInfo>, parcels: ParcelInfo[] } {
    // Validate configuration
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid configuration: ${validationErrors.join(', ')}`);
    }

    // Initialize empty map
    const { tiles, obstacles } = this.initializeMap();
    const parcels: ParcelInfo[] = [];

    // Generate map features in order of dependency
    // 1. City blocks (foundation) - now collects parcel information
    CityGenerator.generateCityBlocks(tiles, obstacles, config.city, parcels);
    
    // 2. Parks (green spaces) - these could also be parcels in the future
    ParksGenerator.generateLargeParks(tiles, obstacles, config.parks);
    
    // 3. River (may modify existing tiles) - RESTORED: Natural water borders
    RiverGenerator.generateRiver(tiles, obstacles, config.river);
    
    // 4. Urban furniture (final details)
    UrbanFurnitureGenerator.addUrbanFurniture(tiles, obstacles, config.furniture);

    // Add preset information to parcels for reference
    if (presetName) {
      parcels.forEach(parcel => {
        parcel.preset = presetName;
        parcel.configSnapshot = JSON.stringify(config);
      });
    }

    return { tiles, obstacles, parcels };
  }

  /**
   * Get a preset configuration by name
   */
  public static getPresetConfig(presetName: string): TerrainConfig {
    const preset = AVAILABLE_PRESETS.find(p => p.name === presetName);
    if (!preset) {
      const availableNames = AVAILABLE_PRESETS.map(p => p.name).join(', ');
      throw new Error(`Unknown preset: ${presetName}. Available presets: ${availableNames}`);
    }
    return preset.config;
  }

  /**
   * Get list of available preset names
   */
  public static getAvailablePresets(): string[] {
    return AVAILABLE_PRESETS.map(p => p.name);
  }

  /**
   * Initialize an empty map with default floor tiles
   */
  private static initializeMap(): { tiles: ExtendedTileData[][], obstacles: Map<string, ObstacleInfo> } {
    const tiles: ExtendedTileData[][] = [];
    const obstacles = new Map<string, ObstacleInfo>();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      tiles[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        tiles[y][x] = {
          id: y * MAP_WIDTH + x,
          x,
          y,
          type: TileType.FLOOR,
          walkable: true,
          category: TileCategory.WALKABLE,
          obstacleId: undefined,
        };
      }
    }

    return { tiles, obstacles };
  }

  /**
   * Generate a preview description of what a preset will generate
   */
  public static getPresetDescription(presetName: string): string {
    const config = this.getPresetConfig(presetName);
    
    const descriptions: Record<string, string> = {
      default: 'Balanced urban environment with moderate density, green spaces, and standard infrastructure.',
      downtown: 'Dense urban core with tall buildings, limited green space, and high infrastructure density.',
      suburban: 'Low-density residential area with large parks, wide spacing, and minimal urban furniture.',
      industrial: 'Industrial district with large blocks, wide rivers, minimal parks, and utilitarian infrastructure.'
    };

    const baseDescription = descriptions[presetName] || 'Custom configuration';
    
    // Add specific stats
    const stats = [
      `Parks: ${config.parks.minParks}-${config.parks.maxParks}`,
      `Block size: ${config.city.blockSize}`,
      `River width: ${config.river.width}`,
      `Street lights: ${Math.round(config.furniture.streetLightDensity * 100)}%`
    ].join(', ');

    return `${baseDescription} (${stats})`;
  }

  /**
   * Get preset information for UI display
   */
  public static getPresetInfo() {
    return AVAILABLE_PRESETS.map(preset => ({
      name: preset.name,
      label: preset.label,
      description: this.getPresetDescription(preset.name)
    }));
  }

  /**
   * Create default parcels when district system is not available
   */
  private static createDefaultParcels(): ParcelInfo[] {
    const parcels: ParcelInfo[] = [];
    
    // Create a simple 4x4 grid of parcels (16 total)
    const parcelSize = 16;
    const spacing = 50;
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const number = row * 4 + col + 1;
        const x = 20 + col * spacing;
        const y = 20 + row * spacing;
        
        parcels.push({
          number,
          x,
          y,
          width: parcelSize,
          height: parcelSize,
          type: 'residential',
          districtType: 'residential',
          buildingType: 'default',
          preset: 'default'
        });
      }
    }
    
    return parcels;
  }
}
