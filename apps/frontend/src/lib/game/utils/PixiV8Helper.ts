/**
 * Helper utilities for Pixi.js v8 compatibility
 * Provides consistent API across the codebase
 */
import { Graphics } from 'pixi.js';

export class PixiV8Helper {
  /**
   * Draw filled rectangle with border - Pixi.js v8 compatible
   */
  static drawFilledRect(
    graphics: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number,
    fillAlpha: number = 1,
    borderColor?: number,
    borderWidth?: number,
    borderAlpha?: number
  ): Graphics {
    // Clear previous drawing
    graphics.clear();

    // Draw filled rectangle
    if (fillAlpha > 0) {
      graphics.rect(x, y, width, height).fill({ color: fillColor, alpha: fillAlpha });
    }

    // Draw border if specified
    if (borderColor !== undefined && borderWidth !== undefined) {
      graphics.rect(x, y, width, height).stroke({ 
        color: borderColor, 
        width: borderWidth,
        alpha: borderAlpha || 1
      });
    }

    return graphics;
  }

  /**
   * Create interactive graphics object with hover effects
   */
  static makeInteractive(
    graphics: Graphics,
    onClick?: () => void,
    onHover?: () => void,
    onHoverOut?: () => void,
    cursor: string = 'pointer'
  ): Graphics {
    graphics.eventMode = 'static';
    graphics.cursor = cursor;

    if (onClick) {
      graphics.on('pointerdown', onClick);
    }

    if (onHover) {
      graphics.on('pointerover', onHover);
    }

    if (onHoverOut) {
      graphics.on('pointerout', onHoverOut);
    }

    return graphics;
  }
}