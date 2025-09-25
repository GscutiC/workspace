import { useEffect, useRef } from 'react';
import { DistrictSystem, type DistrictSystemConfig } from '@/lib/game/DistrictSystem';
import { useDistricts } from '@/hooks/useDistricts';
import type { District } from '@/lib/graphql';
import { logDebug, logInfo, logError, LogCategory } from '@/lib/utils/logger';

export interface UseDistrictSystemOptions extends Omit<DistrictSystemConfig, 'app' | 'mapContainer'> {
  enabled?: boolean;
  onDistrictClick?: (district: District) => void;
  onDistrictHover?: (district: District) => void;
}

export function useDistrictSystem(
  app: any, // Application from PIXI
  mapContainer: any, // Container from PIXI
  options: UseDistrictSystemOptions = {}
) {
  const districtSystemRef = useRef<DistrictSystem | null>(null);
  const initializationAttemptedRef = useRef(false);
  const { data: districts, isLoading, error } = useDistricts();

  const {
    enabled = true,
    onDistrictClick,
    onDistrictHover,
    ...systemConfig
  } = options;

  // Inicializar el sistema de distritos con mejor timing
  useEffect(() => {
    const hasRequiredDeps = !!app && !!mapContainer;
    const canInitialize = hasRequiredDeps && enabled && !initializationAttemptedRef.current;

    logDebug(LogCategory.DISTRICTS, 'DistrictSystem Hook Effect', {
      hasApp: !!app,
      hasMapContainer: !!mapContainer,
      enabled,
      canInitialize,
      alreadyInitialized: !!districtSystemRef.current,
      initializationAttempted: initializationAttemptedRef.current,
      districtsLoading: isLoading,
      districtsCount: districts?.length || 0
    });

    // Reset initialization flag when dependencies become unavailable
    if (!hasRequiredDeps && initializationAttemptedRef.current) {
      initializationAttemptedRef.current = false;
      logDebug(LogCategory.DISTRICTS, 'Resetting initialization flag - dependencies unavailable');
    }

    if (!canInitialize) {
      logDebug(LogCategory.DISTRICTS, 'DistrictSystem initialization conditions not met', {
        hasApp: !!app,
        hasMapContainer: !!mapContainer,
        enabled,
        alreadyAttempted: initializationAttemptedRef.current
      });
      return;
    }

    logInfo(LogCategory.DISTRICTS, 'Initializing DistrictSystem', {
      app: app.constructor.name,
      mapContainer: mapContainer.constructor.name
    });

    // Mark that we've attempted initialization to prevent multiple attempts
    initializationAttemptedRef.current = true;

    const districtSystem = new DistrictSystem({
      app,
      mapContainer,
      ...systemConfig,
    });

    districtSystemRef.current = districtSystem;

    // Configurar event listeners
    const handleDistrictClick = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onDistrictClick && customEvent.detail) {
        onDistrictClick(customEvent.detail);
      }
    };

    const handleDistrictHover = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onDistrictHover && customEvent.detail) {
        onDistrictHover(customEvent.detail);
      }
    };

    window.addEventListener('districtclick', handleDistrictClick);
    window.addEventListener('districthover', handleDistrictHover);

    // Load districts immediately if available
    if (districts && !isLoading) {
      logInfo(LogCategory.DISTRICTS, 'Loading districts immediately after initialization');
      districtSystem.loadDistricts(districts);
    }

    // Cleanup
    return () => {
      window.removeEventListener('districtclick', handleDistrictClick);
      window.removeEventListener('districthover', handleDistrictHover);

      if (districtSystemRef.current) {
        logDebug(LogCategory.DISTRICTS, 'Cleaning up DistrictSystem');
        districtSystemRef.current.destroy();
        districtSystemRef.current = null;
      }
      // Reset flag when cleaning up
      initializationAttemptedRef.current = false;
    };
  }, [app, mapContainer, enabled, onDistrictClick, onDistrictHover, districts, isLoading]);

  // Cargar distritos cuando estén disponibles
  useEffect(() => {
    logDebug(LogCategory.DISTRICTS, 'Districts loading effect', {
      hasSystem: !!districtSystemRef.current,
      hasDistricts: !!districts,
      districtsCount: districts?.length || 0,
      isLoading,
      error: !!error
    });

    if (districtSystemRef.current && districts && !isLoading) {
      logInfo(LogCategory.DISTRICTS, 'Loading districts into DistrictSystem', {
        count: districts.length,
        sampleDistrict: districts[0] ? {
          id: districts[0].id,
          zoneCode: districts[0].zoneCode,
          name: districts[0].name,
          bounds: districts[0].bounds
        } : null
      });
      districtSystemRef.current.loadDistricts(districts);
      logInfo(LogCategory.DISTRICTS, 'Districts loaded successfully');
    }
  }, [districts, isLoading, error]);

  // API del hook
  const districtSystem = districtSystemRef.current;

  return {
    // Estado
    districts,
    isLoading,
    error,
    isReady: !isLoading && !error && districts && districtSystem,
    
    // Control de visibilidad
    setVisible: (visible: boolean) => districtSystem?.setVisible(visible),
    setShowLabels: (show: boolean) => districtSystem?.setShowLabels(show),
    setShowBorders: (show: boolean) => districtSystem?.setShowBorders(show),
    setOpacity: (opacity: number) => districtSystem?.setOpacity(opacity),
    
    // Interacción
    selectDistrict: (id: string | null) => districtSystem?.selectDistrict(id),
    getDistrictAt: (x: number, y: number) => districtSystem?.getDistrictAt(x, y),
    getSelectedDistrict: () => districtSystem?.getSelectedDistrict() || null,
    
    // Utilidades
    debug: () => districtSystem?.debug(),
    
    // Referencia directa para casos avanzados
    districtSystem,
  };
}