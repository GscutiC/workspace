/**
 * ParcelSyncService - Sincroniza parcelas entre frontend y backend
 * Maneja la creación, actualización y sincronización de parcelas
 */

import type { GeneratedParcel } from './ParcelGridGenerator';
import type { ParcelAPIResponse } from '@/types/debug';

// API configuration
const API_BASE_URL = 'http://localhost:3001';
const DEFAULT_ORG_ID = 'cmfvvwo9z0000ukbcotrz1tz2';
const DEFAULT_SPACE_ID = 'demo-space-id';

export interface BackendParcelCreateRequest {
  number: number;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parcelType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE' | 'OFFICE' | 'PUBLIC';
  status: 'AVAILABLE' | 'RESERVED' | 'OWNED' | 'UNDER_CONSTRUCTION' | 'DEVELOPED' | 'ABANDONED' | 'PUBLIC';
  buildingType: string;
  basePrice: number;
  monthlyTax: number;
  organizationId: string;
  spaceId: string;
}

export class ParcelSyncService {
  /**
   * Obtiene todas las parcelas existentes del backend
   */
  static async getExistingParcels(): Promise<ParcelAPIResponse[]> {
    try {
      const url = `${API_BASE_URL}/parcels?organizationId=${DEFAULT_ORG_ID}&spaceId=${DEFAULT_SPACE_ID}&limit=1000`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch parcels: ${response.status}`);
      }
      
      const data = await response.json();
      return data.parcels || [];
    } catch (error) {
      console.error('❌ Error fetching existing parcels:', error);
      return [];
    }
  }

  /**
   * Crea una nueva parcela en el backend
   */
  static async createParcel(parcel: GeneratedParcel): Promise<boolean> {
    try {
      const parcelData: BackendParcelCreateRequest = {
        number: parcel.number,
        name: `Parcela ${parcel.number}`,
        description: `Parcela ${parcel.type} ${parcel.number} - Posición (${parcel.x}, ${parcel.y})`,
        x: parcel.x,
        y: parcel.y,
        width: parcel.width,
        height: parcel.height,
        parcelType: this.mapToBackendType(parcel.type),
        status: 'AVAILABLE',
        buildingType: parcel.buildingType || 'EMPTY',
        basePrice: this.calculatePrice(parcel),
        monthlyTax: this.calculateTax(parcel),
        organizationId: DEFAULT_ORG_ID,
        spaceId: DEFAULT_SPACE_ID
      };

      const response = await fetch(`${API_BASE_URL}/parcels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parcelData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Failed to create parcel ${parcel.number}:`, errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Error creating parcel ${parcel.number}:`, error);
      return false;
    }
  }

  /**
   * Sincroniza todas las parcelas generadas con el backend
   */
  static async syncParcelsToBackend(parcels: GeneratedParcel[]): Promise<void> {
    console.log(`🔄 Starting sync of ${parcels.length} parcels to backend...`);
    
    // Obtener parcelas existentes
    const existingParcels = await this.getExistingParcels();
    const existingNumbers = new Set(existingParcels.map(p => p.number));
    
    console.log(`📊 Found ${existingParcels.length} existing parcels in backend`);
    
    // Filtrar parcelas que no existen
    const newParcels = parcels.filter(p => !existingNumbers.has(p.number));
    
    if (newParcels.length === 0) {
      console.log('✅ All parcels already exist in backend');
      return;
    }
    
    console.log(`📝 Creating ${newParcels.length} new parcels...`);
    
    // Crear parcelas en lotes para no sobrecargar el servidor
    const batchSize = 10;
    let created = 0;
    let failed = 0;
    
    for (let i = 0; i < newParcels.length; i += batchSize) {
      const batch = newParcels.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(parcel => this.createParcel(parcel))
      );
      
      const batchCreated = results.filter(result => result).length;
      const batchFailed = results.length - batchCreated;
      
      created += batchCreated;
      failed += batchFailed;
      
      console.log(`📦 Batch ${Math.floor(i/batchSize) + 1}: ${batchCreated}/${batch.length} created`);
      
      // Pequeña pausa entre lotes
      if (i + batchSize < newParcels.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Sync complete: ${created} created, ${failed} failed`);
  }

  /**
   * Borra todas las parcelas del backend (usar con cuidado)
   */
  static async clearAllParcels(): Promise<void> {
    console.warn('⚠️ CLEARING ALL PARCELS FROM BACKEND');
    
    const existingParcels = await this.getExistingParcels();
    
    for (const parcel of existingParcels) {
      try {
        const response = await fetch(`${API_BASE_URL}/parcels/${parcel.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log(`🗑️ Deleted parcel ${parcel.number}`);
        } else {
          console.error(`❌ Failed to delete parcel ${parcel.number}`);
        }
      } catch (error) {
        console.error(`❌ Error deleting parcel ${parcel.number}:`, error);
      }
      
      // Pausa pequeña entre eliminaciones
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ All parcels cleared');
  }

  /**
   * Convierte tipo de parcela a formato backend
   */
  private static mapToBackendType(type: string): 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE' | 'OFFICE' | 'PUBLIC' {
    switch (type) {
      case 'residential': return 'RESIDENTIAL';
      case 'commercial': return 'COMMERCIAL';
      case 'office': return 'OFFICE';
      case 'mixed': return 'MIXED_USE';
      case 'public': return 'PUBLIC';
      case 'infrastructure': return 'INDUSTRIAL'; // Map infrastructure to industrial
      default: return 'RESIDENTIAL';
    }
  }

  /**
   * Calcula precio base de la parcela
   */
  private static calculatePrice(parcel: GeneratedParcel): number {
    const basePrice = 50000;
    const sizeMultiplier = (parcel.width * parcel.height) / (64 * 64); // Relative to 64x64
    const typeMultiplier = this.getTypeMultiplier(parcel.type);
    
    return Math.floor(basePrice * sizeMultiplier * typeMultiplier * (0.8 + Math.random() * 0.4));
  }

  /**
   * Calcula impuesto mensual
   */
  private static calculateTax(parcel: GeneratedParcel): number {
    const basePrice = this.calculatePrice(parcel);
    return Math.floor(basePrice * 0.002 * (0.5 + Math.random() * 1.0)); // 0.1% - 0.3% del precio base
  }

  /**
   * Obtiene multiplicador de precio por tipo
   */
  private static getTypeMultiplier(type: string): number {
    switch (type) {
      case 'commercial': return 1.5;
      case 'office': return 1.3;
      case 'mixed': return 1.2;
      case 'public': return 0.8;
      case 'infrastructure': return 0.9;
      case 'residential': return 1.0;
      default: return 1.0;
    }
  }
}