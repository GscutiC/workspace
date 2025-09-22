import { AnimatedSprite, Texture, Rectangle } from 'pixi.js';
import type { AvatarData } from '@/types/game';
import { Direction } from '@/types/game';
import { ANIMATION_CONFIG, AVATAR_CONFIG } from '@/constants/game';

/**
 * Avatar Animation System
 * Manages animated sprites for avatars with 4-directional movement
 */
export class AvatarAnimationSystem {
  private static textureCache: Map<string, Texture[]> = new Map();
  private animatedSprites: Map<string, AnimatedSprite> = new Map();

  /**
   * Create animated sprite for avatar
   */
  public createAnimatedAvatar(avatar: AvatarData): AnimatedSprite {
    console.log('🎭 AvatarAnimationSystem.createAnimatedAvatar for:', avatar.id);
    
    try {
      console.log('🖼️ Getting avatar textures...');
      const textures = this.getAvatarTextures(avatar);
      console.log('✅ Got textures:', textures.length);
      
      console.log('🎬 Creating AnimatedSprite...');
      const animatedSprite = new AnimatedSprite(textures);

      // Configure animation
      animatedSprite.animationSpeed = AVATAR_CONFIG.animationSpeed;
      animatedSprite.loop = true;
      animatedSprite.anchor.set(0.5, 1); // Center-bottom anchor
      
      console.log('⚙️ AnimatedSprite configured:', {
        animationSpeed: animatedSprite.animationSpeed,
        anchor: animatedSprite.anchor,
        totalFrames: animatedSprite.totalFrames
      });

      // Set initial position and direction
      animatedSprite.x = avatar.position.x;
      animatedSprite.y = avatar.position.y;
      console.log('📍 Sprite positioned at:', { x: animatedSprite.x, y: animatedSprite.y });

      // Store reference
      this.animatedSprites.set(avatar.id, animatedSprite);
      console.log('💾 Sprite stored with ID:', avatar.id);

      // Set initial animation based on direction
      console.log('🎯 Setting initial animation...');
      this.updateAnimation(avatar.id, avatar.direction, false);
      console.log('✅ Initial animation set');

      console.log('🎉 AnimatedSprite creation completed for:', avatar.id);
      return animatedSprite;
      
    } catch (error) {
      console.error('❌ Error in createAnimatedAvatar:', error);
      throw error;
    }
  }

  /**
   * Update avatar animation based on movement state
   */
  public updateAnimation(avatarId: string, direction: Direction, isMoving: boolean): void {
    const sprite = this.animatedSprites.get(avatarId);
    if (!sprite) return;

    const frames = this.getFramesForDirection(direction, isMoving);
    
    // Ensure we have valid frames
    if (frames.length === 0) return;

    // Update textures for current direction
    sprite.textures = frames;
    sprite.gotoAndPlay(0);

    if (!isMoving) {
      // Show idle frame, but ensure it's within bounds
      const idleFrameIndex = Math.min(ANIMATION_CONFIG.idleFrame, frames.length - 1);
      sprite.gotoAndStop(idleFrameIndex);
    }
  }

  /**
   * Get textures for avatar (creates placeholder colored rectangles for now)
   */
  private getAvatarTextures(avatar: AvatarData): Texture[] {
    console.log('🖼️ Getting avatar textures for:', avatar.id, 'color:', avatar.color);
    
    const cacheKey = `${avatar.avatar}_${avatar.color}`;
    
    if (AvatarAnimationSystem.textureCache.has(cacheKey)) {
      console.log('💾 Using cached textures for:', cacheKey);
      return AvatarAnimationSystem.textureCache.get(cacheKey)!;
    }

    console.log('🎨 Creating new textures for:', cacheKey);
    const textures = this.createAvatarTextures(avatar);
    AvatarAnimationSystem.textureCache.set(cacheKey, textures);
    
    console.log('✅ Created', textures.length, 'textures for avatar');
    return textures;
  }

  /**
   * Create avatar textures (placeholder implementation)
   * TODO: Replace with actual sprite sheets
   */
  private createAvatarTextures(avatar: AvatarData): Texture[] {
    const textures: Texture[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = ANIMATION_CONFIG.frameSize.width * ANIMATION_CONFIG.framesPerDirection * 4; // 4 directions
    canvas.height = ANIMATION_CONFIG.frameSize.height;

    // Create frames for each direction
    for (let direction = 0; direction < 4; direction++) {
      for (let frame = 0; frame < ANIMATION_CONFIG.framesPerDirection; frame++) {
        const x = (direction * ANIMATION_CONFIG.framesPerDirection + frame) * ANIMATION_CONFIG.frameSize.width;
        
        // Draw avatar frame
        ctx.fillStyle = `#${avatar.color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(x, 0, ANIMATION_CONFIG.frameSize.width, ANIMATION_CONFIG.frameSize.height);
        
        // Add direction indicator
        this.drawDirectionIndicator(ctx, x, 0, direction, frame);
        
        // Create texture from canvas region
        const baseTexture = Texture.from(canvas);
        const texture = new Texture({
          source: baseTexture.source,
          frame: new Rectangle(x, 0, ANIMATION_CONFIG.frameSize.width, ANIMATION_CONFIG.frameSize.height)
        });
        
        textures.push(texture);
      }
    }

    return textures;
  }

  /**
   * Draw direction indicator on canvas
   */
  private drawDirectionIndicator(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    direction: number, 
    frame: number
  ): void {
    const centerX = x + ANIMATION_CONFIG.frameSize.width / 2;
    const centerY = y + ANIMATION_CONFIG.frameSize.height / 2;
    const size = 4 + (frame % 2); // Simple walk animation

    ctx.fillStyle = '#000000';
    ctx.beginPath();

    switch (direction) {
      case Direction.UP:
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX - size/2, centerY + size/2);
        ctx.lineTo(centerX + size/2, centerY + size/2);
        break;
      case Direction.DOWN:
        ctx.moveTo(centerX, centerY + size);
        ctx.lineTo(centerX - size/2, centerY - size/2);
        ctx.lineTo(centerX + size/2, centerY - size/2);
        break;
      case Direction.LEFT:
        ctx.moveTo(centerX - size, centerY);
        ctx.lineTo(centerX + size/2, centerY - size/2);
        ctx.lineTo(centerX + size/2, centerY + size/2);
        break;
      case Direction.RIGHT:
        ctx.moveTo(centerX + size, centerY);
        ctx.lineTo(centerX - size/2, centerY - size/2);
        ctx.lineTo(centerX - size/2, centerY + size/2);
        break;
    }

    ctx.closePath();
    ctx.fill();
  }

  /**
   * Get frame offset for direction
   */
  private getDirectionFrameOffset(direction: Direction): number {
    return direction * ANIMATION_CONFIG.framesPerDirection;
  }

  /**
   * Get frames for specific direction and movement state
   */
  private getFramesForDirection(direction: Direction, isMoving: boolean): Texture[] {
    const offset = this.getDirectionFrameOffset(direction);
    const allTextures = Array.from(AvatarAnimationSystem.textureCache.values())[0] || [];
    
    if (!isMoving) {
      // Return idle frame
      return [allTextures[offset + ANIMATION_CONFIG.idleFrame]];
    }

    // Return walking frames
    return allTextures.slice(offset, offset + ANIMATION_CONFIG.framesPerDirection);
  }

  /**
   * Update sprite position
   */
  public updatePosition(avatarId: string, position: { x: number; y: number }): void {
    const sprite = this.animatedSprites.get(avatarId);
    if (!sprite) return;

    sprite.x = position.x;
    sprite.y = position.y;
  }

  /**
   * Remove avatar sprite
   */
  public removeAvatar(avatarId: string): void {
    const sprite = this.animatedSprites.get(avatarId);
    if (sprite) {
      sprite.destroy();
      this.animatedSprites.delete(avatarId);
    }
  }

  /**
   * Destroy all animations
   */
  public destroy(): void {
    this.animatedSprites.forEach(sprite => sprite.destroy());
    this.animatedSprites.clear();
    AvatarAnimationSystem.textureCache.clear();
  }
}