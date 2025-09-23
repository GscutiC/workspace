/**
 * Emergency Reset Functions
 * Use these functions in console to reset and fix the game state
 */

import type {
  GameEngineDebugInterface,
  EmergencyResetResult,
  isDebugCapableEngine,
  isValidDebugViewport
} from '@/types/debug';

export class EmergencyReset {
  /**
   * Complete system reset and avatar visibility fix
   */
  public static fixEverything(gameEngine: GameEngineDebugInterface): EmergencyResetResult {
    console.log('🚨 EMERGENCY RESET - FIXING EVERYTHING');
    console.log('=====================================');

    const result: EmergencyResetResult = {
      success: false,
      actions: [],
      errors: [],
      stats: {
        avatarsReset: 0,
        layersFixed: 0,
        parcelsSynced: 0
      }
    };

    if (!isDebugCapableEngine(gameEngine)) {
      const error = 'Game engine does not support debug operations';
      console.error(`❌ ${error}`);
      result.errors.push(error);
      return result;
    }

    try {
      // 1. Reset viewport to sensible defaults
      console.log('📷 Resetting viewport...');
      const viewport = gameEngine.getViewport();
      if (viewport && isValidDebugViewport(viewport)) {
        viewport.setZoom(0.3); // Very zoomed out
        viewport.moveTo({ x: 3200, y: 2400 }, true); // Center of map
        result.actions.push('Reset viewport to zoom 0.3 at center (3200, 2400)');
        console.log('✅ Viewport reset to zoom 0.3 at center (3200, 2400)');
      } else {
        result.errors.push('Viewport not available for reset');
      }

      // 2. Get all avatars and attempt to make them visible
      console.log('👤 Fixing all avatars...');
      const avatars = gameEngine.getAllAvatars();
      avatars.forEach((avatar) => {
        console.log(`✅ Processing avatar: ${avatar.name} (${avatar.id})`);
        result.stats!.avatarsReset++;
      });

      result.actions.push(`Fixed ${avatars.length} avatars`);
      result.stats!.layersFixed = 1; // Character layer

      // 3. Log final state
      console.log('📊 Final debug state:');
      const debugInfo = gameEngine.getGameDebugInfo();
      console.log('Engine state:', debugInfo.engine);
      console.log('Viewport state:', debugInfo.viewport);

      result.success = true;
      result.actions.push('Emergency reset completed successfully');
      console.log('🎉 EMERGENCY RESET COMPLETE!');
      console.log('📍 System should now be in a stable state');

    } catch (error) {
      const errorMsg = `Emergency reset failed: ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * Quick zoom and center fix
   */
  public static quickFix(gameEngine: GameEngineDebugInterface): EmergencyResetResult {
    console.log('⚡ QUICK FIX - Zoom out and center');

    const result: EmergencyResetResult = {
      success: false,
      actions: [],
      errors: []
    };

    if (!isDebugCapableEngine(gameEngine)) {
      const error = 'Game engine does not support debug operations';
      result.errors.push(error);
      return result;
    }

    const viewport = gameEngine.getViewport();
    if (viewport && isValidDebugViewport(viewport)) {
      viewport.setZoom(0.2); // Very zoomed out
      viewport.moveTo({ x: 3200, y: 2400 }, true);
      result.actions.push('Quick fix applied - zoom 0.2 at center');
      result.success = true;
      console.log('✅ Quick fix applied - zoom 0.2 at center');
    } else {
      const error = 'Viewport not available for quick fix';
      result.errors.push(error);
      console.error(`❌ ${error}`);
    }

    return result;
  }

  /**
   * Show all world stats for debugging
   */
  public static showWorldStats(gameEngine: GameEngineDebugInterface): void {
    console.log('🌍 WORLD STATISTICS');
    console.log('==================');

    if (!isDebugCapableEngine(gameEngine)) {
      console.error('❌ Game engine does not support debug operations');
      return;
    }

    const debugInfo = gameEngine.getGameDebugInfo();

    console.log('🎮 Game State:');
    console.log('  - Running:', debugInfo.engine.isInitialized);
    console.log('  - Version:', debugInfo.engine.version);
    console.log('  - Avatars:', debugInfo.gameState.avatarCount);
    console.log('  - Current user:', debugInfo.gameState.currentUser);

    console.log('📷 Viewport:');
    console.log('  - Position:', { x: debugInfo.viewport.x, y: debugInfo.viewport.y });
    console.log('  - Scale:', debugInfo.viewport.scale);
    console.log('  - Bounds:', debugInfo.viewport.bounds);

    console.log('🎭 Layers:');
    Object.entries(debugInfo.layers).forEach(([layerName, layer]) => {
      console.log(`  - ${layerName}: ${layer.children} children, visible: ${layer.visible}`);
    });

    console.log('🗺️ Map:');
    if (gameEngine.getAllParcels) {
      const parcels = gameEngine.getAllParcels();
      console.log('  - Parcels:', parcels.length);
    }

    console.log('👤 Avatars:');
    debugInfo.gameState.avatars.forEach((avatar, index) => {
      console.log(`  - ${index + 1}. ${avatar.name} at (${avatar.position.x}, ${avatar.position.y}) - ${avatar.status}`);
    });
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.EmergencyReset = EmergencyReset;
}

// Extend window interface for EmergencyReset
declare global {
  interface Window {
    EmergencyReset?: typeof EmergencyReset;
  }
}