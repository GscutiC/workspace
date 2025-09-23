import type { ParcelInfo } from './generators/CityGenerator';
import type { BackendParcel } from '@/hooks/useParcelAPI';

// API configuration
const API_BASE_URL = 'http://localhost:3001';
const DEFAULT_ORG_ID = 'cmfvvwo9z0000ukbcotrz1tz2';
const DEFAULT_SPACE_ID = 'demo-space-id';

/**
 * ParcelLoader handles loading real parcel data from the backend API
 * and converting it to the format expected by the game engine
 */
export class ParcelLoader {
  /**
   * Load real parcels from the backend API
   */
  static async loadRealParcels(): Promise<ParcelInfo[]> {
    try {
      console.log('🏗️ Loading real parcels from API...');
      
      const url = `${API_BASE_URL}/parcels?organizationId=${DEFAULT_ORG_ID}&spaceId=${DEFAULT_SPACE_ID}&limit=100`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch parcels: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const backendParcels: BackendParcel[] = data.parcels || [];
      
      // Convert backend parcels to game engine format
      const gameParcels: ParcelInfo[] = backendParcels.map(parcel => ({
        number: parcel.number,
        x: parcel.x,
        y: parcel.y,
        width: parcel.width,
        height: parcel.height,
        type: this.mapParcelType(parcel.parcelType),
        status: this.mapParcelStatus(parcel.status),
        price: parcel.currentPrice || parcel.basePrice || 0,
        owner: parcel.owner?.name || parcel.ownerId || undefined,
        buildingType: parcel.buildingType || 'EMPTY',
        preset: parcel.preset || 'api-loaded',
        configSnapshot: JSON.stringify({
          source: 'api',
          apiId: parcel.id,
          organizationId: parcel.organizationId,
          spaceId: parcel.spaceId,
          createdAt: parcel.createdAt,
          updatedAt: parcel.updatedAt
        })
      }));
      
      console.log(`✅ Loaded ${gameParcels.length} real parcels from API`);
      return gameParcels;
      
    } catch (error) {
      console.error('❌ Failed to load real parcels from API:', error);
      
      // Return empty array if API fails - this will cause the map to be generated without parcels
      // which is better than breaking the entire game
      return [];
    }
  }

  /**
   * Map backend parcel type to game engine type
   */
  private static mapParcelType(backendType: string): 'residential' | 'commercial' | 'industrial' | 'mixed' {
    switch (backendType) {
      case 'RESIDENTIAL':
        return 'residential';
      case 'COMMERCIAL':
        return 'commercial';
      case 'INDUSTRIAL':
        return 'industrial';
      case 'MIXED_USE':
        return 'mixed';
      default:
        return 'residential'; // Default fallback
    }
  }

  /**
   * Map backend parcel status to game engine status
   */
  private static mapParcelStatus(backendStatus: string): 'available' | 'reserved' | 'sold' | 'maintenance' {
    switch (backendStatus) {
      case 'AVAILABLE':
        return 'available';
      case 'RESERVED':
        return 'reserved';
      case 'OWNED':
      case 'UNDER_CONSTRUCTION':
      case 'DEVELOPED':
        return 'sold';
      case 'ABANDONED':
      case 'PUBLIC':
        return 'maintenance';
      default:
        return 'available'; // Default fallback
    }
  }

  /**
   * Create a fallback method that generates basic parcels if API fails
   * This ensures the game still works even if the backend is down
   */
  static createFallbackParcels(): ParcelInfo[] {
    console.log('⚠️ Creating fallback parcels due to API failure');
    
    const fallbackParcels: ParcelInfo[] = [];
    
    // Create a simple 5x4 grid of parcels as fallback
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const parcelNumber = row * 5 + col + 1;
        fallbackParcels.push({
          number: parcelNumber,
          x: col * 64, // 2 tiles wide (32px each)
          y: row * 64, // 2 tiles tall
          width: 64,
          height: 64,
          type: col % 2 === 0 ? 'residential' : 'commercial',
          status: 'available',
          price: 50000 + (row * col * 1000),
          buildingType: 'EMPTY',
          preset: 'fallback',
          configSnapshot: JSON.stringify({ source: 'fallback' })
        });
      }
    }
    
    console.log(`⚠️ Created ${fallbackParcels.length} fallback parcels`);
    return fallbackParcels;
  }
}