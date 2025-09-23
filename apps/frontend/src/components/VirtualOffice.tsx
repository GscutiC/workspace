'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { GameEngine } from '@/lib/game/GameEngine';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';
import { RealParcelManager } from '@/components/RealParcelManager';
import { ParcelInfoPanel } from '@/components/ParcelInfoPanel';
import { ParcelInfo } from '@/lib/game/generators/CityGenerator';
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
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [showParcelManager, setShowParcelManager] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [parcels, setParcels] = useState<ParcelInfo[]>([]);
  const [showParcelInfo, setShowParcelInfo] = useState(false);
  /**
   * Add a real user to the virtual office (would be called via WebSocket)
   */
  const addRealUser = useCallback((userData: {
    id: string;
    name: string;
    avatar?: string;
    color?: number;
    status?: UserStatus;
  }) => {
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

    const fullAvatarData = gameEngine.addUser(avatarData);
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
    if (!gameEngineRef.current) return;
    
    const gameEngine = gameEngineRef.current;
    const avatar = gameEngine.getGameState().avatars.get(currentUserId);
    if (!avatar) return;
    
    // Center the viewport on the avatar
    gameEngine.getViewport().moveTo(avatar.position, true);
  }, [currentUserId]);

  /**
   * Toggle debug overlay
   */
  const toggleDebug = useCallback(() => {
    if (!gameEngineRef.current) return;
    gameEngineRef.current.toggleDebugMode();
  }, []);

  /**
   * Toggle parcel numbering overlay
   */
  const toggleParcels = useCallback(() => {
    if (!gameEngineRef.current) return;
    gameEngineRef.current.toggleParcels();
  }, []);

  /**
   * Toggle parcel management panel
   */
  const toggleParcelManager = useCallback(() => {
    setShowParcelManager(!showParcelManager);
    
    // Load parcels when opening the manager
    if (!showParcelManager && gameEngineRef.current) {
      const tileMap = gameEngineRef.current.getTileMap();
      if (tileMap && typeof tileMap.getParcels === 'function') {
        const mapParcels = tileMap.getParcels();
        setParcels(mapParcels);
      }
    }
  }, [showParcelManager]);

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
    setParcels(prev => 
      prev.map(p => p.number === updatedParcel.number ? updatedParcel : p)
    );
    setSelectedParcel(updatedParcel);
  }, []);

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
   * Initialize the game engine
   */
  useEffect(() => {
    if (!userLoaded || !avatarConfig || isInitialized) return;

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

        console.log('🎮 Initializing game engine...');
        await gameEngine.init(canvas);
        
        gameEngineRef.current = gameEngine;

        // Add current user avatar 
        const userName = user?.firstName || user?.username || `User-${currentUserId.slice(-4)}`;
        const currentUserData: Omit<AvatarData, 'position' | 'direction'> = {
          id: currentUserId,
          name: userName,
          avatar: avatarConfig.name || 'default',
          color: avatarConfig.color || 0x4287f5,
          status: UserStatus.AVAILABLE
        };

        console.log('👤 Adding current user:', currentUserData);
        const fullCurrentUserData = gameEngine.addUser(currentUserData);
        setConnectedUsers([fullCurrentUserData]);

        // Set this as the current user for the game engine
        gameEngine.setCurrentUser(currentUserId);
        console.log('✅ Current user set in game engine:', currentUserId);

        // Add some demo users for testing
        setTimeout(() => {
          addRealUser({
            id: 'demo-user-1',
            name: 'Demo User 1',
            color: 0xff6b6b,
            status: UserStatus.AVAILABLE
          });
          
          addRealUser({
            id: 'demo-user-2', 
            name: 'Demo User 2',
            color: 0x4ecdc4,
            status: UserStatus.BUSY
          });
        }, 2000);

        setIsInitialized(true);
        setIsLoaded(true);
        
        console.log('✅ Game initialization complete');
      } catch (error) {
        console.error('❌ Failed to initialize game:', error);
      }
    };

    initializeGame();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up game engine...');
      if (gameEngineRef.current) {
        // GameEngine might not have explicit cleanup method
        console.log('🧹 Game engine cleaned up');
        gameEngineRef.current = null;
      }
    };
  }, [userLoaded, avatarConfig, currentUserId, user, addRealUser, isInitialized]);

  /**
   * Handle canvas resize
   */
  useEffect(() => {
    if (!isInitialized || !gameEngineRef.current) return;

    const handleResize = () => {
      if (gameEngineRef.current && containerRef.current) {
        console.log('📏 Resizing game canvas...');
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

  /**
   * Start game loop after initialization
   */
  useEffect(() => {
    if (!isInitialized || !gameEngineRef.current) return;

    const gameEngine = gameEngineRef.current;
    
    // Ensure the game loop starts only once
    if (!gameEngine.getGameState().isRunning) {
      gameEngine.start();
    }

    return () => {
      if (gameEngine.getGameState().isRunning) {
        gameEngine.stop();
      }
    };
  }, [isInitialized]);

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
            <p className="text-gray-600">Loading Virtual Office...</p>
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
                onClick={toggleDebug}
                className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
              >
                Debug
              </button>
              <button
                onClick={toggleParcels}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Parcelas
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

      {/* Parcel Management Panel */}
      {showParcelManager && (
        <div className="absolute top-0 left-0 w-2/3 h-full z-20 bg-white shadow-xl overflow-y-auto">
          <RealParcelManager />
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
    </div>
  );
}