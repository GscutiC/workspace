import { Container, Text, Graphics } from 'pixi.js';
import { AVATAR_CONFIG, TEXT_CONFIG } from '@/constants/game';

/**
 * FloatingNameSystem handles avatar name labels with professional styling
 */
export class FloatingNameSystem {
  private nameContainers: Map<string, Container> = new Map();

  /**
   * Create floating name label for avatar
   */
  public createNameLabel(avatarId: string, name: string, color: number): Container {
    const container = new Container();

    // Create background for name
    const background = new Graphics();
    const nameText = new Text({
      text: name,
      style: {
        fontFamily: TEXT_CONFIG.fontFamily,
        fontSize: TEXT_CONFIG.fontSize.small,
        fill: TEXT_CONFIG.colors.primary,
        fontWeight: 'bold',
      }
    });

    // Calculate background size based on text
    const padding = 8;
    const backgroundWidth = nameText.width + padding * 2;
    const backgroundHeight = nameText.height + padding;

    // Draw rounded background
    background
      .roundRect(-backgroundWidth / 2, -backgroundHeight, backgroundWidth, backgroundHeight, 6)
      .fill(0x000000)
      .stroke({ color: color, width: 2 });

    // Set background alpha
    background.alpha = 0.8;

    // Center text
    nameText.anchor.set(0.5, 1);
    nameText.x = 0;
    nameText.y = -padding / 2;

    // Add to container
    container.addChild(background);
    container.addChild(nameText);

    // Position above avatar
    container.y = AVATAR_CONFIG.nameOffset.y;

    // Store reference
    this.nameContainers.set(avatarId, container);

    return container;
  }

  /**
   * Update name label position and visibility
   */
  public updateNameLabel(avatarId: string, position: { x: number; y: number }): void {
    const nameContainer = this.nameContainers.get(avatarId);
    if (!nameContainer) return;

    // Smooth floating animation
    const time = Date.now() * 0.002;
    const floatOffset = Math.sin(time + position.x * 0.01) * 2;
    
    nameContainer.y = AVATAR_CONFIG.nameOffset.y + floatOffset;
  }

  /**
   * Update name text
   */
  public updateNameText(avatarId: string, newName: string): void {
    const nameContainer = this.nameContainers.get(avatarId);
    if (!nameContainer) return;

    const nameText = nameContainer.children[1] as Text;
    if (nameText) {
      nameText.text = newName;
      
      // Update background size
      const background = nameContainer.children[0] as Graphics;
      const padding = 8;
      const backgroundWidth = nameText.width + padding * 2;
      const backgroundHeight = nameText.height + padding;
      
      background.clear();
      background
        .roundRect(-backgroundWidth / 2, -backgroundHeight, backgroundWidth, backgroundHeight, 6)
        .fill(0x000000)
        .stroke({ color: 0x4F46E5, width: 2 });
      background.alpha = 0.8;
    }
  }

  /**
   * Set name visibility
   */
  public setNameVisibility(avatarId: string, visible: boolean): void {
    const nameContainer = this.nameContainers.get(avatarId);
    if (nameContainer) {
      nameContainer.visible = visible;
    }
  }

  /**
   * Remove name label
   */
  public removeNameLabel(avatarId: string): void {
    const nameContainer = this.nameContainers.get(avatarId);
    if (nameContainer) {
      nameContainer.destroy();
      this.nameContainers.delete(avatarId);
    }
  }

  /**
   * Destroy all name labels
   */
  public destroy(): void {
    this.nameContainers.forEach(container => container.destroy());
    this.nameContainers.clear();
  }
}