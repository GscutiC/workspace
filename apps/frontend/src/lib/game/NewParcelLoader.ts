import type { ParcelInfo } from './generators/CityGenerator';
import type { District, Parcel } from '@/lib/graphql';

// API configuration for GraphQL - FIXED: correct backend port
const getGraphQLURL = (): string => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  return `${backendURL}/graphql`;
};

/**
 * ParcelLoader que usa el nuevo sistema de distritos - IMPROVED with fallbacks
 */
export class NewParcelLoader {
  /**
   * Load parcels from the new district system via GraphQL with robust fallbacks
   */
  static async loadDistrictParcels(): Promise<ParcelInfo[]> {
    const GRAPHQL_URL = getGraphQLURL();

    try {

      // ✅ First, check if backend is available
      const healthCheck = await this.checkBackendHealth();
      if (!healthCheck) {
        console.warn('⚠️ Backend health check failed, using fallback parcels');
        return this.createFallbackParcels();
      }

      const query = `
        query GetDistrictsWithParcels {
          districts {
            id
            name
            zoneCode
            bounds {
              x1
              y1
              x2
              y2
            }
            districtType
            parcels {
              id
              number
              x
              y
              width
              height
              parcelType
              status
              currentPrice
            }
          }
        }
      `;

      // ✅ FIXED: Replace AbortSignal.timeout with compatible implementation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        console.error('❌ GraphQL errors:', data.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const districts: District[] = data.data.districts || [];

      // Convert district parcels to game format
      const gameParcels: ParcelInfo[] = [];
      
      for (const district of districts) {
        if (district.parcels && district.parcels.length > 0) {
          for (const parcel of district.parcels) {
            const gameParcel: ParcelInfo = {
              number: parcel.number,
              x: parcel.x,
              y: parcel.y,
              width: parcel.width,
              height: parcel.height,
              type: this.mapParcelTypeToGame(parcel.parcelType),
              districtType: this.mapDistrictType(district.districtType),
              buildingType: 'EMPTY',
              preset: 'district-system',
              configSnapshot: JSON.stringify({
                source: 'district-system',
                districtId: district.id,
                districtName: district.name,
                zoneCode: district.zoneCode,
                districtType: district.districtType,
                parcelId: parcel.id,
                status: parcel.status,
                currentPrice: parcel.currentPrice,
                createdAt: new Date().toISOString()
              })
            };
            
            gameParcels.push(gameParcel);
          }
        }
      }

      return gameParcels;

    } catch (error) {
      console.error('❌ Error loading district parcels:', error);
      // ✅ Robust fallback to default parcels instead of empty array
      return this.createFallbackParcels();
    }
  }

  /**
   * Check if backend is available - NEW method for health checking
   */
  private static async checkBackendHealth(): Promise<boolean> {
    try {
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      // Try a simple GraphQL introspection query with compatible timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      const response = await fetch(`${backendURL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ __typename }'
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      console.warn('🔍 Backend health check failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Create fallback parcels when backend is unavailable - IMPROVED
   */
  private static createFallbackParcels(): ParcelInfo[] {

    const parcels: ParcelInfo[] = [];

    // Create a better grid of parcels (6x4 = 24 parcels)
    const parcelSize = 20;
    const spacing = 35;
    const startX = 50;
    const startY = 50;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const number = row * 6 + col + 1;
        const x = startX + col * spacing;
        const y = startY + row * spacing;

        // Vary parcel types for better testing
        const types = ['residential', 'commercial', 'office', 'mixed'] as const;
        const type = types[number % types.length];

        parcels.push({
          number,
          x,
          y,
          width: parcelSize,
          height: parcelSize,
          type,
          districtType: type === 'mixed' ? 'mixed' : type,
          buildingType: 'EMPTY',
          preset: 'fallback-system',
          configSnapshot: JSON.stringify({
            source: 'fallback-system',
            reason: 'backend-unavailable',
            generatedAt: new Date().toISOString(),
            parcelNumber: number,
            fallbackVersion: '1.0'
          })
        });
      }
    }

    return parcels;
  }

  /**
   * Map parcel type from GraphQL to game format
   */
  private static mapParcelTypeToGame(parcelType: string): "residential" | "commercial" | "office" | "mixed" | "public" | "infrastructure" {
    const typeMap: Record<string, "residential" | "commercial" | "office" | "mixed" | "public" | "infrastructure"> = {
      'RESIDENTIAL': 'residential',
      'COMMERCIAL': 'commercial',
      'INDUSTRIAL': 'infrastructure',
      'MIXED_USE': 'mixed',
      'RECREATIONAL': 'public',
      'AGRICULTURAL': 'public',
      'INSTITUTIONAL': 'public',
      'TRANSPORTATION': 'infrastructure',
      'UTILITIES': 'infrastructure',
      'ENVIRONMENTAL': 'public',
      'SPECIAL': 'office'
    };
    
    return typeMap[parcelType] || 'residential';
  }

  /**
   * Map district type to game district type
   */
  private static mapDistrictType(districtType: string): "residential" | "commercial" | "office" | "mixed" {
    const typeMap: Record<string, "residential" | "commercial" | "office" | "mixed"> = {
      'COMMERCIAL': 'commercial',
      'RESIDENTIAL': 'residential', 
      'INDUSTRIAL': 'office',
      'MIXED_USE': 'mixed',
      'RECREATIONAL': 'mixed',
      'AGRICULTURAL': 'mixed',
      'INSTITUTIONAL': 'office',
      'TRANSPORTATION': 'mixed',
      'UTILITIES': 'office',
      'ENVIRONMENTAL': 'mixed',
      'SPECIAL': 'office'
    };
    
    return typeMap[districtType] || 'mixed';
  }
}
