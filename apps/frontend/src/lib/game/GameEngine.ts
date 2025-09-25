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
import { DistrictSystem } from './DistrictSystem';
import type { ParcelInfo } from './generators/CityGenerator';

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
  private districtSystem: DistrictSystem | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private cullingEnabled: boolean = true;
  private frameCount: number = 0; // Debug counter

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
    try {
      // Initialize Pixi.js first
      await this.initializePixi(canvas);
      // Setup layers after Pixi.js is ready
      this.setupLayers();

      // Initialize systems after canvas is available (now with real parcels)
      await this.initializeSystems();

    } catch (error) {
      console.error('❌ GameEngine initialization failed:', error);
      if (error instanceof Error) {
        console.error('❌ Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Initialize Pixi.js application - IMPROVED for robustness
   */
  private async initializePixi(canvas: HTMLCanvasElement): Promise<void> {
    try {

      await this.app.init({
        canvas,
        width: GAME_CONFIG.width,
        height: GAME_CONFIG.height,
        backgroundColor: GAME_CONFIG.backgroundColor,
        antialias: GAME_CONFIG.antialias,
        autoDensity: GAME_CONFIG.autoDensity,
        resolution: GAME_CONFIG.resolution,
      });

      // ✅ Verify initialization was successful
      if (!this.app.stage) {
        throw new Error('Pixi.js stage not initialized properly');
      }

      if (!this.app.renderer) {
        throw new Error('Pixi.js renderer not initialized properly');
      }

      // Enable sorting for layers
      this.app.stage.sortableChildren = true;



    } catch (error) {
      console.error('❌ Failed to initialize Pixi.js:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Pixi.js initialization failed: ${message}`);
    }
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

      }
    });
  }

  /**
   * Initialize game systems with real parcels from API - IMPROVED with detailed logging
   */
  private async initializeSystems(): Promise<void> {
    try {
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

    // Create a main world container that will hold all layers - IMPROVED
    const worldContainer = new Container();
    worldContainer.name = 'WorldContainer';
    worldContainer.sortableChildren = true;

    // ✅ Verify stage is ready before adding containers
    if (!this.app.stage) {
      throw new Error('Pixi.js stage is not available for world container');
    }

    // Add all layers to the world container with proper z-index ordering
    this.layers.forEach((layer, layerType) => {
      layer.sortableChildren = true;
      layer.zIndex = layerType; // Use enum values as z-index
      worldContainer.addChild(layer);
    });

    // Add the world container to the stage with verification
    try {
      this.app.stage.addChild(worldContainer);
    } catch (error) {
      console.error('❌ Failed to add world container to stage:', error);
      throw error;
    }

    // Create viewport with the world container
    this.viewport = new Viewport(worldContainer, worldBounds);
    
    // Center the viewport to show the map optimally
    this.viewport.centerOnMap();

    // Add tilemap to the floor layer
    const floorLayer = this.layers.get(LayerType.FLOOR)!;
    const tilemapVisuals = this.tileMap.createVisuals();
    floorLayer.addChild(tilemapVisuals);

    // Add parcel containers to appropriate layers
    const objectLayer = this.layers.get(LayerType.OBJECTS)!;
    const parcelContainer = this.tileMap.getParcelContainer();
    objectLayer.addChild(parcelContainer);

    // Enable parcel visibility by default
    this.tileMap.toggleParcelVisibility();

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
    this.tileMap.toggleParcelVisibility();

    // CRÍTICO: Marcar sistemas como inicializados para permitir conexión con DistrictSystem
    this.gameState.isInitialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize game systems:', error);
      if (error instanceof Error) {
        console.error('❌ Error in initializeSystems:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Setup minimap navigation with separate avatar and camera controls
   */
  private setupMinimapNavigation(): void {
    // Left click: Move avatar
    this.minimapSystem.setAvatarMoveHandler((worldPosition: Position) => {
      if (!this.gameState.currentUser) return;
      
      
      // Use MovementController for avatar movement
      if (this.movementController) {
        this.movementController.handleMouseMovement(worldPosition, this.gameState.currentUser.id);
      }
    });

    // Right click: Move camera
    this.minimapSystem.setCameraMoveHandler((worldPosition: Position) => {
      
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

    // Left click for camera movement (drag map)
    inputSystem.onLeftClick = (position: Position) => {
      
      const worldPos = this.viewport.screenToWorld(position);
      
      // Move camera to clicked position
      this.viewport.moveTo(worldPos, true);
    };

    // Right click for avatar movement
    inputSystem.onRightClick = (position: Position) => {
      
      if (!this.gameState.currentUser) {
        console.error('❌ No current user set!');
        return;
      }
      
      if (!this.movementController) {
        console.error('❌ MovementController not initialized!');
        return;
      }
      

      const worldPos = this.viewport.screenToWorld(position);
      
      // Use MovementController for avatar movement
      this.movementController.handleMouseMovement(worldPos, this.gameState.currentUser.id);
    };

    // Keep general click handler for backward compatibility
    inputSystem.onMouseClick = (position: Position) => {
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
    
    // Emit event for components that need the GameEngine reference
    const gameEngineReadyEvent = new CustomEvent('gameEngineReady', { detail: this });
    window.dispatchEvent(gameEngineReadyEvent);
    
    // Ensure ticker is started
    if (!this.app.ticker.started) {
      this.app.ticker.start();
    }
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
  public addUser(userData: Omit<AvatarData, 'position' | 'direction'>, customPosition?: { x: number; y: number }): AvatarData {
    
    // Use custom position if provided, otherwise find a spawn position
    const spawnPosition = customPosition || this.findSpawnPosition();

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
      
      // Center camera on user with immediate positioning
      this.viewport.moveTo(avatar.position, true);
      
      // Force viewport to update immediately
      setTimeout(() => {
        this.viewport.moveTo(avatar.position, true);
      }, 100);
      
    } else {
      console.error('❌ Avatar not found for user:', userId);
    }
  }

  /**
   * Get current user (the player)
   */
  public getCurrentUser(): AvatarData | null {
    return this.gameState.currentUser || null;
  }

  /**
   * Move avatar to position
   */
  public moveAvatar(userId: string, targetPosition: Position): void {
    
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) {
      console.error('❌ Avatar not found:', userId);
      return;
    }
    
    
    const movementSystem = this.systems.get('movement') as MovementSystem;
    const success = movementSystem.moveToPosition(userId, targetPosition);
    
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
   * Get the parcel where a specific avatar is located
   */
  public getAvatarParcel(userId: string): ParcelInfo | undefined {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return undefined;
    
    return this.tileMap.getParcelAtPosition(avatar.position.x, avatar.position.y);
  }

  /**
   * Get the parcel where the current user is located
   */
  public getCurrentUserParcel(): ParcelInfo | undefined {
    if (!this.gameState.currentUser) {
      return undefined;
    }
    
    const result = this.getAvatarParcel(this.gameState.currentUser.id);
    return result;
  }

  /**
   * Get parcel at specific world coordinates
   */
  public getParcelAtPosition(x: number, y: number): ParcelInfo | undefined {
    return this.tileMap.getParcelAtPosition(x, y);
  }

  /**
   * Get all parcels
   */
  public getAllParcels(): ParcelInfo[] {
    return this.tileMap.getParcels();
  }

  /**
   * Get parcel at screen coordinates (mouse position)
   */
  public getParcelAtScreenPosition(screenX: number, screenY: number): ParcelInfo | undefined {
    const worldPos = this.viewport.screenToWorld({ x: screenX, y: screenY });
    return this.tileMap.getParcelAtPosition(worldPos.x, worldPos.y);
  }

  /**
   * Debug function to analyze parcel migration status
   */
  public debugParcelMigration(): {
    totalParcels: number;
    migratedParcels: number;
    originalParcels: number;
    validParcels: number;
    invalidParcels: number;
    parcelSummary: any[];
  } {
    const allParcels = this.getAllParcels();
    
    const migratedParcels = allParcels.filter(p => 
      p.configSnapshot && p.configSnapshot.includes('api-migrated')
    );
    
    const originalParcels = allParcels.filter(p => 
      p.configSnapshot && p.configSnapshot.includes('api-loaded') && !p.configSnapshot.includes('migrated')
    );
    
    const parcelSummary = allParcels.map(parcel => {
      let config = null;
      try {
        config = JSON.parse(parcel.configSnapshot || '{}');
      } catch (e) {
        config = { error: 'Failed to parse config' };
      }
      
      return {
        number: parcel.number,
        position: { x: parcel.x, y: parcel.y },
        size: { width: parcel.width, height: parcel.height },
        type: parcel.type,
        source: config.source || 'unknown',
        migrated: config.migration?.applied || false,
        validPosition: config.validation?.isValid !== false
      };
    });
    
    const validParcels = parcelSummary.filter(p => p.validPosition).length;
    const invalidParcels = parcelSummary.filter(p => !p.validPosition).length;
    
    const result = {
      totalParcels: allParcels.length,
      migratedParcels: migratedParcels.length,
      originalParcels: originalParcels.length,
      validParcels,
      invalidParcels,
      parcelSummary
    };
    
    
    return result;
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
    
    
    // Check if center is available (walkable and no other avatars)
    if (this.isPositionAvailable(centerPosition)) {
      return centerPosition;
    }
    
    // Try positions near center if center is not available
    const maxAttempts = 50;
    const searchRadius = 200; // Search within 200 pixels of center
    
    for (let i = 0; i < maxAttempts; i++) {
      const position: Position = {
        x: centerPosition.x + (Math.random() - 0.5) * searchRadius,
        y: centerPosition.y + (Math.random() - 0.5) * searchRadius,
      };

      if (this.isPositionAvailable(position)) {
        return position;
      }
    }
    
    // If nothing found, try expanding search
    for (let i = 0; i < maxAttempts; i++) {
      const position: Position = {
        x: centerPosition.x + (Math.random() - 0.5) * 400, // Wider search
        y: centerPosition.y + (Math.random() - 0.5) * 400,
      };

      if (this.isPositionAvailable(position)) {
        return position;
      }
    }
    
    console.warn('🏠 No available spawn position found, using fallback center:', centerPosition);
    return centerPosition;
  }

  /**
   * Check if a position is available (walkable and no other avatars nearby)
   */
  private isPositionAvailable(position: Position): boolean {
    // First check if position is walkable
    if (!this.tileMap.isWalkable(position)) {
      return false;
    }

    // Check if any existing avatar is too close to this position
    const minDistance = 64; // Minimum distance between avatars (2 tiles)
    
    for (const avatar of this.gameState.avatars.values()) {
      const distance = Math.sqrt(
        Math.pow(position.x - avatar.position.x, 2) + 
        Math.pow(position.y - avatar.position.y, 2)
      );
      
      if (distance < minDistance) {
        return false;
      }
    }
    
    return true;
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
    if (this.tileMap) {
      this.tileMap.toggleParcelVisibility();
    }
  }

  /**
   * Get current parcels from the map
   */
  public getParcels(): ParcelInfo[] {
    return this.tileMap ? this.tileMap.getParcels() : [];
  }

  /**
   * Center the camera on the map for optimal viewing
   */
  public centerOnMap(): void {
    if (this.viewport) {
      this.viewport.centerOnMap();
    }
  }

  /**
   * Fit the entire map in the viewport
   */
  public fitMapToViewport(): void {
    if (this.viewport) {
      this.viewport.fitToViewport();
    }
  }

  /**
   * Get parcel at specific position
   */
  public getParcelAt(x: number, y: number): ParcelInfo | undefined {
    return this.tileMap ? this.tileMap.getParcelAt(x, y) : undefined;
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
    
    // Check all layers
    this.layers.forEach((layer, layerType) => {
      // Recursively check children
      this.debugContainerChildren(layer, `  ${LayerType[layerType]}`);
    });

    // Check minimap
    if (this.minimapSystem) {
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
      } else if (child.visible && child.alpha > 0) {
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
  }

  /**
   * Toggle obstacle visualization with markers
   */
  public toggleObstacleVisualization(show: boolean = true): void {
    this.tileMap.visualizeObstacles(show);
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
    
    // Destroy district system
    this.destroyDistrictSystem();

    // Destroy layers
    this.layers.forEach((layer) => layer.destroy());
    this.layers.clear();

    // Destroy Pixi.js application
    this.app.destroy(true);
  }

  /**
   * Get the world container for external systems
   */
  public getWorldContainer(): Container | null {
    // Find the world container in the stage
    const worldContainer = this.app.stage.children.find(
      child => child.name === 'WorldContainer'
    ) as Container;
    return worldContainer || null;
  }

  /**
   * Initialize or get the district system
   */
  public getDistrictSystem(): DistrictSystem | null {
    return this.districtSystem;
  }

  /**
   * Initialize the district system (to be called from React components)
   */
  public initializeDistrictSystem(): DistrictSystem | null {
    const worldContainer = this.getWorldContainer();
    
    if (!worldContainer) {
      console.error('❌ Cannot initialize DistrictSystem: WorldContainer not found');
      return null;
    }

    if (this.districtSystem) {
      // Si ya existe, asegurar conexión con RenderSystem
      this.connectDistrictSystemToRenderSystem();
      return this.districtSystem;
    }

    
    try {
      this.districtSystem = new DistrictSystem({
        app: this.app,
        mapContainer: worldContainer,
        showLabels: true,
        showBorders: true,
        opacity: 0.2,
        interactive: true,
      });

      // 🔥 CONEXIÓN CRÍTICA: Conectar DistrictSystem con RenderSystem
      this.connectDistrictSystemToRenderSystem();
      
      return this.districtSystem;
    } catch (error) {
      console.error('❌ Failed to initialize DistrictSystem:', error);
      return null;
    }
  }

  /**
   * Conectar el DistrictSystem al RenderSystem para tracking de avatares
   */
  private connectDistrictSystemToRenderSystem(): void {
    if (this.districtSystem && this.systems.has('render')) {
      const renderSystem = this.systems.get('render') as any; // RenderSystem
      if (renderSystem && typeof renderSystem.setDistrictSystem === 'function') {
        renderSystem.setDistrictSystem(this.districtSystem);
        console.log('✅ DistrictSystem connected to RenderSystem for avatar tracking');
      }
    }
  }

  /**
   * Destroy the district system
   */
  public destroyDistrictSystem(): void {
    if (this.districtSystem) {
      this.districtSystem.destroy();
      this.districtSystem = null;
    }
  }

  /**
   * Get debug information about the game state
   */
  public getGameDebugInfo(): object {
    const avatarInfo = [];
    for (const [id, avatar] of this.gameState.avatars) {
      avatarInfo.push({
        id,
        name: avatar.name,
        position: avatar.position,
        direction: avatar.direction,
        visible: true,
        layerChildren: this.layers.get(LayerType.CHARACTERS)?.children?.length
      });
    }

    return {
      engine: {
        isRunning: this.isRunning,
        hasTileMap: !!this.tileMap,
        hasViewport: !!this.viewport,
        systemsCount: this.systems.size
      },
      viewport: this.viewport ? {
        state: this.viewport.getState()
      } : null,
      layers: Object.fromEntries(
        Array.from(this.layers.entries()).map(([type, layer]) => [
          LayerType[type],
          {
            children: layer.children.length,
            visible: layer.visible,
            alpha: layer.alpha,
            zIndex: layer.zIndex
          }
        ])
      ),
      gameState: {
        avatarsCount: this.gameState.avatars.size,
        currentUser: this.gameState.currentUser?.name || null,
        avatars: avatarInfo
      }
    };
  }
}
