import type { GameState, Position, AvatarData, MovementTarget } from '@/types/game';
import { Direction } from '@/types/game';
import { AVATAR_CONFIG, MOVEMENT_CONFIG, INPUT_CONFIG } from '@/constants/game';
import { MovementEasing } from '../utils/MovementEasing';
import { AStar } from '../pathfinding/AStar';
import { TileMap } from '../TileMap';

// Define the GameSystem interface locally to ensure implementation
interface GameSystem {
  update?(deltaTime: number, gameState: GameState): void;
  destroy?(): void;
}

/**
 * MovementSystem handles avatar movement, pathfinding, and animation
 */
export class MovementSystem implements GameSystem {
  private gameState: GameState;
  private tileMap: TileMap;
  private pathfinder: AStar;
  private movementEasing: MovementEasing;
  private movementTargets: Map<string, MovementTarget>;
  private lastKeyInputTime: Map<string, number>;

  constructor(gameState: GameState, tileMap: TileMap) {
    this.gameState = gameState;
    this.tileMap = tileMap;
    this.pathfinder = new AStar(tileMap);
    this.movementEasing = new MovementEasing();
    this.movementTargets = new Map();
    this.lastKeyInputTime = new Map();
  }

  /**
   * Update the pathfinder when the tilemap changes
   */
  public updatePathfinder(): void {
    this.pathfinder = new AStar(this.tileMap);
    console.log('🗺️ Pathfinder updated with new TileMap data');
  }

  /**
   * Update movement system
   */
  public update(deltaTime: number, gameState: GameState): void {
    this.gameState = gameState;

    // Update all moving avatars
    this.gameState.avatars.forEach((avatar) => {
      this.updateAvatarMovement(avatar, deltaTime);
    });
  }

  /**
   * Move avatar to specific position using pathfinding
   */
  public moveToPosition(userId: string, targetPosition: Position): boolean {
    console.log('🚀 MovementSystem.moveToPosition called for', userId, 'to', targetPosition);
    
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) {
      console.error('❌ Avatar not found in MovementSystem:', userId);
      return false;
    }

    console.log('📍 Avatar current position:', avatar.position);

    // Check if target position is walkable
    const isWalkable = this.tileMap.isWalkable(targetPosition);
    const isStreet = this.tileMap.isWalkableArea(
      Math.floor(targetPosition.x / 32), 
      Math.floor(targetPosition.y / 32)
    );
    
    console.log('🚶 Target position walkable:', isWalkable);
    console.log('🛣️ Target position is street/sidewalk:', isStreet);
    
    if (!isWalkable) {
      console.warn('⚠️ Target position is not walkable:', targetPosition);
      return false;
    }

    // Log when moving to non-street areas (parks are allowed but noted)
    if (!isStreet) {
      const tileCategory = this.tileMap.getTileCategory(
        Math.floor(targetPosition.x / 32), 
        Math.floor(targetPosition.y / 32)
      );
      console.log('🌳 Moving to non-street area:', { targetPosition, category: tileCategory });
    }

    // Calculate path
    const path = this.pathfinder.findPath(avatar.position, targetPosition);
    console.log('🛤️ Calculated path:', path);
    
    if (!path || path.length === 0) {
      console.warn('⚠️ No path found from', avatar.position, 'to', targetPosition);
      return false;
    }

    // Smooth the path
    const smoothedPath = this.pathfinder.smoothPath(path);
    console.log('✨ Smoothed path:', smoothedPath);

    // Set movement target
    const movementTarget: MovementTarget = {
      position: targetPosition,
      isMoving: true,
      path: smoothedPath,
      currentPathIndex: 0,
    };

    this.movementTargets.set(userId, movementTarget);
    console.log('🎯 Movement target set for', userId);
    
    return true;
  }

  /**
   * Handle keyboard input for movement
   */
  public handleKeyInput(key: string, userId: string): void {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return;

    // FOCUSED DEBUG: Only log UP movement attempts
    const isUpKey = INPUT_CONFIG.moveKeys.up.includes(key);
    if (isUpKey) {
      console.log('� UP KEY DETECTED:', key, 'for user:', userId);
      console.log('📍 Current avatar position:', avatar.position);
    }

    // Check for key repeat delay
    const now = Date.now();
    const lastInput = this.lastKeyInputTime.get(userId) || 0;
    if (now - lastInput < INPUT_CONFIG.keyRepeatDelay) {
      if (isUpKey) console.log('⏰ UP movement blocked - key repeat too soon');
      return;
    }
    this.lastKeyInputTime.set(userId, now);

    // Calculate movement step
    const keyboardSpeed = MOVEMENT_CONFIG.keyboardMoveSpeed; // pixels per second
    const frameTime = 1 / 60; // Assume 60fps for consistent keyboard movement
    const movementStep = keyboardSpeed * frameTime; // pixels per frame

    // Determine movement direction and calculate target position
    let direction: Direction | null = null;
    let targetPosition: Position | null = null;

    if (INPUT_CONFIG.moveKeys.up.includes(key)) {
      direction = Direction.UP;
      targetPosition = {
        x: avatar.position.x,
        y: avatar.position.y - movementStep
      };
      console.log('⬆️ UP movement - target:', targetPosition);
    } else if (INPUT_CONFIG.moveKeys.down.includes(key)) {
      direction = Direction.DOWN;
      targetPosition = {
        x: avatar.position.x,
        y: avatar.position.y + movementStep
      };
    } else if (INPUT_CONFIG.moveKeys.left.includes(key)) {
      direction = Direction.LEFT;
      targetPosition = {
        x: avatar.position.x - movementStep,
        y: avatar.position.y
      };
    } else if (INPUT_CONFIG.moveKeys.right.includes(key)) {
      direction = Direction.RIGHT;
      targetPosition = {
        x: avatar.position.x + movementStep,
        y: avatar.position.y
      };
    }

    if (direction && targetPosition) {
      // Update avatar direction
      avatar.direction = direction;
      
      // Use the same moveToPosition method that works for mouse
      console.log('🎯 Using moveToPosition for keyboard input:', targetPosition);
      this.moveToPosition(userId, targetPosition);
    }
  }

  /**
   * Update individual avatar movement
   */
  private updateAvatarMovement(avatar: AvatarData, deltaTime: number): void {
    const movementTarget = this.movementTargets.get(avatar.id);
    if (!movementTarget || !movementTarget.isMoving) {
      return;
    }

    const path = movementTarget.path;
    if (!path || path.length === 0) {
      console.log('❌ No path available, stopping movement for:', avatar.id);
      this.stopMovement(avatar.id);
      return;
    }

    // Get current target waypoint
    const currentWaypoint = path[movementTarget.currentPathIndex];
    if (!currentWaypoint) {
      console.log('❌ No current waypoint, stopping movement for:', avatar.id);
      this.stopMovement(avatar.id);
      return;
    }

    // Calculate movement towards waypoint
    const moveResult = this.moveTowardsTarget(avatar, currentWaypoint, deltaTime);

    // Check if reached current waypoint
    if (moveResult.reached) {
      movementTarget.currentPathIndex++;

      // Check if reached final destination
      if (movementTarget.currentPathIndex >= path.length) {
        console.log('✅ Avatar reached final destination:', avatar.id);
        this.stopMovement(avatar.id);
      }
    }

    // Update avatar direction based on movement
    if (moveResult.direction) {
      avatar.direction = moveResult.direction;
    }
  }

  /**
   * Move avatar towards target position
   */
  private moveTowardsTarget(
    avatar: AvatarData,
    target: Position,
    deltaTime: number
  ): { reached: boolean; direction?: Direction } {
    const dx = target.x - avatar.position.x;
    const dy = target.y - avatar.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if already at target
    if (distance <= MOVEMENT_CONFIG.pathfindingTolerance) {
      return { reached: true };
    }

    // Calculate movement using proper speed formula
    // Speed is in pixels per second, deltaTime is in seconds
    const pixelsPerSecond = MOVEMENT_CONFIG.pathfindingSpeed;
    const maxMoveDistance = pixelsPerSecond * deltaTime; // Convert to pixels per frame
    const moveDistance = Math.min(maxMoveDistance, distance);

    // Normalize direction
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;

    // Calculate new position
    const newPosition: Position = {
      x: avatar.position.x + normalizedX * moveDistance,
      y: avatar.position.y + normalizedY * moveDistance,
    };

    // Validate movement (pass avatar ID to exclude self-collision)
    if (this.isValidMove(avatar.position, newPosition, avatar.id)) {
      // Log obstacle information when entering new tiles
      const oldTileX = Math.floor(avatar.position.x / 32);
      const oldTileY = Math.floor(avatar.position.y / 32);
      const newTileX = Math.floor(newPosition.x / 32);
      const newTileY = Math.floor(newPosition.y / 32);
      
      // Update position
      avatar.position = newPosition;
      
      // Only log when entering a new tile
      if (newTileX !== oldTileX || newTileY !== oldTileY) {
        const category = this.tileMap.getTileCategory(newTileX, newTileY);
        const obstacles = this.tileMap.getObstaclesInArea({
          x: newTileX - 1, y: newTileY - 1, width: 3, height: 3
        });
        
        if (obstacles.length > 0) {
          console.log('🏢 Nearby obstacles:', obstacles.map(o => ({
            id: o.id,
            type: o.metadata.type,
            interactive: o.metadata.interactive
          })));
        }
        
        console.log('📍 Entered tile:', { x: newTileX, y: newTileY, category });
      }

      // Determine direction for animation
      const direction = this.calculateDirection(normalizedX, normalizedY);

      return { reached: false, direction };
    } else {
      console.log('❌ Movement blocked for avatar:', avatar.id, 'stopping movement');
      // If movement is blocked, stop
      this.stopMovement(avatar.id);
      return { reached: true };
    }
  }

  /**
   * Calculate direction based on movement vector
   */
  private calculateDirection(deltaX: number, deltaY: number): Direction {
    // Prioritize horizontal movement
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      return deltaY > 0 ? Direction.DOWN : Direction.UP;
    }
  }

  /**
   * Stop avatar movement
   */
  public stopMovement(userId: string): void {
    const movementTarget = this.movementTargets.get(userId);
    if (movementTarget) {
      movementTarget.isMoving = false;
      this.movementTargets.delete(userId);
    }
  }

  /**
   * Check if movement is valid (not blocked by obstacles) - Public for controller use
   */
  public isValidMove(from: Position, to: Position, avatarId?: string): boolean {
    // FOCUSED DEBUG: Only log for UP movements (negative Y delta)
    const isUpMovement = to.y < from.y;
    
    if (isUpMovement) {
      console.log('🔍 VALIDATING UP MOVEMENT:');
      console.log('  From:', from);
      console.log('  To:', to);
      console.log('  Delta Y:', to.y - from.y);
    }
    
    // Check boundaries
    const worldBounds = this.tileMap.getWorldBounds();
    
    if (to.x < 0 || to.x >= worldBounds.width || to.y < 0 || to.y >= worldBounds.height) {
      if (isUpMovement) {
        console.log('❌ UP MOVEMENT BLOCKED: OUT OF BOUNDS');
        console.log('  Target position:', to);
        console.log('  World bounds:', worldBounds);
        console.log('  Y check: to.y=', to.y, '< 0?', to.y < 0);
      }
      return false;
    }

    // Check if destination is walkable
    const isWalkable = this.tileMap.isWalkable(to);
    if (!isWalkable) {
      if (isUpMovement) {
        console.log('❌ UP MOVEMENT BLOCKED: NOT WALKABLE');
        console.log('  Target position:', to);
        console.log('  TileMap.isWalkable returned:', isWalkable);
      }
      return false;
    }

    // Check collision with other avatars (excluding the moving avatar)
    const hasCollision = this.checkAvatarCollision(to, avatarId);
    if (hasCollision) {
      if (isUpMovement) {
        console.log('❌ UP MOVEMENT BLOCKED: AVATAR COLLISION');
        console.log('  Target position:', to);
      }
      return false;
    }

    if (isUpMovement) {
      console.log('✅ UP MOVEMENT VALIDATED - all checks passed');
    }
    return true;
  }

  /**
   * Check collision with other avatars
   */
  private checkAvatarCollision(position: Position, excludeAvatarId?: string): boolean {
    const collisionRadius = AVATAR_CONFIG.size.width / 2;

    for (const [id, avatar] of this.gameState.avatars) {
      // Skip the avatar that's moving
      if (excludeAvatarId && id === excludeAvatarId) {
        continue;
      }

      const dx = avatar.position.x - position.x;
      const dy = avatar.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < collisionRadius * 1.5) { // Reduced collision radius for better movement
        console.log('💥 Collision detected with avatar:', id, 'distance:', distance.toFixed(2));
        return true; // Collision detected
      }
    }

    return false;
  }

  /**
   * Get movement target for avatar
   */
  public getMovementTarget(userId: string): MovementTarget | undefined {
    return this.movementTargets.get(userId);
  }

  /**
   * Check if avatar is moving
   */
  public isMoving(userId: string): boolean {
    const target = this.movementTargets.get(userId);
    return target ? target.isMoving : false;
  }

  /**
   * Get current movement speed for avatar
   */
  public getMovementSpeed(userId: string): number {
    return this.isMoving(userId) ? AVATAR_CONFIG.moveSpeed : 0;
  }

  /**
   * Force avatar to specific position (for teleporting)
   */
  public teleportAvatar(userId: string, position: Position): boolean {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return false;

    // Check if position is valid
    if (!this.tileMap.isWalkable(position)) {
      return false;
    }

    // Stop any current movement
    this.stopMovement(userId);

    // Set new position
    avatar.position = position;
    return true;
  }

  /**
   * Set movement speed for avatar (temporary speed boost/reduction)
   */
  public setMovementSpeed(userId: string, speedMultiplier: number): void {
    // This could be implemented with a temporary effect system
    // For now, it's a placeholder for future enhancement
  }

  /**
   * Get estimated time to reach destination
   */
  public getTimeToDestination(userId: string): number {
    const target = this.movementTargets.get(userId);
    const avatar = this.gameState.avatars.get(userId);

    if (!target || !avatar || !target.path) {
      return 0;
    }

    // Calculate remaining distance
    let totalDistance = 0;
    let currentPos = avatar.position;

    for (let i = target.currentPathIndex; i < target.path.length; i++) {
      const waypoint = target.path[i];
      const dx = waypoint.x - currentPos.x;
      const dy = waypoint.y - currentPos.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
      currentPos = waypoint;
    }

    return totalDistance / AVATAR_CONFIG.moveSpeed;
  }

  /**
   * Cleanup movement system
   */
  public destroy(): void {
    this.movementTargets.clear();
    this.lastKeyInputTime.clear();
  }
}