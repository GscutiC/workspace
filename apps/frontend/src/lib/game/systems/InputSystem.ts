import type { Position, GameState } from '@/types/game';
import { INPUT_CONFIG } from '@/constants/game';

/**
 * InputSystem handles all user input (keyboard, mouse, touch)
 * Provides callbacks for different input events
 */
export class InputSystem {
  private canvas: HTMLCanvasElement;
  private gameState: GameState;
  private isListening: boolean = false;

  // Event callbacks
  public onMouseDown?: (position: Position) => void;
  public onMouseMove?: (position: Position) => void;
  public onMouseUp?: (position: Position) => void;
  public onMouseClick?: (position: Position) => void;
  public onMouseWheel?: (delta: number, position: Position) => void;
  public onKeyPress?: (key: string) => void;
  public onKeyRelease?: (key: string) => void;

  // Input state tracking
  private mousePosition: Position = { x: 0, y: 0 };
  private mouseButtonDown: boolean = false;
  private pressedKeys: Set<string> = new Set();
  private lastClickTime: number = 0;
  private dragStartPosition?: Position;
  private isDragging: boolean = false;

  // Touch support
  private touchStartPosition?: Position;
  private lastTouchTime: number = 0;
  private pinchStartDistance?: number;

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.startListening();
  }

  /**
   * Start listening to input events
   */
  private startListening(): void {
    if (this.isListening) return;

    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleMouseWheel.bind(this));
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));

    // Keyboard events (global)
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Focus events
    this.canvas.addEventListener('focus', this.handleFocus.bind(this));
    this.canvas.addEventListener('blur', this.handleBlur.bind(this));

    this.isListening = true;
  }

  /**
   * Stop listening to input events
   */
  private stopListening(): void {
    if (!this.isListening) return;

    // Remove mouse events
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('wheel', this.handleMouseWheel.bind(this));
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu.bind(this));

    // Remove keyboard events
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));

    // Remove touch events
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));

    // Remove focus events
    this.canvas.removeEventListener('focus', this.handleFocus.bind(this));
    this.canvas.removeEventListener('blur', this.handleBlur.bind(this));

    this.isListening = false;
  }

  /**
   * Update input system
   */
  public update(deltaTime: number, gameState: GameState): void {
    this.gameState = gameState;

    // Update input state in game state
    this.gameState.input.keys = new Set(this.pressedKeys);
    this.gameState.input.mouse.position = { ...this.mousePosition };
    this.gameState.input.mouse.isDown = this.mouseButtonDown;

    // Handle continuous key presses
    this.handleContinuousInput(deltaTime);
  }

  /**
   * Handle continuous input (held keys)
   */
  private handleContinuousInput(deltaTime: number): void {
    // Process held movement keys
    for (const key of this.pressedKeys) {
      if (this.isMovementKey(key)) {
        // Throttle movement input
        const now = Date.now();
        if (now - this.lastClickTime > INPUT_CONFIG.keyRepeatDelay) {
          this.onKeyPress?.(key);
          this.lastClickTime = now;
        }
      }
    }
  }

  /**
   * Check if key is a movement key
   */
  private isMovementKey(key: string): boolean {
    return (
      INPUT_CONFIG.moveKeys.up.includes(key) ||
      INPUT_CONFIG.moveKeys.down.includes(key) ||
      INPUT_CONFIG.moveKeys.left.includes(key) ||
      INPUT_CONFIG.moveKeys.right.includes(key)
    );
  }

  /**
   * Get mouse position relative to canvas
   */
  private getCanvasMousePosition(event: MouseEvent): Position {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault();

    const position = this.getCanvasMousePosition(event);
    this.mousePosition = position;
    this.mouseButtonDown = true;
    this.dragStartPosition = position;
    this.isDragging = false;

    // Focus canvas for keyboard input
    this.canvas.focus();

    this.onMouseDown?.(position);
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(event: MouseEvent): void {
    const position = this.getCanvasMousePosition(event);
    this.mousePosition = position;

    // Check if we should start dragging
    if (this.mouseButtonDown && this.dragStartPosition && !this.isDragging) {
      const dragDistance = Math.sqrt(
        Math.pow(position.x - this.dragStartPosition.x, 2) +
        Math.pow(position.y - this.dragStartPosition.y, 2)
      );

      if (dragDistance > INPUT_CONFIG.dragThreshold) {
        this.isDragging = true;
        this.gameState.viewport.isDragging = true;
      }
    }

    this.onMouseMove?.(position);
  }

  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    const position = this.getCanvasMousePosition(event);
    this.mousePosition = position;
    this.mouseButtonDown = false;

    // Check for click (not drag)
    if (!this.isDragging && this.dragStartPosition) {
      this.handleClick(position);
    }

    // Reset drag state
    this.isDragging = false;
    this.dragStartPosition = undefined;
    this.gameState.viewport.isDragging = false;

    this.onMouseUp?.(position);
  }

  /**
   * Handle click events
   */
  private handleClick(position: Position): void {
    const now = Date.now();
    const timeSinceLastClick = now - this.lastClickTime;

    // Prevent rapid clicking
    if (timeSinceLastClick < INPUT_CONFIG.clickCooldown) {
      return;
    }

    this.lastClickTime = now;
    this.onMouseClick?.(position);
  }

  /**
   * Handle mouse wheel events
   */
  private handleMouseWheel(event: WheelEvent): void {
    event.preventDefault();

    const position = this.getCanvasMousePosition(event);
    const delta = -event.deltaY / 1000; // Normalize wheel delta

    this.onMouseWheel?.(delta, position);
  }

  /**
   * Handle context menu (right click)
   */
  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault(); // Disable context menu
  }

  /**
   * Handle key down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.code.toLowerCase();

    // Prevent default for game keys
    if (this.isGameKey(key)) {
      event.preventDefault();
    }

    // Only trigger on first press (not repeat)
    if (!this.pressedKeys.has(key)) {
      this.pressedKeys.add(key);

      // Handle immediate key presses (non-movement keys)
      if (!this.isMovementKey(key)) {
        this.onKeyPress?.(key);
      }
    }
  }

  /**
   * Handle key up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.code.toLowerCase();

    if (this.pressedKeys.has(key)) {
      this.pressedKeys.delete(key);
      this.onKeyRelease?.(key);
    }
  }

  /**
   * Check if key is a game key that should prevent default behavior
   */
  private isGameKey(key: string): boolean {
    return (
      this.isMovementKey(key) ||
      INPUT_CONFIG.actionKeys.includes(key) ||
      INPUT_CONFIG.cameraKeys.includes(key)
    );
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const touch = event.touches[0];
    if (!touch) return;

    const position = this.getTouchPosition(touch);
    this.touchStartPosition = position;
    this.lastTouchTime = Date.now();

    // Treat single touch as mouse down
    this.handleMouseDown({
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
    } as MouseEvent);
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1) {
      // Single finger - pan
      const touch = event.touches[0];
      const position = this.getTouchPosition(touch);

      this.handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    } else if (event.touches.length === 2) {
      // Two fingers - pinch zoom
      this.handlePinchZoom(event.touches);
    }
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    // Check for tap (quick touch)
    if (this.touchStartPosition && event.timeStamp - this.lastTouchTime < 200) {
      const touch = event.changedTouches[0];
      if (touch) {
        const position = this.getTouchPosition(touch);
        this.handleClick(position);
      }
    }

    // Reset touch state
    this.touchStartPosition = undefined;
    this.pinchStartDistance = undefined;

    // Treat as mouse up
    this.handleMouseUp({
      clientX: 0,
      clientY: 0,
    } as MouseEvent);
  }

  /**
   * Get touch position relative to canvas
   */
  private getTouchPosition(touch: Touch): Position {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  /**
   * Handle pinch zoom with two fingers
   */
  private handlePinchZoom(touches: TouchList): void {
    const touch1 = touches[0];
    const touch2 = touches[1];

    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    if (this.pinchStartDistance) {
      const deltaDistance = distance - this.pinchStartDistance;
      const zoomDelta = deltaDistance * 0.001; // Scale factor

      // Get center point between touches
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      const rect = this.canvas.getBoundingClientRect();

      const centerPosition = {
        x: (centerX - rect.left) * (this.canvas.width / rect.width),
        y: (centerY - rect.top) * (this.canvas.height / rect.height),
      };

      this.onMouseWheel?.(zoomDelta, centerPosition);
    }

    this.pinchStartDistance = distance;
  }

  /**
   * Handle focus events
   */
  private handleFocus(): void {
    // Canvas gained focus - can handle keyboard input
  }

  /**
   * Handle blur events
   */
  private handleBlur(): void {
    // Canvas lost focus - clear all input state
    this.pressedKeys.clear();
    this.mouseButtonDown = false;
    this.isDragging = false;
    this.gameState.viewport.isDragging = false;
  }

  /**
   * Get current input state
   */
  public getInputState(): {
    mouse: { position: Position; isDown: boolean };
    keys: Set<string>;
    isDragging: boolean;
  } {
    return {
      mouse: {
        position: { ...this.mousePosition },
        isDown: this.mouseButtonDown,
      },
      keys: new Set(this.pressedKeys),
      isDragging: this.isDragging,
    };
  }

  /**
   * Check if specific key is pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  /**
   * Check if mouse is down
   */
  public isMouseDown(): boolean {
    return this.mouseButtonDown;
  }

  /**
   * Get current mouse position
   */
  public getMousePosition(): Position {
    return { ...this.mousePosition };
  }

  /**
   * Set canvas focus
   */
  public focus(): void {
    this.canvas.focus();
  }

  /**
   * Enable/disable input handling
   */
  public setEnabled(enabled: boolean): void {
    if (enabled && !this.isListening) {
      this.startListening();
    } else if (!enabled && this.isListening) {
      this.stopListening();
      this.pressedKeys.clear();
      this.mouseButtonDown = false;
      this.isDragging = false;
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopListening();
    this.pressedKeys.clear();
  }
}