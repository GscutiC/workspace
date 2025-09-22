import { Container, Graphics, Text } from 'pixi.js';
import { UserStatus } from '@/types/game';
import { AVATAR_CONFIG, TEXT_CONFIG } from '@/constants/game';

export interface StatusIndicatorConfig {
  size: number;
  offset: { x: number; y: number };
  showIcon: boolean;
  showText: boolean;
  animated: boolean;
}

/**
 * StatusIndicatorSystem handles professional status indicators with icons and animations
 */
export class StatusIndicatorSystem {
  private indicators: Map<string, Container> = new Map();
  private animations: Map<string, { startTime: number; type: string }> = new Map();

  /**
   * Create status indicator for avatar
   */
  public createStatusIndicator(
    avatarId: string,
    status: UserStatus,
    config: Partial<StatusIndicatorConfig> = {}
  ): Container {
    // Remove existing indicator
    this.removeStatusIndicator(avatarId);

    const settings: StatusIndicatorConfig = {
      size: 16,
      offset: AVATAR_CONFIG.statusOffset,
      showIcon: true,
      showText: false,
      animated: true,
      ...config
    };

    const container = new Container();

    // Create background circle
    const background = new Graphics();
    this.drawStatusBackground(background, status, settings.size);

    // Create status icon
    if (settings.showIcon) {
      const icon = this.createStatusIcon(status, settings.size);
      container.addChild(icon);
    }

    // Create status text (optional)
    if (settings.showText) {
      const text = this.createStatusText(status);
      text.x = settings.size + 5;
      text.y = -text.height / 2;
      container.addChild(text);
    }

    container.addChild(background);

    // Position indicator
    container.x = settings.offset.x;
    container.y = settings.offset.y;

    // Add animations
    if (settings.animated) {
      this.startAnimation(avatarId, status);
    }

    // Store reference
    this.indicators.set(avatarId, container);

    return container;
  }

  /**
   * Draw status background
   */
  private drawStatusBackground(graphics: Graphics, status: UserStatus, size: number): void {
    const colors = this.getStatusColors(status);
    
    graphics
      .circle(0, 0, size / 2)
      .fill(colors.background)
      .stroke({ color: colors.border, width: 2 });
  }

  /**
   * Create status icon
   */
  private createStatusIcon(status: UserStatus, size: number): Graphics {
    const icon = new Graphics();
    const colors = this.getStatusColors(status);
    
    icon.fill(colors.icon);

    switch (status) {
      case UserStatus.AVAILABLE:
        // Check mark
        icon
          .moveTo(-size/4, -size/8)
          .lineTo(-size/8, size/8)
          .lineTo(size/4, -size/4)
          .stroke({ color: colors.icon, width: 2 });
        break;

      case UserStatus.BUSY:
        // X mark
        icon
          .moveTo(-size/4, -size/4)
          .lineTo(size/4, size/4)
          .moveTo(size/4, -size/4)
          .lineTo(-size/4, size/4)
          .stroke({ color: colors.icon, width: 2 });
        break;

      case UserStatus.AWAY:
        // Clock icon
        icon
          .circle(0, 0, size/6)
          .fill(colors.icon)
          .moveTo(0, 0)
          .lineTo(0, -size/6)
          .moveTo(0, 0)
          .lineTo(size/8, 0)
          .stroke({ color: colors.icon, width: 1 });
        break;

      case UserStatus.OFFLINE:
        // Empty circle
        icon
          .circle(0, 0, size/6)
          .stroke({ color: colors.icon, width: 2 });
        break;
    }

    return icon;
  }

  /**
   * Create status text
   */
  private createStatusText(status: UserStatus): Text {
    const statusTexts = {
      [UserStatus.AVAILABLE]: 'Available',
      [UserStatus.BUSY]: 'Busy',
      [UserStatus.AWAY]: 'Away',
      [UserStatus.OFFLINE]: 'Offline'
    };

    return new Text({
      text: statusTexts[status],
      style: {
        fontFamily: TEXT_CONFIG.fontFamily,
        fontSize: TEXT_CONFIG.fontSize.small,
        fill: TEXT_CONFIG.colors.primary,
        fontWeight: 'bold',
      }
    });
  }

  /**
   * Get status colors
   */
  private getStatusColors(status: UserStatus): { background: number; border: number; icon: number } {
    switch (status) {
      case UserStatus.AVAILABLE:
        return {
          background: 0x10B981, // Green
          border: 0x059669,
          icon: 0xFFFFFF
        };
      case UserStatus.BUSY:
        return {
          background: 0xEF4444, // Red
          border: 0xDC2626,
          icon: 0xFFFFFF
        };
      case UserStatus.AWAY:
        return {
          background: 0xF59E0B, // Yellow
          border: 0xD97706,
          icon: 0x000000
        };
      case UserStatus.OFFLINE:
        return {
          background: 0x6B7280, // Gray
          border: 0x4B5563,
          icon: 0xFFFFFF
        };
      default:
        return {
          background: 0x6B7280,
          border: 0x4B5563,
          icon: 0xFFFFFF
        };
    }
  }

  /**
   * Update status indicator
   */
  public updateStatus(avatarId: string, newStatus: UserStatus): void {
    const indicator = this.indicators.get(avatarId);
    if (!indicator) return;

    // Update background
    const background = indicator.children[indicator.children.length - 1] as Graphics;
    background.clear();
    this.drawStatusBackground(background, newStatus, 16);

    // Update icon
    if (indicator.children.length > 1) {
      const icon = indicator.children[0] as Graphics;
      icon.clear();
      const colors = this.getStatusColors(newStatus);
      icon.fill(colors.icon);
      
      // Redraw icon based on new status
      // (Same logic as createStatusIcon but updating existing icon)
      this.updateIconGraphics(icon, newStatus, colors);
    }

    // Restart animation
    this.startAnimation(avatarId, newStatus);
  }

  /**
   * Update icon graphics
   */
  private updateIconGraphics(icon: Graphics, status: UserStatus, colors: { background: number; border: number; icon: number }): void {
    const size = 16;
    
    switch (status) {
      case UserStatus.AVAILABLE:
        icon
          .moveTo(-size/4, -size/8)
          .lineTo(-size/8, size/8)
          .lineTo(size/4, -size/4)
          .stroke({ color: colors.icon, width: 2 });
        break;

      case UserStatus.BUSY:
        icon
          .moveTo(-size/4, -size/4)
          .lineTo(size/4, size/4)
          .moveTo(size/4, -size/4)
          .lineTo(-size/4, size/4)
          .stroke({ color: colors.icon, width: 2 });
        break;

      case UserStatus.AWAY:
        icon
          .circle(0, 0, size/6)
          .fill(colors.icon)
          .moveTo(0, 0)
          .lineTo(0, -size/6)
          .moveTo(0, 0)
          .lineTo(size/8, 0)
          .stroke({ color: colors.icon, width: 1 });
        break;

      case UserStatus.OFFLINE:
        icon
          .circle(0, 0, size/6)
          .stroke({ color: colors.icon, width: 2 });
        break;
    }
  }

  /**
   * Start animation for status
   */
  private startAnimation(avatarId: string, status: UserStatus): void {
    if (status === UserStatus.BUSY) {
      this.animations.set(avatarId, { startTime: Date.now(), type: 'pulse' });
    } else if (status === UserStatus.AWAY) {
      this.animations.set(avatarId, { startTime: Date.now(), type: 'blink' });
    } else {
      this.animations.delete(avatarId);
    }
  }

  /**
   * Update animations
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();

    for (const [avatarId, animation] of this.animations) {
      const indicator = this.indicators.get(avatarId);
      if (!indicator) continue;

      const elapsed = currentTime - animation.startTime;

      switch (animation.type) {
        case 'pulse':
          // Pulsing animation for busy status
          const pulseScale = 1 + Math.sin(elapsed * 0.005) * 0.1;
          indicator.scale.set(pulseScale);
          break;

        case 'blink':
          // Blinking animation for away status
          const blinkAlpha = 0.5 + Math.sin(elapsed * 0.003) * 0.5;
          indicator.alpha = blinkAlpha;
          break;
      }
    }
  }

  /**
   * Set indicator visibility
   */
  public setVisibility(avatarId: string, visible: boolean): void {
    const indicator = this.indicators.get(avatarId);
    if (indicator) {
      indicator.visible = visible;
    }
  }

  /**
   * Remove status indicator
   */
  public removeStatusIndicator(avatarId: string): void {
    const indicator = this.indicators.get(avatarId);
    if (indicator) {
      indicator.destroy();
      this.indicators.delete(avatarId);
      this.animations.delete(avatarId);
    }
  }

  /**
   * Get indicator position
   */
  public getIndicatorPosition(avatarId: string): { x: number; y: number } | null {
    const indicator = this.indicators.get(avatarId);
    return indicator ? { x: indicator.x, y: indicator.y } : null;
  }

  /**
   * Destroy all indicators
   */
  public destroy(): void {
    this.indicators.forEach(indicator => indicator.destroy());
    this.indicators.clear();
    this.animations.clear();
  }
}