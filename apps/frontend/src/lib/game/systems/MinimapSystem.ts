import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameState, Position } from '@/types/game';
import { TileType } from '@/types/game';
import { TILE_SIZE } from '@/constants/game';
import type { TileMap } from '../TileMap';
import { logError, LogCategory } from '@/lib/utils/logger';
import { runMinimapDiagnostic, MinimapDiagnostic, type MinimapDiagnosticResult } from '@/lib/debug/minimapDiagnostic';
import type { District } from '@/lib/graphql';

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
  private districtGraphics!: Graphics;
  private districts: District[] = [];
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
    BORDER: 0x1A202C,
    
    // District colors
    DISTRICT_BORDER: 0xFFFFFF,
    DISTRICT_FILL: 0x000000
  };

  private onMinimapMoveAvatar?: (worldPosition: Position) => void;
  private onMinimapMoveCamera?: (worldPosition: Position) => void;

  constructor(tileMap: TileMap, gameState: GameState) {
    this.tileMap = tileMap;
    this.gameState = gameState;
    
    // Calculate scale factor based on actual district boundaries (0-192, 0-144 tiles)
    // This matches the backend district data which has maximum bounds of (192, 144)
    const ACTUAL_MAP_WIDTH = 192; // tiles - matches backend district bounds
    const ACTUAL_MAP_HEIGHT = 144; // tiles - matches backend district bounds

    this.SCALE_FACTOR = Math.min(
      this.MINIMAP_WIDTH / (ACTUAL_MAP_WIDTH * TILE_SIZE),
      this.MINIMAP_HEIGHT / (ACTUAL_MAP_HEIGHT * TILE_SIZE)
    );

    // Scale factor calculated silently
    
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
    
    // District graphics (district boundaries)
    this.districtGraphics = new Graphics();
    
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
    this.container.addChild(this.districtGraphics);
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
      } else if (button === 2) {
        // Right click: Move camera
        this.showClickFeedback(localPoint.x, localPoint.y, 'camera');
        if (this.onMinimapMoveCamera) {
          this.onMinimapMoveCamera(worldPosition);
        }
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
    
    // Get actual viewport dimensions dynamically
    let viewportWidth = 800; // Default fallback
    let viewportHeight = 600; // Default fallback
    
    // Try to get actual screen dimensions
    try {
      if (window.innerWidth && window.innerHeight) {
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;
      }
    } catch (e) {
      // Fallback to defaults if window is not available
    }
    
    // Calculate viewport bounds in minimap coordinates with proper zoom scaling
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
   * Render district boundaries on the minimap
   */
  public renderDistricts(districts: District[]): void {

    // Comprehensive validation
    if (!this.districtGraphics) {
      logError(LogCategory.MINIMAP, 'CRITICAL: districtGraphics not initialized!');
      return;
    }

    if (!districts || !Array.isArray(districts)) {
      logError(LogCategory.MINIMAP, 'CRITICAL: Invalid districts data', { districts });
      return;
    }

    if (districts.length === 0) {
      logError(LogCategory.MINIMAP, 'CRITICAL: Districts array is empty!');
      return;
    }

    // Store districts
    this.districts = districts;

    // Clear previous graphics
    this.districtGraphics.clear();

    districts.forEach((district, index) => {
      // Validate individual district
      if (!district.bounds) {
        logError(LogCategory.MINIMAP, `District ${index} missing bounds`, district);
        return;
      }

      // FIXED: Convert district bounds (from backend) to minimap coordinates
      // Districts from backend have bounds: { x1, y1, x2, y2 } in tile coordinates
      // We need to convert to world pixels first, then to minimap coordinates
      const worldX1 = district.bounds.x1 * 32; // TILE_SIZE = 32
      const worldY1 = district.bounds.y1 * 32;
      const worldX2 = district.bounds.x2 * 32;
      const worldY2 = district.bounds.y2 * 32;

      // Convert to minimap coordinates
      const miniX = worldX1 * this.SCALE_FACTOR;
      const miniY = worldY1 * this.SCALE_FACTOR;
      const miniWidth = (worldX2 - worldX1) * this.SCALE_FACTOR;
      const miniHeight = (worldY2 - worldY1) * this.SCALE_FACTOR;

      // Use different colors for each district
      const colors = [
        0xFF4444, 0x44FF44, 0x4444FF, 0xFFFF44,
        0xFF44FF, 0x44FFFF, 0xFFA500, 0x800080,
        0x008000, 0x800000, 0x000080, 0x808000,
        0x808080, 0xC0C0C0, 0xFFC0CB, 0x90EE90
      ];
      
      const districtColor = colors[index % colors.length];

      // Draw district boundary with validation
      try {
        this.districtGraphics
          .rect(miniX, miniY, miniWidth, miniHeight)
          .fill({ color: districtColor, alpha: 0.2 })
          .stroke({
            width: 2,
            color: districtColor,
            alpha: 0.8
          });

      } catch (error) {
        logError(LogCategory.MINIMAP, `Failed to draw district ${index + 1}`, error);
      }

      // Add district name if available
      if (district.name) {
        const nameStyle = new TextStyle({
          fontFamily: 'Arial',
          fontSize: 8,
          fill: 0xFFFFFF,
          fontWeight: 'bold',
          dropShadow: {
            color: 0x000000,
            blur: 1,
            alpha: 0.8,
            distance: 1
          }
        });

        const nameText = new Text({ 
          text: district.name, 
          style: nameStyle 
        });
        nameText.anchor.set(0.5, 0.5);
        nameText.x = miniX + miniWidth / 2;
        nameText.y = miniY + miniHeight / 2;
        
        try {
          this.districtGraphics.addChild(nameText);
        } catch (error) {
          logError(LogCategory.MINIMAP, `Failed to add text for district ${index + 1}`, error);
        }
      }
    });

  }

  /**
   * Run diagnostic on current minimap state
   */
  public async runDiagnostic(): Promise<MinimapDiagnosticResult> {

    const result = await runMinimapDiagnostic(this.districts as District[]);
    const diagnostic = MinimapDiagnostic.getInstance();
    diagnostic.logDiagnosticReport(result);

    return result;
  }

  /**
   * Complete debug session - run all debug functions
   */
  public debugSession() {

    // 1. Basic status
    const status = this.getStatus();

    // 2. Test rendering capability
    const canRender = this.testRendering();

    // 3. Force visual debug
    this.forceVisualDebug();

    // 4. Try to render districts if we have them
    if (this.districts && this.districts.length > 0) {
      this.renderDistricts(this.districts);
    }


    return {
      status,
      canRender,
      hasDistricts: !!(this.districts && this.districts.length > 0),
      districtCount: this.districts?.length || 0,
      debugRendered: true
    };
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
   * Test if minimap can render districts
   */
  public testRendering(): boolean {
    const canRender = !!(this.districtGraphics && this.districts && this.districts.length > 0);
    return canRender;
  }

  /**
   * Debug visual - render a simple test rectangle to confirm minimap works
   */
  public renderDebugRect(): void {
    if (!this.districtGraphics) {
      logError(LogCategory.MINIMAP, 'Cannot render debug rect - districtGraphics not initialized');
      return;
    }

    // Clear and render a bright test rectangle
    this.districtGraphics.clear();
    this.districtGraphics
      .rect(10, 10, 50, 30)
      .fill({ color: 0xFF0000, alpha: 0.8 })
      .stroke({ width: 2, color: 0xFFFFFF, alpha: 1.0 });

  }

  /**
   * Force visual debug - render test elements to confirm rendering pipeline
   */
  public forceVisualDebug(): void {
    if (!this.districtGraphics) {
      logError(LogCategory.MINIMAP, 'Cannot force visual debug - districtGraphics not initialized');
      return;
    }


    // Clear all
    this.districtGraphics.clear();

    // Render corner markers
    const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00];
    const positions = [
      { x: 5, y: 5, label: 'TL' },
      { x: this.MINIMAP_WIDTH - 15, y: 5, label: 'TR' },
      { x: 5, y: this.MINIMAP_HEIGHT - 15, label: 'BL' },
      { x: this.MINIMAP_WIDTH - 15, y: this.MINIMAP_HEIGHT - 15, label: 'BR' }
    ];

    positions.forEach((pos, index) => {
      this.districtGraphics
        .rect(pos.x, pos.y, 10, 10)
        .fill({ color: colors[index], alpha: 0.8 })
        .stroke({ width: 1, color: 0xFFFFFF });
    });

    // Render center cross
    const centerX = this.MINIMAP_WIDTH / 2;
    const centerY = this.MINIMAP_HEIGHT / 2;

    this.districtGraphics
      .rect(centerX - 1, centerY - 10, 2, 20)
      .fill({ color: 0xFFFFFF, alpha: 1.0 })
      .rect(centerX - 10, centerY - 1, 20, 2)
      .fill({ color: 0xFFFFFF, alpha: 1.0 });

    // Make sure it's visible
    this.container.visible = true;
    this.districtGraphics.visible = true;

  }

  /**
   * Get current minimap status for debugging
   */
  public getStatus() {
    return {
      initialized: !!this.container,
      hasDistrictGraphics: !!this.districtGraphics,
      districtsLoaded: !!(this.districts && this.districts.length > 0),
      districtCount: this.districts?.length || 0,
      visible: this.container?.visible || false,
      scaleFactor: this.SCALE_FACTOR,
      dimensions: {
        width: this.MINIMAP_WIDTH,
        height: this.MINIMAP_HEIGHT
      }
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.container.removeAllListeners();
    this.container.destroy();
  }
}
