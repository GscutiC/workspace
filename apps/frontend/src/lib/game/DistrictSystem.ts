import { Container, Graphics, Text, Application } from 'pixi.js';
import { TILE_SIZE } from '@/constants/game';
import { District } from '@/lib/graphql';
import { DISTRICT_COLORS } from '@/hooks/useDistricts';
import { logDebug, logInfo, logError, LogCategory } from '@/lib/utils/logger';
import { PixiV8Helper } from './utils/PixiV8Helper';

export interface DistrictSystemConfig {
  app: Application;
  mapContainer: Container;
  showLabels?: boolean;
  showBorders?: boolean;
  opacity?: number;
  interactive?: boolean;
}

/**
 * DistrictSystem - Sistema integrado de distritos para el mapa
 * Se integra directamente con el sistema de tiles del mapa principal
 */
export class DistrictSystem {
  private app: Application;
  private mapContainer: Container;
  private districtContainer: Container;
  private labelContainer: Container;
  private districts: District[] = [];
  private districtGraphics: Map<string, Graphics> = new Map();
  private districtLabels: Map<string, Text> = new Map();

  private config: Required<Omit<DistrictSystemConfig, 'app' | 'mapContainer'>>;
  private selectedDistrictId: string | null = null;
  private currentDistrictId: string | null = null;

  // Avatar tracking for district detection
  private trackedAvatarId: string | null = null;
  private lastKnownPosition: { x: number; y: number } | null = null;
  private districtChangeCallbacks: Array<(district: District | null, previousDistrict: District | null) => void> = [];

  constructor(config: DistrictSystemConfig) {
    this.app = config.app;
    this.mapContainer = config.mapContainer;
    
    this.config = {
      showLabels: config.showLabels ?? true,
      showBorders: config.showBorders ?? true,
      opacity: config.opacity ?? 0.2,
      interactive: config.interactive ?? true,
    };

    // Crear contenedores como hijos del mapa principal
    this.districtContainer = new Container();
    this.labelContainer = new Container();
    
    this.districtContainer.name = 'DistrictContainer';
    this.labelContainer.name = 'DistrictLabelContainer';
    
    // Importante: Agregar a mapContainer, no al stage principal
    this.mapContainer.addChild(this.districtContainer);
    this.mapContainer.addChild(this.labelContainer);
    
    // Los distritos deben estar debajo del contenido del mapa pero visibles
    this.districtContainer.zIndex = -1; // Detrás del contenido del mapa
    this.labelContainer.zIndex = 10; // Encima del contenido
    
    logInfo(LogCategory.DISTRICTS, 'DistrictSystem initialized and integrated with map');
  }

  /**
   * Cargar y renderizar distritos
   */
  public loadDistricts(districts: District[]): void {
    logInfo(LogCategory.DISTRICTS, 'DistrictSystem loading districts', { count: districts.length });
    
    this.districts = districts;
    this.clearAll();
    
    districts.forEach(district => {
      this.renderDistrict(district);
    });
    
    logInfo(LogCategory.DISTRICTS, 'Districts rendered successfully');
  }

  /**
   * Renderizar un distrito individual
   */
  private renderDistrict(district: District): void {
    // Validate district bounds
    if (!district?.bounds) {
      logError(LogCategory.DISTRICTS, 'District has no bounds data', { district });
      return;
    }

    const bounds = district.bounds;
    const color = this.getDistrictColor(district.zoneCode);
    const colorInt = parseInt(color.replace('#', '0x'));
    
    // Convertir coordenadas de tiles a píxeles del mapa
    const pixelBounds = {
      x: bounds.x1 * TILE_SIZE,
      y: bounds.y1 * TILE_SIZE,
      width: (bounds.x2 - bounds.x1) * TILE_SIZE,
      height: (bounds.y2 - bounds.y1) * TILE_SIZE,
    };

    // Validate pixel bounds
    if (pixelBounds.width <= 0 || pixelBounds.height <= 0) {
      logError(LogCategory.DISTRICTS, 'Invalid district dimensions', { district, pixelBounds });
      return;
    }

    // Crear gráfico del distrito usando Pixi.js v8 API
    const graphics = new Graphics();
    
    // Use helper for v8 compatible drawing
    PixiV8Helper.drawFilledRect(
      graphics,
      pixelBounds.x,
      pixelBounds.y,
      pixelBounds.width,
      pixelBounds.height,
      colorInt,
      this.config.opacity,
      this.config.showBorders ? colorInt : undefined,
      this.config.showBorders ? 2 : undefined,
      0.8
    );

    // Configurar interactividad usando helper
    if (this.config.interactive) {
      PixiV8Helper.makeInteractive(
        graphics,
        () => {
          this.selectDistrict(district.id);
          this.dispatchDistrictEvent('click', district);
        },
        () => {
          graphics.alpha = 0.7;
          this.dispatchDistrictEvent('hover', district);
        },
        () => {
          graphics.alpha = this.selectedDistrictId === district.id ? 0.8 : 0.5;
        }
      );
    }

    // Crear etiqueta del distrito
    if (this.config.showLabels) {
      const label = new Text(district.name, {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: colorInt,
        fontWeight: 'bold',
        stroke: '#FFFFFF',
      });

      // Centrar la etiqueta en el distrito
      label.position.set(
        pixelBounds.x + pixelBounds.width / 2 - label.width / 2,
        pixelBounds.y + pixelBounds.height / 2 - label.height / 2
      );

      this.labelContainer.addChild(label);
      this.districtLabels.set(district.id, label);
    }

    this.districtContainer.addChild(graphics);
    this.districtGraphics.set(district.id, graphics);

    logDebug(LogCategory.DISTRICTS, `District ${district.zoneCode} rendered`, { bounds: pixelBounds });
  }

  /**
   * Seleccionar un distrito
   */
  public selectDistrict(districtId: string | null): void {
    this.selectedDistrictId = districtId;
    
    // Actualizar visualización de todos los distritos
    this.districtGraphics.forEach((graphics, id) => {
      graphics.alpha = id === districtId ? 0.8 : 0.5;
    });

    logDebug(LogCategory.DISTRICTS, 'District selected', { districtId });
  }

  /**
   * Obtener color del distrito
   */
  private getDistrictColor(zoneCode: string): string {
    return DISTRICT_COLORS[zoneCode as keyof typeof DISTRICT_COLORS] || '#4A90E2';
  }

  /**
   * Despachar eventos de distrito
   */
  private dispatchDistrictEvent(type: 'click' | 'hover', district: District): void;
  private dispatchDistrictEvent(type: 'change', district: District | null, previousDistrict?: District | null): void;
  private dispatchDistrictEvent(
    type: 'click' | 'hover' | 'change',
    district: District | null,
    previousDistrict?: District | null
  ): void {
    if (type === 'change') {
      window.dispatchEvent(new CustomEvent('districtchange', {
        detail: {
          current: district,
          previous: previousDistrict || null
        }
      }));
    } else if (district) {
      window.dispatchEvent(new CustomEvent(`district${type}`, {
        detail: district
      }));
    }
  }

  /**
   * Mostrar/ocultar distritos
   */
  public setVisible(visible: boolean): void {
    this.districtContainer.visible = visible;
    this.labelContainer.visible = visible && this.config.showLabels;
  }

  /**
   * Configurar visibilidad de componentes
   */
  public setShowLabels(show: boolean): void {
    this.config.showLabels = show;
    this.labelContainer.visible = show && this.districtContainer.visible;
  }

  public setShowBorders(show: boolean): void {
    this.config.showBorders = show;
    // Rerender todos los distritos
    this.districts.forEach(district => {
      const graphics = this.districtGraphics.get(district.id);
      if (graphics && graphics.parent) {
        graphics.parent.removeChild(graphics);
        this.districtGraphics.delete(district.id);
      }
    });
    this.districts.forEach(district => {
      this.renderDistrict(district);
    });
  }

  public setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0, Math.min(1, opacity));
    this.districtContainer.alpha = this.config.opacity;
  }

  /**
   * Obtener distrito en coordenadas específicas (en píxeles del mapa)
   */
  public getDistrictAt(x: number, y: number): District | null {
    // Convertir píxeles a tiles
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    return this.districts.find(district => {
      const bounds = district.bounds;
      return tileX >= bounds.x1 && tileX < bounds.x2 && 
             tileY >= bounds.y1 && tileY < bounds.y2;
    }) || null;
  }

  /**
   * Obtener todos los distritos
   */
  public getDistricts(): District[] {
    return [...this.districts];
  }

  /**
   * Start tracking an avatar for district detection
   */
  public startTrackingAvatar(avatarId: string): void {
    this.trackedAvatarId = avatarId;
    this.lastKnownPosition = null;
    this.currentDistrictId = null;
    logDebug(LogCategory.DISTRICTS, 'Started tracking avatar for district detection', { avatarId });
  }

  /**
   * Stop tracking the current avatar
   */
  public stopTrackingAvatar(): void {
    const wasTracking = this.trackedAvatarId;
    this.trackedAvatarId = null;
    this.lastKnownPosition = null;
    this.currentDistrictId = null;

    if (wasTracking) {
      logDebug(LogCategory.DISTRICTS, 'Stopped tracking avatar for district detection', { avatarId: wasTracking });
    }
  }

  /**
   * Update avatar position and detect district changes
   */
  public updateAvatarPosition(avatarId: string, x: number, y: number): void {
    if (this.trackedAvatarId !== avatarId) {
      return; // Only track the specified avatar
    }

    const newPosition = { x, y };

    // Only check if position has changed significantly (avoid excessive checks)
    if (this.lastKnownPosition) {
      const deltaX = Math.abs(newPosition.x - this.lastKnownPosition.x);
      const deltaY = Math.abs(newPosition.y - this.lastKnownPosition.y);

      // Only check every 16 pixels (half a tile) of movement
      if (deltaX < 16 && deltaY < 16) {
        return;
      }
    }

    this.lastKnownPosition = newPosition;

    // Find the district at the current position
    const currentDistrict = this.getDistrictAt(x, y);
    const currentDistrictId = currentDistrict?.id || null;

    // Check if district has changed
    if (currentDistrictId !== this.currentDistrictId) {
      const previousDistrict = this.currentDistrictId ?
        this.districts.find(d => d.id === this.currentDistrictId) || null : null;

      this.currentDistrictId = currentDistrictId;

      logDebug(LogCategory.DISTRICTS, 'Avatar district changed', {
        avatarId,
        position: { x, y },
        previousDistrict: previousDistrict?.zoneCode || null,
        currentDistrict: currentDistrict?.zoneCode || null
      });

      // Notify callbacks
      this.districtChangeCallbacks.forEach(callback => {
        try {
          callback(currentDistrict, previousDistrict);
        } catch (error) {
          logError(LogCategory.DISTRICTS, 'Error in district change callback', error);
        }
      });

      // Dispatch custom event
      this.dispatchDistrictEvent('change', currentDistrict, previousDistrict);
    }
  }

  /**
   * Add a callback for district changes
   */
  public onDistrictChange(callback: (district: District | null, previousDistrict: District | null) => void): () => void {
    this.districtChangeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.districtChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.districtChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get the current district for the tracked avatar
   */
  public getCurrentDistrict(): District | null {
    return this.currentDistrictId ?
      this.districts.find(d => d.id === this.currentDistrictId) || null : null;
  }

  /**
   * Get the tracked avatar ID
   */
  public getTrackedAvatarId(): string | null {
    return this.trackedAvatarId;
  }

  /**
   * Obtener distrito seleccionado
   */
  public getSelectedDistrict(): District | null {
    return this.selectedDistrictId 
      ? this.districts.find(d => d.id === this.selectedDistrictId) || null 
      : null;
  }

  /**
   * Limpiar todos los elementos
   */
  private clearAll(): void {
    this.districtContainer.removeChildren();
    this.labelContainer.removeChildren();
    this.districtGraphics.clear();
    this.districtLabels.clear();
  }

  /**
   * Destruir el sistema
   */
  public destroy(): void {
    this.clearAll();
    
    if (this.districtContainer.parent) {
      this.districtContainer.parent.removeChild(this.districtContainer);
    }
    if (this.labelContainer.parent) {
      this.labelContainer.parent.removeChild(this.labelContainer);
    }
    
    this.districtContainer.destroy({ children: true });
    this.labelContainer.destroy({ children: true });
    
    // Clean up tracking
    this.stopTrackingAvatar();
    this.districtChangeCallbacks.length = 0;

    logInfo(LogCategory.DISTRICTS, 'DistrictSystem destroyed');
  }

  /**
   * Debug: Información del sistema
   */
  public debug(): void {
    const debugInfo = {
      districtsLoaded: this.districts.length,
      containersVisible: {
        districts: this.districtContainer.visible,
        labels: this.labelContainer.visible,
      },
      selectedDistrict: this.selectedDistrictId,
      config: this.config,
      mapContainerBounds: {
        x: this.mapContainer.x,
        y: this.mapContainer.y,
        scale: this.mapContainer.scale,
      }
    };
    logInfo(LogCategory.DISTRICTS, 'DistrictSystem Debug Info', debugInfo);
  }
}