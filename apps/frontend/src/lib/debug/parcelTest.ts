/**
 * Test script to verify parcel integration
 * Run this in the browser console to debug parcel loading
 */

// Test API connectivity
async function testParcelAPI() {
  console.log('🧪 Testing parcel API integration...');
  
  try {
    // Test direct API call
    console.log('1. Testing direct API call...');
    const response = await fetch('http://localhost:3001/parcels?organizationId=cmfvvwo9z0000ukbcotrz1tz2&spaceId=demo-space-id&limit=10');
    const data = await response.json();
    
    console.log('✅ API Response:', {
      total: data.total,
      parcelsLoaded: data.parcels?.length,
      firstParcel: data.parcels?.[0]
    });
    
    // Test ParcelLoader
    console.log('2. Testing ParcelLoader...');
    // Note: This would need to be imported properly in the actual frontend
    // For now, we'll check if the game engine has parcels loaded
    
    // Test game engine parcel access
    console.log('3. Checking game engine parcels...');
    // This would access the global game instance if available
    
    return {
      apiWorking: true,
      totalParcels: data.total,
      sampleParcel: data.parcels?.[0]
    };
    
  } catch (error) {
    console.error('❌ API Test failed:', error);
    return {
      apiWorking: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check if running in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected');
  console.log('💡 Run testParcelAPI() to test the integration');
  (window as any).testParcelAPI = testParcelAPI;
} else {
  console.log('📦 Node environment - this is a browser test script');
}

export { testParcelAPI };