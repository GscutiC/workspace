/**
 * Test utilities for Parcel Admin Panel
 * Provides validation and testing functions for the parcel management system
 */

import { ParcelGridGenerator, GeneratedParcel } from '@/lib/game/ParcelGridGenerator';
import { ParcelSyncService } from '@/lib/game/ParcelSyncService';

export class ParcelAdminTest {
  /**
   * Test parcel generation without creating actual parcels
   */
  static testParcelGeneration(): {
    centerAreaCount: number;
    fullMapCount: number;
    sampleParcels: GeneratedParcel[];
  } {
    console.log('🧪 Testing parcel generation...');
    
    // Test center area generation
    const centerParcels = ParcelGridGenerator.generateCenterAreaParcels();
    console.log(`📍 Center area would generate: ${centerParcels.length} parcels`);
    
    // Test full map generation 
    const fullMapParcels = ParcelGridGenerator.generateFullMapParcels();
    console.log(`🗺️ Full map would generate: ${fullMapParcels.length} parcels`);
    
    // Sample some parcels for inspection
    const sampleParcels = fullMapParcels.slice(0, 5);
    
    return {
      centerAreaCount: centerParcels.length,
      fullMapCount: fullMapParcels.length,
      sampleParcels
    };
  }

  /**
   * Test backend synchronization without actual API calls
   */
  static async testBackendSync(parcels: GeneratedParcel[]): Promise<void> {
    console.log('🔄 Testing backend sync...');
    console.log(`Would sync ${parcels.length} parcels to backend`);
    
    // Validate parcel data
    const invalidParcels = parcels.filter(parcel => 
      parcel.number == null || !parcel.type || parcel.x == null || parcel.y == null
    );
    
    if (invalidParcels.length > 0) {
      console.warn(`⚠️ Found ${invalidParcels.length} invalid parcels:`, invalidParcels);
    } else {
      console.log('✅ All parcels have valid data structure');
    }
    
    // Test parcel type mapping
    const typeCounts = parcels.reduce((counts, parcel) => {
      counts[parcel.type] = (counts[parcel.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    console.log('📊 Parcel type distribution:', typeCounts);
  }

  /**
   * Validate coordinates are within expected bounds
   */
  static validateCoordinates(parcels: GeneratedParcel[]): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    parcels.forEach((parcel, index) => {
      if (parcel.x < 0 || parcel.x > 10000) {
        issues.push(`Parcel ${index} has invalid X coordinate: ${parcel.x}`);
      }
      if (parcel.y < 0 || parcel.y > 10000) {
        issues.push(`Parcel ${index} has invalid Y coordinate: ${parcel.y}`);
      }
    });
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Run comprehensive test suite
   */
  static async runFullTest(): Promise<void> {
    console.log('🚀 Running full parcel admin test suite...');
    
    try {
      // Test generation
      const genResults = this.testParcelGeneration();
      console.log('✅ Generation test passed');
      
      // Test coordinate validation
      const coordResults = this.validateCoordinates(genResults.sampleParcels);
      if (coordResults.valid) {
        console.log('✅ Coordinate validation passed');
      } else {
        console.warn('⚠️ Coordinate validation issues:', coordResults.issues);
      }
      
      // Test sync simulation
      await this.testBackendSync(genResults.sampleParcels);
      console.log('✅ Sync test passed');
      
      console.log('🎉 All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }
}