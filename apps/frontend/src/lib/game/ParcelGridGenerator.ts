/**
 * ParcelGridGenerator - Genera una grilla completa de parcelas para el mapa
 * Este sistema crea parcelas secuenciales que cubren todo el área válida del mapa
 */

import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';
import type { ParcelInfo } from './generators/CityGenerator';

export interface ParcelGenerationConfig {
  // Tamaño de parcelas en píxeles
  parcelWidth: number;
  parcelHeight: number;
  
  // Área del mapa a parcelar
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  
  // Espaciado entre parcelas
  marginX: number;
  marginY: number;
  
  // Numeración
  startNumber: number;
}

export interface GeneratedParcel {
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'residential' | 'commercial' | 'office' | 'mixed' | 'public' | 'infrastructure';
  districtType: 'commercial' | 'residential' | 'office' | 'mixed';
  buildingType?: string;
  preset: string;
}

export class ParcelGridGenerator {
  /**
   * Genera una grilla completa de parcelas para todo el mapa
   */
  static generateFullMapParcels(config?: Partial<ParcelGenerationConfig>): GeneratedParcel[] {
    const defaultConfig: ParcelGenerationConfig = {
      parcelWidth: 64,   // 2 tiles
      parcelHeight: 64,  // 2 tiles  
      startX: 400,       // Inicia después del spawn area
      startY: 400,       // Inicia después del spawn area
      endX: MAP_WIDTH * TILE_SIZE - 400,   // Termina antes del borde
      endY: MAP_HEIGHT * TILE_SIZE - 400,  // Termina antes del borde
      marginX: 16,       // Espacio entre parcelas
      marginY: 16,       // Espacio entre parcelas
      startNumber: 1
    };

    const finalConfig = { ...defaultConfig, ...config };
    const parcels: GeneratedParcel[] = [];
    let parcelNumber = finalConfig.startNumber;

    console.log('🏗️ Generating full map parcels with config:', finalConfig);

    // Calcular cuántas parcelas caben en X e Y
    const availableWidth = finalConfig.endX - finalConfig.startX;
    const availableHeight = finalConfig.endY - finalConfig.startY;
    
    const parcelStepX = finalConfig.parcelWidth + finalConfig.marginX;
    const parcelStepY = finalConfig.parcelHeight + finalConfig.marginY;
    
    const parcelsPerRow = Math.floor(availableWidth / parcelStepX);
    const parcelsPerColumn = Math.floor(availableHeight / parcelStepY);

    console.log(`📏 Grid dimensions: ${parcelsPerRow} × ${parcelsPerColumn} = ${parcelsPerRow * parcelsPerColumn} parcels`);

    // Generar parcelas en grilla
    for (let row = 0; row < parcelsPerColumn; row++) {
      for (let col = 0; col < parcelsPerRow; col++) {
        const x = finalConfig.startX + (col * parcelStepX);
        const y = finalConfig.startY + (row * parcelStepY);

        // Determinar tipo basado en posición
        const parcel: GeneratedParcel = {
          number: parcelNumber,
          x,
          y,
          width: finalConfig.parcelWidth,
          height: finalConfig.parcelHeight,
          type: this.determineParcelType(row, col, parcelsPerRow, parcelsPerColumn),
          districtType: this.determineDistrictType(row, col, parcelsPerRow, parcelsPerColumn),
          buildingType: 'EMPTY',
          preset: 'generated-grid'
        };

        parcels.push(parcel);
        parcelNumber++;
      }
    }

    console.log(`✅ Generated ${parcels.length} parcels in grid layout`);
    return parcels;
  }

  /**
   * Genera parcelas que se ajusten al área del spawn del avatar
   */
  static generateCenterAreaParcels(): GeneratedParcel[] {
    return this.generateFullMapParcels({
      startX: 2400,      // Cerca del spawn (3200, 2400)
      startY: 1800,      
      endX: 4000,        
      endY: 3000,        
      parcelWidth: 96,   // Parcelas más grandes en área central
      parcelHeight: 96,  
      marginX: 32,
      marginY: 32,
      startNumber: 1
    });
  }

  /**
   * Determina el tipo de parcela basado en su posición en la grilla
   */
  private static determineParcelType(
    row: number, 
    col: number, 
    totalCols: number, 
    totalRows: number
  ): 'residential' | 'commercial' | 'office' | 'mixed' | 'public' | 'infrastructure' {
    // Centro: comercial
    const centerRows = Math.floor(totalRows * 0.3);
    const centerCols = Math.floor(totalCols * 0.3);
    
    if (row >= centerRows && row < totalRows - centerRows && 
        col >= centerCols && col < totalCols - centerCols) {
      return Math.random() > 0.7 ? 'office' : 'commercial';
    }
    
    // Bordes: infraestructura y público
    if (row === 0 || row === totalRows - 1 || col === 0 || col === totalCols - 1) {
      return Math.random() > 0.5 ? 'public' : 'infrastructure';
    }
    
    // Resto: residencial y mixto
    return Math.random() > 0.3 ? 'residential' : 'mixed';
  }

  /**
   * Determina el tipo de distrito basado en la posición
   */
  private static determineDistrictType(
    row: number, 
    col: number, 
    totalCols: number, 
    totalRows: number
  ): 'commercial' | 'residential' | 'office' | 'mixed' {
    const centerRows = Math.floor(totalRows * 0.3);
    const centerCols = Math.floor(totalCols * 0.3);
    
    // Centro comercial/oficinas
    if (row >= centerRows && row < totalRows - centerRows && 
        col >= centerCols && col < totalCols - centerCols) {
      return Math.random() > 0.5 ? 'commercial' : 'office';
    }
    
    // Resto residencial/mixto
    return Math.random() > 0.4 ? 'residential' : 'mixed';
  }

  /**
   * Convierte parcelas generadas al formato ParcelInfo
   */
  static toParcelInfo(generated: GeneratedParcel[]): ParcelInfo[] {
    return generated.map(p => ({
      number: p.number,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      type: p.type,
      districtType: p.districtType,
      buildingType: p.buildingType,
      preset: p.preset,
      configSnapshot: JSON.stringify({
        generated: true,
        timestamp: Date.now(),
        method: 'ParcelGridGenerator'
      })
    }));
  }
}