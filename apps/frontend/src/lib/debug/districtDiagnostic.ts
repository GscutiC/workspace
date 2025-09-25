/**
 * Main Map District Diagnostic Functions
 * Complete diagnostic tools to troubleshoot main map district rendering issues
 */

import { logInfo, logError, logDebug, LogCategory } from '@/lib/utils/logger';
import type { District } from '@/lib/graphql';
import type { DistrictSystem } from '@/lib/game/DistrictSystem';
import type { GameEngine } from '@/lib/game/GameEngine';
import type { Application, Container } from 'pixi.js';

export interface DistrictDiagnosticResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  gameEngine: {
    available: boolean;
    initialized: boolean;
    hasApp: boolean;
    hasWorldContainer: boolean;
  };
  districtSystem: {
    initialized: boolean;
    hasDistricts: boolean;
    districtCount: number;
    containersVisible: boolean;
    isReady: boolean;
  };
  districtData: {
    loaded: boolean;
    count: number;
    validDistricts: number;
    invalidDistricts: string[];
  };
  rendering: {
    canRender: boolean;
    containersPresent: boolean;
    zIndexCorrect: boolean;
    coordinatesValid: boolean;
  };
  suggestions: string[];
}

export class DistrictDiagnostic {
  private static instance: DistrictDiagnostic;

  private constructor() {}

  public static getInstance(): DistrictDiagnostic {
    if (!DistrictDiagnostic.instance) {
      DistrictDiagnostic.instance = new DistrictDiagnostic();
    }
    return DistrictDiagnostic.instance;
  }

  /**
   * Run complete diagnostic check on main map district system
   */
  public async runDiagnostic(
    gameEngine?: GameEngine | null,
    districtSystem?: DistrictSystem | null,
    districts?: District[]
  ): Promise<DistrictDiagnosticResult> {
    logInfo(LogCategory.DISTRICTS, 'Starting main map district diagnostic');

    const result: DistrictDiagnosticResult = {
      success: true,
      errors: [],
      warnings: [],
      gameEngine: {
        available: false,
        initialized: false,
        hasApp: false,
        hasWorldContainer: false,
      },
      districtSystem: {
        initialized: false,
        hasDistricts: false,
        districtCount: 0,
        containersVisible: false,
        isReady: false,
      },
      districtData: {
        loaded: false,
        count: 0,
        validDistricts: 0,
        invalidDistricts: []
      },
      rendering: {
        canRender: false,
        containersPresent: false,
        zIndexCorrect: false,
        coordinatesValid: false,
      },
      suggestions: []
    };

    try {
      // Test 1: Check GameEngine availability
      this.checkGameEngine(gameEngine, result);

      // Test 2: Check DistrictSystem initialization
      this.checkDistrictSystem(districtSystem, result);

      // Test 3: Check district data
      await this.checkDistrictData(districts, result);

      // Test 4: Check rendering capabilities
      this.checkRenderingCapabilities(gameEngine, districtSystem, result);

      // Test 5: Check container hierarchy
      this.checkContainerHierarchy(gameEngine, districtSystem, result);

      // Generate suggestions
      this.generateSuggestions(result);

      result.success = result.errors.length === 0;

      logInfo(LogCategory.DISTRICTS, 'Main map district diagnostic completed', {
        success: result.success,
        errorsCount: result.errors.length,
        warningsCount: result.warnings.length
      });

    } catch (error) {
      result.success = false;
      result.errors.push(`Diagnostic failed: ${error}`);
      logError(LogCategory.DISTRICTS, 'District diagnostic failed', error);
    }

    return result;
  }

  /**
   * Check GameEngine availability and state
   */
  private checkGameEngine(gameEngine: GameEngine | null | undefined, result: DistrictDiagnosticResult): void {
    logDebug(LogCategory.DISTRICTS, 'Checking GameEngine state');

    result.gameEngine.available = !!gameEngine;

    if (!gameEngine) {
      result.errors.push('GameEngine is not available');
      return;
    }

    // Check if game engine is initialized
    try {
      const app = gameEngine.getApp();
      const worldContainer = gameEngine.getWorldContainer();

      result.gameEngine.hasApp = !!app;
      result.gameEngine.hasWorldContainer = !!worldContainer;
      result.gameEngine.initialized = !!(app && worldContainer);

      if (!app) {
        result.errors.push('PIXI Application not available in GameEngine');
      }

      if (!worldContainer) {
        result.errors.push('World container not available in GameEngine');
      }

    } catch (error) {
      result.errors.push(`Error accessing GameEngine components: ${error}`);
    }
  }

  /**
   * Check DistrictSystem initialization and state
   */
  private checkDistrictSystem(districtSystem: DistrictSystem | null | undefined, result: DistrictDiagnosticResult): void {
    logDebug(LogCategory.DISTRICTS, 'Checking DistrictSystem state');

    result.districtSystem.initialized = !!districtSystem;

    if (!districtSystem) {
      result.errors.push('DistrictSystem is not initialized');
      return;
    }

    try {
      // Check if districts are loaded
      const districts = districtSystem.getDistricts();
      result.districtSystem.hasDistricts = districts.length > 0;
      result.districtSystem.districtCount = districts.length;

      // For the hook-based system, we consider it ready if it has districts
      result.districtSystem.isReady = result.districtSystem.hasDistricts;

      if (districts.length === 0) {
        result.warnings.push('DistrictSystem initialized but no districts loaded');
      }

      if (districts.length !== 16) {
        result.warnings.push(`Expected 16 districts, found ${districts.length}`);
      }

    } catch (error) {
      result.errors.push(`Error checking DistrictSystem state: ${error}`);
    }
  }

  /**
   * Check if district data is valid and loaded
   */
  private async checkDistrictData(districts: District[] | undefined, result: DistrictDiagnosticResult): Promise<void> {
    logDebug(LogCategory.DISTRICTS, 'Checking district data');

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

    logDebug(LogCategory.DISTRICTS, 'District data validation completed', {
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
  private checkRenderingCapabilities(
    gameEngine: GameEngine | null | undefined,
    districtSystem: DistrictSystem | null | undefined,
    result: DistrictDiagnosticResult
  ): void {
    logDebug(LogCategory.DISTRICTS, 'Checking rendering capabilities');

    if (!gameEngine || !districtSystem) {
      result.errors.push('Cannot check rendering - GameEngine or DistrictSystem unavailable');
      return;
    }

    try {
      // Check if PIXI app and containers are available
      const app = gameEngine.getApp();
      const worldContainer = gameEngine.getWorldContainer();

      result.rendering.canRender = !!(app && worldContainer);

      if (!app) {
        result.errors.push('Cannot render - PIXI Application not available');
      }

      if (!worldContainer) {
        result.errors.push('Cannot render - World container not available');
      }

      // Check if district data has valid coordinates
      const districts = districtSystem.getDistricts();
      result.rendering.coordinatesValid = districts.every(district => {
        return district.bounds &&
               typeof district.bounds.x1 === 'number' &&
               typeof district.bounds.y1 === 'number' &&
               typeof district.bounds.x2 === 'number' &&
               typeof district.bounds.y2 === 'number';
      });

      if (!result.rendering.coordinatesValid) {
        result.errors.push('Invalid district coordinates detected');
      }

    } catch (error) {
      result.errors.push(`Error checking rendering capabilities: ${error}`);
    }
  }

  /**
   * Check container hierarchy and setup
   */
  private checkContainerHierarchy(
    gameEngine: GameEngine | null | undefined,
    districtSystem: DistrictSystem | null | undefined,
    result: DistrictDiagnosticResult
  ): void {
    logDebug(LogCategory.DISTRICTS, 'Checking container hierarchy');

    if (!gameEngine || !districtSystem) {
      result.warnings.push('Cannot check container hierarchy - components unavailable');
      return;
    }

    try {
      const worldContainer = gameEngine.getWorldContainer();
      if (!worldContainer) {
        result.errors.push('World container not found');
        return;
      }

      // Look for district containers in world container children
      const districtContainer = worldContainer.children.find(child => child.name === 'DistrictContainer');
      const labelContainer = worldContainer.children.find(child => child.name === 'DistrictLabelContainer');

      result.rendering.containersPresent = !!(districtContainer && labelContainer);

      if (!districtContainer) {
        result.warnings.push('District container not found in world container');
      }

      if (!labelContainer) {
        result.warnings.push('District label container not found in world container');
      }

      if (districtContainer && labelContainer) {
        // Check z-index setup
        const districtZIndex = (districtContainer as any).zIndex;
        const labelZIndex = (labelContainer as any).zIndex;

        result.rendering.zIndexCorrect = districtZIndex < labelZIndex;

        if (!result.rendering.zIndexCorrect) {
          result.warnings.push(`Z-index incorrect: district(${districtZIndex}) should be < labels(${labelZIndex})`);
        }

        // Check visibility
        result.districtSystem.containersVisible = districtContainer.visible && labelContainer.visible;

        if (!result.districtSystem.containersVisible) {
          result.warnings.push('District containers are not visible');
        }
      }

    } catch (error) {
      result.warnings.push(`Error checking container hierarchy: ${error}`);
    }
  }

  /**
   * Generate suggestions based on diagnostic results
   */
  private generateSuggestions(result: DistrictDiagnosticResult): void {
    const suggestions: string[] = [];

    if (!result.gameEngine.available) {
      suggestions.push('1. Ensure GameEngine is initialized before creating DistrictSystem');
      suggestions.push('2. Check VirtualOffice component initialization order');
    }

    if (!result.gameEngine.hasApp || !result.gameEngine.hasWorldContainer) {
      suggestions.push('3. Wait for PIXI Application and WorldContainer to be ready');
      suggestions.push('4. Check GameEngine.init() completion');
    }

    if (!result.districtSystem.initialized) {
      suggestions.push('5. Initialize DistrictSystem with proper app and mapContainer');
      suggestions.push('6. Check useDistrictSystem hook timing');
    }

    if (result.districtData.count === 0) {
      suggestions.push('7. Verify GraphQL backend is running on port 3000');
      suggestions.push('8. Check districts are seeded in database');
      suggestions.push('9. Verify useDistricts hook is fetching data');
    }

    if (result.districtData.invalidDistricts.length > 0) {
      suggestions.push('10. Fix district data validation errors');
      suggestions.push('11. Check district bounds contain valid coordinates');
    }

    if (!result.rendering.canRender) {
      suggestions.push('12. Ensure PIXI Application and containers are initialized');
      suggestions.push('13. Check district system initialization order');
    }

    if (!result.rendering.containersPresent) {
      suggestions.push('14. Verify DistrictSystem containers are added to world container');
      suggestions.push('15. Check container naming and hierarchy');
    }

    if (!result.districtSystem.containersVisible) {
      suggestions.push('16. Set district containers visibility to true');
      suggestions.push('17. Check district overlay toggle state');
    }

    if (result.errors.length === 0 && result.districtSystem.hasDistricts && result.rendering.canRender) {
      suggestions.push('✅ District system appears healthy - check district rendering calls');
      suggestions.push('✅ Use window.debugDistricts() for detailed runtime info');
      suggestions.push('✅ Use window.forceDistrictRender() to manually trigger rendering');
    }

    result.suggestions = suggestions;
  }

  /**
   * Log detailed diagnostic report
   */
  public logDiagnosticReport(result: DistrictDiagnosticResult): void {
    logInfo(LogCategory.DISTRICTS, '=== MAIN MAP DISTRICT DIAGNOSTIC REPORT ===');
    logInfo(LogCategory.DISTRICTS, `Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);

    if (result.errors.length > 0) {
      logError(LogCategory.DISTRICTS, 'ERRORS:', result.errors);
    }

    if (result.warnings.length > 0) {
      logDebug(LogCategory.DISTRICTS, 'WARNINGS:', result.warnings);
    }

    logInfo(LogCategory.DISTRICTS, 'GameEngine State:', result.gameEngine);
    logInfo(LogCategory.DISTRICTS, 'DistrictSystem State:', result.districtSystem);
    logInfo(LogCategory.DISTRICTS, 'District Data:', result.districtData);
    logInfo(LogCategory.DISTRICTS, 'Rendering State:', result.rendering);

    if (result.suggestions.length > 0) {
      logInfo(LogCategory.DISTRICTS, 'SUGGESTIONS:', result.suggestions);
    }

    logInfo(LogCategory.DISTRICTS, '=== END DIAGNOSTIC REPORT ===');
  }
}

// Export convenience function
export const runDistrictDiagnostic = async (
  gameEngine?: GameEngine | null,
  districtSystem?: DistrictSystem | null,
  districts?: District[]
): Promise<DistrictDiagnosticResult> => {
  const diagnostic = DistrictDiagnostic.getInstance();
  return await diagnostic.runDiagnostic(gameEngine, districtSystem, districts);
};

export const logDistrictDiagnosticReport = (result: DistrictDiagnosticResult): void => {
  const diagnostic = DistrictDiagnostic.getInstance();
  diagnostic.logDiagnosticReport(result);
};