import React, { useState } from 'react';
import { useDistricts, DISTRICT_COLORS } from '@/hooks/useDistricts';

interface DistrictNavigatorProps {
  selectedDistrictId?: string;
  onDistrictSelect: (districtId: string) => void;
  onDistrictNavigate: (bounds: { x1: number; y1: number; x2: number; y2: number }) => void;
}

export const DistrictNavigator: React.FC<DistrictNavigatorProps> = ({
  selectedDistrictId,
  onDistrictSelect,
  onDistrictNavigate
}) => {
  const { data: districts, isLoading } = useDistricts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600">Cargando distritos...</div>
      </div>
    );
  }

  if (!districts) {
    return null;
  }

  // Filter districts based on search and type
  const filteredDistricts = districts.filter(district => {
    const matchesSearch = district.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         district.zoneCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || district.districtType === selectedType;
    return matchesSearch && matchesType;
  });

  // Get unique district types
  const districtTypes = Array.from(new Set(districts.map(d => d.districtType)));

  const handleDistrictClick = (district: any) => {
    onDistrictSelect(district.id);
    onDistrictNavigate(district.bounds);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-80">
      <h3 className="font-semibold text-lg mb-4">Navegador de Distritos</h3>
      
      {/* Search and Filter Controls */}
      <div className="space-y-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los tipos</option>
          {districtTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* District Grid */}
      <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          {filteredDistricts.map(district => {
            const color = DISTRICT_COLORS[district.zoneCode as keyof typeof DISTRICT_COLORS] || '#4A90E2';
            const isSelected = selectedDistrictId === district.id;
            
            return (
              <div
                key={district.id}
                onClick={() => handleDistrictClick(district)}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  {/* Color indicator */}
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{district.name}</div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <span>{district.zoneCode}</span>
                      <span>•</span>
                      <span>{district.districtType}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-600">
                      {district.basePriceMultiplier}x
                    </div>
                    <div className="text-xs text-gray-500">
                      {(district.taxRate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {district.description && (
                  <div className="mt-2 text-xs text-gray-600 line-clamp-2">
                    {district.description}
                  </div>
                )}

                {district.parcels && district.parcels.length > 0 && (
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Parcelas: {district.parcels.length}</span>
                    <span>
                      Ocupadas: {district.parcels.filter(p => p.status === 'occupied').length}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredDistricts.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-sm">No se encontraron distritos</div>
            <div className="text-xs mt-1">
              Intenta con diferentes términos de búsqueda
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Mostrando {filteredDistricts.length} de {districts.length} distritos</div>
          <div className="flex items-center space-x-4">
            <span>Total parcelas: {districts.reduce((acc, d) => acc + (d.parcels?.length || 0), 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};