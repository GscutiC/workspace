import { Application, Container } from 'pixi.js';
import type { GameState, Position, AvatarData, ObstacleInfo } from '@/types/game';
import { LayerType, Direction, UserStatus } from '@/types/game';
import { GAME_CONFIG, LAYER_CONFIG, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';
import { TileMap } from './TileMap';
import { MapFactory } from './MapFactory';
import { Viewport } from './Viewport';
import { MovementSystem } from './systems/MovementSystem';
import { RenderSystem } from './systems/RenderSystem';
import { InputSystem } from './systems/InputSystem';
import { ObjectPool } from './systems/ObjectPool';
import { MinimapSystem } from './systems/MinimapSystem';
import { MovementController } from './controllers/MovementController';

// Define interfaces for systems
interface GameSystem {
  update?(deltaTime: number, gameState: GameState): void;
  destroy?(): void;
}

/**
 * GameEngine is the core class that orchestrates all game systems
 * Manages the game loop, systems, and state
 */
export class GameEngine {
  private app: Application;
  private gameState: GameState;
  private layers: Map<LayerType, Container>;
  private systems: Map<string, GameSystem>;
  private tileMap!: TileMap;
  private viewport!: Viewport;
  private objectPool!: ObjectPool;
  private minimapSystem!: MinimapSystem;
  private movementController: MovementController | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private cullingEnabled: boolean = true;

  constructor() {
    // Initialize Pixi.js application
    this.app = new Application();

    // Initialize basic properties
    this.layers = new Map();
    this.systems = new Map();
    this.isRunning = false;
    this.lastFrameTime = 0;

    // Initialize game state
    this.gameState = this.createInitialState();
  }

  /**
   * Initialize the game engine with canvas
   */
  async init(canvas: HTMLCanvasElement): Promise<void> {
    // Initialize Pixi.js first
    await this.initializePixi(canvas);

    // Setup layers after Pixi.js is ready
    this.setupLayers();

    // Initialize systems after canvas is available (now with real parcels)
    await this.initializeSystems();
  }

  /**
   * Initialize Pixi.js application
   */
  private async initializePixi(canvas: HTMLCanvasElement): Promise<void> {
    await this.app.init({
      canvas,
      width: GAME_CONFIG.width,
      height: GAME_CONFIG.height,
      backgroundColor: GAME_CONFIG.backgroundColor,
      antialias: GAME_CONFIG.antialias,
      autoDensity: GAME_CONFIG.autoDensity,
      resolution: GAME_CONFIG.resolution,
    });

    // Enable sorting for layers
    this.app.stage.sortableChildren = true;
  }

  /**
   * Create initial game state
   */
  private createInitialState(): GameState {
    return {
      isInitialized: false,
      isRunning: false,
      avatars: new Map(),
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
        isDragging: false,
      },
      input: {
        keys: new Set(),
        mouse: {
          position: { x: 0, y: 0 },
          isDown: false,
        },
      },
      deltaTime: 0,
      lastFrameTime: 0,
    };
  }

  /**
   * Setup layer containers
   */
  private setupLayers(): void {
    Object.values(LayerType).forEach((layerType) => {
      if (typeof layerType === 'number') {
        const container = new Container();
        const config = LAYER_CONFIG[layerType];

        container.label = config.name;
        container.zIndex = config.zIndex;
        container.sortableChildren = true;

        this.layers.set(layerType, container);
        // Don't add to stage yet - will be added to world container in initializeSystems
        console.log(`🎭 Created layer: ${config.name} (z-index: ${config.zIndex})`);
      }
    });
  }

  /**
   * Initialize game systems with real parcels from API
   */
  private async initializeSystems(): Promise<void> {
    // Generate map data using MapFactory with real parcels
    console.log('🏗️ Loading real parcels from API for map generation...');
    const { tiles, obstacles, parcels } = await MapFactory.generateMapWithRealParcels('default');
    
    // Create tile map with real parcel data
    this.tileMap = new TileMap(
      {
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        tileSize: TILE_SIZE,
        tiles: tiles,
        obstacles: obstacles,
        collisionMap: [],
        walkableAreas: []
      },
      parcels
    );
    const worldBounds = this.tileMap.getWorldBounds();

    // Create a main world container that will hold all layers
    const worldContainer = new Container();
    worldContainer.name = 'WorldContainer';
    
    // Add all layers to the world container instead of directly to stage
    this.layers.forEach((layer, layerType) => {
      worldContainer.addChild(layer);
      console.log(`🌍 Added layer ${LayerType[layerType]} to world container`);
    });
    
    // Add the world container to the stage
    this.app.stage.addChild(worldContainer);
    console.log('🌍 World container added to stage');

    // Create viewport with the world container
    this.viewport = new Viewport(worldContainer, worldBounds);
    console.log('📷 Viewport created with world container');

    // Add tilemap to the floor layer
    const floorLayer = this.layers.get(LayerType.FLOOR)!;
    const tilemapVisuals = this.tileMap.createVisuals();
    floorLayer.addChild(tilemapVisuals);
    console.log('🗺️ Tilemap added to floor layer');

    // Initialize object pool
    this.objectPool = new ObjectPool();

    // Initialize game systems
    this.systems.set('input', new InputSystem(this.app.canvas, this.gameState));
    this.systems.set('movement', new MovementSystem(this.gameState, this.tileMap));
    this.systems.set('render', new RenderSystem(this.layers, this.objectPool, this.viewport));

    // Initialize minimap system
    this.minimapSystem = new MinimapSystem(this.tileMap, this.gameState);
    this.systems.set('minimap', this.minimapSystem);

    // Add minimap to stage (UI layer, not affected by viewport)
    this.setupMinimap();

    // Initialize Movement Controller
    const movementSystem = this.systems.get('movement') as MovementSystem;
    const renderSystem = this.systems.get('render') as RenderSystem;
    this.movementController = new MovementController(movementSystem, renderSystem, this.gameState);

    // Setup minimap navigation
    this.setupMinimapNavigation();

    // Connect input events
    this.setupInputHandlers();

    // Show parcel numbers by default to help with identification
    console.log('🏗️ Enabling parcel numbers by default for better navigation');
    this.tileMap.toggleParcels();
  }

  /**
   * Setup minimap navigation with separate avatar and camera controls
   */
  private setupMinimapNavigation(): void {
    // Left click: Move avatar
    this.minimapSystem.setAvatarMoveHandler((worldPosition: Position) => {
      if (!this.gameState.currentUser) return;
      
      console.log('🗺️ Moving avatar via minimap to:', worldPosition);
      
      // Use MovementController for avatar movement
      if (this.movementController) {
        this.movementController.handleMouseMovement(worldPosition, this.gameState.currentUser.id);
      }
    });

    // Right click: Move camera
    this.minimapSystem.setCameraMoveHandler((worldPosition: Position) => {
      console.log('🗺️ Moving camera via minimap to:', worldPosition);
      
      // Move camera to clicked position
      this.viewport.moveTo(worldPosition, true);
    });
  }

  /**
   * Setup minimap positioning and add to stage
   */
  private setupMinimap(): void {
    const minimapContainer = this.minimapSystem.getContainer();
    
    // Position minimap above Connected Users panel (bottom-left area)
    const padding = 20;
    const connectedUsersPanelHeight = 140; // Approximate height of Connected Users panel
    
    minimapContainer.x = padding; // Left side with padding
    minimapContainer.y = GAME_CONFIG.height - this.minimapSystem.getDimensions().height - connectedUsersPanelHeight - padding;
    
    // Set high z-index to appear above everything
    minimapContainer.zIndex = 1000;
    
    // Add to stage (not to world container, so it's always visible)
    this.app.stage.addChild(minimapContainer);
    
    console.log('🗺️ Minimap added to stage at position:', minimapContainer.x, minimapContainer.y);
  }

  /**
   * Setup input event handlers
   */
  private setupInputHandlers(): void {
    const inputSystem = this.systems.get('input') as InputSystem;

    // Mouse events for camera movement
    inputSystem.onMouseDown = (position: Position) => {
      this.viewport.startDrag(position);
    };

    inputSystem.onMouseMove = (position: Position) => {
      if (this.gameState.viewport.isDragging) {
        this.viewport.updateDrag(position);
      }
    };

    inputSystem.onMouseUp = () => {
      this.viewport.stopDrag();
    };

    // Mouse click for movement (left click only)
    inputSystem.onLeftClick = (position: Position) => {
      console.log('� GameEngine received LEFT click at:', position);
      
      if (!this.gameState.currentUser) {
        console.error('❌ No current user set!');
        return;
      }
      
      if (!this.movementController) {
        console.error('❌ MovementController not initialized!');
        return;
      }
      
      console.log('👤 Moving avatar for user:', this.gameState.currentUser.id);

      const worldPos = this.viewport.screenToWorld(position);
      console.log('🌍 Avatar moving to world position:', worldPos);
      
      // Use MovementController for avatar movement
      this.movementController.handleMouseMovement(worldPos, this.gameState.currentUser.id);
    };

    // Right click for camera movement
    inputSystem.onRightClick = (position: Position) => {
      console.log('👆 GameEngine received RIGHT click at:', position);
      
      const worldPos = this.viewport.screenToWorld(position);
      console.log('🎥 Moving camera to world position:', worldPos);
      
      // Move camera to clicked position
      this.viewport.moveTo(worldPos, true);
    };

    // Keep general click handler for backward compatibility
    inputSystem.onMouseClick = (position: Position) => {
      console.log('🖱️ GameEngine received general mouse click at:', position);
      // General click handling can be added here if needed
    };

    // Mouse wheel for zoom
    inputSystem.onMouseWheel = (delta: number, position: Position) => {
      this.viewport.zoomBy(delta * 0.1, position);
    };

    // Keyboard movement
    inputSystem.onKeyPress = (key: string) => {
      if (!this.gameState.currentUser) return;
      
      if (!this.movementController) {
        console.error('❌ MovementController not initialized!');
        return;
      }

      // Use MovementController for keyboard movement
      this.movementController.handleKeyboardMovement(key, this.gameState.currentUser.id);
    };
  }

  /**
   * Start the game engine
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.gameState.isRunning = true;
    this.gameState.isInitialized = true;
    this.lastFrameTime = performance.now();

    // Start the game loop
    this.app.ticker.add(this.update.bind(this));
  }

  /**
   * Stop the game engine
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.gameState.isRunning = false;

    // Stop the game loop
    this.app.ticker.remove(this.update.bind(this));
  }

  /**
   * Main game update loop
   */
  private update(): void {
    const currentTime = performance.now();
    this.gameState.deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.gameState.lastFrameTime = currentTime;
    this.lastFrameTime = currentTime;

    // Update viewport
    this.viewport.update(this.gameState.deltaTime);

    // Update all systems
    this.systems.forEach((system, name) => {
      if (system.update) {
        system.update(this.gameState.deltaTime, this.gameState);
      }
    });

    // Update viewport state in game state
    this.gameState.viewport = this.viewport.getState();
  }

  /**
   * Add user to the game
   */
  public addUser(userData: Omit<AvatarData, 'position' | 'direction'>): AvatarData {
    console.log(`🧑 Adding user: ${userData.name} (${userData.id})`);
    
    // Find a spawn position
    const spawnPosition = this.findSpawnPosition();

    const avatar: AvatarData = {
      ...userData,
      position: spawnPosition,
      direction: Direction.DOWN,
      status: UserStatus.AVAILABLE,
    };

    this.gameState.avatars.set(avatar.id, avatar);

    // Create visual representation
    const renderSystem = this.systems.get('render') as RenderSystem;
    if (renderSystem) {
      renderSystem.createAvatar(avatar);
      console.log(`✅ User ${userData.name} added successfully at (${spawnPosition.x}, ${spawnPosition.y})`);
    } else {
      console.error('❌ RenderSystem not available!');
    }

    return avatar;
  }

  /**
   * Remove user from the game
   */
  public removeUser(userId: string): void {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return;

    // Remove from game state
    this.gameState.avatars.delete(userId);

    // Remove visual representation
    const renderSystem = this.systems.get('render') as RenderSystem;
    renderSystem.removeAvatar(userId);
  }

  /**
   * Set current user (the player)
   */
  public setCurrentUser(userId: string): void {
    const avatar = this.gameState.avatars.get(userId);
    if (avatar) {
      this.gameState.currentUser = avatar;
      console.log(`👤 Current user set: ${avatar.name}`);
      
      // Center camera on user
      this.viewport.moveTo(avatar.position, true);
      console.log(`📷 Camera centered on user at (${avatar.position.x}, ${avatar.position.y})`);
    } else {
      console.error('❌ Avatar not found for user:', userId);
    }
  }

  /**
   * Move avatar to position
   */
  public moveAvatar(userId: string, targetPosition: Position): void {
    console.log('🎯 Moving avatar', userId, 'to position:', targetPosition);
    
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) {
      console.error('❌ Avatar not found:', userId);
      return;
    }
    
    console.log('📍 Current avatar position:', avatar.position);
    
    const movementSystem = this.systems.get('movement') as MovementSystem;
    const success = movementSystem.moveToPosition(userId, targetPosition);
    
    console.log('✅ Movement system response:', success);
  }

  /**
   * Update avatar status
   */
  public updateAvatarStatus(userId: string, status: UserStatus): void {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return;

    avatar.status = status;

    // Update visual representation
    const renderSystem = this.systems.get('render') as RenderSystem;
    renderSystem.updateAvatarStatus(userId, status);
  }

  /**
   * Send chat message
   */
  public sendChatMessage(userId: string, message: string): void {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return;

    avatar.lastMessage = {
      id: Date.now().toString(),
      content: message,
      timestamp: new Date(),
      author: {
        id: userId,
        name: avatar.name,
      },
    };

    // Show chat bubble
    const renderSystem = this.systems.get('render') as RenderSystem;
    renderSystem.showChatBubble(userId, message);
  }

  /**
   * Get current game state
   */
  public getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Get avatar data
   */
  public getAvatar(userId: string): AvatarData | undefined {
    return this.gameState.avatars.get(userId);
  }

  /**
   * Get all avatars
   */
  public getAllAvatars(): AvatarData[] {
    return Array.from(this.gameState.avatars.values());
  }

  /**
   * Find available spawn position
   */
  private findSpawnPosition(): Position {
    const worldBounds = this.tileMap.getWorldBounds();
    
    // For debugging, let's spawn closer to the center initially
    const centerPosition = {
      x: worldBounds.width / 2,
      y: worldBounds.height / 2,
    };
    
    console.log('🏠 Using center spawn position:', centerPosition, 'world bounds:', worldBounds);
    
    // Simple validation - if center is walkable, use it
    if (this.tileMap.isWalkable(centerPosition)) {
      return centerPosition;
    }
    
    // Try positions near center if center is not walkable
    const maxAttempts = 20;
    const searchRadius = 100; // Search within 100 pixels of center
    
    for (let i = 0; i < maxAttempts; i++) {
      const position: Position = {
        x: centerPosition.x + (Math.random() - 0.5) * searchRadius,
        y: centerPosition.y + (Math.random() - 0.5) * searchRadius,
      };

      if (this.tileMap.isWalkable(position)) {
        console.log('🏠 Spawn position found near center:', position);
        return position;
      }
    }
    
    console.log('🏠 Using fallback center position (may not be walkable):', centerPosition);
    return centerPosition;
  }

  /**
   * Resize the game
   */
  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);

    // Only resize viewport if it's initialized
    if (this.viewport) {
      // Update viewport configuration
      this.viewport.setConfig({
        worldWidth: width,
        worldHeight: height,
      });
    }

    // Reposition minimap if it exists
    if (this.minimapSystem) {
      const padding = 20;
      const connectedUsersPanelHeight = 140; // Approximate height of Connected Users panel
      const minimapContainer = this.minimapSystem.getContainer();
      
      minimapContainer.x = padding; // Left side with padding
      minimapContainer.y = height - this.minimapSystem.getDimensions().height - connectedUsersPanelHeight - padding;
    }
  }

  /**
   * Toggle debug mode
   */
  public toggleDebugMode(): void {
    this.tileMap.toggleDebug();
  }

  /**
   * Toggle parcel numbering overlay
   */
  public toggleParcels(): void {
    this.tileMap.toggleParcels();
  }

  /**
   * Get Pixi.js application
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Get viewport
   */
  public getViewport(): Viewport {
    return this.viewport;
  }

  /**
   * Get tile map
   */
  public getTileMap(): TileMap {
    return this.tileMap;
  }

  /**
   * Get minimap system
   */
  public getMinimapSystem(): MinimapSystem {
    return this.minimapSystem;
  }

  /**
   * Debug: Get comprehensive game state information
   */
  public getDebugInfo(): {
    gameState: {
      isInitialized: boolean;
      isRunning: boolean;
      avatarCount: number;
      currentUser: string;
      viewport: unknown;
    };
    layers: Record<string, {
      children: number;
      visible: boolean;
      alpha: number;
      x: number;
      y: number;
      scale: { x: number; y: number };
      bounds: unknown;
    }>;
    systems: {
      available: string[];
      renderSystem: boolean;
      movementSystem: boolean;
      inputSystem: boolean;
    };
    avatars: Array<{
      id: string;
      name: string;
      position: Position;
      direction: string;
      status: string;
    }>;
    worldContainer: {
      name: string;
      children: number;
      visible: boolean;
      alpha: number;
      x: number;
      y: number;
      scale: { x: number; y: number };
      bounds: unknown;
    } | null;
    characterLayer: {
      children: Array<{
        index: number;
        name: string;
        visible: boolean;
        alpha: number;
        x: number;
        y: number;
        bounds: unknown;
      }>;
    } | null;
  } {
    const debugInfo = {
      gameState: {
        isInitialized: this.gameState.isInitialized,
        isRunning: this.gameState.isRunning,
        avatarCount: this.gameState.avatars.size,
        currentUser: this.gameState.currentUser?.id || 'none',
        viewport: this.gameState.viewport
      },
      layers: {} as Record<string, {
        children: number;
        visible: boolean;
        alpha: number;
        x: number;
        y: number;
        scale: { x: number; y: number };
        bounds: unknown;
      }>,
      systems: {
        available: Array.from(this.systems.keys()),
        renderSystem: !!this.systems.get('render'),
        movementSystem: !!this.systems.get('movement'),
        inputSystem: !!this.systems.get('input')
      },
      avatars: [] as Array<{
        id: string;
        name: string;
        position: Position;
        direction: string;
        status: string;
      }>,
      worldContainer: null as {
        name: string;
        children: number;
        visible: boolean;
        alpha: number;
        x: number;
        y: number;
        scale: { x: number; y: number };
        bounds: unknown;
      } | null,
      characterLayer: null as {
        children: Array<{
          index: number;
          name: string;
          visible: boolean;
          alpha: number;
          x: number;
          y: number;
          bounds: unknown;
        }>;
      } | null
    };

    // Get layer information
    this.layers.forEach((layer, type) => {
      debugInfo.layers[LayerType[type]] = {
        children: layer.children.length,
        visible: layer.visible,
        alpha: layer.alpha,
        x: layer.x,
        y: layer.y,
        scale: { x: layer.scale.x, y: layer.scale.y },
        bounds: layer.getBounds()
      };
    });

    // Get avatar information
    this.gameState.avatars.forEach((avatar) => {
      debugInfo.avatars.push({
        id: avatar.id,
        name: avatar.name,
        position: avatar.position,
        direction: Direction[avatar.direction],
        status: avatar.status // UserStatus ya es string, no necesita conversión
      });
    });

    // Get world container info
    if (this.app.stage.children.length > 0) {
      const worldContainer = this.app.stage.children[0];
      debugInfo.worldContainer = {
        name: worldContainer.name,
        children: worldContainer.children.length,
        visible: worldContainer.visible,
        alpha: worldContainer.alpha,
        x: worldContainer.x,
        y: worldContainer.y,
        scale: { x: worldContainer.scale.x, y: worldContainer.scale.y },
        bounds: worldContainer.getBounds()
      };
    }

    // Get character layer specific info
    const characterLayer = this.layers.get(LayerType.CHARACTERS);
    if (characterLayer) {
      debugInfo.characterLayer = {
        children: characterLayer.children.map((child, index) => ({
          index,
          name: child.name || child.constructor.name,
          visible: child.visible,
          alpha: child.alpha,
          x: child.x,
          y: child.y,
          bounds: child.getBounds()
        }))
      };
    }

    return debugInfo;
  }

  /**
   * Get layer container
   */
  public getLayer(layerType: LayerType): Container | undefined {
    return this.layers.get(layerType);
  }

  /**
   * Debug methods for troubleshooting map and avatar issues
   */
  public enableDebugMode(enabled: boolean = true): void {
    const renderSystem = this.systems.get('render') as RenderSystem;
    if (renderSystem) {
      renderSystem.setDebugMode(enabled);
    }
    console.log(`🐛 GameEngine debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  public toggleCulling(enabled?: boolean): void {
    const renderSystem = this.systems.get('render') as RenderSystem;
    if (renderSystem) {
      const newState = enabled !== undefined ? enabled : !this.cullingEnabled;
      renderSystem.setCullingEnabled(newState);
      this.cullingEnabled = newState;
    }
  }

  public setCullingMargin(margin: number): void {
    const renderSystem = this.systems.get('render') as RenderSystem;
    if (renderSystem) {
      renderSystem.setCullingMargin(margin);
    }
  }

  public getRenderStats(): {
    culling: { total: number; visible: number; hidden: number };
    viewport: { x: number; y: number; width: number; height: number };
    avatars: Array<{ id: string; name: string; position: { x: number; y: number } }>;
  } | null {
    const renderSystem = this.systems.get('render') as RenderSystem;
    if (renderSystem) {
      return {
        culling: renderSystem.getCullingStats(),
        viewport: this.viewport.getVisibleBounds(),
        avatars: Array.from(this.gameState.avatars.values()).map(a => ({
          id: a.id,
          name: a.name,
          position: a.position
        }))
      };
    }
    return null;
  }

  /**
   * Debug method to list all visible elements and their properties
   */
  public debugVisibleElements(): void {
    console.log('🔍 Debugging visible elements...');
    
    // Check all layers
    this.layers.forEach((layer, layerType) => {
      console.log(`📚 Layer ${LayerType[layerType]}:`, {
        children: layer.children.length,
        visible: layer.visible,
        alpha: layer.alpha
      });
      
      // Recursively check children
      this.debugContainerChildren(layer, `  ${LayerType[layerType]}`);
    });

    // Check minimap
    if (this.minimapSystem) {
      console.log('🗺️ Minimap elements:');
      const minimapContainer = this.minimapSystem.getContainer();
      this.debugContainerChildren(minimapContainer, '  Minimap');
    }
  }

  /**
   * Helper to debug container children recursively
   */
  private debugContainerChildren(container: Container, prefix: string): void {
    container.children?.forEach((child: Container, index: number) => {
      const info = {
        type: child.constructor.name,
        visible: child.visible,
        alpha: child.alpha,
        position: { x: child.x, y: child.y },
        tint: child.tint,
        name: child.name
      };
      
      // Check for pink/magenta colors (common hex values)
      const isPink = child.tint === 0xFF00FF || child.tint === 0xFF69B4 || 
                    child.tint === 0xFFC0CB || child.tint === 0xFF1493;
      
      if (isPink || child.name?.includes('pink') || child.name?.includes('marker')) {
        console.log(`🎯 POTENTIAL PINK ELEMENT: ${prefix}[${index}]`, info);
      } else if (child.visible && child.alpha > 0) {
        console.log(`${prefix}[${index}]`, info);
      }
      
      // Recursively check children
      if (child.children?.length > 0) {
        this.debugContainerChildren(child, `${prefix}  `);
      }
    });
  }

  /**
   * Hide elements by name pattern or type
   */
  public hideElementsByPattern(pattern: string): number {
    let hiddenCount = 0;
    
    this.layers.forEach((layer, layerType) => {
      hiddenCount += this.hideElementsInContainer(layer, pattern);
    });

    // Also check minimap
    if (this.minimapSystem) {
      const minimapContainer = this.minimapSystem.getContainer();
      hiddenCount += this.hideElementsInContainer(minimapContainer, pattern);
    }

    console.log(`🙈 Hidden ${hiddenCount} elements matching pattern: "${pattern}"`);
    return hiddenCount;
  }

  /**
   * Helper to hide elements in a container
   */
  private hideElementsInContainer(container: Container, pattern: string): number {
    let hiddenCount = 0;
    
    container.children?.forEach((child: Container) => {
      const name = child.name || '';
      const type = child.constructor.name || '';
      
      if (name.toLowerCase().includes(pattern.toLowerCase()) || 
          type.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`🙈 Hiding element: ${name} (${type})`);
        child.visible = false;
        hiddenCount++;
      }
      
      // Recursively check children
      if (child.children?.length > 0) {
        hiddenCount += this.hideElementsInContainer(child, pattern);
      }
    });
    
    return hiddenCount;
  }

  /**
   * Toggle area visualization (color-coded by category)
   */
  public toggleAreaVisualization(show: boolean = true): void {
    this.tileMap.toggleAreaVisualization(show);
    console.log(`🎨 Area visualization ${show ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle obstacle visualization with markers
   */
  public toggleObstacleVisualization(show: boolean = true): void {
    this.tileMap.visualizeObstacles(show);
    console.log(`🏢 Obstacle visualization ${show ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get obstacle information at position
   */
  public getObstacleAt(worldX: number, worldY: number): ObstacleInfo | null {
    const tileX = Math.floor(worldX / 32);
    const tileY = Math.floor(worldY / 32);
    
    const obstacles = this.tileMap.getObstaclesInArea({
      x: tileX, y: tileY, width: 1, height: 1
    });
    
    return obstacles.length > 0 ? obstacles[0] : null;
  }

  /**
   * Get area information at position
   */
  public getAreaInfo(worldX: number, worldY: number): {
    position: { x: number; y: number };
    category: string | null;
    isWalkable: boolean;
    isStreet: boolean;
    obstacles: ObstacleInfo[];
  } {
    const tileX = Math.floor(worldX / 32);
    const tileY = Math.floor(worldY / 32);
    
    return {
      position: { x: tileX, y: tileY },
      category: this.tileMap.getTileCategory(tileX, tileY),
      isWalkable: this.tileMap.isWalkable({ x: worldX, y: worldY }),
      isStreet: this.tileMap.isWalkableArea(tileX, tileY),
      obstacles: this.tileMap.getObstaclesInArea({
        x: tileX - 1, y: tileY - 1, width: 3, height: 3
      })
    };
  }

  /**
   * Cleanup and destroy the engine
   */
  public destroy(): void {
    this.stop();

    // Destroy all systems
    this.systems.forEach((system) => {
      if (system.destroy) {
        system.destroy();
      }
    });

    // Destroy components
    this.tileMap.destroy();
    this.viewport.destroy();
    this.objectPool.destroy();

    // Destroy layers
    this.layers.forEach((layer) => layer.destroy());
    this.layers.clear();

    // Destroy Pixi.js application
    this.app.destroy(true);
  }
}