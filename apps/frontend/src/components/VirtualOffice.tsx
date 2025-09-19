'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Game state for UI
  const [connectedUsers, setConnectedUsers] = useState<AvatarData[]>([]);
  const [currentUserId] = useState<string>('user-1');

  /**
   * Initialize the game engine
   */
  const initializeGame = useCallback(async () => {
    if (!canvasRef.current || gameEngineRef.current) return;

    try {
      // Create game engine
      const gameEngine = new GameEngine();
      gameEngineRef.current = gameEngine;

      // Initialize with canvas
      await gameEngine.init(canvasRef.current);

      // Start the game
      await gameEngine.start();

      // Add initial user (player)
      gameEngine.addUser({
        id: currentUserId,
        name: 'You',
        color: 0x4F46E5, // Indigo
        avatar: 'default',
      });

      // Set as current user
      gameEngine.setCurrentUser(currentUserId);

      // Add some demo users
      const demoUsers = [
        { id: 'user-2', name: 'Alice', color: 0xEF4444, status: UserStatus.AVAILABLE },
        { id: 'user-3', name: 'Bob', color: 0x10B981, status: UserStatus.BUSY },
        { id: 'user-4', name: 'Carol', color: 0xF59E0B, status: UserStatus.AWAY },
        { id: 'user-5', name: 'David', color: 0x8B5CF6, status: UserStatus.AVAILABLE },
      ];

      demoUsers.forEach(user => {
        gameEngine.addUser({
          id: user.id,
          name: user.name,
          color: user.color,
          avatar: 'default',
        });
        gameEngine.updateAvatarStatus(user.id, user.status);
      });

      // Update connected users state
      setConnectedUsers(gameEngine.getAllAvatars());
      setIsInitialized(true);

      console.log('Virtual Office initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Virtual Office:', error);
    }
  }, [currentUserId]);

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
    gameEngineRef.current.toggleDebugMode();
  }, []);

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