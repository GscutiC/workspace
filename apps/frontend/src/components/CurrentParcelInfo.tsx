'use client';

import { useState, useEffect } from 'react';
import type { ParcelInfo } from '@/lib/game/generators/CityGenerator';
import type { CurrentParcelInfoProps } from '@/types/components';
import { isGameEngineReady } from '@/types/components';

export function CurrentParcelInfo({ gameEngine, currentUserId }: CurrentParcelInfoProps) {
  const [currentParcel, setCurrentParcel] = useState<ParcelInfo | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isGameEngineReady(gameEngine) || !currentUserId) {
      return;
    }

    const updateParcelInfo = () => {
      try {
        // Get current user position using the typed interface
        const avatar = gameEngine.gameState?.avatars?.get(currentUserId);

        if (avatar) {
          const newPosition = { x: Math.round(avatar.position.x), y: Math.round(avatar.position.y) };
          setPosition(newPosition);

          // Get current parcel using typed method
          const parcel = gameEngine.getCurrentUserParcel();
          setCurrentParcel(parcel || null);
        }
      } catch (error) {
        console.error('Error updating parcel info:', error);
        setCurrentParcel(null);
        setPosition(null);
      }
    };

    // Update immediately
    updateParcelInfo();

    // Update every 500ms to track movement
    const interval = setInterval(updateParcelInfo, 500);

    return () => {
      clearInterval(interval);
    };
  }, [gameEngine, currentUserId]);

  // Always show the component for debugging
  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-[200px] z-30">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        📍 Detección de Parcela
      </h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <span className="text-gray-500">Estado:</span>
          <br />
          <span className="font-mono">
            {!gameEngine ? 'No GameEngine' :
             !currentUserId ? 'No userId' :
             !position ? 'No Position' :
             'Active'}
          </span>
        </div>
        
        {position && (
          <div>
            <span className="text-gray-500">Coordenadas:</span>
            <br />
            <span className="font-mono">({position.x}, {position.y})</span>
          </div>
        )}
        
        {currentParcel ? (
          <div className="border-t pt-2">
            <div className="font-medium text-blue-600">
              🏗️ Parcela #{currentParcel.number}
            </div>
            <div className="text-gray-600">
              Tipo: {currentParcel.type}
            </div>
            <div className="text-gray-600">
              Distrito: {currentParcel.districtType}
            </div>
            <div className="text-gray-600">
              Tamaño: {currentParcel.width}×{currentParcel.height}px
            </div>
            {currentParcel.buildingType && (
              <div className="text-gray-600">
                Edificio: {currentParcel.buildingType}
              </div>
            )}
          </div>
        ) : position ? (
          <div className="border-t pt-2 text-gray-500">
            🌳 Área pública
          </div>
        ) : (
          <div className="border-t pt-2 text-yellow-600">
            ⚠️ Buscando avatar...
          </div>
        )}
      </div>
    </div>
  );
}