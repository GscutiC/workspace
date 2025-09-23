'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParcelAPI, BackendParcel } from '@/hooks/useParcelAPI';

interface ParcelFilters {
  status?: string;
  parcelType?: string;
  priceMin?: number;
  priceMax?: number;
  searchTerm?: string;
}

/**
 * RealParcelManager - Parcel administration interface with real backend integration
 * Features:
 * - Real-time data from backend API
 * - Advanced filtering and search
 * - CRUD operations with backend sync
 * - Statistics dashboard
 */
export function RealParcelManager() {
  const {
    parcels,
    stats,
    loading,
    error,
    fetchParcels,
    updateParcel,
    purchaseParcel,
    deleteParcel
  } = useParcelAPI();

  const [selectedParcel, setSelectedParcel] = useState<BackendParcel | null>(null);
  const [filters, setFilters] = useState<ParcelFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter parcels based on current filters
  const filteredParcels = parcels.filter(parcel => {
    if (filters.status && parcel.status !== filters.status) return false;
    if (filters.parcelType && parcel.parcelType !== filters.parcelType) return false;
    if (filters.priceMin && (parcel.currentPrice || 0) < filters.priceMin) return false;
    if (filters.priceMax && (parcel.currentPrice || 0) > filters.priceMax) return false;
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      return (
        parcel.number.toString().includes(term) ||
        parcel.name?.toLowerCase().includes(term) ||
        parcel.parcelType.toLowerCase().includes(term) ||
        parcel.buildingType?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Handle parcel selection
  const handleParcelSelect = useCallback((parcel: BackendParcel) => {
    setSelectedParcel(parcel);
  }, []);

  // Handle status change
  const handleStatusChange = async (parcel: BackendParcel, newStatus: string) => {
    try {
      await updateParcel(parcel.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update parcel status:', error);
    }
  };

  // Get status color styling
  const getStatusColor = (status: string) => {
    const colors = {
      'AVAILABLE': 'bg-green-100 text-green-800',
      'RESERVED': 'bg-yellow-100 text-yellow-800',
      'OWNED': 'bg-blue-100 text-blue-800',
      'UNDER_CONSTRUCTION': 'bg-orange-100 text-orange-800',
      'DEVELOPED': 'bg-purple-100 text-purple-800',
      'ABANDONED': 'bg-gray-100 text-gray-800',
      'PUBLIC': 'bg-indigo-100 text-indigo-800'
    };
    return colors[status as keyof typeof colors] || colors.AVAILABLE;
  };

  // Format price
  const formatPrice = (price: number | null) => {
    if (!price) return 'Sin precio';
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error al cargar las parcelas</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={() => fetchParcels()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Administración de Parcelas</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'list' | 'grid')}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="list">Lista</option>
            <option value="grid">Cuadrícula</option>
          </select>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Parcelas</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
            <div className="text-sm text-gray-600">Reservadas</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.owned}</div>
            <div className="text-sm text-gray-600">Vendidas</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {formatPrice(stats.totalValue)}
            </div>
            <div className="text-sm text-gray-600">Valor Total</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                <option value="AVAILABLE">Disponible</option>
                <option value="RESERVED">Reservada</option>
                <option value="OWNED">Vendida</option>
                <option value="UNDER_CONSTRUCTION">En Construcción</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.parcelType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, parcelType: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                <option value="RESIDENTIAL">Residencial</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="MIXED_USE">Uso Mixto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Mínimo
              </label>
              <input
                type="number"
                value={filters.priceMin || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="$0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={filters.searchTerm || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Número, nombre, tipo..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando parcelas...</p>
        </div>
      )}

      {/* Parcels List/Grid */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Results Info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando {filteredParcels.length} de {parcels.length} parcelas
            </p>
          </div>

          {/* Table Header (List Mode) */}
          {viewMode === 'list' && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>PARCELA</div>
                <div>TIPO</div>
                <div>DISTRITO</div>
                <div>DIMENSIONES</div>
                <div>PRECIO</div>
                <div>ESTADO</div>
                <div>ACCIONES</div>
              </div>
            </div>
          )}

          {/* Parcels Data */}
          <div className={viewMode === 'list' ? 'divide-y divide-gray-200' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'}>
            {filteredParcels.map((parcel) => (
              <div
                key={parcel.id}
                className={viewMode === 'list' 
                  ? 'px-6 py-4 hover:bg-gray-50 cursor-pointer'
                  : 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer'
                }
                onClick={() => handleParcelSelect(parcel)}
              >
                {viewMode === 'list' ? (
                  <div className="grid grid-cols-7 gap-4 items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">#{parcel.number}</div>
                      <div className="text-sm text-gray-500">{parcel.name || 'Sin nombre'}</div>
                    </div>
                    <div className="text-sm text-gray-900">{parcel.parcelType}</div>
                    <div className="text-sm text-gray-900">{parcel.buildingType || 'Sin edificio'}</div>
                    <div className="text-sm text-gray-900">{parcel.width}x{parcel.height}</div>
                    <div className="text-sm text-gray-900">{formatPrice(parcel.currentPrice)}</div>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                        {parcel.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(parcel, parcel.status === 'AVAILABLE' ? 'RESERVED' : 'AVAILABLE');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Cambiar Estado
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">#{parcel.number}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                        {parcel.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{parcel.name || 'Sin nombre'}</p>
                      <p>{parcel.description}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tipo:</span>
                        <span className="text-gray-900">{parcel.parcelType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dimensiones:</span>
                        <span className="text-gray-900">{parcel.width}x{parcel.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Precio:</span>
                        <span className="text-gray-900 font-medium">{formatPrice(parcel.currentPrice)}</span>
                      </div>
                      {parcel.monthlyTax && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Impuesto:</span>
                          <span className="text-gray-900">{formatPrice(parcel.monthlyTax)}/mes</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredParcels.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron parcelas con los filtros aplicados.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}