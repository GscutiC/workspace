'use client';

import { useState } from 'react';
import { ParcelGridGenerator } from '@/lib/game/ParcelGridGenerator';
import { ParcelSyncService } from '@/lib/game/ParcelSyncService';
import type { ParcelAdminPanelProps } from '@/types/components';
import { isGameEngineReady } from '@/types/components';

export function ParcelAdminPanel({ gameEngine }: ParcelAdminPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [generatedCount, setGeneratedCount] = useState<number>(0);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const setStep = (step: string) => {
    setCurrentStep(step);
    addResult(step);
  };

  const generateCenterParcels = async () => {
    setIsGenerating(true);
    setResults([]);
    setCurrentStep('Iniciando generación del área central...');
    
    try {
      setStep('🏗️ Generando parcelas del área central (2800-4000px)...');
      const parcels = ParcelGridGenerator.generateCenterAreaParcels();
      setGeneratedCount(parcels.length);
      setStep(`✅ ¡Éxito! Generadas ${parcels.length} parcelas del área central`);
      
      setStep('📊 Estadísticas de generación:');
      addResult(`   • Área cubierta: 2800-4000 x 2200-3400 píxeles`);
      addResult(`   • Tamaño de parcela: 100x100 píxeles`);
      addResult(`   • Numeración: Parcela ${parcels[0]?.number} a Parcela ${parcels[parcels.length-1]?.number}`);
      
      // Mostrar tipos de parcelas
      const typeCounts = parcels.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setStep('🏢 Distribución por tipos:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        addResult(`   • ${type}: ${count} parcelas`);
      });
      
      setStep('💡 ¡Listo para sincronizar! Haz clic en "Sincronizar con Base de Datos"');
      
    } catch (error) {
      setStep('❌ Error en la generación');
      addResult(`Error: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFullMapParcels = async () => {
    setIsGenerating(true);
    setResults([]);
    
    try {
      setStep('🗺️ Generando parcelas para todo el mapa...');
      
      const parcels = ParcelGridGenerator.generateFullMapParcels();
      setGeneratedCount(parcels.length);
      setStep(`✅ Generadas ${parcels.length} parcelas del mapa completo`);
      
    } catch (error) {
      setStep(`❌ Error: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const syncToBackend = async () => {
    if (generatedCount === 0) {
      setStep('⚠️ Primero genera parcelas antes de sincronizar');
      return;
    }
    
    setIsSyncing(true);
    setCurrentStep('Iniciando sincronización...');
    
    try {
      setStep('🔄 Preparando sincronización con base de datos...');
      
      const parcels = ParcelGridGenerator.generateCenterAreaParcels();
      setStep(`📝 Preparando ${parcels.length} parcelas para envío...`);
      
      setStep('📡 Enviando parcelas al servidor...');
      addResult('   • Conectando con http://localhost:3001/api/parcels');
      addResult('   • Enviando en lotes de 50 parcelas');
      
      await ParcelSyncService.syncParcelsToBackend(parcels);
      
      setStep('✅ ¡SINCRONIZACIÓN EXITOSA!');
      addResult(`   • ${parcels.length} parcelas guardadas en base de datos`);
      addResult(`   • Numeración: Parcela ${parcels[0]?.number} a Parcela ${parcels[parcels.length-1]?.number}`);
      setStep('🎉 Las parcelas ya están disponibles en el sistema');
      
    } catch (error) {
      setStep('❌ Error en la sincronización');
      addResult(`   • Error: ${error}`);
      addResult('   • Verifica que el backend esté corriendo en puerto 3001');
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAllParcels = async () => {
    if (!confirm('⚠️ PELIGRO: Esto eliminará TODAS las parcelas del backend. ¿Estás seguro?')) {
      return;
    }
    
    setIsClearing(true);
    
    try {
      setStep('🗑️ Eliminando todas las parcelas del backend...');
      await ParcelSyncService.clearAllParcels();
      setStep('✅ Todas las parcelas han sido eliminadas');
      setGeneratedCount(0);
      
    } catch (error) {
      setStep(`❌ Error eliminando parcelas: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  const testCurrentLocation = () => {
    if (!isGameEngineReady(gameEngine)) {
      setStep('❌ Motor del juego no disponible o no inicializado');
      return;
    }

    try {
      setStep('🧪 Probando detección de ubicación...');

      // Using typed interface method
      const currentParcel = gameEngine.getCurrentUserParcel();
      addResult(`📍 Parcela actual: ${currentParcel ? `Parcela ${currentParcel.number} (${currentParcel.type})` : 'Ninguna detectada'}`);

      // Test parcel listing
      const allParcels = gameEngine.getAllParcels();
      addResult(`📊 Total de parcelas en el mapa: ${allParcels.length}`);

      setStep('✅ Prueba de ubicación completada');

    } catch (error) {
      setStep(`❌ Error obteniendo ubicación: ${error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado actual y paso a paso */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
        <h3 className="font-bold text-lg mb-3 text-blue-800">🎯 Sistema de Parcelas - Guía Paso a Paso</h3>
        
        {currentStep && (
          <div className="bg-white p-3 rounded border-l-4 border-blue-500 mb-3">
            <div className="font-medium text-blue-800">Estado Actual:</div>
            <div className="text-blue-600">{currentStep}</div>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl mb-1">1️⃣</div>
            <div className="font-medium">Generar Parcelas</div>
            <div className="text-gray-600">Crear en memoria</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">2️⃣</div>
            <div className="font-medium">Sincronizar</div>
            <div className="text-gray-600">Guardar en BD</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">3️⃣</div>
            <div className="font-medium">Usar</div>
            <div className="text-gray-600">Navegar y ver</div>
          </div>
        </div>
      </div>

      {/* Controles principales */}
      <div className="grid grid-cols-2 gap-6">
        {/* Paso 1: Generación */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-bold text-green-800 mb-3">
            1️⃣ Generar Parcelas ({generatedCount > 0 ? `${generatedCount} generadas` : 'Sin generar'})
          </h4>
          
          <div className="space-y-3">
            <button
              onClick={generateCenterParcels}
              disabled={isGenerating}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium text-sm"
            >
              {isGenerating ? '⏳ Generando...' : '🏗️ Generar Área Central (~140 parcelas)'}
            </button>
            
            <button
              onClick={generateFullMapParcels}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm"
            >
              {isGenerating ? '⏳ Generando...' : '🗺️ Generar Mapa Completo (~1500 parcelas)'}
            </button>
            
            <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
              💡 <strong>Recomendado:</strong> Usa &ldquo;Área Central&rdquo; para pruebas rápidas
            </div>
          </div>
        </div>

        {/* Paso 2: Sincronización */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-bold text-orange-800 mb-3">
            2️⃣ Sincronizar con Base de Datos
          </h4>
          
          <div className="space-y-3">
            <button
              onClick={syncToBackend}
              disabled={isSyncing || generatedCount === 0}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 font-medium text-sm"
            >
              {isSyncing ? '⏳ Sincronizando...' : '🔄 Sincronizar con Base de Datos'}
            </button>
            
            <button
              onClick={clearAllParcels}
              disabled={isClearing}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 text-sm"
            >
              {isClearing ? '⏳ Eliminando...' : '🗑️ Limpiar Todas las Parcelas'}
            </button>
            
            {generatedCount === 0 && (
              <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                ⚠️ Primero genera parcelas en el Paso 1
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paso 3: Pruebas */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h4 className="font-bold text-purple-800 mb-3">3️⃣ Probar y Verificar</h4>
        
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={testCurrentLocation}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
          >
            📍 Mi Ubicación
          </button>
          <button
            onClick={() => {
              addResult('🎮 Test GameEngine ejecutado');
              console.log('🎮 GameEngine test from panel');
            }}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            🎮 Test GameEngine
          </button>
          <button
            onClick={() => {
              addResult('🌐 Test Backend ejecutado');
              fetch('http://localhost:3001/parcels?organizationId=cmfvvwo9z0000ukbcotrz1tz2&spaceId=demo-space-id&limit=5')
                .then(response => response.json())
                .then(data => addResult(`✅ Backend conectado: ${data.parcels?.length || 0} parcelas`))
                .catch(error => addResult(`❌ Backend error: ${error}`));
            }}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            🌐 Test Backend
          </button>
        </div>
        
        <div className="mt-3 text-xs text-purple-700 bg-purple-100 p-2 rounded">
          💡 <strong>Después de sincronizar:</strong> Mueve tu avatar para ver la información de parcelas en tiempo real (esquina superior izquierda)
        </div>
      </div>

      {/* Log de resultados */}
      <div className="bg-gray-50 rounded-lg border">
        <div className="p-3 border-b bg-gray-100 rounded-t-lg">
          <h4 className="font-medium">📋 Log de Actividad</h4>
        </div>
        <div className="p-3 max-h-60 overflow-y-auto">
          {results.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              Ejecuta una acción para ver los resultados aquí
            </div>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {results.map((result, index) => (
                <div key={index} className={
                  result.includes('✅') ? 'text-green-600' :
                  result.includes('❌') ? 'text-red-600' :
                  result.includes('⚠️') ? 'text-orange-600' :
                  result.includes('🔄') ? 'text-blue-600' :
                  'text-gray-700'
                }>
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}