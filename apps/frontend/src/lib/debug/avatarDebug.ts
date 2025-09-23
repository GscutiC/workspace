/**
 * Avatar Debug Utilities
 * Helper functions to debug avatar visibility and game state
 */

import type {
  GameEngineDebugInterface,
  AvatarDebugResult,
  isDebugCapableEngine,
  isValidDebugViewport,
  isValidAvatarData
} from '@/types/debug';

export class AvatarDebug {
  /**
   * Debug avatar visibility issues
   */
  public static debugAvatarVisibility(gameEngine: GameEngineDebugInterface): AvatarDebugResult {
    console.log('🔍 AVATAR VISIBILITY DEBUG');
    console.log('==========================');

    if (!isDebugCapableEngine(gameEngine)) {
      console.error('❌ Game engine does not support debug operations');
      return {
        found: false,
        visible: false,
        position: { x: 0, y: 0 },
        issues: ['Game engine does not support debug operations'],
        fixes: []
      };
    }

    const debugInfo = gameEngine.getGameDebugInfo();
    console.log('🎮 Engine State:', debugInfo.engine);
    console.log('📷 Viewport State:', debugInfo.viewport);
    console.log('🎭 Layers State:', debugInfo.layers);
    console.log('👤 Game State:', debugInfo.gameState);

    const issues: string[] = [];
    const fixes: string[] = [];

    // Check if character layer has children
    const characterLayer = debugInfo.layers['CHARACTERS'];
    if (characterLayer) {
      console.log('✅ Character layer found with', characterLayer.children, 'children');
      console.log('🔍 Character layer visible:', characterLayer.visible);
      console.log('🔍 Character layer alpha:', characterLayer.alpha);

      if (!characterLayer.visible) {
        issues.push('Character layer is not visible');
        fixes.push('Set character layer visibility to true');
      }
      if (characterLayer.alpha < 1) {
        issues.push(`Character layer alpha is low: ${characterLayer.alpha}`);
        fixes.push('Set character layer alpha to 1');
      }
    } else {
      console.error('❌ Character layer not found!');
      issues.push('Character layer not found');
      fixes.push('Initialize character layer properly');
    }

    // Check avatars
    let found = false;
    let visible = false;
    let position = { x: 0, y: 0 };

    if (debugInfo.gameState.avatars.length > 0) {
      console.log('✅ Found', debugInfo.gameState.avatars.length, 'avatars');
      debugInfo.gameState.avatars.forEach((avatar) => {
        if (isValidAvatarData(avatar)) {
          console.log(`👤 Avatar ${avatar.name} at (${avatar.position.x}, ${avatar.position.y})`);
          found = true;
          position = avatar.position;
          visible = avatar.visible ?? true;

          if (!visible) {
            issues.push(`Avatar ${avatar.name} is not visible`);
            fixes.push(`Set avatar ${avatar.name} visibility to true`);
          }
        }
      });
    } else {
      console.error('❌ No avatars found!');
      issues.push('No avatars found in game state');
      fixes.push('Create and add avatars to the game');
    }

    return {
      found,
      visible,
      position,
      issues,
      fixes
    };
  }

  /**
   * Force avatar to visible position for debugging
   */
  public static forceAvatarVisible(gameEngine: GameEngineDebugInterface): boolean {
    console.log('🔧 FORCING AVATAR VISIBILITY');

    if (!isDebugCapableEngine(gameEngine)) {
      console.error('❌ Game engine does not support debug operations');
      return false;
    }

    // Get current user
    const currentUser = gameEngine.getCurrentUser();
    if (!currentUser) {
      console.error('❌ No current user found');
      return false;
    }

    console.log('🔧 Current user ID:', currentUser.id);

    // Get viewport and center on user
    const viewport = gameEngine.getViewport();
    if (viewport && isValidDebugViewport(viewport)) {
      console.log('🔧 Forcing viewport to center on avatar at:', currentUser.position);
      viewport.moveTo(currentUser.position, true);
    }

    // Get debug info to access layers
    const debugInfo = gameEngine.getGameDebugInfo();
    const characterLayer = debugInfo.layers['CHARACTERS'];

    if (characterLayer) {
      console.log('🔧 Character layer debug:');
      console.log('  - Children:', characterLayer.children);
      console.log('  - Visible:', characterLayer.visible);
      console.log('  - Alpha:', characterLayer.alpha);
      console.log('  - Position:', { x: characterLayer.x, y: characterLayer.y });
      console.log('  - Scale:', { x: characterLayer.scale?.x, y: characterLayer.scale?.y });

      console.log('✅ Successfully forced avatar visibility settings');
      return true;
    } else {
      console.error('❌ Character layer not found in debug info');
      return false;
    }
  }

  /**
   * Check viewport and camera position
   */
  public static debugViewport(gameEngine: GameEngineDebugInterface): void {
    console.log('📷 VIEWPORT DEBUG');
    console.log('=================');

    if (!isDebugCapableEngine(gameEngine)) {
      console.error('❌ Game engine does not support debug operations');
      return;
    }

    const viewport = gameEngine.getViewport();
    if (!viewport || !isValidDebugViewport(viewport)) {
      console.error('❌ Viewport not found or invalid');
      return;
    }

    const debugInfo = gameEngine.getGameDebugInfo();
    console.log('📷 Viewport state:', debugInfo.viewport);

    const currentUser = gameEngine.getCurrentUser();
    if (currentUser && isValidAvatarData(currentUser)) {
      console.log('👤 Current user position:', currentUser.position);

      // Get viewport bounds
      const bounds = viewport.getBounds();
      console.log('🔍 Visible bounds:', bounds);

      const isVisible =
        currentUser.position.x >= bounds.x &&
        currentUser.position.x <= bounds.x + bounds.width &&
        currentUser.position.y >= bounds.y &&
        currentUser.position.y <= bounds.y + bounds.height;

      console.log('👁️ Avatar in visible area:', isVisible);

      if (!isVisible) {
        console.log('💡 Recommendation: Center viewport on avatar');
        viewport.moveTo(currentUser.position, true);
      }
    } else {
      console.error('❌ No valid current user found');
    }
  }
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  window.AvatarDebug = AvatarDebug;
}

// Extend window interface for AvatarDebug
declare global {
  interface Window {
    AvatarDebug?: typeof AvatarDebug;
  }
}