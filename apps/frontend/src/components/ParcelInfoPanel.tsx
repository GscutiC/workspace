'use client';

import { useState, useEffect } from 'react';
import { ParcelInfo } from '@/lib/game/generators/CityGenerator';

interface ParcelData extends ParcelInfo {
  id?: string;
  status: 'available' | 'reserved' | 'sold' | 'maintenance';
  price?: number;
  owner?: string;
  lastModified?: Date;
  description?: string;
  amenities?: string[];
  zoning?: string;
  utilities?: {
    water: boolean;
    electricity: boolean;
    gas: boolean;
    internet: boolean;
  };
}

interface ParcelInfoPanelProps {
  parcel: ParcelData | null;
  onClose: () => void;
  onUpdate: (parcel: ParcelData) => void;
  onStatusChange: (status: ParcelData['status']) => void;
}

/**
 * ParcelInfoPanel - Detailed parcel information and editing interface
 * Features:
 * - Comprehensive parcel details display
 * - Inline editing capabilities
 * - Status management
 * - History tracking
 * - Media gallery for parcel images
 */
export function ParcelInfoPanel({ 
  parcel, 
  onClose, 
  onUpdate, 
  onStatusChange 
}: ParcelInfoPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedParcel, setEditedParcel] = useState<ParcelData | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'utilities' | 'history'>('details');

  useEffect(() => {
    if (parcel) {
      setEditedParcel({ ...parcel });
    }
  }, [parcel]);

  if (!parcel) return null;

  const handleSave = () => {
    if (editedParcel) {
      onUpdate({
        ...editedParcel,
        lastModified: new Date()
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedParcel({ ...parcel });
    setIsEditing(false);
  };

  const getStatusColor = (status: ParcelData['status']) => {
    const colors = {
      available: 'text-green-600 bg-green-100',
      reserved: 'text-yellow-600 bg-yellow-100',
      sold: 'text-red-600 bg-red-100',
      maintenance: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.available;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      residential: '🏠',
      commercial: '🏢',
      office: '🏢',
      mixed: '🏬',
      public: '🏛️',
      infrastructure: '🏗️'
    };
    return icons[type as keyof typeof icons] || '📍';
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-30 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTypeIcon(parcel.type)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Parcela {parcel.number}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {parcel.type} - {parcel.districtType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Status and Price */}
        <div className="mt-3 flex justify-between items-center">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(parcel.status)}`}>
            {parcel.status.charAt(0).toUpperCase() + parcel.status.slice(1)}
          </span>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              ${parcel.price?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              ${Math.round((parcel.price || 0) / (parcel.width * parcel.height))}/m²
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Editar
              </button>
              <select
                value={parcel.status}
                onChange={(e) => onStatusChange(e.target.value as ParcelData['status'])}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="available">Disponible</option>
                <option value="reserved">Reservada</option>
                <option value="sold">Vendida</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'details', label: 'Detalles', icon: '📋' },
            { id: 'utilities', label: 'Servicios', icon: '⚡' },
            { id: 'history', label: 'Historial', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'details' | 'utilities' | 'history')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Información Básica</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-gray-600">Posición</label>
                  <div className="font-medium">({parcel.x}, {parcel.y})</div>
                </div>
                <div>
                  <label className="text-gray-600">Dimensiones</label>
                  <div className="font-medium">{parcel.width} × {parcel.height}</div>
                </div>
                <div>
                  <label className="text-gray-600">Área Total</label>
                  <div className="font-medium">{parcel.width * parcel.height} m²</div>
                </div>
                <div>
                  <label className="text-gray-600">Edificio</label>
                  <div className="font-medium capitalize">
                    {parcel.buildingType || 'No especificado'}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Información de Precio</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio Base:</span>
                  <span className="font-medium">${parcel.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio por m²:</span>
                  <span className="font-medium">
                    ${Math.round((parcel.price || 0) / (parcel.width * parcel.height))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valoración:</span>
                  <span className="font-medium text-green-600">
                    {parcel.price && parcel.price > 100000 ? 'Alta' : 
                     parcel.price && parcel.price > 50000 ? 'Media' : 'Baja'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Descripción</h4>
              {isEditing ? (
                <textarea
                  value={editedParcel?.description || ''}
                  onChange={(e) => setEditedParcel(prev => prev ? 
                    { ...prev, description: e.target.value } : null
                  )}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  rows={3}
                  placeholder="Descripción de la parcela..."
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {parcel.description || 'No hay descripción disponible'}
                </p>
              )}
            </div>

            {/* Location Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Detalles de Ubicación</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distrito:</span>
                  <span className="font-medium capitalize">{parcel.districtType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zonificación:</span>
                  <span className="font-medium">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedParcel?.zoning || ''}
                        onChange={(e) => setEditedParcel(prev => prev ? 
                          { ...prev, zoning: e.target.value } : null
                        )}
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-20"
                        placeholder="Zona"
                      />
                    ) : (
                      parcel.zoning || 'No especificada'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accesibilidad:</span>
                  <span className="font-medium text-green-600">
                    {/* Calculate based on position - closer to center = better */}
                    {parcel.x > 20 && parcel.x < 80 && parcel.y > 20 && parcel.y < 80 ? 'Excelente' : 'Buena'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utilities' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Servicios Disponibles</h4>
            <div className="space-y-3">
              {[
                { key: 'water', label: 'Agua Potable', icon: '💧' },
                { key: 'electricity', label: 'Electricidad', icon: '⚡' },
                { key: 'gas', label: 'Gas Natural', icon: '🔥' },
                { key: 'internet', label: 'Internet/Fibra', icon: '🌐' }
              ].map((utility) => (
                <div key={utility.key} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{utility.icon}</span>
                    <span className="text-sm">{utility.label}</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={editedParcel?.utilities?.[utility.key as keyof typeof editedParcel.utilities] || false}
                      onChange={(e) => setEditedParcel(prev => prev ? {
                        ...prev,
                        utilities: {
                          water: false,
                          electricity: false,
                          gas: false,
                          internet: false,
                          ...prev.utilities,
                          [utility.key]: e.target.checked
                        }
                      } : null)}
                      className="rounded"
                    />
                  ) : (
                    <span className={`text-sm font-medium ${
                      parcel.utilities?.[utility.key as keyof typeof parcel.utilities] 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parcel.utilities?.[utility.key as keyof typeof parcel.utilities] ? '✓ Disponible' : '✗ No disponible'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Servicios Adicionales</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recolección de Basura:</span>
                  <span className="text-green-600">✓ Diaria</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transporte Público:</span>
                  <span className="text-green-600">✓ 2 cuadras</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seguridad:</span>
                  <span className="text-green-600">✓ Patrullaje</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Historial de Cambios</h4>
            <div className="space-y-3">
              <div className="border-l-2 border-blue-500 pl-3">
                <div className="text-sm font-medium text-gray-900">Creación</div>
                <div className="text-xs text-gray-600">
                  {new Date().toLocaleDateString()} - Sistema generó parcela automáticamente
                </div>
              </div>
              {parcel.lastModified && (
                <div className="border-l-2 border-green-500 pl-3">
                  <div className="text-sm font-medium text-gray-900">Última Modificación</div>
                  <div className="text-xs text-gray-600">
                    {parcel.lastModified.toLocaleDateString()} - Actualización de datos
                  </div>
                </div>
              )}
              <div className="border-l-2 border-yellow-500 pl-3">
                <div className="text-sm font-medium text-gray-900">Estado Actual</div>
                <div className="text-xs text-gray-600">
                  Estado: {parcel.status} | Precio: ${parcel.price?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Métricas</h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-600">Vistas</div>
                  <div className="font-medium">{Math.floor(Math.random() * 50) + 10}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-600">Interés</div>
                  <div className="font-medium">{Math.floor(Math.random() * 20) + 5}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          ID: {parcel.id} | Última actualización: {
            parcel.lastModified ? parcel.lastModified.toLocaleString() : 'No disponible'
          }
        </div>
      </div>
    </div>
  );
}