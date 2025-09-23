/**
 * MapConfig.ts - Configuración centralizada para generación de mapas
 * 
 * Este archivo centraliza todas las constantes y parámetros configurables
 * que antes estaban dispersos en los diferentes generadores.
 */

// Tipos para configuración
export interface CityConfig {
  // Dimensiones de bloques
  blockSize: number;
  blockSpacing: number;
  
  // Calles y avenidas
  mainStreetWidth: number;
  secondaryStreetWidth: number;
  avenueSpacing: number;
  
  // Distribución urbana
  urbanDensityCenter: number;  // 0-1, densidad en el centro
  urbanDensityEdge: number;    // 0-1, densidad en bordes
  districtVariation: number;   // Variación entre distritos
}

export interface RiverConfig {
  // Posición del río
  startHeightRatio: number;    // 0-1, altura donde empieza el río
  endHeightRatio: number;      // 0-1, altura donde termina
  
  // Forma del río
  width: number;
  curviness: number;           // Intensidad de las curvas
  curveFrequency: number;      // Frecuencia de ondulación
  
  // Puentes
  bridgeCount: number;
  bridgeSpacing: number;
}

export interface ParksConfig {
  // Cantidad de parques
  minParks: number;
  maxParks: number;
  
  // Tamaños de parques
  minParkSize: number;
  maxParkSize: number;
  
  // Distribución
  centerBias: number;          // Preferencia por centro vs bordes
  avoidRiver: boolean;         // Evitar generar sobre el río
  
  // Características del parque
  treeProbability: number;     // 0-1, probabilidad de árboles en bordes
  fountainProbability: number; // 0-1, probabilidad de fuentes en centro
  benchProbability: number;    // 0-1, probabilidad de bancos
  pathProbability: number;     // 0-1, probabilidad de senderos
}

export interface UrbanFurnitureConfig {
  // Densidad de mobiliario
  streetLightDensity: number;  // 0-1, probabilidad por tile
  signDensity: number;         // 0-1, probabilidad por tile
  
  // Distribución de tipos
  streetLightRatio: number;    // 0-1, ratio de semáforos vs letreros
  
  // Espaciado mínimo
  minSpacing: number;          // Tiles mínimos entre elementos
}

export interface TerrainConfig {
  // Generación procedural
  seed?: number;               // Semilla para reproducibilidad
  
  // Configuraciones por zona
  city: CityConfig;
  river: RiverConfig;
  parks: ParksConfig;
  furniture: UrbanFurnitureConfig;
}

// =============================================================================
// PRESETS DE CONFIGURACIÓN
// =============================================================================

/**
 * Configuración por defecto - Ciudad balanceada
 */
export const DEFAULT_CONFIG: TerrainConfig = {
  city: {
    blockSize: 12,
    blockSpacing: 2,
    mainStreetWidth: 3,
    secondaryStreetWidth: 2,
    avenueSpacing: 25,
    urbanDensityCenter: 0.9,
    urbanDensityEdge: 0.3,
    districtVariation: 0.2
  },
  
  river: {
    startHeightRatio: 0.4,
    endHeightRatio: 0.6,
    width: 5,
    curviness: 8,
    curveFrequency: 3,
    bridgeCount: 4,
    bridgeSpacing: 40
  },
  
  parks: {
    minParks: 8,
    maxParks: 15,
    minParkSize: 4,
    maxParkSize: 8,
    centerBias: 0.6,
    avoidRiver: true,
    treeProbability: 0.3,
    fountainProbability: 0.2,
    benchProbability: 0.1,
    pathProbability: 0.05
  },
  
  furniture: {
    streetLightDensity: 0.15,
    signDensity: 0.08,
    streetLightRatio: 0.5,
    minSpacing: 3
  }
};

/**
 * Ciudad metropolitana - Más densa y urbana
 */
export const DOWNTOWN_CONFIG: TerrainConfig = {
  ...DEFAULT_CONFIG,
  city: {
    ...DEFAULT_CONFIG.city,
    blockSize: 8,           // Bloques más pequeños
    blockSpacing: 1,        // Menos espacio entre bloques
    mainStreetWidth: 4,     // Avenidas más anchas
    avenueSpacing: 20,      // Avenidas más frecuentes
    urbanDensityCenter: 1.0, // Máxima densidad central
    urbanDensityEdge: 0.7   // Densidad alta incluso en bordes
  },
  
  parks: {
    ...DEFAULT_CONFIG.parks,
    minParks: 5,            // Menos parques
    maxParks: 8,
    minParkSize: 3,         // Parques más pequeños
    maxParkSize: 6,
    treeProbability: 0.4,   // Más árboles en ciudad
    fountainProbability: 0.3, // Más fuentes decorativas
    benchProbability: 0.15,  // Más bancos para descanso
    pathProbability: 0.08    // Más senderos definidos
  },
  
  furniture: {
    ...DEFAULT_CONFIG.furniture,
    streetLightDensity: 0.25, // Más mobiliario urbano
    signDensity: 0.15
  }
};

/**
 * Ciudad suburbana - Más espaciosa y verde
 */
export const SUBURBAN_CONFIG: TerrainConfig = {
  ...DEFAULT_CONFIG,
  city: {
    ...DEFAULT_CONFIG.city,
    blockSize: 16,          // Bloques más grandes
    blockSpacing: 4,        // Más espacio entre bloques
    mainStreetWidth: 2,     // Calles más estrechas
    avenueSpacing: 35,      // Avenidas más separadas
    urbanDensityCenter: 0.6, // Menor densidad general
    urbanDensityEdge: 0.1
  },
  
  parks: {
    ...DEFAULT_CONFIG.parks,
    minParks: 12,           // Más parques
    maxParks: 20,
    minParkSize: 6,         // Parques más grandes
    maxParkSize: 12,
    centerBias: 0.3,        // Parques distribuidos más uniformemente
    treeProbability: 0.5,   // Muchos árboles en suburbios
    fountainProbability: 0.1, // Pocas fuentes
    benchProbability: 0.2,  // Más bancos para relajarse
    pathProbability: 0.03   // Senderos más naturales
  },
  
  furniture: {
    ...DEFAULT_CONFIG.furniture,
    streetLightDensity: 0.08, // Menos mobiliario
    signDensity: 0.04
  }
};

/**
 * Zona industrial - Enfocada en grandes estructuras
 */
export const INDUSTRIAL_CONFIG: TerrainConfig = {
  ...DEFAULT_CONFIG,
  city: {
    ...DEFAULT_CONFIG.city,
    blockSize: 20,          // Bloques muy grandes (fábricas)
    blockSpacing: 6,        // Mucho espacio (patios, parking)
    mainStreetWidth: 4,     // Calles anchas para camiones
    secondaryStreetWidth: 3,
    avenueSpacing: 45,      // Pocas avenidas
    urbanDensityCenter: 0.8,
    urbanDensityEdge: 0.4,
    districtVariation: 0.4  // Mayor variación entre zonas
  },
  
  river: {
    ...DEFAULT_CONFIG.river,
    width: 7,               // Río más ancho (industrial)
    bridgeCount: 2          // Menos puentes
  },
  
  parks: {
    ...DEFAULT_CONFIG.parks,
    minParks: 2,            // Muy pocos parques
    maxParks: 5,
    minParkSize: 8,
    maxParkSize: 15,        // Pero más grandes (áreas verdes industriales)
    centerBias: 0.1,        // Parques en periferia
    treeProbability: 0.2,   // Pocos árboles (zona industrial)
    fountainProbability: 0.05, // Casi sin fuentes
    benchProbability: 0.05, // Pocos bancos
    pathProbability: 0.02   // Pocos senderos
  },
  
  furniture: {
    ...DEFAULT_CONFIG.furniture,
    streetLightDensity: 0.12,
    signDensity: 0.2,       // Más señalización industrial
    streetLightRatio: 0.3   // Más letreros que semáforos
  }
};

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Obtener configuración por nombre
 */
export function getConfigByName(name: string): TerrainConfig {
  switch (name.toLowerCase()) {
    case 'downtown':
    case 'metropolitan':
      return DOWNTOWN_CONFIG;
    
    case 'suburban':
    case 'residential':
      return SUBURBAN_CONFIG;
    
    case 'industrial':
    case 'factory':
      return INDUSTRIAL_CONFIG;
    
    default:
      return DEFAULT_CONFIG;
  }
}

/**
 * Lista de presets disponibles
 */
export const AVAILABLE_PRESETS = [
  { name: 'default', label: 'Balanced City', config: DEFAULT_CONFIG },
  { name: 'downtown', label: 'Metropolitan', config: DOWNTOWN_CONFIG },
  { name: 'suburban', label: 'Suburban', config: SUBURBAN_CONFIG },
  { name: 'industrial', label: 'Industrial Zone', config: INDUSTRIAL_CONFIG }
] as const;

/**
 * Validar configuración
 */
export function validateConfig(config: TerrainConfig): string[] {
  const errors: string[] = [];
  
  // Validar city config
  if (config.city.blockSize < 4 || config.city.blockSize > 30) {
    errors.push('Block size must be between 4 and 30');
  }
  
  if (config.city.mainStreetWidth < 1 || config.city.mainStreetWidth > 8) {
    errors.push('Main street width must be between 1 and 8');
  }
  
  // Validar river config
  if (config.river.width < 2 || config.river.width > 15) {
    errors.push('River width must be between 2 and 15');
  }
  
  // Validar densidades (0-1)
  if (config.city.urbanDensityCenter < 0 || config.city.urbanDensityCenter > 1) {
    errors.push('Urban density values must be between 0 and 1');
  }
  
  return errors;
}

/**
 * Combinar configuraciones (merge profundo)
 */
export function mergeConfigs(base: TerrainConfig, override: Partial<TerrainConfig>): TerrainConfig {
  return {
    seed: override.seed ?? base.seed,
    city: { ...base.city, ...override.city },
    river: { ...base.river, ...override.river },
    parks: { ...base.parks, ...override.parks },
    furniture: { ...base.furniture, ...override.furniture }
  };
}