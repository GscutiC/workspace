import { Application, Container } from 'pixi.js';
import type { GameState, Position, AvatarData } from '@/types/game';
import { LayerType, Direction, UserStatus } from '@/types/game';
import { GAME_CONFIG, LAYER_CONFIG, TILE_SIZE } from '@/constants/game';
import { TileMap } from './TileMap';
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

    // Initialize systems after canvas is available
    this.initializeSystems();
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
   * Initialize game systems
   */
  private initializeSystems(): void {
    // Create tile map
    this.tileMap = new TileMap();
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
    this.systems.set('render', new RenderSystem(this.layers, this.objectPool));

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

    // Mouse click for movement
    inputSystem.onMouseClick = (position: Position) => {
      console.log('🖱️ GameEngine received mouse click at:', position);
      
      if (!this.gameState.currentUser) {
        console.error('❌ No current user set!');
        return;
      }
      
      if (!this.movementController) {
        console.error('❌ MovementController not initialized!');
        return;
      }
      
      console.log('👤 Current user:', this.gameState.currentUser.id);

      const worldPos = this.viewport.screenToWorld(position);
      console.log('🌍 Converted to world position:', worldPos);
      
      // Use MovementController for mouse movement
      this.movementController.handleMouseMovement(worldPos, this.gameState.currentUser.id);
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
    this.systems.forEach((system) => {
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
    const maxAttempts = 50;

    // Add safety margin from walls (2 tiles = 64 pixels)
    const safetyMargin = TILE_SIZE * 2; // 64 pixels

    for (let i = 0; i < maxAttempts; i++) {
      const position: Position = {
        x: Math.random() * (worldBounds.width - safetyMargin * 2) + safetyMargin,
        y: Math.random() * (worldBounds.height - safetyMargin * 2) + safetyMargin,
      };

      if (this.tileMap.isWalkable(position)) {
        console.log('🏠 Spawn position found:', position, 'world bounds:', worldBounds);
        return position;
      }
    }

    // Fallback to center if no position found
    const centerPosition = {
      x: worldBounds.width / 2,
      y: worldBounds.height / 2,
    };
    
    console.log('🏠 Using fallback center position:', centerPosition);
    return centerPosition;
  }

  /**
   * Resize the game
   */
  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);

    // Update viewport configuration
    this.viewport.setConfig({
      worldWidth: width,
      worldHeight: height,
    });

    // Reposition minimap
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