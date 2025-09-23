import { Container, Graphics, Text } from 'pixi.js';
import type { TileMap as TileMapType, ExtendedTileData, ObstacleInfo, Position } from '@/types/game';
import { TileType, TileCategory, LayerType } from '@/types/game';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TILE_PROPERTIES } from '@/constants/game';
import { CityGenerator, type ParcelInfo } from './generators/CityGenerator';
import { RiverGenerator } from './generators/RiverGenerator';
import { ParksGenerator } from './generators/ParksGenerator';
import { UrbanFurnitureGenerator } from './generators/UrbanFurnitureGenerator';
import { PathfindingIntegration } from './utils/PathfindingIntegration';
import { DEFAULT_CONFIG, type TerrainConfig } from './config/MapConfig';
import { MapFactory } from './MapFactory';

/**
 * TileMap manages the 2D grid-based world
 * Handles tile rendering, collision detection, and map data
 */
export class TileMap {
  private mapData: TileMapType;
  private parcels: ParcelInfo[] = [];
  private tileContainer: Container;
  private collisionContainer: Container;
  private debugContainer: Container;
  private parcelContainer: Container;
  private tileSprites: Map<string, Graphics>;
  private parcelSprites: Map<string, Container>;
  private showDebug: boolean = false;
  private showParcels: boolean = false;

  constructor(mapData: TileMapType, parcels: ParcelInfo[] = []) {
    this.mapData = mapData;
    this.parcels = parcels;
    this.tileContainer = new Container();
    this.collisionContainer = new Container();
    this.debugContainer = new Container();
    this.parcelContainer = new Container();
    this.tileSprites = new Map();
    this.parcelSprites = new Map();
    
    this.tileContainer.name = 'TileContainer';
    this.collisionContainer.name = 'CollisionContainer';
    this.debugContainer.name = 'DebugContainer';
    this.parcelContainer.name = 'ParcelContainer';
    
    this.collisionContainer.visible = false;
    this.debugContainer.visible = false;
    this.parcelContainer.visible = false;

    // Initialize walkableAreas if not provided or empty
    this.initializeWalkableAreas();
  }

  /**
   * Initialize walkableAreas array with proper dimensions
   */
  private initializeWalkableAreas(): void {
    if (!this.mapData.walkableAreas || this.mapData.walkableAreas.length === 0) {
      console.log('🚀 Initializing walkableAreas array...');
      this.mapData.walkableAreas = [];
      
      for (let y = 0; y < this.mapData.height; y++) {
        this.mapData.walkableAreas[y] = [];
        for (let x = 0; x < this.mapData.width; x++) {
          // Default all areas to walkable, this will be refined later
          this.mapData.walkableAreas[y][x] = true;
        }
      }
      
      console.log(`✅ Initialized walkableAreas: ${this.mapData.width}x${this.mapData.height}`);
    }
  }

  /**
   * Regenerate the map using a specific preset configuration
   */
  public regenerateWithPreset(presetName: string = 'default'): void {
    try {
      // Clear existing sprites
      this.clearAllSprites();
      
      // Generate new map using MapFactory
      const { tiles, obstacles, parcels } = MapFactory.generateMap(presetName);
      
      // Store parcels information
      this.parcels = parcels;
      
      // Initialize collision and walkable maps
      const collisionMap: boolean[][] = [];
      const walkableAreas: boolean[][] = [];
      
      for (let y = 0; y < MAP_HEIGHT; y++) {
        collisionMap[y] = [];
        walkableAreas[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
          collisionMap[y][x] = false;
          walkableAreas[y][x] = true;
        }
      }
      
      // Update collision and walkable maps using PathfindingIntegration
      PathfindingIntegration.updateCollisionMaps(tiles, collisionMap, walkableAreas);
      
      // Update map data
      this.mapData = {
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        tileSize: TILE_SIZE,
        tiles,
        collisionMap,
        walkableAreas,
        obstacles
      };
      
      // Regenerate sprites
      this.renderTiles();
      
      if (this.showDebug) {
        this.renderDebugInfo();
      }
      
      console.log(`🗺️ Map regenerated with preset: ${presetName}`);
      console.log(`📦 Loaded ${this.parcels.length} parcels:`, this.parcels.map(p => `Parcela ${p.number} (${p.type})`));
    } catch (error) {
      console.error('❌ Failed to regenerate map:', error);
      // Fallback to default map
      this.mapData = this.generateDefaultMap();
      this.renderTiles();
    }
  }

  /**
   * Clear all existing sprites
   */
  private clearAllSprites(): void {
    this.tileSprites.forEach((sprite) => {
      sprite.destroy();
    });
    this.tileSprites.clear();
    this.clearParcelSprites();
    this.tileContainer.removeChildren();
    this.collisionContainer.removeChildren();
    this.debugContainer.removeChildren();
  }

  /**
   * Get all parcels generated for the current map
   */
  public getParcels(): ParcelInfo[] {
    return [...this.parcels]; // Return a copy to prevent external modifications
  }

  /**
   * Get parcel information for a specific position
   */
  public getParcelAt(x: number, y: number): ParcelInfo | undefined {
    return this.parcels.find(parcel => 
      x >= parcel.x && 
      x < parcel.x + parcel.width && 
      y >= parcel.y && 
      y < parcel.y + parcel.height
    );
  }

  /**
   * Get parcel by number
   */
  public getParcelByNumber(number: number): ParcelInfo | undefined {
    return this.parcels.find(parcel => parcel.number === number);
  }

  /**
   * Generate a default urban environment layout with city blocks, wide streets, large parks and a river
   */
  private generateDefaultMap(): TileMapType {
    const tiles: ExtendedTileData[][] = [];
    const collisionMap: boolean[][] = [];
    const walkableAreas: boolean[][] = [];
    const obstacles = new Map<string, ObstacleInfo>();

    // Initialize with street tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      tiles[y] = [];
      collisionMap[y] = [];
      walkableAreas[y] = [];

      for (let x = 0; x < MAP_WIDTH; x++) {
        tiles[y][x] = {
          id: y * MAP_WIDTH + x,
          x,
          y,
          type: TileType.STREET,
          walkable: true,
          category: TileCategory.WALKABLE,
        };
        collisionMap[y][x] = false;
        walkableAreas[y][x] = true;
      }
    }

    // Generate city blocks with configuration
    const config = DEFAULT_CONFIG; // Por ahora usamos la configuración por defecto
    CityGenerator.generateCityBlocks(tiles, obstacles, config.city);
    
    // Generate large parks with configuration
    ParksGenerator.generateLargeParks(tiles, obstacles, config.parks);
    
    // Generate river crossing the city with configuration
    RiverGenerator.generateRiver(tiles, obstacles, config.river);
    
    // Add urban furniture with configuration
    UrbanFurnitureGenerator.addUrbanFurniture(tiles, obstacles, config.furniture);

    // Update collision and walkable maps
    PathfindingIntegration.updateCollisionMaps(tiles, collisionMap, walkableAreas);

    // Debug logging for map generation
    const tileTypeCounts: Record<string, number> = {};
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = tiles[y][x];
        tileTypeCounts[tile.type] = (tileTypeCounts[tile.type] || 0) + 1;
      }
    }
    
    console.log('🗺️ Map generated with tile types:', tileTypeCounts);
    console.log('🏢 Total obstacles:', obstacles.size);
    console.log('📐 Map dimensions:', MAP_WIDTH, 'x', MAP_HEIGHT);
    console.log('🎯 Tiles array length:', tiles.length, 'x', tiles[0]?.length);

    return {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tileSize: TILE_SIZE,
      tiles,
      collisionMap,
      obstacles,
      walkableAreas,
    };
  }

  /**
   * Generate structured city blocks with main avenues and district streets
   */
  /**
   * Generate large parks (3-8 tiles) distributed across the city
   */
  /**
   * Setup container hierarchy
   */
  private setupContainers(): void {
    this.tileContainer.sortableChildren = true;
    this.collisionContainer.sortableChildren = true;
    this.debugContainer.sortableChildren = true;

    // Set layer z-indices
    this.tileContainer.zIndex = LayerType.FLOOR;
    this.collisionContainer.zIndex = LayerType.OBJECTS;
    this.debugContainer.zIndex = LayerType.UI;
  }

  /**
   * Create visual representation of the map
   */
  public createVisuals(): Container {
    const container = new Container();
    container.addChild(this.tileContainer);
    container.addChild(this.collisionContainer);
    container.addChild(this.parcelContainer);
    container.addChild(this.debugContainer);

    this.renderTiles();
    if (this.showDebug) {
      this.renderDebugInfo();
    }
    if (this.showParcels) {
      this.renderParcels();
    }

    return container;
  }

  /**
   * Render all tiles
   */
  private renderTiles(): void {
    console.log('🎨 Starting tile rendering...');
    let renderedCount = 0;
    
    for (let y = 0; y < this.mapData.height; y++) {
      for (let x = 0; x < this.mapData.width; x++) {
        const tile = this.mapData.tiles[y][x];
        this.renderTile(tile);
        renderedCount++;
      }
    }
    
    console.log(`🎨 Rendered ${renderedCount} tiles`);
    console.log(`📦 Tile container children: ${this.tileContainer.children.length}`);
    console.log(`🧱 Collision container children: ${this.collisionContainer.children.length}`);
  }

  /**
   * Render a single tile
   */
  private renderTile(tile: ExtendedTileData): void {
    const graphics = this.createTileSprite(tile);

    if (graphics) {
      const key = `${tile.x}-${tile.y}`;
      this.tileSprites.set(key, graphics);

      // Add to appropriate container based on tile category
      if (tile.category === TileCategory.WALKABLE || tile.type === TileType.FLOOR || tile.type === TileType.PARK_GRASS) {
        this.tileContainer.addChild(graphics);
      } else {
        this.collisionContainer.addChild(graphics);
      }

      // Store reference in tile data
      tile.sprite = graphics;
    }
  }

  /**
   * Create sprite for a tile
   */
  private createTileSprite(tile: ExtendedTileData): Graphics {
    // Create graphics directly instead of converting to sprite
    // This avoids texture generation issues in Pixi.js v8
    const graphics = new Graphics();
    const properties = TILE_PROPERTIES[tile.type as keyof typeof TILE_PROPERTIES];

    if (!properties) {
      console.warn(`⚠️ No properties found for tile type: ${tile.type}`);
      return graphics;
    }

    graphics
      .rect(0, 0, TILE_SIZE, TILE_SIZE)
      .fill(properties.color);

    // Add border for better visibility
    if (tile.type !== TileType.FLOOR && tile.type !== TileType.STREET) {
      graphics
        .rect(0, 0, TILE_SIZE, TILE_SIZE)
        .stroke({ width: 1, color: 0x000000 });
    }

    // Set position
    graphics.x = tile.x * TILE_SIZE;
    graphics.y = tile.y * TILE_SIZE;

    // Debug logging for first few tiles
    if (tile.x < 3 && tile.y < 3) {
      console.log(`🎨 Creating tile at (${tile.x}, ${tile.y}) type: ${tile.type}, color: 0x${properties.color.toString(16)}`);
    }

    return graphics;
  }

  /**
   * Render debug information
   */
  private renderDebugInfo(): void {
    this.debugContainer.removeChildren();

    // Render collision grid
    for (let y = 0; y < this.mapData.height; y++) {
      for (let x = 0; x < this.mapData.width; x++) {
        if (this.mapData.collisionMap[y][x]) {
          const graphics = new Graphics();
          graphics
            .rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            .stroke({ width: 2, color: 0xFF0000, alpha: 0.5 });

          this.debugContainer.addChild(graphics);
        }
      }
    }
  }

  /**
   * Office layout logic - desk placement
   */
  private shouldPlaceDesk(x: number, y: number): boolean {
    // Place desks in a grid pattern with spacing
    return (x % 6 === 2 || x % 6 === 4) && (y % 4 === 2);
  }

  /**
   * Office layout logic - chair placement
   */
  private shouldPlaceChair(x: number, y: number, tiles: ExtendedTileData[][]): boolean {
    // Place chairs next to desks
    const hasNearbyDesk =
      (x > 0 && tiles[y] && tiles[y][x - 1] && tiles[y][x - 1].type === TileType.DESK) ||
      (x < MAP_WIDTH - 1 && tiles[y] && tiles[y][x + 1] && tiles[y][x + 1].type === TileType.DESK) ||
      (y > 0 && tiles[y - 1] && tiles[y - 1][x] && tiles[y - 1][x].type === TileType.DESK) ||
      (y < MAP_HEIGHT - 1 && tiles[y + 1] && tiles[y + 1][x] && tiles[y + 1][x].type === TileType.DESK);

    return hasNearbyDesk && Math.random() < 0.7;
  }

  /**
   * Office layout logic - plant placement
   */
  private shouldPlacePlant(x: number, y: number): boolean {
    // Place plants in corners and scattered around
    const isCornerArea = (x < 3 || x > MAP_WIDTH - 4) && (y < 3 || y > MAP_HEIGHT - 4);
    const isScattered = Math.random() < 0.02;

    return isCornerArea || isScattered;
  }

  /**
   * Office layout logic - door placement
   */
  private shouldPlaceDoor(x: number, y: number): boolean {
    // Place doors on walls
    const isOnWall = x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1;
    const isDoorPosition = (x === Math.floor(MAP_WIDTH / 2) && y === 0) ||
                          (x === MAP_WIDTH - 1 && y === Math.floor(MAP_HEIGHT / 2));

    return isOnWall && isDoorPosition;
  }

  /**
   * Office layout logic - window placement
   */
  private shouldPlaceWindow(x: number, y: number): boolean {
    // Place windows on outer walls
    const isOnOuterWall = x === 0 || x === MAP_WIDTH - 1;
    const isWindowPosition = y % 8 === 4;

    return isOnOuterWall && isWindowPosition;
  }

  /**
   * Get tile type at position
   */
  private getTileTypeAt(x: number, y: number): TileType | null {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return null;
    }
    if (!this.mapData || !this.mapData.tiles || !this.mapData.tiles[y] || !this.mapData.tiles[y][x]) {
      return null;
    }
    return this.mapData.tiles[y][x].type;
  }

  /**
   * Get tile at world position
   */
  public getTileAtPosition(worldPos: Position): ExtendedTileData | null {
    const tileX = Math.floor(worldPos.x / TILE_SIZE);
    const tileY = Math.floor(worldPos.y / TILE_SIZE);

    if (tileX < 0 || tileX >= this.mapData.width || tileY < 0 || tileY >= this.mapData.height) {
      return null;
    }

    return this.mapData.tiles[tileY][tileX];
  }

  /**
   * Check if position is walkable
   */
  public isWalkable(worldPos: Position): boolean {
    const tile = this.getTileAtPosition(worldPos);
    return tile ? tile.walkable : false;
  }

  /**
   * Get map data for pathfinding
   */
  public getMapData(): TileMapType {
    return this.mapData;
  }

  /**
   * Get world bounds
   */
  public getWorldBounds(): { width: number; height: number } {
    return {
      width: this.mapData.width * TILE_SIZE,
      height: this.mapData.height * TILE_SIZE,
    };
  }

  /**
   * Toggle debug visualization
   */
  public toggleDebug(): void {
    this.showDebug = !this.showDebug;
    if (this.showDebug) {
      this.renderDebugInfo();
    } else {
      this.debugContainer.removeChildren();
    }
  }

  /**
   * Update tile at position
   */
  public updateTile(x: number, y: number, tileType: TileType): void {
    if (x < 0 || x >= this.mapData.width || y < 0 || y >= this.mapData.height) {
      return;
    }

    const tile = this.mapData.tiles[y][x];
    const properties = TILE_PROPERTIES[tileType as keyof typeof TILE_PROPERTIES];
    
    tile.type = tileType;
    tile.walkable = properties.walkable;
    
    // Update category based on tile type
    if (tileType === TileType.STREET || tileType === TileType.SIDEWALK || tileType === TileType.PARK_PATH) {
      tile.category = TileCategory.WALKABLE;
    } else if (tileType === TileType.OFFICE_BUILDING || tileType === TileType.RESIDENTIAL_BUILDING || tileType === TileType.COMMERCIAL_BUILDING) {
      tile.category = TileCategory.BUILDING;
    } else if (tileType === TileType.TREE || tileType === TileType.PARK_GRASS || tileType === TileType.FOUNTAIN) {
      tile.category = TileCategory.NATURE;
    } else if (tileType === TileType.STREET_LIGHT || tileType === TileType.TRAFFIC_LIGHT) {
      tile.category = TileCategory.URBAN_FURNITURE;
    } else {
      tile.category = TileCategory.OBSTACLE;
    }
    
    this.mapData.collisionMap[y][x] = !tile.walkable;
    this.mapData.walkableAreas[y][x] = tile.walkable && (tile.category === TileCategory.WALKABLE);

    // Update visual representation
    const key = `${x}-${y}`;
    const existingSprite = this.tileSprites.get(key);
    if (existingSprite) {
      existingSprite.destroy();
      this.tileSprites.delete(key);
    }

    this.renderTile(tile);
  }

  /**
   * Get tiles in viewport for culling
   */
  public getTilesInView(viewBounds: { x: number; y: number; width: number; height: number }): ExtendedTileData[] {
    // Convert world bounds to tile coordinates
    const startX = Math.floor(viewBounds.x / this.mapData.tileSize);
    const startY = Math.floor(viewBounds.y / this.mapData.tileSize);
    const endX = Math.ceil((viewBounds.x + viewBounds.width) / this.mapData.tileSize);
    const endY = Math.ceil((viewBounds.y + viewBounds.height) / this.mapData.tileSize);

    const tiles: ExtendedTileData[] = [];

    // Iterate through visible tile range
    for (let y = Math.max(0, startY); y < Math.min(this.mapData.height, endY); y++) {
      for (let x = Math.max(0, startX); x < Math.min(this.mapData.width, endX); x++) {
        tiles.push(this.mapData.tiles[y][x]);
      }
    }

    return tiles;
  }

  /**
   * Get obstacle information by ID
   */
  public getObstacle(obstacleId: string): ObstacleInfo | undefined {
    return this.mapData.obstacles.get(obstacleId);
  }

  /**
   * Get all obstacles
   */
  public getAllObstacles(): Map<string, ObstacleInfo> {
    return this.mapData.obstacles;
  }

  /**
   * Check if position is in a walkable area (street/sidewalk)
   */
  public isWalkableArea(x: number, y: number): boolean {
    if (x < 0 || x >= this.mapData.width || y < 0 || y >= this.mapData.height) {
      return false;
    }
    return this.mapData.walkableAreas[y][x];
  }

  /**
   * Get obstacles in a specific area
   */
  public getObstaclesInArea(bounds: { x: number; y: number; width: number; height: number }): ObstacleInfo[] {
    const obstacles: ObstacleInfo[] = [];
    
    for (const obstacle of this.mapData.obstacles.values()) {
      const obstBounds = obstacle.bounds;
      
      // Check if obstacle bounds intersect with the query area
      if (obstBounds.x < bounds.x + bounds.width &&
          obstBounds.x + obstBounds.width > bounds.x &&
          obstBounds.y < bounds.y + bounds.height &&
          obstBounds.y + obstBounds.height > bounds.y) {
        obstacles.push(obstacle);
      }
    }
    
    return obstacles;
  }

  /**
   * Get tile category at position
   */
  public getTileCategory(x: number, y: number): TileCategory | null {
    if (x < 0 || x >= this.mapData.width || y < 0 || y >= this.mapData.height) {
      return null;
    }
    return this.mapData.tiles[y][x].category;
  }

  /**
   * Toggle visualization of areas by category
   */
  public toggleAreaVisualization(show: boolean = true): void {
    this.showDebug = show;
    if (show) {
      this.renderAreaVisualization();
    } else {
      this.debugContainer.removeChildren();
    }
  }

  /**
   * Render color-coded areas based on tile categories
   */
  private renderAreaVisualization(): void {
    this.debugContainer.removeChildren();

    for (let y = 0; y < this.mapData.height; y++) {
      for (let x = 0; x < this.mapData.width; x++) {
        const tile = this.mapData.tiles[y][x];
        this.renderAreaIndicator(tile);
      }
    }
  }

  /**
   * Render area indicator for a specific tile
   */
  private renderAreaIndicator(tile: ExtendedTileData): void {
    const graphics = new Graphics();
    const size = this.mapData.tileSize;
    
    // Set color based on category
    let color = 0x000000;
    const alpha = 0.3;
    
    switch (tile.category) {
      case TileCategory.WALKABLE:
        color = 0x00FF00; // Verde para calles/aceras
        break;
      case TileCategory.BUILDING:
        color = 0xFF0000; // Rojo para edificios
        break;
      case TileCategory.NATURE:
        color = 0x00AA00; // Verde oscuro para parques
        break;
      case TileCategory.URBAN_FURNITURE:
        color = 0xFFFF00; // Amarillo para mobiliario
        break;
      case TileCategory.OBSTACLE:
        color = 0xFF00FF; // Magenta para obstáculos
        break;
      default:
        return; // No mostrar áreas sin categoría
    }

    // Draw colored overlay
    graphics.beginFill(color, alpha);
    graphics.drawRect(
      tile.x * size,
      tile.y * size,
      size,
      size
    );
    graphics.endFill();

    // Add border for better visibility
    graphics.lineStyle(1, color, 0.8);
    graphics.drawRect(
      tile.x * size,
      tile.y * size,
      size,
      size
    );

    this.debugContainer.addChild(graphics);
  }

  /**
   * Show obstacles with labels
   */
  public visualizeObstacles(show: boolean = true): void {
    if (!show) {
      // Remove existing obstacle markers
      this.debugContainer.children.forEach(child => {
        if (child.name && child.name.startsWith('obstacle_')) {
          this.debugContainer.removeChild(child);
        }
      });
      return;
    }

    for (const obstacle of this.mapData.obstacles.values()) {
      this.renderObstacleMarker(obstacle);
    }
  }

  /**
   * Render marker for an obstacle
   */
  private renderObstacleMarker(obstacle: ObstacleInfo): void {
    const graphics = new Graphics();
    const size = this.mapData.tileSize;
    
    // Draw obstacle bounds
    graphics.lineStyle(2, 0xFF4444, 1);
    graphics.beginFill(0xFF4444, 0.2);
    graphics.drawRect(
      obstacle.bounds.x * size,
      obstacle.bounds.y * size,
      obstacle.bounds.width * size,
      obstacle.bounds.height * size
    );
    graphics.endFill();

    // Add interactive indicator if applicable
    if (obstacle.metadata.interactive) {
      graphics.lineStyle(2, 0x44FF44, 1);
      graphics.drawCircle(
        (obstacle.bounds.x + obstacle.bounds.width / 2) * size,
        (obstacle.bounds.y + obstacle.bounds.height / 2) * size,
        size / 4
      );
    }

    graphics.name = `obstacle_${obstacle.id}`;
    this.debugContainer.addChild(graphics);
  }

  /**
   * Render parcel numbering overlay
   */
  private renderParcels(): void {
    this.parcelContainer.removeChildren();
    this.parcelSprites.clear();

    if (!this.parcels || this.parcels.length === 0) {
      return;
    }

    this.parcels.forEach((parcel) => {
      this.renderParcelNumber(parcel);
    });
  }

  /**
   * Render a single parcel number
   */
  private renderParcelNumber(parcel: ParcelInfo): void {
    const size = TILE_SIZE;
    const centerX = (parcel.x + parcel.width / 2) * size;
    const centerY = (parcel.y + parcel.height / 2) * size;

    // Create background for the parcel number
    const background = new Graphics();
    background.beginFill(0x000000, 0.7);
    background.drawRoundedRect(
      centerX - 30,
      centerY - 10,
      60,
      20,
      5
    );
    background.endFill();

    // Create text for parcel number using Graphics instead of Text
    // This avoids compatibility issues with Pixi.js v8
    const textGraphics = new Graphics();
    textGraphics.beginFill(0xFFFFFF);
    
    // Draw text as simple rectangles for now (simplified version)
    // In a real implementation, you might want to use BitmapText or another approach
    const text = `P${parcel.number}`;
    const charWidth = 6;
    const charHeight = 8;
    const textWidth = text.length * charWidth;
    const startX = centerX - textWidth / 2;
    const startY = centerY - charHeight / 2;
    
    // Simple pixel-based text rendering (very basic)
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = startX + i * charWidth;
      
      // Draw basic character shapes
      if (char === 'P') {
        textGraphics.drawRect(x, startY, 1, charHeight);
        textGraphics.drawRect(x, startY, charWidth - 1, 1);
        textGraphics.drawRect(x, startY + charHeight / 2, charWidth - 1, 1);
        textGraphics.drawRect(x + charWidth - 1, startY, 1, charHeight / 2);
      } else if (/\d/.test(char)) {
        // Simple number representation
        textGraphics.drawRect(x, startY, charWidth, charHeight);
      }
    }
    
    textGraphics.endFill();

    // Group background and text
    const parcelGroup = new Container();
    parcelGroup.addChild(background);
    parcelGroup.addChild(textGraphics);
    parcelGroup.name = `parcel_${parcel.number}`;

    // Store sprite reference
    this.parcelSprites.set(`parcel_${parcel.number}`, parcelGroup);
    this.parcelContainer.addChild(parcelGroup);
  }

  /**
   * Toggle parcel numbering visibility
   */
  public toggleParcels(): void {
    this.showParcels = !this.showParcels;
    this.parcelContainer.visible = this.showParcels;
    
    if (this.showParcels) {
      this.renderParcels();
    }
  }

  /**
   * Set parcel visibility
   */
  public setParcelsVisible(visible: boolean): void {
    this.showParcels = visible;
    this.parcelContainer.visible = visible;
    
    if (visible) {
      this.renderParcels();
    }
  }

  /**
   * Get parcel at position
   */
  public getParcelAtPosition(x: number, y: number): ParcelInfo | undefined {
    return this.parcels.find(parcel => 
      x >= parcel.x && x < parcel.x + parcel.width &&
      y >= parcel.y && y < parcel.y + parcel.height
    );
  }

  /**
   * Clear all parcel sprites
   */
  private clearParcelSprites(): void {
    this.parcelSprites.forEach(sprite => sprite.destroy());
    this.parcelSprites.clear();
    this.parcelContainer.removeChildren();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.tileSprites.forEach(sprite => sprite.destroy());
    this.tileSprites.clear();
    this.clearParcelSprites();
    this.tileContainer.destroy();
    this.collisionContainer.destroy();
    this.parcelContainer.destroy();
    this.debugContainer.destroy();
  }
}