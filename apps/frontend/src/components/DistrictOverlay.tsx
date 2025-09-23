import React, { useEffect, useState } from 'react';
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js';
import { useDistricts, useDistrictStats, DISTRICT_COLORS, CENTER_POINT } from '@/hooks/useDistricts';

interface DistrictOverlayProps {
  app: Application | null;
  showOverlay: boolean;
  selectedDistrictId?: string;
  onDistrictClick?: (districtId: string) => void;
  enableMinimapView?: boolean;
  minimapScale?: number;
}

export const DistrictOverlay: React.FC<DistrictOverlayProps> = ({
  app,
  showOverlay,
  selectedDistrictId,
  onDistrictClick,
  enableMinimapView = false,
  minimapScale = 0.1
}) => {
  const { data: districts, isLoading, error } = useDistricts();
  const { data: stats } = useDistrictStats();
  const [overlayContainer, setOverlayContainer] = useState<Container | null>(null);
  const [minimapContainer, setMinimapContainer] = useState<Container | null>(null);

  // Strategic logging - only show important state changes
  useEffect(() => {
    if (error) {
      console.error('🚨 DistrictOverlay: Error loading districts:', error.message);
    } else if (!isLoading && districts) {
      console.log('✅ DistrictOverlay: Successfully loaded', districts.length, 'districts');
    }
  }, [districts, isLoading, error]);

  useEffect(() => {
    if (!app || !districts || isLoading) return;

    // Create main overlay container
    const container = new Container();
    container.name = 'districtOverlay';
    container.zIndex = 1000;
    app.stage.addChild(container);
    setOverlayContainer(container);

    // Create minimap container if enabled
    let minimap: Container | null = null;
    if (enableMinimapView) {
      minimap = new Container();
      minimap.name = 'districtMinimap';
      minimap.scale.set(minimapScale);
      minimap.position.set(20, 20); // Top-left corner
      minimap.zIndex = 2000;
      app.stage.addChild(minimap);
      setMinimapContainer(minimap);
    }

    // Create district graphics
    districts.forEach(district => {
      const bounds = district.bounds;
      const color = parseInt(DISTRICT_COLORS[district.zoneCode as keyof typeof DISTRICT_COLORS]?.replace('#', '0x') || '0x4A90E2');
      
      // Main overlay graphics - FIXED for Pixi.js v8
      const graphics = new Graphics();
      graphics.beginFill(color, 0.2);
      graphics.lineStyle(2, color, 0.8);
      graphics.drawRect(
        bounds.x1 * 32, // Convert to pixel coordinates (TILE_SIZE = 32)
        bounds.y1 * 32,
        (bounds.x2 - bounds.x1) * 32,
        (bounds.y2 - bounds.y1) * 32
      );
      graphics.endFill();

      // Add district label - FIXED for Pixi.js v8
      const text = new Text(district.name, {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: color,
        fontWeight: 'bold',
        stroke: '#FFFFFF'
      });
      text.position.set(
        (bounds.x1 + (bounds.x2 - bounds.x1) / 2) * 32 - text.width / 2,
        (bounds.y1 + (bounds.y2 - bounds.y1) / 2) * 32 - text.height / 2
      );

      // Make interactive
      graphics.interactive = true;
      graphics.cursor = 'pointer';
      graphics.on('pointerdown', () => {
        if (onDistrictClick) {
          onDistrictClick(district.id);
        }
      });

      // Add hover effects
      graphics.on('pointerover', () => {
        graphics.alpha = 0.7;
      });

      graphics.on('pointerout', () => {
        graphics.alpha = selectedDistrictId === district.id ? 0.8 : 0.5;
      });

      container.addChild(graphics);
      container.addChild(text);

      // Create minimap version
      if (minimap) {
        const minimapGraphics = new Graphics();
        minimapGraphics.beginFill(color, 0.6);
        minimapGraphics.lineStyle(1, color, 1);
        minimapGraphics.drawRect(
          bounds.x1 * 32,
          bounds.y1 * 32,
          (bounds.x2 - bounds.x1) * 32,
          (bounds.y2 - bounds.y1) * 32
        );
        minimapGraphics.endFill();

        // Make minimap interactive for navigation
        minimapGraphics.interactive = true;
        minimapGraphics.cursor = 'pointer';
        minimapGraphics.on('pointerdown', () => {
          // Center viewport on clicked district
          const centerX = (bounds.x1 + (bounds.x2 - bounds.x1) / 2) * 32;
          const centerY = (bounds.y1 + (bounds.y2 - bounds.y1) / 2) * 32;
          
          if (app.stage.scale.x && app.stage.scale.y) {
            app.stage.position.set(
              app.screen.width / 2 - centerX * app.stage.scale.x,
              app.screen.height / 2 - centerY * app.stage.scale.y
            );
          }

          if (onDistrictClick) {
            onDistrictClick(district.id);
          }
        });

        minimap.addChild(minimapGraphics);
      }
    });

    // Cleanup function
    return () => {
      if (container && container.parent) {
        container.parent.removeChild(container);
        container.destroy({ children: true });
      }
      if (minimap && minimap.parent) {
        minimap.parent.removeChild(minimap);
        minimap.destroy({ children: true });
      }
    };
  }, [app, districts, isLoading, enableMinimapView, minimapScale, onDistrictClick]);

  // Update overlay visibility
  useEffect(() => {
    if (overlayContainer) {
      overlayContainer.visible = showOverlay;
    }
  }, [overlayContainer, showOverlay]);

  // Update selected district highlighting
  useEffect(() => {
    if (!overlayContainer || !districts) return;

    overlayContainer.children.forEach((child, index) => {
      if (child instanceof Graphics) {
        const district = districts[Math.floor(index / 2)]; // Graphics and Text alternate
        child.alpha = selectedDistrictId === district?.id ? 0.8 : 0.5;
      }
    });
  }, [overlayContainer, districts, selectedDistrictId]);

  if (isLoading) {
    return (
      <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 shadow-lg">
        <div className="text-sm text-gray-600">Cargando distritos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-4 left-4 bg-red-100 rounded-lg p-3 shadow-lg">
        <div className="text-sm text-red-600">Error cargando distritos:</div>
        <div className="text-xs text-red-500">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 shadow-lg max-w-xs">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Control de Distritos</h3>
        
        {stats && (
          <div className="text-xs text-gray-600 space-y-1">
            <div>Total: {stats.totalDistricts} distritos</div>
            <div>Parcelas: {stats.totalParcels || 0}</div>
            <div>Ocupadas: {stats.occupiedParcels || 0}</div>
            <div>Disponibles: {stats.availableParcels || 0}</div>
          </div>
        )}

        <div className="space-y-1">
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={() => {}} // Controlled by parent
              className="w-3 h-3"
            />
            <span>Mostrar límites</span>
          </label>
          
          {enableMinimapView && (
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={!!minimapContainer?.visible}
                onChange={(e) => {
                  if (minimapContainer) {
                    minimapContainer.visible = e.target.checked;
                  }
                }}
                className="w-3 h-3"
              />
              <span>Minimapa</span>
            </label>
          )}
        </div>

        {selectedDistrictId && districts && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            {(() => {
              const district = districts.find(d => d.id === selectedDistrictId);
              return district && (
                <div className="text-xs space-y-1">
                  <div className="font-medium">{district.name}</div>
                  <div>Código: {district.zoneCode}</div>
                  <div>Tipo: {district.districtType}</div>
                  <div>Multiplicador: {district.basePriceMultiplier}x</div>
                  <div>Impuestos: {(district.taxRate * 100).toFixed(1)}%</div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};