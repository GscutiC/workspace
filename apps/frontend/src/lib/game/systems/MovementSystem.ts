import type { GameState, Position, AvatarData, MovementTarget } from '@/types/game';
import { Direction } from '@/types/game';
import { AVATAR_CONFIG, MOVEMENT_CONFIG, INPUT_CONFIG } from '@/constants/game';
import { AStar } from '../pathfinding/AStar';
import { TileMap } from '../TileMap';

/**
 * MovementSystem handles avatar movement, pathfinding, and animation
 */
export class MovementSystem {
  private gameState: GameState;
  private tileMap: TileMap;
  private pathfinder: AStar;
  private movementTargets: Map<string, MovementTarget>;
  private lastKeyInputTime: Map<string, number>;

  constructor(gameState: GameState, tileMap: TileMap) {
    this.gameState = gameState;
    this.tileMap = tileMap;
    this.pathfinder = new AStar(tileMap.getMapData());
    this.movementTargets = new Map();
    this.lastKeyInputTime = new Map();
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
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return false;

    // Check if target position is walkable
    if (!this.tileMap.isWalkable(targetPosition)) {
      return false;
    }

    // Calculate path
    const path = this.pathfinder.findPath(avatar.position, targetPosition);
    if (!path || path.length === 0) {
      return false;
    }

    // Smooth the path
    const smoothedPath = this.pathfinder.smoothPath(path);

    // Set movement target
    const movementTarget: MovementTarget = {
      position: targetPosition,
      isMoving: true,
      path: smoothedPath,
      currentPathIndex: 0,
    };

    this.movementTargets.set(userId, movementTarget);
    return true;
  }

  /**
   * Handle keyboard input for movement
   */
  public handleKeyInput(key: string, userId: string): void {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return;

    // Check for key repeat delay
    const now = Date.now();
    const lastInput = this.lastKeyInputTime.get(userId) || 0;
    if (now - lastInput < INPUT_CONFIG.keyRepeatDelay) {
      return;
    }
    this.lastKeyInputTime.set(userId, now);

    // Determine movement direction
    let direction: Direction | null = null;
    let deltaX = 0;
    let deltaY = 0;

    if (INPUT_CONFIG.moveKeys.up.includes(key)) {
      direction = Direction.UP;
      deltaY = -AVATAR_CONFIG.moveSpeed;
    } else if (INPUT_CONFIG.moveKeys.down.includes(key)) {
      direction = Direction.DOWN;
      deltaY = AVATAR_CONFIG.moveSpeed;
    } else if (INPUT_CONFIG.moveKeys.left.includes(key)) {
      direction = Direction.LEFT;
      deltaX = -AVATAR_CONFIG.moveSpeed;
    } else if (INPUT_CONFIG.moveKeys.right.includes(key)) {
      direction = Direction.RIGHT;
      deltaX = AVATAR_CONFIG.moveSpeed;
    }

    if (direction) {
      // Update avatar direction
      avatar.direction = direction;

      // Calculate target position
      const targetPosition: Position = {
        x: avatar.position.x + deltaX * 0.1, // Small movement step
        y: avatar.position.y + deltaY * 0.1,
      };

      // Check if movement is valid
      if (this.isValidMove(avatar.position, targetPosition)) {
        avatar.position = targetPosition;

        // Clear any existing pathfinding movement
        this.movementTargets.delete(userId);
      }
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
      this.stopMovement(avatar.id);
      return;
    }

    // Get current target waypoint
    const currentWaypoint = path[movementTarget.currentPathIndex];
    if (!currentWaypoint) {
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

    // Calculate movement speed
    const moveSpeed = AVATAR_CONFIG.moveSpeed * deltaTime;
    const moveDistance = Math.min(moveSpeed, distance);

    // Normalize direction
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;

    // Calculate new position
    const newPosition: Position = {
      x: avatar.position.x + normalizedX * moveDistance,
      y: avatar.position.y + normalizedY * moveDistance,
    };

    // Validate movement
    if (this.isValidMove(avatar.position, newPosition)) {
      avatar.position = newPosition;

      // Determine direction for animation
      const direction = this.calculateDirection(normalizedX, normalizedY);

      return { reached: false, direction };
    } else {
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
   * Check if movement is valid (not blocked by obstacles)
   */
  private isValidMove(from: Position, to: Position): boolean {
    // Check boundaries
    const worldBounds = this.tileMap.getWorldBounds();
    if (to.x < 0 || to.x >= worldBounds.width || to.y < 0 || to.y >= worldBounds.height) {
      return false;
    }

    // Check if destination is walkable
    if (!this.tileMap.isWalkable(to)) {
      return false;
    }

    // Check collision with other avatars
    if (this.checkAvatarCollision(to)) {
      return false;
    }

    // Additional validation can be added here (e.g., restricted areas)
    return true;
  }

  /**
   * Check collision with other avatars
   */
  private checkAvatarCollision(position: Position): boolean {
    const collisionRadius = AVATAR_CONFIG.size.width / 2;

    for (const [id, avatar] of this.gameState.avatars) {
      const dx = avatar.position.x - position.x;
      const dy = avatar.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < collisionRadius * 2) {
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