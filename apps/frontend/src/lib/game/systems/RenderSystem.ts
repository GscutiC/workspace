import { Container, Graphics, Text, Sprite } from 'pixi.js';
import type { GameState, AvatarData, Position } from '@/types/game';
import { Direction, UserStatus, LayerType } from '@/types/game';
import { AVATAR_CONFIG } from '@/constants/game';
import { ObjectPool } from './ObjectPool';
import { AvatarAnimationSystem } from './AvatarAnimationSystem';
import { Viewport } from '../Viewport';

/**
 * RenderSystem handles all visual rendering of avatars, effects, and UI elements
 */
export class RenderSystem {
  private layers: Map<LayerType, Container>;
  private avatarSprites: Map<string, Container>;
  private chatBubbles: Map<string, Container>;
  private statusIndicators: Map<string, Graphics>;
  private nameLabels: Map<string, Text>;
  private objectPool: ObjectPool;
  private animationSystem: AvatarAnimationSystem;
  private lastRenderTime: number = 0;
  private viewport: Viewport;
  private cullingEnabled: boolean = true;
  private cullingMargin: number = 150;
  private debugMode: boolean = false;

  constructor(layers: Map<LayerType, Container>, objectPool: ObjectPool, viewport: Viewport) {
    this.layers = layers;
    this.objectPool = objectPool;
    this.viewport = viewport;
    this.avatarSprites = new Map();
    this.chatBubbles = new Map();
    this.statusIndicators = new Map();
    this.nameLabels = new Map();
    this.animationSystem = new AvatarAnimationSystem();
  }

  /**
   * Update render system
   */
  public update(deltaTime: number, gameState: GameState): void {
    this.lastRenderTime = performance.now();

    // Update avatar positions first
    this.updateAvatarPositions(gameState);

    // Update avatar animations
    this.updateAvatarAnimations(deltaTime, gameState);

    // Update chat bubble timeouts
    this.updateChatBubbles(deltaTime);

    // Cull off-screen objects for performance (disabled for debugging)
    // this.performFrustumCulling(gameState);
  }

  /**
   * Create avatar visual representation
   */
  public createAvatar(avatar: AvatarData): void {
    console.log(`🎨 Creating avatar: ${avatar.name} (${avatar.id})`);
    
    const avatarContainer = this.objectPool.getAvatarContainer();

    // Ensure container is visible and properly configured
    avatarContainer.visible = true;
    avatarContainer.alpha = 1;
    avatarContainer.name = `Avatar_${avatar.id}`;
    avatarContainer.zIndex = 100; // High z-index to ensure avatar is visible
    
    // Create animated avatar sprite
    const animatedSprite = this.animationSystem.createAnimatedAvatar(avatar);
    animatedSprite.name = `Sprite_${avatar.id}`;
    animatedSprite.visible = true;
    animatedSprite.alpha = 1;
    animatedSprite.zIndex = 1;
    avatarContainer.addChild(animatedSprite);

    // Create name label
    const nameLabel = this.createNameLabel(avatar.name, avatar.color);
    nameLabel.name = `NameLabel_${avatar.id}`;
    nameLabel.y = AVATAR_CONFIG.nameOffset.y;
    nameLabel.x = AVATAR_CONFIG.nameOffset.x;
    nameLabel.visible = true;
    nameLabel.alpha = 1;
    nameLabel.zIndex = 2;
    avatarContainer.addChild(nameLabel);

    // Create status indicator
    const statusIndicator = this.createStatusIndicator(avatar.status);
    statusIndicator.name = `Status_${avatar.id}`;
    statusIndicator.x = AVATAR_CONFIG.statusOffset.x;
    statusIndicator.y = AVATAR_CONFIG.statusOffset.y;
    statusIndicator.visible = true;
    statusIndicator.alpha = 1;
    statusIndicator.zIndex = 2;
    avatarContainer.addChild(statusIndicator);

    // Position avatar container
    avatarContainer.x = avatar.position.x;
    avatarContainer.y = avatar.position.y;

    // Store references
    this.avatarSprites.set(avatar.id, avatarContainer);
    this.nameLabels.set(avatar.id, nameLabel);
    this.statusIndicators.set(avatar.id, statusIndicator);

    // Add to character layer
    const characterLayer = this.layers.get(LayerType.CHARACTERS);
    if (characterLayer) {
      characterLayer.addChild(avatarContainer);
      console.log(`✅ Avatar ${avatar.name} added to scene at (${avatar.position.x}, ${avatar.position.y})`);
      
      // Debug information
      console.log(`🔍 Avatar container debug:`, {
        visible: avatarContainer.visible,
        alpha: avatarContainer.alpha,
        scale: avatarContainer.scale,
        zIndex: avatarContainer.zIndex,
        children: avatarContainer.children.length
      });
      
      console.log(`🔍 Character layer debug:`, {
        visible: characterLayer.visible,
        alpha: characterLayer.alpha,
        zIndex: characterLayer.zIndex,
        children: characterLayer.children.length
      });
    } else {
      console.error('❌ CHARACTERS layer not found!');
    }
  }

  /**
   * Update avatar positions to match game state
   */
  private updateAvatarPositions(gameState: GameState): void {
    gameState.avatars.forEach((avatar, userId) => {
      const avatarContainer = this.avatarSprites.get(userId);
      if (avatarContainer) {
        // Update container position
        avatarContainer.x = avatar.position.x;
        avatarContainer.y = avatar.position.y;
        
        // Ensure container is visible
        avatarContainer.visible = true;
        avatarContainer.alpha = 1;
        
        // Update animation system position
        this.animationSystem.updatePosition(userId, avatar.position);
      }
    });
  }

  /**
   * Remove avatar visual representation
   */
  public removeAvatar(userId: string): void {
    const avatarContainer = this.avatarSprites.get(userId);
    if (avatarContainer) {
      // Remove from layer
      avatarContainer.parent?.removeChild(avatarContainer);

      // Return to object pool
      this.objectPool.returnAvatarContainer(avatarContainer);

      // Clean up references
      this.avatarSprites.delete(userId);
      this.nameLabels.delete(userId);
      this.statusIndicators.delete(userId);

      // Remove chat bubble if exists
      this.removeChatBubble(userId);
    }
  }

  /**
   * Update avatar status visual
   */
  public updateAvatarStatus(userId: string, status: UserStatus): void {
    const statusIndicator = this.statusIndicators.get(userId);
    if (statusIndicator) {
      this.updateStatusIndicatorAppearance(statusIndicator, status);
    }
  }

  /**
   * Show chat bubble for avatar
   */
  public showChatBubble(userId: string, message: string, duration: number = 5000): void {
    // Remove existing bubble
    this.removeChatBubble(userId);

    const avatarContainer = this.avatarSprites.get(userId);
    if (!avatarContainer) return;

    const bubble = this.createChatBubble(message);
    bubble.y = -AVATAR_CONFIG.size.height - 60;

    avatarContainer.addChild(bubble);
    this.chatBubbles.set(userId, bubble);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeChatBubble(userId);
    }, duration);
  }

  /**
   * Remove chat bubble
   */
  public removeChatBubble(userId: string): void {
    const bubble = this.chatBubbles.get(userId);
    if (bubble) {
      bubble.parent?.removeChild(bubble);
      this.objectPool.returnChatBubble(bubble);
      this.chatBubbles.delete(userId);
    }
  }

  /**
   * Create avatar graphics (using Graphics instead of Sprite to avoid texture issues)
   */
  private createAvatarSprite(avatar: AvatarData): Graphics {
    // Create graphics directly instead of converting to sprite
    // This avoids texture generation issues in Pixi.js v8
    const graphics = new Graphics();
    graphics
      .rect(0, 0, AVATAR_CONFIG.size.width, AVATAR_CONFIG.size.height)
      .fill(avatar.color);

    // Add direction indicator
    this.addDirectionIndicator(graphics, avatar.direction);

    // Set pivot to center-bottom for proper positioning
    graphics.pivot.set(AVATAR_CONFIG.size.width / 2, AVATAR_CONFIG.size.height);

    return graphics;
  }

  /**
   * Add direction indicator to avatar sprite
   */
  private addDirectionIndicator(graphics: Graphics, direction: Direction): void {
    const centerX = AVATAR_CONFIG.size.width / 2;
    const centerY = AVATAR_CONFIG.size.height / 2;
    const indicatorSize = 8;

    graphics.fill(0x000000);

    switch (direction) {
      case Direction.UP:
        graphics
          .moveTo(centerX, centerY - indicatorSize)
          .lineTo(centerX - indicatorSize/2, centerY + indicatorSize/2)
          .lineTo(centerX + indicatorSize/2, centerY + indicatorSize/2)
          .closePath()
          .fill();
        break;
      case Direction.DOWN:
        graphics
          .moveTo(centerX, centerY + indicatorSize)
          .lineTo(centerX - indicatorSize/2, centerY - indicatorSize/2)
          .lineTo(centerX + indicatorSize/2, centerY - indicatorSize/2)
          .closePath()
          .fill();
        break;
      case Direction.LEFT:
        graphics
          .moveTo(centerX - indicatorSize, centerY)
          .lineTo(centerX + indicatorSize/2, centerY - indicatorSize/2)
          .lineTo(centerX + indicatorSize/2, centerY + indicatorSize/2)
          .closePath()
          .fill();
        break;
      case Direction.RIGHT:
        graphics
          .moveTo(centerX + indicatorSize, centerY)
          .lineTo(centerX - indicatorSize/2, centerY - indicatorSize/2)
          .lineTo(centerX - indicatorSize/2, centerY + indicatorSize/2)
          .closePath()
          .fill();
        break;
    }
  }

  /**
   * Create name label for avatar
   */
  private createNameLabel(name: string, color: number): Text {
    console.log('🎨 Creating name label with text:', name);
    
    const nameLabel = new Text({
      text: name,
      style: {
        fontSize: 14, // Normal size
        fill: 0xffffff, // White text for visibility
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 2 }, // Black outline
        align: 'center',
        dropShadow: {
          color: 0x000000,
          blur: 3,
          angle: Math.PI / 6,
          distance: 2,
        },
      },
    });

    nameLabel.anchor.set(0.5, 1);
    nameLabel.visible = true;
    nameLabel.alpha = 1.0;
    
    console.log('🎨 Name label created with dimensions:', nameLabel.width, 'x', nameLabel.height);
    console.log('🎨 Name label text content:', nameLabel.text);
    
    return nameLabel;
  }

  /**
   * Create status indicator
   */
  private createStatusIndicator(status: UserStatus): Graphics {
    const indicator = new Graphics();
    this.updateStatusIndicatorAppearance(indicator, status);
    return indicator;
  }

  /**
   * Update status indicator appearance
   */
  private updateStatusIndicatorAppearance(indicator: Graphics, status: UserStatus): void {
    indicator.clear();

    let color: number;
    switch (status) {
      case UserStatus.AVAILABLE:
        color = 0x00FF00; // Green
        break;
      case UserStatus.BUSY:
        color = 0xFF0000; // Red
        break;
      case UserStatus.AWAY:
        color = 0xFFFF00; // Yellow
        break;
      default:
        color = 0x808080; // Gray
    }

    indicator
      .circle(0, 0, 5)
      .fill(color)
      .stroke({ width: 1, color: 0x000000 });
  }

  /**
   * Create chat bubble
   */
  private createChatBubble(message: string): Container {
    const bubble = this.objectPool.getChatBubble();
    bubble.removeChildren(); // Clear any existing content

    // Create background
    const maxWidth = 200;
    const padding = 10;

    // Create text
    const text = new Text({
      text: message,
      style: {
        fontSize: 11,
        fill: 0x000000,
        fontFamily: 'Arial',
        wordWrap: true,
        wordWrapWidth: maxWidth - padding * 2,
        align: 'left',
      },
    });

    const textWidth = Math.min(text.width, maxWidth - padding * 2);
    const textHeight = text.height;

    // Create background graphics
    const bg = new Graphics();
    bg
      .roundRect(0, 0, textWidth + padding * 2, textHeight + padding * 2, 8)
      .fill(0xFFFFFF)
      .stroke({ width: 1, color: 0x000000 });

    // Create tail
    const tailSize = 8;
    bg
      .moveTo((textWidth + padding * 2) / 2 - tailSize, textHeight + padding * 2)
      .lineTo((textWidth + padding * 2) / 2, textHeight + padding * 2 + tailSize)
      .lineTo((textWidth + padding * 2) / 2 + tailSize, textHeight + padding * 2)
      .fill();

    bubble.addChild(bg);

    // Position text
    text.x = padding;
    text.y = padding;
    bubble.addChild(text);

    // Center the bubble
    bubble.pivot.set((textWidth + padding * 2) / 2, 0);

    return bubble;
  }

  /**
   * Update avatar animations
   */
  private updateAvatarAnimations(deltaTime: number, gameState: GameState): void {
    // Update avatar positions with smooth interpolation
    for (const [userId, avatarContainer] of this.avatarSprites) {
      const avatar = gameState.avatars.get(userId);
      if (!avatar) continue;

      // Smooth movement interpolation
      const lerpFactor = Math.min(deltaTime * 10, 1); // Adjust speed as needed
      avatarContainer.x += (avatar.position.x - avatarContainer.x) * lerpFactor;
      avatarContainer.y += (avatar.position.y - avatarContainer.y) * lerpFactor;

      // Update sprite direction if changed
      this.updateAvatarDirection(avatarContainer, avatar.direction);

      // Add walking animation bob effect
      if (this.isAvatarMoving(avatar, gameState)) {
        const bobOffset = Math.sin(performance.now() * 0.01) * 2;
        avatarContainer.y += bobOffset;
      }
    }
  }

  /**
   * Update avatar direction visual
   */
  private updateAvatarDirection(avatarContainer: Container, direction: Direction): void {
    // This would update the sprite frame based on direction
    // For now, we'll just rotate the container slightly
    const rotationMap = {
      [Direction.UP]: 0,
      [Direction.RIGHT]: 0.1,
      [Direction.DOWN]: 0,
      [Direction.LEFT]: -0.1,
    };

    avatarContainer.rotation = rotationMap[direction] || 0;
  }

  /**
   * Check if avatar is currently moving
   */
  private isAvatarMoving(_avatar: AvatarData, _gameState: GameState): boolean {
    // This would check movement system state
    return false; // Placeholder
  }

  /**
   * Update chat bubbles
   */
  private updateChatBubbles(deltaTime: number): void {
    // Add subtle floating animation to chat bubbles
    for (const [userId, bubble] of this.chatBubbles) {
      const floatOffset = Math.sin(performance.now() * 0.005) * 3;
      bubble.y = -AVATAR_CONFIG.size.height - 60 + floatOffset;
    }
  }

  /**
   * Perform frustum culling for performance
   */
  private performFrustumCulling(gameState: GameState): void {
    if (!this.viewport || !this.cullingEnabled) {
      // If culling is disabled, ensure all avatars are visible
      if (!this.cullingEnabled) {
        for (const [userId, avatarContainer] of this.avatarSprites) {
          avatarContainer.visible = true;
        }
      }
      return;
    }

    // Use proper viewport bounds instead of hardcoded values
    const viewportBounds = this.viewport.getVisibleBounds();
    
    const visibleBounds = {
      x: viewportBounds.x - this.cullingMargin,
      y: viewportBounds.y - this.cullingMargin,
      width: viewportBounds.width + (this.cullingMargin * 2),
      height: viewportBounds.height + (this.cullingMargin * 2),
    };

    if (this.debugMode) {
      console.log(`🔍 Culling bounds:`, visibleBounds);
      console.log(`📐 Viewport bounds:`, viewportBounds);
    }

    // Hide/show avatars based on visibility with improved logging
    for (const [userId, avatarContainer] of this.avatarSprites) {
      const avatar = gameState.avatars.get(userId);
      if (!avatar) continue;
      
      const wasVisible = avatarContainer.visible;
      const isVisible = this.isPositionInBounds(avatar.position, visibleBounds);
      
      if (wasVisible !== isVisible || this.debugMode) {
        console.log(`👁️ Avatar ${avatar.name} visibility: ${wasVisible} -> ${isVisible} at (${avatar.position.x}, ${avatar.position.y})`);
        if (this.debugMode) {
          console.log(`� Position in bounds: x(${avatar.position.x} in ${visibleBounds.x}-${visibleBounds.x + visibleBounds.width}) y(${avatar.position.y} in ${visibleBounds.y}-${visibleBounds.y + visibleBounds.height})`);
        }
      }
      
      avatarContainer.visible = isVisible;
    }
  }

  /**
   * Enable or disable frustum culling
   */
  public setCullingEnabled(enabled: boolean): void {
    console.log(`🎛️ Frustum culling ${enabled ? 'enabled' : 'disabled'}`);
    this.cullingEnabled = enabled;
  }

  /**
   * Set culling margin for fine-tuning
   */
  public setCullingMargin(margin: number): void {
    console.log(`📏 Culling margin set to: ${margin}px`);
    this.cullingMargin = margin;
  }

  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    console.log(`🐛 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    this.debugMode = enabled;
  }

  /**
   * Get current culling stats
   */
  public getCullingStats(): { total: number; visible: number; hidden: number } {
    const total = this.avatarSprites.size;
    let visible = 0;
    let hidden = 0;

    for (const [, avatarContainer] of this.avatarSprites) {
      if (avatarContainer.visible) {
        visible++;
      } else {
        hidden++;
      }
    }

    return { total, visible, hidden };
  }  /**
   * Check if position is within bounds
   */
  private isPositionInBounds(position: Position, bounds: { x: number; y: number; width: number; height: number }): boolean {
    return (
      position.x >= bounds.x &&
      position.x <= bounds.x + bounds.width &&
      position.y >= bounds.y &&
      position.y <= bounds.y + bounds.height
    );
  }

  /**
   * Add visual effects (screen shake, fade, etc.)
   */
  public addScreenShake(intensity: number, duration: number): void {
    const characterLayer = this.layers.get(LayerType.CHARACTERS);
    if (!characterLayer) return;

    const originalX = characterLayer.x;
    const originalY = characterLayer.y;
    const startTime = performance.now();

    const shake = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= duration) {
        characterLayer.x = originalX;
        characterLayer.y = originalY;
        return;
      }

      const shakeIntensity = intensity * (1 - elapsed / duration);
      characterLayer.x = originalX + (Math.random() - 0.5) * shakeIntensity;
      characterLayer.y = originalY + (Math.random() - 0.5) * shakeIntensity;

      requestAnimationFrame(shake);
    };

    shake();
  }

  /**
   * Get render statistics
   */
  public getRenderStats(): { avatarsRendered: number; chatBubbles: number; renderTime: number } {
    return {
      avatarsRendered: this.avatarSprites.size,
      chatBubbles: this.chatBubbles.size,
      renderTime: this.lastRenderTime,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Clean up all avatar sprites
    for (const [userId, avatarContainer] of this.avatarSprites) {
      avatarContainer.destroy();
    }
    this.avatarSprites.clear();

    // Clean up chat bubbles
    for (const [userId, bubble] of this.chatBubbles) {
      bubble.destroy();
    }
    this.chatBubbles.clear();

    // Clean up other resources
    this.statusIndicators.clear();
    this.nameLabels.clear();
  }
}