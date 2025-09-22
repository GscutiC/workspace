'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { GameEngine } from '@/lib/game/GameEngine';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';
import type { AvatarData } from '@/types/game';
import { UserStatus } from '@/types/game';

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
    
    console.log('👤 Adding real user to virtual office:', userData.name);
    gameEngine.addUser({
      id: userData.id,
      name: userData.name,
      color: userData.color || 0x4F46E5,
      avatar: userData.avatar || 'default',
      status: userData.status || UserStatus.AVAILABLE,
    });

    // Update connected users state
    setConnectedUsers(gameEngine.getAllAvatars());
  }, []);

  /**
   * Remove a user from the virtual office (would be called via WebSocket)
   */
  const removeRealUser = useCallback((userId: string) => {
    if (!gameEngineRef.current) return;

    const gameEngine = gameEngineRef.current;
    
    console.log('👤 Removing user from virtual office:', userId);
    gameEngine.removeUser(userId);

    // Update connected users state
    setConnectedUsers(gameEngine.getAllAvatars());
  }, []);

  /**
   * Initialize the game engine
   */
  const initializeGame = useCallback(async () => {
    if (!canvasRef.current || gameEngineRef.current || !userLoaded) return;

    try {
      console.log('🎮 Initializing Virtual Office...');
      
      // Create game engine
      const gameEngine = new GameEngine();
      gameEngineRef.current = gameEngine;

      // Initialize with canvas
      await gameEngine.init(canvasRef.current);

      // Start the game
      await gameEngine.start();

      // Get player configuration (prioritize saved config, fallback to user data)
      let playerName = user?.fullName || user?.firstName || 'Usuario';
      let playerColor = 0x4F46E5;
      let playerAvatar = 'default';
      
      if (avatarConfig) {
        playerName = avatarConfig.name || playerName;
        playerColor = avatarConfig.color || playerColor;
        playerAvatar = avatarConfig.avatar || playerAvatar;
        console.log('🎨 Using saved avatar configuration');
      }

      // Add initial user (player)
      const playerAvatarData = gameEngine.addUser({
        id: currentUserId,
        name: playerName,
        color: playerColor,
        avatar: playerAvatar,
        status: UserStatus.AVAILABLE,
      });

      // Set as current user
      gameEngine.setCurrentUser(currentUserId);

      // Update connected users state
      setConnectedUsers(gameEngine.getAllAvatars());

      setIsInitialized(true);
      console.log('✅ Virtual Office initialized successfully');
      
      // Auto-center on avatar after initialization
      setTimeout(() => {
        const avatar = gameEngine.getAvatar(currentUserId);
        if (avatar) {
          const viewport = gameEngine.getViewport();
          viewport.moveTo(avatar.position, true);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error initializing Virtual Office:', error);
    }
  }, [userLoaded, user, avatarConfig, currentUserId]);

  /**
   * Handle window resize
   */
  const handleResize = useCallback(() => {
    if (!gameEngineRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    gameEngineRef.current.resize(rect.width, rect.height);
  }, []);

  /**
   * Setup resize observer
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Initial resize
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  /**
   * Initialize game when component mounts
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const init = async () => {
      // Small delay to ensure canvas is properly mounted
      timeoutId = setTimeout(async () => {
        await initializeGame();
        setIsLoaded(true);
      }, 100);
    };

    init();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initializeGame]);

  /**
   * Listen for avatar configuration changes and update current user
   */
  useEffect(() => {
    const handleAvatarConfigChange = (event: CustomEvent) => {
      const newConfig = event.detail;
      if (!gameEngineRef.current || !isInitialized) return;

      console.log('🎨 Avatar config changed, updating current user:', newConfig);
      
      const gameEngine = gameEngineRef.current;
      const currentUser = gameEngine.getAvatar(currentUserId);
      
      if (currentUser) {
        // Update the current user's avatar in the game
        const updatedUser = {
          ...currentUser,
          name: newConfig.name || currentUser.name,
          color: newConfig.color || currentUser.color,
          avatar: newConfig.avatar || currentUser.avatar
        };
        
        // Remove and re-add user with new configuration
        gameEngine.removeUser(currentUserId);
        gameEngine.addUser(updatedUser);
        gameEngine.setCurrentUser(currentUserId);
        
        // Update connected users state
        setConnectedUsers(gameEngine.getAllAvatars());
        
        console.log('✅ Current user avatar updated in real-time');
      }
    };

    window.addEventListener('avatarConfigChanged', handleAvatarConfigChange as EventListener);
    
    return () => {
      window.removeEventListener('avatarConfigChanged', handleAvatarConfigChange as EventListener);
    };
  }, [currentUserId, isInitialized]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, []);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((message: string) => {
    if (!gameEngineRef.current || !message.trim()) return;

    gameEngineRef.current.sendChatMessage(currentUserId, message.trim());

    // Update connected users to reflect new message
    setConnectedUsers(gameEngineRef.current.getAllAvatars());
  }, [currentUserId]);

  /**
   * Update user status
   */
  const updateStatus = useCallback((status: UserStatus) => {
    if (!gameEngineRef.current) return;

    gameEngineRef.current.updateAvatarStatus(currentUserId, status);
    setConnectedUsers(gameEngineRef.current.getAllAvatars());
  }, [currentUserId]);

  /**
   * Toggle debug mode
   */
  const toggleDebug = useCallback(() => {
    if (!gameEngineRef.current) return;

    const gameEngine = gameEngineRef.current;
    
    // Toggle debug mode on tilemap
    gameEngine.toggleDebugMode();
    
    // Get comprehensive debug information
    const debugInfo = gameEngine.getDebugInfo();
    console.log('🐛 COMPREHENSIVE DEBUG INFO:');
    console.log('🐛 Game State:', debugInfo.gameState);
    console.log('🐛 Layers:', debugInfo.layers);
    console.log('🐛 Systems:', debugInfo.systems);
    console.log('🐛 Avatars:', debugInfo.avatars);
    console.log('🐛 World Container:', debugInfo.worldContainer);
    console.log('🐛 Character Layer:', debugInfo.characterLayer);
    
    // Also log viewport information
    const viewport = gameEngine.getViewport();
    const viewportState = viewport.getState();
    console.log('🐛 Viewport State:', viewportState);
    
    // Force a manual check of the character layer
    const allAvatars = gameEngine.getAllAvatars();
    console.log('🐛 All avatars from GameEngine:', allAvatars);
    
    alert('Debug information logged to console. Open DevTools to see details.');
  }, []);

  /**
   * Force center camera on current user avatar
   */
  const centerOnAvatar = useCallback(() => {
    if (!gameEngineRef.current || !currentUserId) return;

    const gameEngine = gameEngineRef.current;
    const avatar = gameEngine.getAvatar(currentUserId);
    
    if (avatar) {
      console.log(`🎯 Centering camera on ${avatar.name} at (${avatar.position.x}, ${avatar.position.y})`);
      
      // Center viewport on avatar
      const viewport = gameEngine.getViewport();
      viewport.moveTo(avatar.position, true);
    } else {
      console.error('❌ No avatar found for current user:', currentUserId);
    }
  }, [currentUserId]);

  /**
   * Move to specific position (for demo purposes)
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
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{
            display: 'block',
            outline: 'none',
          }}
          tabIndex={0} // Make canvas focusable for keyboard input
        />
      </div>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Virtual Office...</p>
          </div>
        </div>
      )}

      {/* Controls UI */}
      {isInitialized && (
        <>
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
            {/* Status Controls */}
            <div className="bg-white rounded-lg shadow-lg p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Your Status</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(UserStatus.AVAILABLE)}
                  className="px-3 py-1 rounded text-xs bg-green-100 text-green-800 hover:bg-green-200"
                >
                  Available
                </button>
                <button
                  onClick={() => updateStatus(UserStatus.BUSY)}
                  className="px-3 py-1 rounded text-xs bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Busy
                </button>
                <button
                  onClick={() => updateStatus(UserStatus.AWAY)}
                  className="px-3 py-1 rounded text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  Away
                </button>
              </div>
            </div>

            {/* Chat Input */}
            <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const message = formData.get('message') as string;
                  sendMessage(message);
                  e.currentTarget.reset();
                }}
              >
                <div className="flex gap-2">
                  <input
                    name="message"
                    type="text"
                    placeholder="Say something..."
                    className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={100}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20">
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

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-lg p-3">
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/virtual-office/lobby')}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                >
                  Configurar Avatar
                </button>
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
                  onClick={() => moveToPosition(400, 300)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Center
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg max-w-xs z-20">
            <h4 className="font-medium mb-1">Controls</h4>
            <ul className="space-y-1 text-xs">
              <li>• Click to move your avatar</li>
              <li>• Use WASD or arrow keys</li>
              <li>• Mouse wheel to zoom</li>
              <li>• Drag to pan the camera</li>
              <li>• Type messages to chat</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}