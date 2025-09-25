/**
 * Debug utilities for the district and avatar systems
 * Provides safe debugging methods that handle errors gracefully
 */

import { GameEngine } from '@/lib/game/GameEngine';
import { DistrictSystem } from '@/lib/game/DistrictSystem';

export class SafeDebugSystem {
  private static instance: SafeDebugSystem;
  
  public static getInstance(): SafeDebugSystem {
    if (!SafeDebugSystem.instance) {
      SafeDebugSystem.instance = new SafeDebugSystem();
    }
    return SafeDebugSystem.instance;
  }

  /**
   * Safely debug avatar and viewport information
   */
  public debugAvatarSystem(gameEngine: GameEngine): void {
    try {
      console.group('🎮 Avatar System Debug');
      
      // Get current user safely
      const currentUser = this.safeGetCurrentUser(gameEngine);
      if (currentUser) {
        console.log('👤 Current user:', {
          id: currentUser.id,
          name: currentUser.name,
          position: currentUser.position,
          status: currentUser.status
        });
      } else {
        console.warn('⚠️ No current user set');
      }

      // Get all avatars
      const allAvatars = this.safeGetAllAvatars(gameEngine);
      console.log(`👥 Total avatars: ${allAvatars.length}`);

      // Debug game state
      const gameState = this.safeGetGameState(gameEngine);
      if (gameState) {
        console.log('🎯 Game state:', {
          isRunning: gameState.isRunning,
          avatarCount: gameState.avatars.size,
          currentUser: gameState.currentUser ? 'Set' : 'Not set'
        });
      }

      console.groupEnd();
    } catch (error) {
      console.error('❌ Error in avatar system debug:', error);
    }
  }

  /**
   * Safely debug district system
   */
  public debugDistrictSystem(districtSystem: DistrictSystem | null): void {
    try {
      console.group('🏛️ District System Debug');
      
      if (!districtSystem) {
        console.warn('⚠️ District system not initialized');
        console.groupEnd();
        return;
      }

      // Get districts safely
      const districts = this.safeGetDistricts(districtSystem);
      console.log(`🏗️ Total districts: ${districts.length}`);

      // Get current district
      const currentDistrict = this.safeGetCurrentDistrict(districtSystem);
      if (currentDistrict) {
        console.log('📍 Current district:', {
          id: currentDistrict.id,
          name: currentDistrict.name,
          zoneCode: currentDistrict.zoneCode,
          bounds: currentDistrict.bounds
        });
      } else {
        console.log('📍 Not in any district');
      }

      // Get tracked avatar
      const trackedAvatar = this.safeGetTrackedAvatar(districtSystem);
      console.log('👁️ Tracked avatar:', trackedAvatar || 'None');

      console.groupEnd();
    } catch (error) {
      console.error('❌ Error in district system debug:', error);
    }
  }

  /**
   * Complete system debug
   */
  public debugCompleteSystem(gameEngine: GameEngine, districtSystem?: DistrictSystem | null): void {
    console.group('🔍 Complete System Debug');
    console.log('⏰ Debug timestamp:', new Date().toISOString());
    
    this.debugAvatarSystem(gameEngine);
    
    if (districtSystem) {
      this.debugDistrictSystem(districtSystem);
    } else {
      console.warn('⚠️ District system not provided for debug');
    }
    
    console.groupEnd();
  }

  // Safe wrapper methods
  private safeGetCurrentUser(gameEngine: GameEngine) {
    try {
      if (typeof gameEngine.getCurrentUser === 'function') {
        return gameEngine.getCurrentUser();
      } else {
        console.warn('⚠️ getCurrentUser method not available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  private safeGetAllAvatars(gameEngine: GameEngine) {
    try {
      if (typeof gameEngine.getAllAvatars === 'function') {
        return gameEngine.getAllAvatars();
      } else {
        console.warn('⚠️ getAllAvatars method not available');
        return [];
      }
    } catch (error) {
      console.error('❌ Error getting all avatars:', error);
      return [];
    }
  }

  private safeGetGameState(gameEngine: GameEngine) {
    try {
      if (typeof gameEngine.getGameState === 'function') {
        return gameEngine.getGameState();
      } else {
        console.warn('⚠️ getGameState method not available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting game state:', error);
      return null;
    }
  }

  private safeGetDistricts(districtSystem: DistrictSystem) {
    try {
      if (typeof districtSystem.getDistricts === 'function') {
        return districtSystem.getDistricts();
      } else {
        console.warn('⚠️ getDistricts method not available');
        return [];
      }
    } catch (error) {
      console.error('❌ Error getting districts:', error);
      return [];
    }
  }

  private safeGetCurrentDistrict(districtSystem: DistrictSystem) {
    try {
      if (typeof districtSystem.getCurrentDistrict === 'function') {
        return districtSystem.getCurrentDistrict();
      } else {
        console.warn('⚠️ getCurrentDistrict method not available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting current district:', error);
      return null;
    }
  }

  private safeGetTrackedAvatar(districtSystem: DistrictSystem) {
    try {
      if (typeof districtSystem.getTrackedAvatarId === 'function') {
        return districtSystem.getTrackedAvatarId();
      } else {
        console.warn('⚠️ getTrackedAvatarId method not available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting tracked avatar:', error);
      return null;
    }
  }
}

// Export singleton instance
export const safeDebugSystem = SafeDebugSystem.getInstance();