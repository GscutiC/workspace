import type { GameState, Position, AvatarData } from '@/types/game';
import { Direction } from '@/types/game';
import { AVATAR_CONFIG, MOVEMENT_CONFIG, INPUT_CONFIG } from '@/constants/game';
import { MovementSystem } from '../systems/MovementSystem';
import { RenderSystem } from '../systems/RenderSystem';

/**
 * MovementController - Unified movement control system
 * Handles both keyboard and mouse input with consistent behavior
 */
export class MovementController {
  private movementSystem: MovementSystem;
  private renderSystem: RenderSystem;
  private gameState: GameState;
  private lastKeyInputTime: Map<string, number> = new Map();

  constructor(
    movementSystem: MovementSystem, 
    renderSystem: RenderSystem, 
    gameState: GameState
  ) {
    this.movementSystem = movementSystem;
    this.renderSystem = renderSystem;
    this.gameState = gameState;
  }

  /**
   * Handle keyboard movement - Unified system
   */
  public handleKeyboardMovement(key: string, userId: string): void {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) {
      console.warn('❌ Avatar not found for keyboard movement:', userId);
      return;
    }

    // Key repeat protection
    if (!this.isKeyInputAllowed(userId)) {
      return;
    }

    // Calculate target position based on key
    const targetPosition = this.calculateKeyboardTarget(key, avatar);
    if (!targetPosition) {
      // No movement direction for key
      return;
    }

    // Execute movement
    this.executeMovement(userId, targetPosition, 'keyboard');
  }

  /**
   * Handle mouse movement - Unified system
   */
  public handleMouseMovement(worldPosition: Position, userId: string): void {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) {
      console.warn('❌ Avatar not found for mouse movement:', userId);
      return;
    }

    // Execute movement
    this.executeMovement(userId, worldPosition, 'mouse');
  }

  /**
   * Unified movement execution
   */
  private executeMovement(userId: string, targetPosition: Position, source: 'keyboard' | 'mouse'): void {
    // Movement initiated for user

    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return;

    // Update avatar direction for keyboard movement
    if (source === 'keyboard') {
      const direction = this.calculateDirection(avatar.position, targetPosition);
      avatar.direction = direction;
      // Direction set
    }

    // Use MovementSystem for pathfinding and movement
    const success = this.movementSystem.moveToPosition(userId, targetPosition);
    
    if (success) {
      // Movement initiated successfully
    } else {
      // Movement failed
    }

    // Force immediate position update for keyboard (small movements)
    if (source === 'keyboard') {
      this.handleImmediateMovement(userId, targetPosition);
    }
  }

  /**
   * Handle immediate movement for small keyboard steps
   */
  private handleImmediateMovement(userId: string, targetPosition: Position): void {
    const avatar = this.gameState.avatars.get(userId);
    if (!avatar) return;

    // For keyboard, check if it's a small movement that should be immediate
    const dx = Math.abs(targetPosition.x - avatar.position.x);
    const dy = Math.abs(targetPosition.y - avatar.position.y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If it's a small step (typical keyboard movement), apply immediately
    if (distance <= MOVEMENT_CONFIG.keyboardMoveSpeed / 60) {
      // Applying immediate keyboard movement
      
      // Validate the movement first
      if (this.movementSystem.isValidMove(avatar.position, targetPosition, userId)) {
        // Update position directly
        avatar.position = { ...targetPosition };
        
        // Stop any ongoing pathfinding movement
        this.movementSystem.stopMovement(userId);
        
        // Position updated
      } else {
        // Immediate movement blocked
      }
    }
  }

  /**
   * Calculate target position for keyboard input
   */
  private calculateKeyboardTarget(key: string, avatar: AvatarData): Position | null {
    const keyboardSpeed = MOVEMENT_CONFIG.keyboardMoveSpeed;
    const frameTime = 1 / 60;
    const movementStep = keyboardSpeed * frameTime;

    if (INPUT_CONFIG.moveKeys.up.includes(key)) {
      return {
        x: avatar.position.x,
        y: avatar.position.y - movementStep
      };
    } else if (INPUT_CONFIG.moveKeys.down.includes(key)) {
      return {
        x: avatar.position.x,
        y: avatar.position.y + movementStep
      };
    } else if (INPUT_CONFIG.moveKeys.left.includes(key)) {
      return {
        x: avatar.position.x - movementStep,
        y: avatar.position.y
      };
    } else if (INPUT_CONFIG.moveKeys.right.includes(key)) {
      return {
        x: avatar.position.x + movementStep,
        y: avatar.position.y
      };
    }

    return null;
  }

  /**
   * Calculate direction based on movement vector
   */
  private calculateDirection(from: Position, to: Position): Direction {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      return dy > 0 ? Direction.DOWN : Direction.UP;
    }
  }

  /**
   * Check if key input is allowed (rate limiting)
   */
  private isKeyInputAllowed(userId: string): boolean {
    const now = Date.now();
    const lastInput = this.lastKeyInputTime.get(userId) || 0;
    
    if (now - lastInput < INPUT_CONFIG.keyRepeatDelay) {
      return false;
    }
    
    this.lastKeyInputTime.set(userId, now);
    return true;
  }

  /**
   * Get movement state for debugging
   */
  public getMovementState(userId: string): object {
    const avatar = this.gameState.avatars.get(userId);
    const movementTarget = this.movementSystem.getMovementTarget(userId);
    
    return {
      avatar: avatar ? {
        id: avatar.id,
        position: avatar.position,
        direction: avatar.direction
      } : null,
      isMoving: this.movementSystem.isMoving(userId),
      movementTarget: movementTarget ? {
        targetPosition: movementTarget.position,
        isMoving: movementTarget.isMoving,
        pathLength: movementTarget.path?.length || 0,
        currentIndex: movementTarget.currentPathIndex
      } : null
    };
  }

  /**
   * Force position update (for debugging)
   */
  public forcePosition(userId: string, position: Position): void {
    const avatar = this.gameState.avatars.get(userId);
    if (avatar) {
      avatar.position = { ...position };
      this.movementSystem.stopMovement(userId);
      console.log('🔧 Force updated position to:', position);
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.lastKeyInputTime.clear();
  }
}