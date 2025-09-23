'use client';

import { useEffect, useRef } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';

/**
 * ViewportControlComponent - Controls for viewport management
 */
export function ViewportControlComponent() {
  const gameEngineRef = useRef<GameEngine | null>(null);

  const handleCenterMap = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.centerOnMap();
      console.log('🎯 Map centered via control panel');
    }
  };

  const handleFitMap = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.fitMapToViewport();
      console.log('📏 Map fitted to viewport via control panel');
    }
  };

  const handleZoomIn = () => {
    if (gameEngineRef.current) {
      const viewport = (gameEngineRef.current as any).viewport;
      if (viewport) {
        const currentZoom = viewport.getState().zoom;
        viewport.setZoom(currentZoom * 1.2);
      }
    }
  };

  const handleZoomOut = () => {
    if (gameEngineRef.current) {
      const viewport = (gameEngineRef.current as any).viewport;
      if (viewport) {
        const currentZoom = viewport.getState().zoom;
        viewport.setZoom(currentZoom * 0.8);
      }
    }
  };

  const handleResetView = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.centerOnMap();
      console.log('🔄 View reset to default');
    }
  };

  // Listen for GameEngine initialization
  useEffect(() => {
    const handleGameEngineReady = (event: CustomEvent) => {
      gameEngineRef.current = event.detail;
      console.log('🎮 GameEngine ready in ViewportControl');
    };

    window.addEventListener('gameEngineReady', handleGameEngineReady as EventListener);

    return () => {
      window.removeEventListener('gameEngineReady', handleGameEngineReady as EventListener);
    };
  }, []);

  return (
    <div className="fixed top-4 left-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg z-50">
      <h3 className="font-bold text-lg mb-3">📷 Control de Cámara</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={handleZoomIn}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
          title="Acercar vista"
        >
          🔍 Zoom +
        </button>
        
        <button
          onClick={handleZoomOut}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
          title="Alejar vista"
        >
          🔍 Zoom -
        </button>
        
        <button
          onClick={handleCenterMap}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
          title="Centrar el mapa"
        >
          🎯 Centrar
        </button>
        
        <button
          onClick={handleFitMap}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm"
          title="Ajustar mapa al viewport"
        >
          📏 Ajustar
        </button>
      </div>

      <button
        onClick={handleResetView}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
        title="Restablecer vista"
      >
        🔄 Restablecer Vista
      </button>

      <div className="text-xs text-gray-600 mt-3 space-y-1">
        <div>🖱️ Arrastra para mover la cámara</div>
        <div>🎯 Usa estos controles para mejor navegación</div>
        <div>📏 "Ajustar" muestra todo el mapa</div>
        <div>🎯 "Centrar" optimiza la vista</div>
      </div>
    </div>
  );
}