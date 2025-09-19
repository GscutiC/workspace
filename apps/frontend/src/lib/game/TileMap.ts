import { Container, Graphics, Sprite, Texture, DisplayObject } from 'pixi.js';
import type { TileMap as TileMapType, TileData, Position } from '@/types/game';
import { TileType, LayerType } from '@/types/game';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TILE_PROPERTIES } from '@/constants/game';

/**
 * TileMap manages the 2D grid-based world
 * Handles tile rendering, collision detection, and map data
 */
export class TileMap {
  private mapData: TileMapType;
  private tileContainer: Container;
  private collisionContainer: Container;
  private debugContainer: Container;
  private tileSprites: Map<string, DisplayObject>;
  private showDebug: boolean = false;

  constructor() {
    this.tileContainer = new Container();
    this.collisionContainer = new Container();
    this.debugContainer = new Container();
    this.tileSprites = new Map();

    // Initialize map data
    this.mapData = this.generateDefaultMap();
    this.setupContainers();
  }

  /**
   * Generate a default office layout
   */
  private generateDefaultMap(): TileMapType {
    const tiles: TileData[][] = [];
    const collisionMap: boolean[][] = [];

    // Initialize with floor tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      tiles[y] = [];
      collisionMap[y] = [];

      for (let x = 0; x < MAP_WIDTH; x++) {
        let tileType = TileType.FLOOR;
        let walkable = true;

        // Create walls around the perimeter
        if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
          tileType = TileType.WALL;
          walkable = false;
        }
        // Add some office furniture
        else if (this.shouldPlaceDesk(x, y)) {
          tileType = TileType.DESK;
          walkable = false;
        }
        else if (this.shouldPlaceChair(x, y, tiles)) {
          tileType = TileType.CHAIR;
          walkable = false;
        }
        else if (this.shouldPlacePlant(x, y)) {
          tileType = TileType.PLANT;
          walkable = false;
        }
        else if (this.shouldPlaceDoor(x, y)) {
          tileType = TileType.DOOR;
          walkable = true;
        }
        else if (this.shouldPlaceWindow(x, y)) {
          tileType = TileType.WINDOW;
          walkable = false;
        }

        tiles[y][x] = {
          id: y * MAP_WIDTH + x,
          x,
          y,
          type: tileType,
          walkable,
        };

        collisionMap[y][x] = !walkable;
      }
    }

    return {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tileSize: TILE_SIZE,
      tiles,
      collisionMap,
    };
  }

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
    container.addChild(this.debugContainer);

    this.renderTiles();
    if (this.showDebug) {
      this.renderDebugInfo();
    }

    return container;
  }

  /**
   * Render all tiles
   */
  private renderTiles(): void {
    for (let y = 0; y < this.mapData.height; y++) {
      for (let x = 0; x < this.mapData.width; x++) {
        const tile = this.mapData.tiles[y][x];
        this.renderTile(tile);
      }
    }
  }

  /**
   * Render a single tile
   */
  private renderTile(tile: TileData): void {
    const graphics = this.createTileSprite(tile);

    if (graphics) {
      const key = `${tile.x}-${tile.y}`;
      this.tileSprites.set(key, graphics);

      // Add to appropriate container
      if (tile.type === TileType.FLOOR) {
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
  private createTileSprite(tile: TileData): Graphics {
    // Create graphics directly instead of converting to sprite
    // This avoids texture generation issues in Pixi.js v8
    const graphics = new Graphics();
    const properties = TILE_PROPERTIES[tile.type];

    graphics
      .rect(0, 0, TILE_SIZE, TILE_SIZE)
      .fill(properties.color);

    // Add border for better visibility
    if (tile.type !== TileType.FLOOR) {
      graphics
        .rect(0, 0, TILE_SIZE, TILE_SIZE)
        .stroke({ width: 1, color: 0x000000 });
    }

    // Set position
    graphics.x = tile.x * TILE_SIZE;
    graphics.y = tile.y * TILE_SIZE;

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
  private shouldPlaceChair(x: number, y: number, tiles: TileData[][]): boolean {
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
  public getTileAtPosition(worldPos: Position): TileData | null {
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
    tile.type = tileType;
    tile.walkable = TILE_PROPERTIES[tileType].walkable;
    this.mapData.collisionMap[y][x] = !tile.walkable;

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
  public getTilesInView(viewBounds: { x: number; y: number; width: number; height: number }): TileData[] {
    const startX = Math.max(0, Math.floor(viewBounds.x / TILE_SIZE));
    const endX = Math.min(this.mapData.width - 1, Math.ceil((viewBounds.x + viewBounds.width) / TILE_SIZE));
    const startY = Math.max(0, Math.floor(viewBounds.y / TILE_SIZE));
    const endY = Math.min(this.mapData.height - 1, Math.ceil((viewBounds.y + viewBounds.height) / TILE_SIZE));

    const tiles: TileData[] = [];
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        tiles.push(this.mapData.tiles[y][x]);
      }
    }

    return tiles;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.tileSprites.forEach(sprite => sprite.destroy());
    this.tileSprites.clear();
    this.tileContainer.destroy();
    this.collisionContainer.destroy();
    this.debugContainer.destroy();
  }
}