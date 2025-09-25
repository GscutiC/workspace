'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { GameEngine } from '@/lib/game/GameEngine';
import { ViewportResizeManager } from '@/lib/game/ViewportResizeManager';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';
import { RealParcelManager } from '@/components/RealParcelManager';
import { ParcelInfoPanel } from '@/components/ParcelInfoPanel';
import { CurrentParcelInfo } from '@/components/CurrentParcelInfo';
import { ParcelAdminPanel } from '@/components/ParcelAdminPanel';
import { DistrictNavigator } from '@/components/DistrictNavigator';
import { DistrictStatusIndicator } from '@/components/DistrictStatusIndicator';
import { useDistrictSystem } from '@/hooks/useDistrictSystem';
import { useDistricts } from '@/hooks/useDistricts';
import { ParcelInfo } from '@/lib/game/generators/CityGenerator';
import { logInfo, logDebug, LogCategory } from '@/lib/utils/logger';
import type { GameEngineInterface } from '@/types/components';
import type { District } from '@/lib/graphql';
import type { AvatarData } from '@/types/game';
import { UserStatus } from '@/types/game';

interface ParcelData extends ParcelInfo {
  id?: string;
  status: 'available' | 'reserved' | 'sold' | 'maintenance';
  price?: number;
  owner?: string;
  lastModified?: Date;
}

/**
 * VirtualOffice component - Main React component for the 2D virtual office
 * Features:
 * - Pixi.js initialization and responsive resize
 * - Viewport with zoom and pan controls
 * - Tile map rendering with layered system
 * - Avatar management with smooth movement
 * - Performance optimizations with object pooling and culling
 */
export function VirtualOffice() {
  const gameEngineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportResizeManagerRef = useRef<ViewportResizeManager | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get real user information from Clerk
  const { user, isLoaded: userLoaded } = useUser();
  
  // Get avatar configuration with real-time updates
  const { config: avatarConfig } = useAvatarConfig();

  // Game state for UI
  const [connectedUsers, setConnectedUsers] = useState<AvatarData[]>([]);
  const [currentUserId] = useState<string>(() => user?.id || `user-${Date.now()}`);

  // Parcel management state
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [showParcelInfo, setShowParcelInfo] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // District management state
  const [showDistrictOverlay, setShowDistrictOverlay] = useState(true); // Activado por defecto
  const [showDistrictNavigator, setShowDistrictNavigator] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | undefined>();

  // District system state
  const [districtSystemReady, setDistrictSystemReady] = useState(false);
  
  // Load district data
  const { data: districts, isLoading: districtsLoading } = useDistricts();
  
  // Initialize district system AFTER game engine is ready
  const districtSystem = useDistrictSystem(
    isInitialized && gameEngineRef.current ? gameEngineRef.current.getApp() : null,
    isInitialized && gameEngineRef.current ? gameEngineRef.current.getWorldContainer() : null,
    {
      enabled: isInitialized && !!gameEngineRef.current,
      showLabels: true,
      showBorders: true,
      opacity: 0.2,
      interactive: true,
      onDistrictClick: (district) => {
        logInfo(LogCategory.DISTRICTS, 'District clicked', { district: district.zoneCode });
        setSelectedDistrictId(district.id);
        handleDistrictNavigate(district.bounds);
      },
      onDistrictHover: (district) => {
        logDebug(LogCategory.DISTRICTS, 'District hovered', { district: district.zoneCode });
      }
    }
  );

  // Set up avatar tracking for district detection
  useEffect(() => {
    if (!districtSystem.districtSystem || !gameEngineRef.current || !currentUserId) {
      return;
    }

    const ds = districtSystem.districtSystem;

    // Start tracking the current user's avatar
    ds.startTrackingAvatar(currentUserId);
    logInfo(LogCategory.DISTRICTS, 'Started tracking avatar for district detection', { avatarId: currentUserId });

    // Set up district change event listener
    const handleDistrictChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ current: District | null; previous: District | null }>;
      const { current, previous } = customEvent.detail;

      setSelectedDistrictId(current?.id);

      logInfo(LogCategory.DISTRICTS, 'Avatar district changed', {
        previous: previous?.zoneCode || 'none',
        current: current?.zoneCode || 'none',
        currentName: current?.name || 'Outside districts'
      });

      // You could add a toast notification here or update UI state
      if (current) {
        // TODO: Show district notification or update UI
        console.log(`🏙️ Entered district: ${current.name} (${current.zoneCode})`);
      } else if (previous) {
        console.log(`🚶 Left district: ${previous.name} (${previous.zoneCode})`);
      }
    };

    window.addEventListener('districtchange', handleDistrictChange);

    return () => {
      // Clean up
      window.removeEventListener('districtchange', handleDistrictChange);
      ds.stopTrackingAvatar();
      logDebug(LogCategory.DISTRICTS, 'Cleaned up district tracking');
    };
  }, [districtSystem.districtSystem, currentUserId, isInitialized]);

  /**
   * Add a real user to the virtual office (would be called via WebSocket)
   */
  const addRealUser = useCallback((userData: {
    id: string;
    name: string;
    avatar?: string;
    color?: number;
    status?: UserStatus;
  }, customPosition?: { x: number; y: number }) => {
    if (!gameEngineRef.current) return;

    const gameEngine = gameEngineRef.current;
    
    // Check if user already exists
    const existingUser = connectedUsers.find(u => u.id === userData.id);
    if (existingUser) return;

    // Add avatar to game
    const avatarData: Omit<AvatarData, 'position' | 'direction'> = {
      id: userData.id,
      name: userData.name,
      avatar: userData.avatar || 'default',
      color: userData.color || 0x4287f5,
      status: userData.status || UserStatus.AVAILABLE
    };

    const fullAvatarData = gameEngine.addUser(avatarData, customPosition);
    setConnectedUsers(prev => [...prev, fullAvatarData]);
  }, [connectedUsers]);

  /**
   * Update user status
   */
  const updateStatus = useCallback((status: UserStatus) => {
    if (!gameEngineRef.current) return;
    
    setConnectedUsers(prev => 
      prev.map(user => 
        user.id === currentUserId 
          ? { ...user, status }
          : user
      )
    );
  }, [currentUserId]);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((message: string) => {
    if (!gameEngineRef.current || !message.trim()) return;
    
    console.log('💬 Chat message:', { user: currentUserId, message });
    // Here you would typically send to WebSocket
  }, [currentUserId]);

  /**
   * Center camera on current user's avatar
   */
  const centerOnAvatar = useCallback(() => {
    console.log('🎯 centerOnAvatar clicked');
    console.log('🔍 GameEngine status:', { 
      exists: !!gameEngineRef.current, 
      isInitialized, 
      userLoaded 
    });
    
    if (gameEngineRef.current) {
      console.log('🎯 Centering on avatar...');
      const currentUser = gameEngineRef.current.getGameState()?.currentUser;
      if (currentUser) {
        // Force immediate centering
        gameEngineRef.current.getViewport()?.moveTo(currentUser.position, true);
        console.log('✅ Centered on avatar at:', currentUser.position);
        
        // Center camera on avatar
        setTimeout(() => {
          if (gameEngineRef.current) {
            console.log('📷 Ensuring camera is centered on avatar');
          }
        }, 100);
      } else {
        console.warn('❌ No current user found');
        // Try to get any avatar and center on it
        const gameState = gameEngineRef.current.getGameState();
        if (gameState.avatars.size > 0) {
          const firstAvatar = Array.from(gameState.avatars.values())[0];
          gameEngineRef.current.getViewport()?.moveTo(firstAvatar.position, true);
          console.log('📍 Centered on first available avatar:', firstAvatar.name);
        }
      }
    } else {
      console.error('❌ GameEngine not available for centerOnAvatar');
    }
  }, []);



  /**
   * Toggle parcel numbering overlay
   */
  const toggleParcels = useCallback(() => {
    console.log('🏗️ toggleParcels clicked');
    if (gameEngineRef.current) {
      console.log('🏗️ Toggling parcel visibility...');
      try {
        const tileMap = gameEngineRef.current.getTileMap();
        if (tileMap && typeof tileMap.toggleParcels === 'function') {
          tileMap.toggleParcels();
          console.log('✅ Parcels toggled via TileMap');
        } else if (typeof gameEngineRef.current.toggleParcels === 'function') {
          gameEngineRef.current.toggleParcels();
          console.log('✅ Parcels toggled via GameEngine');
        } else {
          console.warn('⚠️ toggleParcels method not found');
        }
      } catch (error) {
        console.error('❌ Error toggling parcels:', error);
      }
    } else {
      console.error('❌ GameEngine not available for toggleParcels');
    }
  }, []);

  /**
   * Toggle parcel management panel
   */
  const toggleParcelManager = useCallback(() => {
    console.log('🎛️ toggleParcelManager clicked - Opening Admin Panel');
    setShowAdminPanel(!showAdminPanel);
    console.log('✅ Admin Panel toggled to:', !showAdminPanel);
  }, [showAdminPanel]);

  /**
   * Handle parcel selection
   */
  const handleParcelSelect = useCallback((parcel: ParcelData) => {
    setSelectedParcel(parcel);
    setShowParcelInfo(true);
  }, []);

  /**
   * Handle parcel update
   */
  const handleParcelUpdate = useCallback((updatedParcel: ParcelData) => {
    setSelectedParcel(updatedParcel);
  }, []);

  /**
   * Handle district selection
   */
  const handleDistrictSelect = useCallback((districtId: string) => {
    setSelectedDistrictId(districtId);
  }, []);

  /**
   * Handle district navigation - center camera on district
   */
  const handleDistrictNavigate = useCallback((bounds: { x1: number; y1: number; x2: number; y2: number }) => {
    if (!gameEngineRef.current) return;

    const centerX = (bounds.x1 + (bounds.x2 - bounds.x1) / 2) * 32; // Convert to pixel coordinates (TILE_SIZE = 32)
    const centerY = (bounds.y1 + (bounds.y2 - bounds.y1) / 2) * 32;
    
    const viewport = gameEngineRef.current.getViewport();
    if (viewport) {
      // Animate to the district center
      viewport.moveTo({ x: centerX, y: centerY }, true);
      console.log(`🗺️ Navigating to district bounds:`, bounds, `center: (${centerX}, ${centerY})`);
    }
  }, []);

  /**
   * Toggle district overlay visibility
   */
  const toggleDistrictOverlay = useCallback(() => {
    const newValue = !showDistrictOverlay;
    setShowDistrictOverlay(newValue);
    
    // Use integrated district system
    if (districtSystem.isReady) {
      districtSystem.setVisible(newValue);
      console.log('🏢 Integrated district system toggled to:', newValue);
    }
    
    console.log('🏢 District overlay toggled to:', newValue);
  }, [showDistrictOverlay, districtSystem]);

  /**
   * Toggle district navigator panel
   */
  const toggleDistrictNavigator = useCallback(() => {
    setShowDistrictNavigator(!showDistrictNavigator);
    console.log('🗺️ District navigator toggled to:', !showDistrictNavigator);
  }, [showDistrictNavigator]);

  /**
   * Handle parcel status change
   */
  const handleParcelStatusChange = useCallback((status: ParcelData['status']) => {
    if (selectedParcel) {
      const updatedParcel = { ...selectedParcel, status };
      handleParcelUpdate(updatedParcel);
    }
  }, [selectedParcel, handleParcelUpdate]);

  /**
   * Initialize the game engine - IMPROVED with better condition checking
   */
  useEffect(() => {
    // Check initialization conditions
    if (!avatarConfig) {
      return;
    }

    // Prevent re-initialization if GameEngine already exists
    if (gameEngineRef.current || isInitialized) {
      return;
    }

    const initializeGame = async () => {
      try {
        const gameEngine = new GameEngine();
        
        if (!containerRef.current) {
          console.error('❌ Container ref not available');
          return;
        }

        // Create canvas element
        const canvas = document.createElement('canvas');
        containerRef.current.appendChild(canvas);

        await gameEngine.init(canvas);
        gameEngineRef.current = gameEngine;

        // Add current user avatar with better fallbacks
        const userName = user?.firstName || user?.username || avatarConfig.name || `User-${currentUserId.slice(-4)}`;
        const currentUserData: Omit<AvatarData, 'position' | 'direction'> = {
          id: currentUserId,
          name: userName,
          avatar: avatarConfig.avatar || 'default',
          color: avatarConfig.color || 0x4287f5,
          status: UserStatus.AVAILABLE
        };
        const fullCurrentUserData = gameEngine.addUser(currentUserData);
        setConnectedUsers([fullCurrentUserData]);

        // Set this as the current user for the game engine
        gameEngine.setCurrentUser(currentUserId);
        console.log('✅ Current user set in game engine:', currentUserId);

        setIsInitialized(true);
        setIsLoaded(true);
        
        console.log('✅ Game initialization complete');

        // Start game loop immediately after initialization
        await gameEngine.start();

        // Initialize viewport resize manager
        if (containerRef.current) {
          const resizeManager = new ViewportResizeManager(gameEngine, containerRef.current);
          viewportResizeManagerRef.current = resizeManager;
        }

        // Initialize viewport after game setup
        setTimeout(() => {
          if (gameEngineRef.current) {
            const viewport = gameEngineRef.current.getViewport();
            if (viewport) {
              viewport.setZoom(0.5);
              viewport.moveTo({ x: 3200, y: 2400 }, true);
            }
          }
        }, 1000);
      } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        if (error instanceof Error) {
          console.error('❌ Error details:', error.message);
          console.error('❌ Stack trace:', error.stack);
        }

        // ✅ IMPROVED: Better error recovery
        setIsLoaded(true); // Still set to loaded to prevent infinite loading

        // Try to clean up partial initialization
        if (gameEngineRef.current) {
          try {
            gameEngineRef.current.destroy();
            gameEngineRef.current = null;
          } catch (cleanupError) {
            console.warn('⚠️ Error during cleanup:', cleanupError);
          }
        }

        // Show user-friendly error message
        console.log('🔄 Game initialization failed. Please refresh the page to try again.');
      }
    };

    initializeGame();

    // Cleanup function - ONLY clean up when component unmounts, not on re-renders
    return () => {
      // Cleanup ViewportResizeManager
      if (viewportResizeManagerRef.current) {
        viewportResizeManagerRef.current.destroy();
        viewportResizeManagerRef.current = null;
      }
      
      if (gameEngineRef.current) {
        // Don't set to null immediately - check if we're actually unmounting
        const shouldCleanup = !containerRef.current || !containerRef.current.isConnected;
        if (shouldCleanup) {
          gameEngineRef.current = null;
        }
      }
    };
  }, [avatarConfig, isInitialized, user, currentUserId]); // ✅ Removed userLoaded dependency for faster initialization

  // Effect to handle district system visibility
  useEffect(() => {
    if (districtSystem?.isReady && isInitialized) {
      districtSystem.setVisible(showDistrictOverlay);
    }
  }, [districtSystem, showDistrictOverlay, isInitialized]);

  // Effect to render districts on minimap
  useEffect(() => {
    if (gameEngineRef.current && districts && districts.length > 0 && isInitialized) {
      try {
        const minimapSystem = gameEngineRef.current.getMinimapSystem?.();
        if (minimapSystem && minimapSystem.renderDistricts) {
          minimapSystem.renderDistricts(districts);
        }
      } catch (error) {
        console.error('❌ Error rendering districts on minimap:', error);
      }
    }
  }, [districts, isInitialized]);

  /**
   * Handle canvas resize
   */
  useEffect(() => {
    if (!isInitialized || !gameEngineRef.current) return;

    const handleResize = () => {
      if (gameEngineRef.current && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        gameEngineRef.current.resize(clientWidth, clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Initial resize
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isInitialized]);

  /*
   * REMOVED: Start game loop after initialization
   * This was causing timing issues - now starting immediately after init
   */
  /*
  useEffect(() => {
    console.log('🔍 AUDIT: Start useEffect triggered', { 
      isInitialized, 
      hasGameEngine: !!gameEngineRef.current 
    });
    
    if (!isInitialized || !gameEngineRef.current) {
      console.log('⚠️ AUDIT: Cannot start - missing requirements');
      return;
    }

    const gameEngine = gameEngineRef.current;
    
    console.log('🚀 CRITICAL: Starting game engine from VirtualOffice');
    gameEngine.start();

    return () => {
      if (gameEngine.getGameState().isRunning) {
        gameEngine.stop();
      }
    };
  }, [isInitialized]);
  */

  /**
   * Keyboard controls setup
   */
  useEffect(() => {
    if (!isInitialized || !gameEngineRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameEngineRef.current) return;

      const moveDistance = 32; // One tile
      const gameEngine = gameEngineRef.current;
      const currentUser = connectedUsers.find(u => u.id === currentUserId);
      
      if (!currentUser) return;

      let newX = currentUser.position.x;
      let newY = currentUser.position.y;

      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          newY -= moveDistance;
          break;
        case 's':
        case 'arrowdown':
          newY += moveDistance;
          break;
        case 'a':
        case 'arrowleft':
          newX -= moveDistance;
          break;
        case 'd':
        case 'arrowright':
          newX += moveDistance;
          break;
        default:
          return; // Don't prevent default for other keys
      }

      event.preventDefault();
      gameEngine.moveAvatar(currentUserId, { x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInitialized, connectedUsers, currentUserId]);

  // Sync district system visibility with state
  useEffect(() => {
    if (districtSystem.isReady) {
      districtSystem.setVisible(showDistrictOverlay);
      console.log('🏢 District system visibility synced:', showDistrictOverlay);
    }
  }, [showDistrictOverlay, districtSystem.isReady]);

  /**
   * Move to specific position (for testing)
   */
  const moveToPosition = useCallback((x: number, y: number) => {
    if (!gameEngineRef.current) return;
    gameEngineRef.current.moveAvatar(currentUserId, { x, y });
  }, [currentUserId]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-100 rounded-lg overflow-hidden">
      {/* Game Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }} // Prevent touch scrolling
      >
        {/* Canvas will be injected here by Pixi.js */}
      </div>

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600" suppressHydrationWarning translate="no">
              Loading Virtual Office...
            </p>
          </div>
        </div>
      )}

      {/* User Info and Connected Users - Always visible */}
      {isInitialized && (
        <div className="absolute bottom-4 left-4 flex gap-4 z-20">
          {/* Connected Users */}
          <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Connected Users ({connectedUsers.length})
            </h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {connectedUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user.status === UserStatus.AVAILABLE ? 'bg-green-500' :
                      user.status === UserStatus.BUSY ? 'bg-red-500' :
                      user.status === UserStatus.AWAY ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}
                  />
                  <span className="truncate">{user.name}</span>
                  {user.id === currentUserId && (
                    <span className="text-gray-500">(You)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Parcel Info - Always visible in top left */}
      {isInitialized && gameEngineRef.current && (
        <CurrentParcelInfo 
          gameEngine={gameEngineRef.current as unknown as GameEngineInterface}
          currentUserId={currentUserId}
        />
      )}

      {/* Essential Controls - Always visible */}
      {isInitialized && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-lg p-3">
            <div className="flex gap-2">
              <button
                onClick={centerOnAvatar}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
              >
                Find Avatar
              </button>

              <button
                onClick={toggleParcels}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Parcelas
              </button>
              <button
                onClick={toggleDistrictOverlay}
                className={`px-3 py-1 text-white rounded text-xs ${
                  showDistrictOverlay 
                    ? 'bg-orange-700 hover:bg-orange-800' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                Distritos
              </button>
              <button
                onClick={toggleDistrictNavigator}
                className={`px-3 py-1 text-white rounded text-xs ${
                  showDistrictNavigator 
                    ? 'bg-indigo-700 hover:bg-indigo-800' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Mapa
              </button>
              <button
                onClick={toggleParcelManager}
                className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Parcel Information Panel */}
      {showParcelInfo && selectedParcel && (
        <ParcelInfoPanel
          parcel={selectedParcel}
          onClose={() => setShowParcelInfo(false)}
          onUpdate={handleParcelUpdate}
          onStatusChange={handleParcelStatusChange}
        />
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className="absolute top-0 left-0 w-full h-full z-30 bg-black bg-opacity-50">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Parcel Administration</h2>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
              <ParcelAdminPanel 
                gameEngine={gameEngineRef.current as GameEngineInterface | null}
                onClose={() => setShowAdminPanel(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* District Overlay - Now using integrated DistrictSystem */}
      {/* District overlay is now handled by the integrated DistrictSystem */}

      {/* District Navigator */}
      {showDistrictNavigator && (
        <div className="absolute top-4 right-4 z-30">
          <DistrictNavigator 
            selectedDistrictId={selectedDistrictId}
            onDistrictSelect={handleDistrictSelect}
            onDistrictNavigate={handleDistrictNavigate}
          />
          <button
            onClick={() => setShowDistrictNavigator(false)}
            className="absolute top-2 right-2 w-6 h-6 bg-gray-500 text-white rounded-full text-xs hover:bg-gray-600 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      {/* District Status Indicator for debugging */}
      <DistrictStatusIndicator />
    </div>
  );
}