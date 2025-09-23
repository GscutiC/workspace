'use client';

import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/lib/game/GameEngine';
import type { ParcelInfo } from '@/lib/game/generators/CityGenerator';

/**
 * ParcelTestComponent - Simple component to test parcel functionality
 */
export function ParcelTestComponent() {
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [parcels, setParcels] = useState<ParcelInfo[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ParcelInfo | null>(null);
  const [showParcels, setShowParcels] = useState(true);

  useEffect(() => {
    // Listen for parcel selection events
    const handleParcelSelected = (event: CustomEvent) => {
      const parcel = event.detail as ParcelInfo;
      setSelectedParcel(parcel);
      console.log('🏗️ Parcel selected:', parcel);
    };

    window.addEventListener('parcelSelected', handleParcelSelected as EventListener);

    return () => {
      window.removeEventListener('parcelSelected', handleParcelSelected as EventListener);
    };
  }, []);

  const handleToggleParcels = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.toggleParcels();
      setShowParcels(!showParcels);
    }
  };

  const handleRefreshParcels = () => {
    if (gameEngineRef.current) {
      const currentParcels = gameEngineRef.current.getParcels();
      setParcels(currentParcels);
      console.log('📦 Refreshed parcels:', currentParcels.length);
    }
  };

  const handleTestParcelAt = () => {
    if (gameEngineRef.current) {
      // Test getting parcel at center of map
      const centerX = 3200;
      const centerY = 2400;
      const parcel = gameEngineRef.current.getParcelAt(centerX, centerY);
      console.log(`🎯 Parcel at (${centerX}, ${centerY}):`, parcel);
      if (parcel) {
        setSelectedParcel(parcel);
      }
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-lg mb-3">🏗️ Parcel Test Panel</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={handleToggleParcels}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
        >
          {showParcels ? '👁️ Hide Parcels' : '👁️‍🗨️ Show Parcels'}
        </button>
        
        <button
          onClick={handleRefreshParcels}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
        >
          🔄 Refresh Parcel List ({parcels.length})
        </button>
        
        <button
          onClick={handleTestParcelAt}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm"
        >
          🎯 Test Parcel at Center
        </button>
      </div>

      {selectedParcel && (
        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
          <h4 className="font-semibold text-sm mb-2">📋 Selected Parcel</h4>
          <div className="text-xs space-y-1">
            <div><strong>Number:</strong> {selectedParcel.number}</div>
            <div><strong>Type:</strong> {selectedParcel.type}</div>
            <div><strong>District:</strong> {selectedParcel.districtType}</div>
            <div><strong>Position:</strong> ({selectedParcel.x}, {selectedParcel.y})</div>
            <div><strong>Size:</strong> {selectedParcel.width}×{selectedParcel.height}</div>
            <div><strong>Building:</strong> {selectedParcel.buildingType || 'None'}</div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 mt-3">
        <div>📍 Click on parcels in the map to select them</div>
        <div>🗺️ Parcels should be visible as colored rectangles</div>
      </div>
    </div>
  );
}