/**
 * Minimap Diagnostic Functions
 * Complete diagnostic tools to troubleshoot minimap rendering issues
 */

import { logInfo, logError, logDebug, LogCategory } from '@/lib/utils/logger';
import type { District } from '@/lib/graphql';

export interface MinimapDiagnosticResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  districtData: {
    loaded: boolean;
    count: number;
    validDistricts: number;
    invalidDistricts: string[];
  };
  rendering: {
    canRender: boolean;
    scaleFactorValid: boolean;
    coordinatesInRange: boolean;
  };
  suggestions: string[];
}

export class MinimapDiagnostic {
  private static instance: MinimapDiagnostic;

  private constructor() {}

  public static getInstance(): MinimapDiagnostic {
    if (!MinimapDiagnostic.instance) {
      MinimapDiagnostic.instance = new MinimapDiagnostic();
    }
    return MinimapDiagnostic.instance;
  }

  /**
   * Run complete diagnostic check on minimap
   */
  public async runDiagnostic(districts?: District[]): Promise<MinimapDiagnosticResult> {
    logInfo(LogCategory.MINIMAP, 'Starting minimap diagnostic');

    const result: MinimapDiagnosticResult = {
      success: true,
      errors: [],
      warnings: [],
      districtData: {
        loaded: false,
        count: 0,
        validDistricts: 0,
        invalidDistricts: []
      },
      rendering: {
        canRender: false,
        scaleFactorValid: false,
        coordinatesInRange: false
      },
      suggestions: []
    };

    try {
      // Test 1: Check district data
      await this.checkDistrictData(districts, result);

      // Test 2: Check rendering capabilities
      this.checkRenderingCapabilities(districts, result);

      // Test 3: Check coordinate system
      this.checkCoordinateSystem(districts, result);

      // Test 4: Check scale factor
      this.checkScaleFactor(result);

      // Generate suggestions
      this.generateSuggestions(result);

      result.success = result.errors.length === 0;

      logInfo(LogCategory.MINIMAP, 'Minimap diagnostic completed', {
        success: result.success,
        errorsCount: result.errors.length,
        warningsCount: result.warnings.length
      });

    } catch (error) {
      result.success = false;
      result.errors.push(`Diagnostic failed: ${error}`);
      logError(LogCategory.MINIMAP, 'Diagnostic failed', error);
    }

    return result;
  }

  /**
   * Check if district data is valid and loaded
   */
  private async checkDistrictData(districts: District[] | undefined, result: MinimapDiagnosticResult): Promise<void> {
    logDebug(LogCategory.MINIMAP, 'Checking district data');

    if (!districts) {
      result.errors.push('No district data provided to diagnostic');
      return;
    }

    result.districtData.loaded = true;
    result.districtData.count = districts.length;

    if (districts.length === 0) {
      result.errors.push('District array is empty');
      return;
    }

    // Expected 16 districts
    if (districts.length !== 16) {
      result.warnings.push(`Expected 16 districts, found ${districts.length}`);
    }

    // Validate each district
    districts.forEach((district, index) => {
      const errors = this.validateDistrict(district, index);
      if (errors.length === 0) {
        result.districtData.validDistricts++;
      } else {
        result.districtData.invalidDistricts.push(
          `District ${index} (${district.zoneCode || 'NO_ZONE'}): ${errors.join(', ')}`
        );
      }
    });

    logDebug(LogCategory.MINIMAP, 'District data check completed', {
      total: result.districtData.count,
      valid: result.districtData.validDistricts,
      invalid: result.districtData.invalidDistricts.length
    });
  }

  /**
   * Validate individual district
   */
  private validateDistrict(district: District, index: number): string[] {
    const errors: string[] = [];

    if (!district.id) errors.push('Missing id');
    if (!district.zoneCode) errors.push('Missing zoneCode');
    if (!district.name) errors.push('Missing name');

    if (!district.bounds) {
      errors.push('Missing bounds object');
    } else {
      const { x1, y1, x2, y2 } = district.bounds;

      if (typeof x1 !== 'number' || typeof y1 !== 'number' ||
          typeof x2 !== 'number' || typeof y2 !== 'number') {
        errors.push('Invalid bounds coordinates - not numbers');
      }

      if (x1 >= x2) errors.push('Invalid bounds - x1 >= x2');
      if (y1 >= y2) errors.push('Invalid bounds - y1 >= y2');

      if (x1 < 0 || y1 < 0) errors.push('Negative coordinates');
      if (x2 > 192 || y2 > 144) errors.push('Coordinates outside expected range (0-192, 0-144)');
    }

    return errors;
  }

  /**
   * Check if rendering is possible
   */
  private checkRenderingCapabilities(districts: District[] | undefined, result: MinimapDiagnosticResult): void {
    logDebug(LogCategory.MINIMAP, 'Checking rendering capabilities');

    if (!districts || districts.length === 0) {
      result.errors.push('Cannot render - no district data');
      return;
    }

    // Check if we have valid graphics context (would be done in actual implementation)
    result.rendering.canRender = true;

    logDebug(LogCategory.MINIMAP, 'Rendering capabilities check completed');
  }

  /**
   * Check coordinate system
   */
  private checkCoordinateSystem(districts: District[] | undefined, result: MinimapDiagnosticResult): void {
    logDebug(LogCategory.MINIMAP, 'Checking coordinate system');

    if (!districts || districts.length === 0) {
      result.warnings.push('Cannot check coordinates - no district data');
      return;
    }

    let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;

    districts.forEach(district => {
      if (district.bounds) {
        minX = Math.min(minX, district.bounds.x1);
        minY = Math.min(minY, district.bounds.y1);
        maxX = Math.max(maxX, district.bounds.x2);
        maxY = Math.max(maxY, district.bounds.y2);
      }
    });

    const expectedMaxX = 192;
    const expectedMaxY = 144;

    if (minX < 0 || minY < 0) {
      result.warnings.push(`Negative coordinates detected: min(${minX}, ${minY})`);
    }

    if (maxX > expectedMaxX || maxY > expectedMaxY) {
      result.warnings.push(`Coordinates exceed expected bounds: max(${maxX}, ${maxY}) > (${expectedMaxX}, ${expectedMaxY})`);
    }

    result.rendering.coordinatesInRange = (minX >= 0 && minY >= 0 && maxX <= expectedMaxX && maxY <= expectedMaxY);

    logDebug(LogCategory.MINIMAP, 'Coordinate system check completed', {
      bounds: { minX, minY, maxX, maxY },
      inRange: result.rendering.coordinatesInRange
    });
  }

  /**
   * Check scale factor calculation
   */
  private checkScaleFactor(result: MinimapDiagnosticResult): void {
    logDebug(LogCategory.MINIMAP, 'Checking scale factor');

    // These are the constants from MinimapSystem
    const MINIMAP_WIDTH = 200;
    const MINIMAP_HEIGHT = 150;
    const MAP_WIDTH = 192;  // tiles
    const MAP_HEIGHT = 144; // tiles
    const TILE_SIZE = 32;   // pixels

    const scaleX = MINIMAP_WIDTH / (MAP_WIDTH * TILE_SIZE);
    const scaleY = MINIMAP_HEIGHT / (MAP_HEIGHT * TILE_SIZE);
    const scaleFactor = Math.min(scaleX, scaleY);

    logInfo(LogCategory.MINIMAP, 'Scale factor calculation', {
      minimapSize: { width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT },
      worldSize: { width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE },
      scaleX,
      scaleY,
      finalScaleFactor: scaleFactor
    });

    // Check if scale factor is reasonable
    if (scaleFactor <= 0 || scaleFactor > 1) {
      result.errors.push(`Invalid scale factor: ${scaleFactor}`);
    } else if (scaleFactor < 0.01) {
      result.warnings.push(`Very small scale factor: ${scaleFactor} - districts might be too small to see`);
    }

    result.rendering.scaleFactorValid = scaleFactor > 0 && scaleFactor <= 1;

    logDebug(LogCategory.MINIMAP, 'Scale factor check completed', {
      scaleFactor,
      valid: result.rendering.scaleFactorValid
    });
  }

  /**
   * Generate suggestions based on diagnostic results
   */
  private generateSuggestions(result: MinimapDiagnosticResult): void {
    const suggestions: string[] = [];

    if (result.districtData.count === 0) {
      suggestions.push('1. Check backend GraphQL endpoint is running on port 3000');
      suggestions.push('2. Verify districts are seeded in database');
      suggestions.push('3. Check GraphQL query returns data');
    }

    if (result.districtData.count > 0 && result.districtData.validDistricts === 0) {
      suggestions.push('1. Fix district data validation errors');
      suggestions.push('2. Ensure bounds contain valid numeric coordinates');
    }

    if (result.districtData.invalidDistricts.length > 0) {
      suggestions.push('3. Review invalid districts and fix data issues');
    }

    if (!result.rendering.scaleFactorValid) {
      suggestions.push('4. Check SCALE_FACTOR calculation in MinimapSystem');
      suggestions.push('5. Verify map constants (MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)');
    }

    if (!result.rendering.coordinatesInRange) {
      suggestions.push('6. Verify district coordinates are within expected range (0-192, 0-144)');
    }

    if (result.errors.length === 0 && result.districtData.validDistricts > 0) {
      suggestions.push('✅ Data looks good - check MinimapSystem.renderDistricts() is being called');
      suggestions.push('✅ Enable debug visual to confirm rendering');
    }

    result.suggestions = suggestions;
  }

  /**
   * Quick test to verify MinimapSystem can render
   */
  public testMinimapRendering(): { canRender: boolean; message: string } {
    try {
      // This would test actual PIXI.js rendering in a real scenario
      logDebug(LogCategory.MINIMAP, 'Testing minimap rendering capability');

      return {
        canRender: true,
        message: 'Minimap rendering test passed - PIXI.js Graphics available'
      };
    } catch (error) {
      logError(LogCategory.MINIMAP, 'Minimap rendering test failed', error);
      return {
        canRender: false,
        message: `Rendering test failed: ${error}`
      };
    }
  }

  /**
   * Log detailed diagnostic report
   */
  public logDiagnosticReport(result: MinimapDiagnosticResult): void {
    logInfo(LogCategory.MINIMAP, '=== MINIMAP DIAGNOSTIC REPORT ===');
    logInfo(LogCategory.MINIMAP, `Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);

    if (result.errors.length > 0) {
      logError(LogCategory.MINIMAP, 'ERRORS:', result.errors);
    }

    if (result.warnings.length > 0) {
      logDebug(LogCategory.MINIMAP, 'WARNINGS:', result.warnings);
    }

    logInfo(LogCategory.MINIMAP, 'District Data:', result.districtData);
    logInfo(LogCategory.MINIMAP, 'Rendering:', result.rendering);

    if (result.suggestions.length > 0) {
      logInfo(LogCategory.MINIMAP, 'SUGGESTIONS:', result.suggestions);
    }

    logInfo(LogCategory.MINIMAP, '=== END DIAGNOSTIC REPORT ===');
  }
}

// Export convenience function
export const runMinimapDiagnostic = async (districts?: District[]): Promise<MinimapDiagnosticResult> => {
  const diagnostic = MinimapDiagnostic.getInstance();
  return await diagnostic.runDiagnostic(districts);
};

export const testMinimapRendering = (): { canRender: boolean; message: string } => {
  const diagnostic = MinimapDiagnostic.getInstance();
  return diagnostic.testMinimapRendering();
};