import { Application, Container } from 'pixi.js';
import type { GameState, Position, AvatarData } from '@/types/game';
import { LayerType, Direction, UserStatus } from '@/types/game';
import { GAME_CONFIG, LAYER_CONFIG } from '@/constants/game';
import { TileMap } from './TileMap';
import { Viewport } from './Viewport';
import { MovementSystem } from './systems/MovementSystem';
import { RenderSystem } from './systems/RenderSystem';
import { InputSystem } from './systems/InputSystem';
import { ObjectPool } from './systems/ObjectPool';

/**
 * GameEngine is the core class that orchestrates all game systems
 * Manages the game loop, systems, and state
 */
export class GameEngine {
  private app: Application;
  private gameState: GameState;
  private layers: Map<LayerType, Container>;
  private systems: Map<string, unknown>;
  private tileMap: TileMap;
  private viewport: Viewport;
  private objectPool: ObjectPool;
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
        this.app.stage.addChild(container);
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

    // Create viewport
    const worldContainer = this.layers.get(LayerType.FLOOR)!;
    this.viewport = new Viewport(worldContainer, worldBounds);

    // Add tilemap to the world
    const tilemapVisuals = this.tileMap.createVisuals();
    worldContainer.addChild(tilemapVisuals);

    // Initialize object pool
    this.objectPool = new ObjectPool();

    // Initialize game systems
    this.systems.set('input', new InputSystem(this.app.canvas, this.gameState));
    this.systems.set('movement', new MovementSystem(this.gameState, this.tileMap));
    this.systems.set('render', new RenderSystem(this.layers, this.objectPool));

    // Connect input events
    this.setupInputHandlers();
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
      if (!this.gameState.currentUser) return;

      const worldPos = this.viewport.screenToWorld(position);
      this.moveAvatar(this.gameState.currentUser.id, worldPos);
    };

    // Mouse wheel for zoom
    inputSystem.onMouseWheel = (delta: number, position: Position) => {
      this.viewport.zoomBy(delta * 0.1, position);
    };

    // Keyboard movement
    inputSystem.onKeyPress = (key: string) => {
      if (!this.gameState.currentUser) return;

      const movementSystem = this.systems.get('movement') as MovementSystem;
      movementSystem.handleKeyInput(key, this.gameState.currentUser.id);
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
    renderSystem.createAvatar(avatar);

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
      // Center camera on user
      this.viewport.moveTo(avatar.position, true);
    }
  }

  /**
   * Move avatar to position
   */
  public moveAvatar(userId: string, targetPosition: Position): void {
    const movementSystem = this.systems.get('movement') as MovementSystem;
    movementSystem.moveToPosition(userId, targetPosition);
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

    for (let i = 0; i < maxAttempts; i++) {
      const position: Position = {
        x: Math.random() * worldBounds.width * 0.8 + worldBounds.width * 0.1,
        y: Math.random() * worldBounds.height * 0.8 + worldBounds.height * 0.1,
      };

      if (this.tileMap.isWalkable(position)) {
        return position;
      }
    }

    // Fallback to center if no position found
    return {
      x: worldBounds.width / 2,
      y: worldBounds.height / 2,
    };
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