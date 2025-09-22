import { Texture, Rectangle } from 'pixi.js';
import { PERFORMANCE_CONFIG, DEFAULT_TEXTURES } from '@/constants/game';
import { Direction, TileType } from '@/types/game';

export interface AtlasFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextureAtlasData {
  frames: { [key: string]: AtlasFrame };
  meta: {
    size: { w: number; h: number };
    scale: number;
  };
}

/**
 * TextureAtlasSystem manages sprite sheets and texture atlases for optimal performance
 */
export class TextureAtlasSystem {
  private static instance: TextureAtlasSystem;
  private atlases: Map<string, Texture> = new Map();
  private textureCache: Map<string, Texture> = new Map();

  private constructor() {}

  public static getInstance(): TextureAtlasSystem {
    if (!TextureAtlasSystem.instance) {
      TextureAtlasSystem.instance = new TextureAtlasSystem();
    }
    return TextureAtlasSystem.instance;
  }

  /**
   * Initialize atlas system with default textures
   */
  public async initialize(): Promise<void> {
    // Create atlas for avatars
    await this.createAvatarAtlas();
    
    // Create atlas for tiles
    await this.createTileAtlas();
    
    console.log('Texture Atlas System initialized');
  }

  /**
   * Create avatar texture atlas
   */
  private async createAvatarAtlas(): Promise<void> {
    // Simplified implementation for now
    console.log('Avatar atlas creation - simplified implementation');
  }

  /**
   * Create tile texture atlas
   */
  private async createTileAtlas(): Promise<void> {
    // Simplified implementation for now
    console.log('Tile atlas creation - simplified implementation');
  }

  /**
   * Draw avatar sprite on canvas
   */
  private drawAvatarSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    direction: number,
    frame: number
  ): void {
    // Draw body
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(x, y, width, height);

    // Draw direction indicator
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const size = 4 + (frame % 2); // Simple animation

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

    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  /**
   * Draw tile sprite on canvas
   */
  private drawTileSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    tileType: number
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    // Add tile-specific details
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    // Add simple icons for different tile types
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Simple implementation without switch
    if (tileType === 1) ctx.fillText('■', centerX, centerY); // WALL
    else if (tileType === 2) ctx.fillText('▬', centerX, centerY); // DESK
    else if (tileType === 3) ctx.fillText('□', centerX, centerY); // CHAIR
    else if (tileType === 4) ctx.fillText('♠', centerX, centerY); // PLANT
    else if (tileType === 5) ctx.fillText('▯', centerX, centerY); // DOOR
    else if (tileType === 6) ctx.fillText('◇', centerX, centerY); // WINDOW
  }

  /**
   * Get texture for avatar
   */
  public getAvatarTexture(direction: Direction, frame: number): Texture | null {
    const key = `avatar_${direction}_${frame}`;
    return this.textureCache.get(key) || null;
  }

  /**
   * Get textures for avatar direction (all frames)
   */
  public getAvatarDirectionTextures(direction: Direction): Texture[] {
    const textures: Texture[] = [];
    for (let frame = 0; frame < 4; frame++) {
      const texture = this.getAvatarTexture(direction, frame);
      if (texture) textures.push(texture);
    }
    return textures;
  }

  /**
   * Get texture for tile
   */
  public getTileTexture(tileType: TileType): Texture | null {
    const key = `tile_${tileType}`;
    return this.textureCache.get(key) || null;
  }

  /**
   * Get atlas statistics
   */
  public getStats(): { textureCount: number; atlasCount: number; memoryUsage: string } {
    return {
      textureCount: this.textureCache.size,
      atlasCount: this.atlases.size,
      memoryUsage: `${Math.round(this.atlases.size * PERFORMANCE_CONFIG.textureAtlasSize / 1024)}KB`
    };
  }

  /**
   * Destroy all textures and atlases
   */
  public destroy(): void {
    this.textureCache.forEach(texture => texture.destroy());
    this.atlases.forEach(texture => texture.destroy());
    
    this.textureCache.clear();
    this.atlases.clear();
  }
}