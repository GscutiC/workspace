/**
 * ParcelMigration - Handles coordinate migration and validation
 * for parcel data compatibility between different data sources
 */

import type { Position } from '@/types/game';

export interface ParcelCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface ParcelValidationResult {
  isValid: boolean;
  error?: string;
}

export class ParcelMigration {
  /**
   * Migrate parcel coordinates from old format to new format
   * Currently a pass-through since we don't have legacy formats
   */
  static migrateParcelCoordinates(coords: ParcelCoordinates): ParcelCoordinates {
    // For now, just return the coordinates as-is
    // In the future, this could handle coordinate system migrations
    return {
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height
    };
  }

  /**
   * Validate parcel position coordinates
   */
  static validateParcelPosition(coords: ParcelCoordinates): ParcelValidationResult {
    // Basic validation
    if (typeof coords.x !== 'number' || typeof coords.y !== 'number') {
      return {
        isValid: false,
        error: 'Coordinates must be numbers'
      };
    }

    // Check for reasonable bounds (adjust as needed)
    const MIN_COORD = -10000;
    const MAX_COORD = 10000;

    if (coords.x < MIN_COORD || coords.x > MAX_COORD ||
        coords.y < MIN_COORD || coords.y > MAX_COORD) {
      return {
        isValid: false,
        error: `Coordinates must be between ${MIN_COORD} and ${MAX_COORD}`
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Convert Position to ParcelCoordinates
   */
  static positionToCoords(position: Position): ParcelCoordinates {
    return {
      x: position.x,
      y: position.y
    };
  }

  /**
   * Convert ParcelCoordinates to Position
   */
  static coordsToPosition(coords: ParcelCoordinates): Position {
    return {
      x: coords.x,
      y: coords.y
    };
  }
}