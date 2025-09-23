/**
 * Funciones de prueba rápida para el sistema de parcelas
 * Ejecutar desde la consola del navegador para verificar funcionamiento
 */

// Función global para probar la generación de parcelas
window.testParcelGeneration = function() {
  console.log('🧪 Iniciando prueba de generación de parcelas...');
  
  try {
    // Importar dinámicamente el generador
    import('/src/lib/game/ParcelGridGenerator.js').then(({ ParcelGridGenerator }) => {
      // Generar parcelas de prueba
      const centerParcels = ParcelGridGenerator.generateCenterAreaParcels();
      console.log(`✅ Generadas ${centerParcels.length} parcelas del área central`);
      
      // Mostrar primeras 5 parcelas
      console.log('📋 Primeras 5 parcelas:', centerParcels.slice(0, 5));
      
      // Verificar estructura
      const sampleParcel = centerParcels[0];
      console.log('🔍 Estructura de parcela:', {
        number: sampleParcel.number,
        x: sampleParcel.x,
        y: sampleParcel.y,
        type: sampleParcel.type,
        name: `Parcela ${sampleParcel.number}`
      });
      
      return centerParcels;
    }).catch(error => {
      console.error('❌ Error al importar ParcelGridGenerator:', error);
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de generación:', error);
  }
};

// Función para verificar el estado del GameEngine
window.testGameEngineParcel = function() {
  console.log('🎮 Verificando detección de parcelas en GameEngine...');
  
  try {
    // Acceder al GameEngine desde la ventana global o contexto React
    const gameEngine = window.gameEngineRef?.current;
    
    if (!gameEngine) {
      console.warn('⚠️ GameEngine no encontrado. Intenta después de que el juego esté cargado.');
      return;
    }
    
    console.log('✅ GameEngine encontrado');
    
    // Verificar métodos de parcela
    if (typeof gameEngine.getCurrentUserParcel === 'function') {
      const currentParcel = gameEngine.getCurrentUserParcel();
      console.log('📍 Parcela actual del usuario:', currentParcel);
    } else {
      console.warn('⚠️ Método getCurrentUserParcel no disponible');
    }
    
    if (typeof gameEngine.getParcelAtScreenPosition === 'function') {
      const testParcel = gameEngine.getParcelAtScreenPosition(400, 300);
      console.log('🖱️ Parcela en posición (400, 300):', testParcel);
    } else {
      console.warn('⚠️ Método getParcelAtScreenPosition no disponible');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar GameEngine:', error);
  }
};

// Función para probar la sincronización (simulada)
window.testParcelSync = function() {
  console.log('🔄 Probando sincronización de parcelas...');
  
  try {
    // Crear parcelas de prueba
    const testParcels = [
      {
        number: 999,
        x: 3000,
        y: 2500,
        width: 100,
        height: 100,
        type: 'commercial'
      }
    ];
    
    // Simular sincronización
    console.log('📤 Enviando parcelas de prueba:', testParcels);
    
    // Verificar estructura antes de enviar
    const validParcels = testParcels.filter(parcel => 
      parcel.number && parcel.x != null && parcel.y != null && parcel.type
    );
    
    console.log(`✅ ${validParcels.length}/${testParcels.length} parcelas válidas`);
    
    return validParcels;
    
  } catch (error) {
    console.error('❌ Error en prueba de sincronización:', error);
  }
};

// Función para verificar el backend
window.testBackendConnection = function() {
  console.log('🌐 Verificando conexión con backend...');
  
  fetch('http://localhost:3001/parcels?organizationId=cmfvvwo9z0000ukbcotrz1tz2&spaceId=demo-space-id&limit=5')
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    })
    .then(data => {
      console.log('✅ Backend conectado correctamente');
      console.log('📊 Datos recibidos:', data);
      console.log(`📋 Parcelas en BD: ${data.parcels?.length || 0}`);
    })
    .catch(error => {
      console.error('❌ Error de conexión con backend:', error);
      console.log('💡 Verifica que el backend esté corriendo en puerto 3001');
    });
};

// Función integral de pruebas
window.runAllParcelTests = function() {
  console.log('🚀 Ejecutando todas las pruebas del sistema de parcelas...');
  console.log('═══════════════════════════════════════════════════════');
  
  // Test 1: Conexión backend
  console.log('\n1️⃣ PRUEBA: Conexión Backend');
  window.testBackendConnection();
  
  // Test 2: Generación de parcelas
  setTimeout(() => {
    console.log('\n2️⃣ PRUEBA: Generación de Parcelas');
    window.testParcelGeneration();
  }, 1000);
  
  // Test 3: GameEngine
  setTimeout(() => {
    console.log('\n3️⃣ PRUEBA: GameEngine');
    window.testGameEngineParcel();
  }, 2000);
  
  // Test 4: Sincronización
  setTimeout(() => {
    console.log('\n4️⃣ PRUEBA: Sincronización');
    window.testParcelSync();
  }, 3000);
  
  setTimeout(() => {
    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('💡 Si todas las pruebas pasaron, el sistema está listo para usar');
  }, 4000);
};

console.log('🛠️ Funciones de prueba de parcelas cargadas:');
console.log('  - testParcelGeneration()');
console.log('  - testGameEngineParcel()'); 
console.log('  - testParcelSync()');
console.log('  - testBackendConnection()');
console.log('  - runAllParcelTests()');
console.log('');
console.log('💡 Ejecuta runAllParcelTests() para probar todo el sistema');