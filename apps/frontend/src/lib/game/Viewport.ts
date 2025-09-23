import { Container } from 'pixi.js';
import type { Position, ViewportConfig, ViewportState } from '@/types/game';
import { VIEWPORT_CONFIG } from '@/constants/game';

/**
 * Viewport manages camera movement, zoom, and world transformations
 * Provides smooth camera controls and bounds checking
 */
export class Viewport {
  private config: ViewportConfig;
  private state: ViewportState;
  private worldContainer: Container;
  private bounds: { width: number; height: number };
  private smoothing: boolean = true;
  private smoothFactor: number = 0.1;

  constructor(worldContainer: Container, worldBounds: { width: number; height: number }) {
    this.worldContainer = worldContainer;
    this.bounds = worldBounds;
    this.config = { ...VIEWPORT_CONFIG };

    this.state = {
      x: this.config.center.x,
      y: this.config.center.y,
      zoom: this.config.zoom,
      isDragging: false,
    };

    this.applyTransform();
  }

  /**
   * Update viewport (called each frame)
   */
  public update(deltaTime: number): void {
    // Apply smooth camera movement if enabled
    if (this.smoothing && this.state.isDragging) {
      this.applySmoothTransform(deltaTime);
    }
  }

  /**
   * Move camera to specific world position
   */
  public moveTo(worldPos: Position, immediate: boolean = false): void {
    console.log('📷 Viewport.moveTo called:', { worldPos, immediate, currentState: this.state });
    
    const targetX = this.clampX(worldPos.x);
    const targetY = this.clampY(worldPos.y);

    console.log('📷 Clamped target position:', { targetX, targetY });

    this.state.x = targetX;
    this.state.y = targetY;
    
    // Always apply transform immediately for now to debug
    this.applyTransform();
    
    console.log('📷 Viewport moved to:', { x: targetX, y: targetY });
  }

  /**
   * Move camera by offset
   */
  public moveBy(offset: Position): void {
    this.moveTo({
      x: this.state.x + offset.x,
      y: this.state.y + offset.y,
    });
  }

  /**
   * Set zoom level
   */
  public setZoom(zoom: number, center?: Position): void {
    const oldZoom = this.state.zoom;
    this.state.zoom = this.clampZoom(zoom);

    // If center is provided, zoom to that point
    if (center) {
      const zoomFactor = this.state.zoom / oldZoom;
      const worldCenter = this.screenToWorld(center);

      this.state.x = worldCenter.x - (worldCenter.x - this.state.x) * zoomFactor;
      this.state.y = worldCenter.y - (worldCenter.y - this.state.y) * zoomFactor;

      this.clampPosition();
    }

    this.applyTransform();
  }

  /**
   * Zoom by delta amount
   */
  public zoomBy(delta: number, center?: Position): void {
    const newZoom = this.state.zoom * (1 + delta);
    this.setZoom(newZoom, center);
  }

  /**
   * Start dragging the viewport
   */
  public startDrag(screenPos: Position): void {
    this.state.isDragging = true;
    this.state.lastPointerPosition = screenPos;
  }

  /**
   * Update drag position
   */
  public updateDrag(screenPos: Position): void {
    if (!this.state.isDragging || !this.state.lastPointerPosition) {
      return;
    }

    const deltaX = screenPos.x - this.state.lastPointerPosition.x;
    const deltaY = screenPos.y - this.state.lastPointerPosition.y;

    // Convert screen movement to world movement (inverted and scaled by zoom)
    this.moveBy({
      x: -deltaX / this.state.zoom,
      y: -deltaY / this.state.zoom,
    });

    this.state.lastPointerPosition = screenPos;
  }

  /**
   * Stop dragging
   */
  public stopDrag(): void {
    this.state.isDragging = false;
    this.state.lastPointerPosition = undefined;
  }

  /**
   * Follow a target position smoothly
   */
  public followTarget(targetPos: Position, deadzone?: { width: number; height: number }): void {
    if (!deadzone) {
      this.moveTo(targetPos);
      return;
    }

    // Only move if target is outside deadzone
    const screenCenter = {
      x: this.config.worldWidth / 2,
      y: this.config.worldHeight / 2,
    };

    const targetScreen = this.worldToScreen(targetPos);
    const deadzoneLeft = screenCenter.x - deadzone.width / 2;
    const deadzoneRight = screenCenter.x + deadzone.width / 2;
    const deadzoneTop = screenCenter.y - deadzone.height / 2;
    const deadzoneBottom = screenCenter.y + deadzone.height / 2;

    let moveX = 0;
    let moveY = 0;

    if (targetScreen.x < deadzoneLeft) {
      moveX = targetScreen.x - deadzoneLeft;
    } else if (targetScreen.x > deadzoneRight) {
      moveX = targetScreen.x - deadzoneRight;
    }

    if (targetScreen.y < deadzoneTop) {
      moveY = targetScreen.y - deadzoneTop;
    } else if (targetScreen.y > deadzoneBottom) {
      moveY = targetScreen.y - deadzoneBottom;
    }

    if (moveX !== 0 || moveY !== 0) {
      this.moveBy({
        x: moveX / this.state.zoom,
        y: moveY / this.state.zoom,
      });
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  public worldToScreen(worldPos: Position): Position {
    return {
      x: (worldPos.x - this.state.x) * this.state.zoom + this.config.worldWidth / 2,
      y: (worldPos.y - this.state.y) * this.state.zoom + this.config.worldHeight / 2,
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  public screenToWorld(screenPos: Position): Position {
    return {
      x: (screenPos.x - this.config.worldWidth / 2) / this.state.zoom + this.state.x,
      y: (screenPos.y - this.config.worldHeight / 2) / this.state.zoom + this.state.y,
    };
  }

  /**
   * Get visible world bounds
   */
  public getVisibleBounds(): { x: number; y: number; width: number; height: number } {
    const halfWidth = (this.config.worldWidth / 2) / this.state.zoom;
    const halfHeight = (this.config.worldHeight / 2) / this.state.zoom;

    return {
      x: this.state.x - halfWidth,
      y: this.state.y - halfHeight,
      width: halfWidth * 2,
      height: halfHeight * 2,
    };
  }

  /**
   * Check if a world position is visible
   */
  public isVisible(worldPos: Position, margin: number = 0): boolean {
    const bounds = this.getVisibleBounds();
    return (
      worldPos.x >= bounds.x - margin &&
      worldPos.x <= bounds.x + bounds.width + margin &&
      worldPos.y >= bounds.y - margin &&
      worldPos.y <= bounds.y + bounds.height + margin
    );
  }

  /**
   * Shake the camera
   */
  public shake(intensity: number, duration: number): void {
    // Implementation for camera shake effect
    // This could be enhanced with more sophisticated shake patterns
    const originalX = this.state.x;
    const originalY = this.state.y;

    const shakeX = (Math.random() - 0.5) * intensity;
    const shakeY = (Math.random() - 0.5) * intensity;

    this.state.x = originalX + shakeX;
    this.state.y = originalY + shakeY;
    this.applyTransform();

    // Restore original position after duration
    setTimeout(() => {
      this.state.x = originalX;
      this.state.y = originalY;
      this.applyTransform();
    }, duration);
  }

  /**
   * Apply transform to world container
   */
  private applyTransform(): void {
    const centerX = this.config.worldWidth / 2;
    const centerY = this.config.worldHeight / 2;

    const newScale = this.state.zoom;
    const newX = centerX - this.state.x * this.state.zoom;
    const newY = centerY - this.state.y * this.state.zoom;

    console.log('📷 Applying viewport transform:', {
      state: this.state,
      newScale,
      newPosition: { x: newX, y: newY },
      worldContainerBefore: {
        x: this.worldContainer.x,
        y: this.worldContainer.y,
        scaleX: this.worldContainer.scale.x,
        scaleY: this.worldContainer.scale.y
      }
    });

    this.worldContainer.scale.set(newScale);
    this.worldContainer.position.set(newX, newY);

    console.log('📷 Viewport transform applied:', {
      worldContainerAfter: {
        x: this.worldContainer.x,
        y: this.worldContainer.y,
        scaleX: this.worldContainer.scale.x,
        scaleY: this.worldContainer.scale.y
      }
    });
  }

  /**
   * Apply smooth transform for camera movement
   */
  private applySmoothTransform(deltaTime: number): void {
    // This could be enhanced with more sophisticated interpolation
    this.applyTransform();
  }

  /**
   * Clamp X position to world bounds with better boundary handling
   */
  private clampX(x: number): number {
    const halfViewWidth = (this.config.worldWidth / 2) / this.state.zoom;
    
    // Ensure camera can't go beyond map boundaries
    const minX = Math.max(halfViewWidth, 0 + halfViewWidth);
    const maxX = Math.min(this.bounds.width - halfViewWidth, this.bounds.width - halfViewWidth);
    
    // If map is smaller than viewport, center it
    if (this.bounds.width < this.config.worldWidth / this.state.zoom) {
      return this.bounds.width / 2;
    }
    
    return Math.max(minX, Math.min(maxX, x));
  }

  /**
   * Clamp Y position to world bounds with better boundary handling
   */
  private clampY(y: number): number {
    const halfViewHeight = (this.config.worldHeight / 2) / this.state.zoom;
    
    // Ensure camera can't go beyond map boundaries
    const minY = Math.max(halfViewHeight, 0 + halfViewHeight);
    const maxY = Math.min(this.bounds.height - halfViewHeight, this.bounds.height - halfViewHeight);
    
    // If map is smaller than viewport, center it
    if (this.bounds.height < this.config.worldHeight / this.state.zoom) {
      return this.bounds.height / 2;
    }
    
    return Math.max(minY, Math.min(maxY, y));
  }

  /**
   * Clamp position to world bounds
   */
  private clampPosition(): void {
    this.state.x = this.clampX(this.state.x);
    this.state.y = this.clampY(this.state.y);
  }

  /**
   * Clamp zoom to configured limits
   */
  private clampZoom(zoom: number): number {
    return Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
  }

  /**
   * Center the viewport to show the entire map optimally
   */
  public centerOnMap(): void {
    // Calculate the optimal zoom to fit the entire map
    const scaleX = this.config.worldWidth / this.bounds.width;
    const scaleY = this.config.worldHeight / this.bounds.height;
    const optimalZoom = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin
    
    // Clamp the zoom to our limits
    const newZoom = this.clampZoom(optimalZoom);
    
    // Center the map
    const centerX = this.bounds.width / 2;
    const centerY = this.bounds.height / 2;
    
    console.log('📷 Centering on map:', {
      bounds: this.bounds,
      viewport: { width: this.config.worldWidth, height: this.config.worldHeight },
      optimalZoom,
      newZoom,
      center: { x: centerX, y: centerY }
    });
    
    this.state.zoom = newZoom;
    this.state.x = centerX;
    this.state.y = centerY;
    
    this.applyTransform();
  }

  /**
   * Fit the map to viewport (alternative to centerOnMap)
   */
  public fitToViewport(): void {
    // Calculate zoom to fit map in viewport
    const zoomX = this.config.worldWidth / this.bounds.width;
    const zoomY = this.config.worldHeight / this.bounds.height;
    const fitZoom = Math.max(zoomX, zoomY) * 1.1; // 110% to ensure full coverage
    
    this.setZoom(this.clampZoom(fitZoom));
    this.moveTo({ x: this.bounds.width / 2, y: this.bounds.height / 2 });
  }

  /**
   * Get current viewport state
   */
  public getState(): ViewportState {
    return { ...this.state };
  }

  /**
   * Set viewport configuration
   */
  public setConfig(config: Partial<ViewportConfig>): void {
    this.config = { ...this.config, ...config };
    this.clampPosition();
    this.applyTransform();
  }

  /**
   * Enable/disable smooth camera movement
   */
  public setSmoothingEnabled(enabled: boolean): void {
    this.smoothing = enabled;
  }

  /**
   * Set smoothing factor for camera movement
   */
  public setSmoothingFactor(factor: number): void {
    this.smoothFactor = Math.max(0.01, Math.min(1, factor));
  }

  /**
   * Reset viewport to center
   */
  public reset(): void {
    this.state = {
      x: this.config.center.x,
      y: this.config.center.y,
      zoom: this.config.zoom,
      isDragging: false,
    };
    this.applyTransform();
  }

  /**
   * Animate zoom to target level
   */
  public animateZoomTo(targetZoom: number, duration: number, center?: Position): Promise<void> {
    return new Promise((resolve) => {
      const startZoom = this.state.zoom;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;

        this.setZoom(currentZoom, center);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopDrag();
  }
}