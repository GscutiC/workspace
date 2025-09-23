import type { ParcelInfo } from './generators/CityGenerator';
import { ParcelMigration } from './ParcelMigration';
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
      
      // Convert backend parcels to game engine format using migration system
      const gameParcels: ParcelInfo[] = backendParcels.map(parcel => {
        
        // Use migration system to properly position parcels in the new map layout
        const oldCoords = {
          x: parcel.x,
          y: parcel.y,
          width: parcel.width,
          height: parcel.height
        };
        
        const newCoords = ParcelMigration.migrateParcelCoordinates(oldCoords);
        
        // Validate the new position
        const validation = ParcelMigration.validateParcelPosition(newCoords);
        if (!validation.isValid) {
          console.warn(`⚠️ Parcel ${parcel.number} has position issues:`, validation.issues);
        }
        
        return {
          number: parcel.number,
          x: newCoords.x,
          y: newCoords.y,
          width: newCoords.width,
          height: newCoords.height,
          type: this.mapParcelType(parcel.parcelType),
          districtType: this.mapParcelTypeToDistrict(parcel.parcelType),
          buildingType: parcel.buildingType || 'EMPTY',
          preset: parcel.preset || 'api-loaded-migrated',
          configSnapshot: JSON.stringify({
            source: 'api-migrated',
            apiId: parcel.id,
            organizationId: parcel.organizationId,
            spaceId: parcel.spaceId,
            originalCoords: { x: parcel.x, y: parcel.y },
            migratedCoords: { x: newCoords.x, y: newCoords.y },
            migration: {
              applied: true,
              timestamp: new Date().toISOString(),
              waterBorderOffset: 3
            },
            validation: validation,
            createdAt: parcel.createdAt,
            updatedAt: parcel.updatedAt
          })
        };
      });
      
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
  private static mapParcelType(backendType: string): 'residential' | 'commercial' | 'office' | 'mixed' | 'public' | 'infrastructure' {
    switch (backendType) {
      case 'RESIDENTIAL':
        return 'residential';
      case 'COMMERCIAL':
        return 'commercial';
      case 'INDUSTRIAL':
        return 'infrastructure'; // Map industrial to infrastructure
      case 'MIXED_USE':
        return 'mixed';
      case 'OFFICE':
        return 'office';
      case 'PUBLIC':
        return 'public';
      default:
        return 'residential'; // Default fallback
    }
  }

  /**
   * Map backend parcel type to district type
   */
  private static mapParcelTypeToDistrict(backendType: string): 'commercial' | 'residential' | 'office' | 'mixed' {
    switch (backendType) {
      case 'RESIDENTIAL':
        return 'residential';
      case 'COMMERCIAL':
        return 'commercial';
      case 'INDUSTRIAL':
        return 'mixed'; // Map industrial to mixed district
      case 'MIXED_USE':
        return 'mixed';
      case 'OFFICE':
        return 'office';
      case 'PUBLIC':
        return 'mixed'; // Map public to mixed district
      default:
        return 'residential'; // Default fallback
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
          x: col * 64 + 2800, // Position near center like real parcels
          y: row * 64 + 2200, // Position near center like real parcels  
          width: 64,
          height: 64,
          type: col % 2 === 0 ? 'residential' : 'commercial',
          districtType: col % 2 === 0 ? 'residential' : 'commercial', // Required field
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