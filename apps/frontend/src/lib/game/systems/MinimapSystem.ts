import { Container, Graphics, Rectangle, Text, TextStyle } from 'pixi.js';
import type { GameState, Position, AvatarData } from '@/types/game';
import { TileType, LayerType } from '@/types/game';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';
import type { TileMap } from '../TileMap';

/**
 * MinimapSystem handles minimap rendering and navigation
 * Shows a bird's eye view of the entire map with avatars and interactive navigation
 */
export class MinimapSystem {
  private container: Container;
  private mapGraphics!: Graphics;
  private avatarGraphics!: Graphics;
  private viewportIndicator!: Graphics;
  private background!: Graphics;
  private titleText!: Text;
  private tileMap: TileMap;
  private gameState: GameState;
  
  // Minimap configuration
  private readonly MINIMAP_WIDTH = 200;
  private readonly MINIMAP_HEIGHT = 150;
  private readonly SCALE_FACTOR: number;
  private readonly TILE_SIZE_MINI: number;
  
  // Colors for minimap
  private readonly COLORS = {
    BACKGROUND: 0x2D3748,
    
    // Áreas caminables - Urban tiles
    STREET: 0x808080, // Gris
    SIDEWALK: 0xC0C0C0, // Gris plateado
    PARK_PATH: 0xD2B48C, // Tan claro
    PARK_GRASS: 0x90EE90, // Verde claro
    
    // Edificios
    OFFICE_BUILDING: 0x4169E1, // Azul real
    RESIDENTIAL_BUILDING: 0xB22222, // Rojo ladrillo
    COMMERCIAL_BUILDING: 0x32CD32, // Verde lima
    BUILDING: 0x4169E1, // Azul real (genérico)
    
    // Naturaleza
    TREE: 0x006400, // Verde oscuro
    FOUNTAIN: 0x00CED1, // Turquesa oscuro
    PLANT: 0x16A34A, // Verde legacy
    WATER: 0x1E90FF, // Azul profundo para agua
    
    // Mobiliario urbano
    STREET_LIGHT: 0xFFD700, // Dorado
    TRAFFIC_LIGHT: 0xFF4500, // Rojo naranja
    ROAD_SIGN: 0xFFD700, // Dorado
    PARK_BENCH: 0x8B4513, // Marrón
    
    // Tipos de oficina legacy (para compatibilidad)
    FLOOR: 0xF7FAFC,
    WALL: 0x4A5568,
    DESK: 0x92400E,
    CHAIR: 0x1F2937,
    DOOR: 0x7C2D12,
    WINDOW: 0x0EA5E9,
    
    // Special colors
    AVATAR_SELF: 0xEF4444,
    AVATAR_OTHER: 0x3B82F6,
    VIEWPORT: 0xFBBF24,
    BORDER: 0x1A202C
  };

  private onMinimapMoveAvatar?: (worldPosition: Position) => void;
  private onMinimapMoveCamera?: (worldPosition: Position) => void;

  constructor(tileMap: TileMap, gameState: GameState) {
    this.tileMap = tileMap;
    this.gameState = gameState;
    
    // Calculate scale factor to fit the entire map
    this.SCALE_FACTOR = Math.min(
      this.MINIMAP_WIDTH / (MAP_WIDTH * TILE_SIZE),
      this.MINIMAP_HEIGHT / (MAP_HEIGHT * TILE_SIZE)
    );
    
    this.TILE_SIZE_MINI = TILE_SIZE * this.SCALE_FACTOR;
    
    this.container = new Container();
    this.container.name = 'MinimapSystem';
    
    this.initializeGraphics();
    this.setupInteraction();
    this.renderStaticMap();
  }

  /**
   * Initialize graphics containers
   */
  private initializeGraphics(): void {
    // Background with enhanced styling
    this.background = new Graphics();
    this.background
      .rect(0, 0, this.MINIMAP_WIDTH, this.MINIMAP_HEIGHT)
      .fill(this.COLORS.BACKGROUND)
      .stroke({ 
        width: 3, 
        color: this.COLORS.BORDER,
        alpha: 0.9
      });
    
    // Add inner shadow effect
    this.background
      .rect(2, 2, this.MINIMAP_WIDTH - 4, this.MINIMAP_HEIGHT - 4)
      .stroke({ 
        width: 1, 
        color: 0x000000,
        alpha: 0.3
      });
    
    // Map graphics (static elements)
    this.mapGraphics = new Graphics();
    
    // Avatar graphics (dynamic elements)
    this.avatarGraphics = new Graphics();
    
    // Viewport indicator
    this.viewportIndicator = new Graphics();
    
    // Title text
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      dropShadow: {
        color: 0x000000,
        blur: 2,
        alpha: 0.8,
        distance: 1
      }
    });
    
    this.titleText = new Text({ text: 'MAPA', style: titleStyle });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = this.MINIMAP_WIDTH / 2;
    this.titleText.y = -20;
    
    // Add to container in correct order
    this.container.addChild(this.background);
    this.container.addChild(this.mapGraphics);
    this.container.addChild(this.avatarGraphics);
    this.container.addChild(this.viewportIndicator);
    this.container.addChild(this.titleText);
    
    // Set container properties
    this.container.interactive = true;
    this.container.cursor = 'pointer';
  }

  /**
   * Setup click interaction for navigation with visual feedback
   * Left click: Move avatar, Right click: Move camera
   */
  private setupInteraction(): void {
    this.container.on('pointerdown', (event) => {
      // Prevent context menu on right click
      event.data.originalEvent.preventDefault();
      
      const localPoint = event.data.getLocalPosition(this.container);
      const nativeEvent = event.data.originalEvent as unknown as MouseEvent;
      const button = nativeEvent.button || 0; // Default to left click if button is undefined
      
      // Convert minimap coordinates to world coordinates
      const worldX = (localPoint.x / this.SCALE_FACTOR);
      const worldY = (localPoint.y / this.SCALE_FACTOR);
      const worldPosition: Position = { x: worldX, y: worldY };
      
      // Determine action based on mouse button
      if (button === 0) {
        // Left click: Move avatar
        this.showClickFeedback(localPoint.x, localPoint.y, 'avatar');
        if (this.onMinimapMoveAvatar) {
          this.onMinimapMoveAvatar(worldPosition);
        }
        console.log('🗺️ Minimap: Moving avatar to:', worldPosition);
      } else if (button === 2) {
        // Right click: Move camera
        this.showClickFeedback(localPoint.x, localPoint.y, 'camera');
        if (this.onMinimapMoveCamera) {
          this.onMinimapMoveCamera(worldPosition);
        }
        console.log('🗺️ Minimap: Moving camera to:', worldPosition);
      }
    });
    
    // Prevent context menu on right click
    this.container.on('rightdown', (event) => {
      event.data.originalEvent.preventDefault();
    });
    
    // Add hover effect
    this.container.on('pointerover', () => {
      this.container.alpha = 0.95;
    });
    
    this.container.on('pointerout', () => {
      this.container.alpha = 1.0;
    });
  }

  /**
   * Show visual feedback when minimap is clicked
   */
  private showClickFeedback(x: number, y: number, actionType: 'avatar' | 'camera' = 'avatar'): void {
    const feedback = new Graphics();
    const color = actionType === 'avatar' ? 0x00FF00 : 0x00BFFF; // Green for avatar, blue for camera
    
    feedback
      .circle(x, y, 8)
      .stroke({ width: 2, color: color, alpha: 0.8 })
      .circle(x, y, 4)
      .fill({ color: color, alpha: 0.6 });
    
    this.container.addChild(feedback);
    
    // Remove feedback after animation
    setTimeout(() => {
      if (feedback.parent) {
        feedback.parent.removeChild(feedback);
      }
    }, 300);
  }

  /**
   * Render static map elements (tiles)
   */
  private renderStaticMap(): void {
    this.mapGraphics.clear();
    
    const mapData = this.tileMap.getMapData();
    
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        this.renderTile(tile);
      }
    }
  }

  /**
   * Render a single tile on the minimap
   */
  private renderTile(tile: { x: number; y: number; type: TileType }): void {
    const x = tile.x * this.TILE_SIZE_MINI;
    const y = tile.y * this.TILE_SIZE_MINI;
    
    let color: number;
    switch (tile.type) {
      // Áreas caminables - Urban tiles
      case TileType.STREET:
        color = this.COLORS.STREET;
        break;
      case TileType.SIDEWALK:
        color = this.COLORS.SIDEWALK;
        break;
      case TileType.PARK_PATH:
        color = this.COLORS.PARK_PATH;
        break;
      case TileType.PARK_GRASS:
        color = this.COLORS.PARK_GRASS;
        break;
        
      // Edificios
      case TileType.OFFICE_BUILDING:
        color = this.COLORS.OFFICE_BUILDING;
        break;
      case TileType.RESIDENTIAL_BUILDING:
        color = this.COLORS.RESIDENTIAL_BUILDING;
        break;
      case TileType.COMMERCIAL_BUILDING:
        color = this.COLORS.COMMERCIAL_BUILDING;
        break;
      case TileType.BUILDING:
        color = this.COLORS.BUILDING;
        break;
        
      // Naturaleza
      case TileType.TREE:
        color = this.COLORS.TREE;
        break;
      case TileType.FOUNTAIN:
        color = this.COLORS.FOUNTAIN;
        break;
      case TileType.PLANT:
        color = this.COLORS.PLANT;
        break;
      case TileType.WATER:
        color = this.COLORS.WATER;
        break;
        
      // Mobiliario urbano
      case TileType.STREET_LIGHT:
        color = this.COLORS.STREET_LIGHT;
        break;
      case TileType.TRAFFIC_LIGHT:
        color = this.COLORS.TRAFFIC_LIGHT;
        break;
      case TileType.ROAD_SIGN:
        color = this.COLORS.ROAD_SIGN;
        break;
      case TileType.PARK_BENCH:
        color = this.COLORS.PARK_BENCH;
        break;
        
      // Tipos de oficina legacy
      case TileType.FLOOR:
        color = this.COLORS.FLOOR;
        break;
      case TileType.WALL:
        color = this.COLORS.WALL;
        break;
      case TileType.DESK:
        color = this.COLORS.DESK;
        break;
      case TileType.CHAIR:
        color = this.COLORS.CHAIR;
        break;
      case TileType.DOOR:
        color = this.COLORS.DOOR;
        break;
      case TileType.WINDOW:
        color = this.COLORS.WINDOW;
        break;
        
      default:
        // Default to street color for unknown types
        color = this.COLORS.STREET;
    }
    
    this.mapGraphics
      .rect(x, y, this.TILE_SIZE_MINI, this.TILE_SIZE_MINI)
      .fill(color);
  }

  /**
   * Update minimap with current game state
   */
  public update(deltaTime: number, gameState: GameState): void {
    this.gameState = gameState;
    this.updateAvatars();
    this.updateViewportIndicator();
  }

  /**
   * Update avatar positions on minimap with enhanced visibility
   */
  private updateAvatars(): void {
    this.avatarGraphics.clear();
    
    this.gameState.avatars.forEach((avatar, userId) => {
      const isCurrentUser = this.gameState.currentUser?.id === userId;
      const color = isCurrentUser ? this.COLORS.AVATAR_SELF : this.COLORS.AVATAR_OTHER;
      
      const x = avatar.position.x * this.SCALE_FACTOR;
      const y = avatar.position.y * this.SCALE_FACTOR;
      const size = isCurrentUser ? 5 : 3.5;
      
      // Add outer glow for better visibility
      if (isCurrentUser) {
        this.avatarGraphics
          .circle(x, y, size + 4)
          .fill({ color: color, alpha: 0.2 });
        this.avatarGraphics
          .circle(x, y, size + 2)
          .fill({ color: color, alpha: 0.4 });
      }
      
      // Draw main avatar dot
      this.avatarGraphics
        .circle(x, y, size)
        .fill(color)
        .stroke({ width: 1.5, color: 0x000000, alpha: 0.8 });
      
      // Add bright center dot for current user
      if (isCurrentUser) {
        this.avatarGraphics
          .circle(x, y, size - 1.5)
          .fill(0xFFFFFF);
      }
    });
  }

  /**
   * Update viewport indicator showing current camera view
   */
  private updateViewportIndicator(): void {
    this.viewportIndicator.clear();
    
    const viewport = this.gameState.viewport;
    if (!viewport) return;
    
    // Calculate viewport bounds in minimap coordinates
    const viewportWidth = 800; // Default screen width
    const viewportHeight = 600; // Default screen height
    
    const scaledViewportWidth = (viewportWidth / viewport.zoom) * this.SCALE_FACTOR;
    const scaledViewportHeight = (viewportHeight / viewport.zoom) * this.SCALE_FACTOR;
    
    const x = viewport.x * this.SCALE_FACTOR - scaledViewportWidth / 2;
    const y = viewport.y * this.SCALE_FACTOR - scaledViewportHeight / 2;
    
    // Draw viewport rectangle
    this.viewportIndicator
      .rect(x, y, scaledViewportWidth, scaledViewportHeight)
      .stroke({ 
        width: 2, 
        color: this.COLORS.VIEWPORT, 
        alpha: 0.8 
      });
    
    // Add corner indicators
    const cornerSize = 4;
    this.viewportIndicator
      .rect(x - cornerSize/2, y - cornerSize/2, cornerSize, cornerSize)
      .fill(this.COLORS.VIEWPORT)
      .rect(x + scaledViewportWidth - cornerSize/2, y - cornerSize/2, cornerSize, cornerSize)
      .fill(this.COLORS.VIEWPORT)
      .rect(x - cornerSize/2, y + scaledViewportHeight - cornerSize/2, cornerSize, cornerSize)
      .fill(this.COLORS.VIEWPORT)
      .rect(x + scaledViewportWidth - cornerSize/2, y + scaledViewportHeight - cornerSize/2, cornerSize, cornerSize)
      .fill(this.COLORS.VIEWPORT);
  }

  /**
   * Set handler for avatar movement (left click)
   */
  public setAvatarMoveHandler(handler: (worldPosition: Position) => void): void {
    this.onMinimapMoveAvatar = handler;
  }

  /**
   * Set handler for camera movement (right click)
   */
  public setCameraMoveHandler(handler: (worldPosition: Position) => void): void {
    this.onMinimapMoveCamera = handler;
  }

  /**
   * Get the minimap container for adding to the stage
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * Set minimap position
   */
  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Set minimap visibility
   */
  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Get minimap dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return {
      width: this.MINIMAP_WIDTH,
      height: this.MINIMAP_HEIGHT
    };
  }

  /**
   * Refresh static map if map data changes
   */
  public refreshMap(): void {
    this.renderStaticMap();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.container.removeAllListeners();
    this.container.destroy();
  }
}