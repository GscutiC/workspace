import { Container, Sprite, Text, Graphics } from 'pixi.js';

/**
 * ObjectPool manages reusable game objects for performance optimization
 * Reduces garbage collection by reusing containers, sprites, and other objects
 */
export class ObjectPool {
  private avatarContainers: Container[] = [];
  private chatBubbles: Container[] = [];
  private textObjects: Text[] = [];
  private sprites: Sprite[] = [];
  private graphics: Graphics[] = [];

  // Pool statistics
  private stats = {
    avatarContainersCreated: 0,
    avatarContainersReused: 0,
    chatBubblesCreated: 0,
    chatBubblesReused: 0,
    textObjectsCreated: 0,
    textObjectsReused: 0,
    spritesCreated: 0,
    spritesReused: 0,
    graphicsCreated: 0,
    graphicsReused: 0,
  };

  // Pool configuration
  private readonly maxPoolSize = {
    avatarContainers: 50,
    chatBubbles: 100,
    textObjects: 200,
    sprites: 300,
    graphics: 100,
  };

  /**
   * Get an avatar container from the pool or create a new one
   */
  public getAvatarContainer(): Container {
    if (this.avatarContainers.length > 0) {
      const container = this.avatarContainers.pop()!;
      this.resetContainer(container);
      this.stats.avatarContainersReused++;
      return container;
    }

    // Create new container
    const container = new Container();
    container.sortableChildren = true;
    this.stats.avatarContainersCreated++;
    return container;
  }

  /**
   * Return an avatar container to the pool
   */
  public returnAvatarContainer(container: Container): void {
    if (this.avatarContainers.length < this.maxPoolSize.avatarContainers) {
      this.cleanContainer(container);
      this.avatarContainers.push(container);
    } else {
      // Pool is full, destroy the container
      container.destroy();
    }
  }

  /**
   * Get a chat bubble container from the pool or create a new one
   */
  public getChatBubble(): Container {
    if (this.chatBubbles.length > 0) {
      const bubble = this.chatBubbles.pop()!;
      this.resetContainer(bubble);
      this.stats.chatBubblesReused++;
      return bubble;
    }

    // Create new chat bubble container
    const bubble = new Container();
    this.stats.chatBubblesCreated++;
    return bubble;
  }

  /**
   * Return a chat bubble to the pool
   */
  public returnChatBubble(bubble: Container): void {
    if (this.chatBubbles.length < this.maxPoolSize.chatBubbles) {
      this.cleanContainer(bubble);
      this.chatBubbles.push(bubble);
    } else {
      // Pool is full, destroy the bubble
      bubble.destroy();
    }
  }

  /**
   * Get a text object from the pool or create a new one
   */
  public getTextObject(): Text {
    if (this.textObjects.length > 0) {
      const text = this.textObjects.pop()!;
      this.resetTextObject(text);
      this.stats.textObjectsReused++;
      return text;
    }

    // Create new text object
    const text = new Text();
    this.stats.textObjectsCreated++;
    return text;
  }

  /**
   * Return a text object to the pool
   */
  public returnTextObject(text: Text): void {
    if (this.textObjects.length < this.maxPoolSize.textObjects) {
      this.cleanTextObject(text);
      this.textObjects.push(text);
    } else {
      // Pool is full, destroy the text
      text.destroy();
    }
  }

  /**
   * Get a sprite from the pool or create a new one
   */
  public getSprite(): Sprite {
    if (this.sprites.length > 0) {
      const sprite = this.sprites.pop()!;
      this.resetSprite(sprite);
      this.stats.spritesReused++;
      return sprite;
    }

    // Create new sprite
    const sprite = new Sprite();
    this.stats.spritesCreated++;
    return sprite;
  }

  /**
   * Return a sprite to the pool
   */
  public returnSprite(sprite: Sprite): void {
    if (this.sprites.length < this.maxPoolSize.sprites) {
      this.cleanSprite(sprite);
      this.sprites.push(sprite);
    } else {
      // Pool is full, destroy the sprite
      sprite.destroy();
    }
  }

  /**
   * Get a graphics object from the pool or create a new one
   */
  public getGraphics(): Graphics {
    if (this.graphics.length > 0) {
      const graphics = this.graphics.pop()!;
      this.resetGraphics(graphics);
      this.stats.graphicsReused++;
      return graphics;
    }

    // Create new graphics object
    const graphics = new Graphics();
    this.stats.graphicsCreated++;
    return graphics;
  }

  /**
   * Return a graphics object to the pool
   */
  public returnGraphics(graphics: Graphics): void {
    if (this.graphics.length < this.maxPoolSize.graphics) {
      this.cleanGraphics(graphics);
      this.graphics.push(graphics);
    } else {
      // Pool is full, destroy the graphics
      graphics.destroy();
    }
  }

  /**
   * Reset container to default state for reuse
   */
  private resetContainer(container: Container): void {
    container.x = 0;
    container.y = 0;
    container.rotation = 0;
    container.scale.set(1, 1);
    container.alpha = 1;
    container.visible = true;
    container.pivot.set(0, 0);
    container.skew.set(0, 0);
    container.tint = 0xFFFFFF;
  }

  /**
   * Clean container before returning to pool
   */
  private cleanContainer(container: Container): void {
    // Remove all children but don't destroy them (they might be pooled too)
    container.removeChildren();

    // Remove from parent if it has one
    if (container.parent) {
      container.parent.removeChild(container);
    }

    // Reset properties
    this.resetContainer(container);
  }

  /**
   * Reset text object to default state
   */
  private resetTextObject(text: Text): void {
    text.text = '';
    text.x = 0;
    text.y = 0;
    text.rotation = 0;
    text.scale.set(1, 1);
    text.alpha = 1;
    text.visible = true;
    text.anchor.set(0, 0);
    text.pivot.set(0, 0);
    text.tint = 0xFFFFFF;
  }

  /**
   * Clean text object before returning to pool
   */
  private cleanTextObject(text: Text): void {
    if (text.parent) {
      text.parent.removeChild(text);
    }
    this.resetTextObject(text);
  }

  /**
   * Reset sprite to default state
   */
  private resetSprite(sprite: Sprite): void {
    sprite.x = 0;
    sprite.y = 0;
    sprite.rotation = 0;
    sprite.scale.set(1, 1);
    sprite.alpha = 1;
    sprite.visible = true;
    sprite.anchor.set(0, 0);
    sprite.pivot.set(0, 0);
    sprite.tint = 0xFFFFFF;
    sprite.texture = Sprite.EMPTY.texture;
  }

  /**
   * Clean sprite before returning to pool
   */
  private cleanSprite(sprite: Sprite): void {
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }
    this.resetSprite(sprite);
  }

  /**
   * Reset graphics to default state
   */
  private resetGraphics(graphics: Graphics): void {
    graphics.clear();
    graphics.x = 0;
    graphics.y = 0;
    graphics.rotation = 0;
    graphics.scale.set(1, 1);
    graphics.alpha = 1;
    graphics.visible = true;
    graphics.pivot.set(0, 0);
    graphics.tint = 0xFFFFFF;
  }

  /**
   * Clean graphics before returning to pool
   */
  private cleanGraphics(graphics: Graphics): void {
    if (graphics.parent) {
      graphics.parent.removeChild(graphics);
    }
    this.resetGraphics(graphics);
  }

  /**
   * Warm up the pool with pre-created objects
   */
  public warmUp(): void {
    // Pre-create some commonly used objects
    const warmUpCounts = {
      avatarContainers: 10,
      chatBubbles: 20,
      textObjects: 30,
      sprites: 50,
      graphics: 15,
    };

    // Create avatar containers
    for (let i = 0; i < warmUpCounts.avatarContainers; i++) {
      const container = new Container();
      container.sortableChildren = true;
      this.avatarContainers.push(container);
      this.stats.avatarContainersCreated++;
    }

    // Create chat bubbles
    for (let i = 0; i < warmUpCounts.chatBubbles; i++) {
      this.chatBubbles.push(new Container());
      this.stats.chatBubblesCreated++;
    }

    // Create text objects
    for (let i = 0; i < warmUpCounts.textObjects; i++) {
      this.textObjects.push(new Text());
      this.stats.textObjectsCreated++;
    }

    // Create sprites
    for (let i = 0; i < warmUpCounts.sprites; i++) {
      this.sprites.push(new Sprite());
      this.stats.spritesCreated++;
    }

    // Create graphics
    for (let i = 0; i < warmUpCounts.graphics; i++) {
      this.graphics.push(new Graphics());
      this.stats.graphicsCreated++;
    }
  }

  /**
   * Get pool statistics
   */
  public getStats(): typeof this.stats & {
    poolSizes: {
      avatarContainers: number;
      chatBubbles: number;
      textObjects: number;
      sprites: number;
      graphics: number;
    };
    reuseRates: {
      avatarContainers: number;
      chatBubbles: number;
      textObjects: number;
      sprites: number;
      graphics: number;
    };
  } {
    const calculateReuseRate = (reused: number, created: number): number => {
      const total = reused + created;
      return total > 0 ? (reused / total) * 100 : 0;
    };

    return {
      ...this.stats,
      poolSizes: {
        avatarContainers: this.avatarContainers.length,
        chatBubbles: this.chatBubbles.length,
        textObjects: this.textObjects.length,
        sprites: this.sprites.length,
        graphics: this.graphics.length,
      },
      reuseRates: {
        avatarContainers: calculateReuseRate(
          this.stats.avatarContainersReused,
          this.stats.avatarContainersCreated
        ),
        chatBubbles: calculateReuseRate(
          this.stats.chatBubblesReused,
          this.stats.chatBubblesCreated
        ),
        textObjects: calculateReuseRate(
          this.stats.textObjectsReused,
          this.stats.textObjectsCreated
        ),
        sprites: calculateReuseRate(
          this.stats.spritesReused,
          this.stats.spritesCreated
        ),
        graphics: calculateReuseRate(
          this.stats.graphicsReused,
          this.stats.graphicsCreated
        ),
      },
    };
  }

  /**
   * Clear all pools and destroy objects
   */
  public clear(): void {
    // Destroy all pooled objects
    this.avatarContainers.forEach(container => container.destroy());
    this.chatBubbles.forEach(bubble => bubble.destroy());
    this.textObjects.forEach(text => text.destroy());
    this.sprites.forEach(sprite => sprite.destroy());
    this.graphics.forEach(graphics => graphics.destroy());

    // Clear arrays
    this.avatarContainers.length = 0;
    this.chatBubbles.length = 0;
    this.textObjects.length = 0;
    this.sprites.length = 0;
    this.graphics.length = 0;

    // Reset stats
    this.stats = {
      avatarContainersCreated: 0,
      avatarContainersReused: 0,
      chatBubblesCreated: 0,
      chatBubblesReused: 0,
      textObjectsCreated: 0,
      textObjectsReused: 0,
      spritesCreated: 0,
      spritesReused: 0,
      graphicsCreated: 0,
      graphicsReused: 0,
    };
  }

  /**
   * Optimize pool sizes based on usage patterns
   */
  public optimize(): void {
    // This could be enhanced with more sophisticated optimization logic
    // For now, we'll just trim pools that are too large

    const trimIfNeeded = (pool: { destroy(): void }[], maxSize: number) => {
      if (pool.length > maxSize) {
        const excess = pool.splice(maxSize);
        excess.forEach(obj => obj.destroy());
      }
    };

    trimIfNeeded(this.avatarContainers, this.maxPoolSize.avatarContainers);
    trimIfNeeded(this.chatBubbles, this.maxPoolSize.chatBubbles);
    trimIfNeeded(this.textObjects, this.maxPoolSize.textObjects);
    trimIfNeeded(this.sprites, this.maxPoolSize.sprites);
    trimIfNeeded(this.graphics, this.maxPoolSize.graphics);
  }

  /**
   * Set maximum pool sizes
   */
  public setMaxPoolSizes(sizes: Partial<typeof this.maxPoolSize>): void {
    Object.assign(this.maxPoolSize, sizes);
    this.optimize(); // Trim if necessary
  }

  /**
   * Get current pool efficiency metrics
   */
  public getEfficiencyMetrics(): {
    memoryUsage: number; // Estimated memory usage in MB
    averageReuseRate: number; // Overall reuse rate percentage
    totalObjectsManaged: number; // Total objects in all pools
  } {
    const stats = this.getStats();

    // Rough estimation of memory usage (very approximate)
    const memoryUsage = (
      (stats.poolSizes.avatarContainers * 1000) + // ~1KB per container
      (stats.poolSizes.chatBubbles * 500) +       // ~0.5KB per bubble
      (stats.poolSizes.textObjects * 200) +       // ~200B per text
      (stats.poolSizes.sprites * 300) +           // ~300B per sprite
      (stats.poolSizes.graphics * 400)            // ~400B per graphics
    ) / 1024 / 1024; // Convert to MB

    const totalReused = Object.values(stats.reuseRates).reduce((a, b) => a + b, 0);
    const averageReuseRate = totalReused / Object.keys(stats.reuseRates).length;

    const totalObjectsManaged = Object.values(stats.poolSizes).reduce((a, b) => a + b, 0);

    return {
      memoryUsage,
      averageReuseRate,
      totalObjectsManaged,
    };
  }

  /**
   * Cleanup and destroy all pooled objects
   */
  public destroy(): void {
    this.clear();
  }
}