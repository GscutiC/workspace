import { useQuery } from '@tanstack/react-query';
import { graphqlClient, GET_DISTRICTS, GET_DISTRICTS_BY_SPACE, GET_DISTRICT_STATS, District, DistrictStats } from '@/lib/graphql';
import { logDebug, logInfo, logError, LogCategory } from '@/lib/utils/logger';
import { DistrictValidator, DISTRICT_CONFIG } from '@/lib/game/config/DistrictConfig';

export const useDistricts = () => {
  return useQuery({
    queryKey: ['districts'],
    queryFn: async () => {
      logDebug(LogCategory.GRAPHQL, 'Making GraphQL request for districts');
      try {
        const data = await graphqlClient.request<{ districts: District[] }>(GET_DISTRICTS);
        
        // Validate and sanitize district data
        const validDistricts = DistrictValidator.sanitizeDistricts(data.districts);
        
        if (validDistricts.length !== data.districts.length) {
          logError(LogCategory.DISTRICTS, 'Some districts failed validation', {
            total: data.districts.length,
            valid: validDistricts.length,
            invalid: data.districts.length - validDistricts.length
          });
        }
        
        logInfo(LogCategory.DISTRICTS, 'Districts loaded successfully', {
          count: validDistricts.length,
          firstDistrict: validDistricts[0] ? {
            id: validDistricts[0].id,
            zoneCode: validDistricts[0].zoneCode,
            name: validDistricts[0].name,
            bounds: validDistricts[0].bounds
          } : null
        });
        
        return validDistricts;
      } catch (error) {
        logError(LogCategory.GRAPHQL, 'Error loading districts', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to load districts: ${errorMessage}`);
      }
    },
    staleTime: DISTRICT_CONFIG.cacheTimeout,
    retry: DISTRICT_CONFIG.retryAttempts,
    retryDelay: DISTRICT_CONFIG.retryDelay,
  });
};

export const useDistrictsBySpace = (organizationId?: string, spaceId?: string) => {
  return useQuery({
    queryKey: ['districts', 'bySpace', organizationId, spaceId],
    queryFn: async () => {
      if (!organizationId || !spaceId) throw new Error('Organization ID and Space ID are required');
      
      const data = await graphqlClient.request<{ districtsBySpace: District[] }>(
        GET_DISTRICTS_BY_SPACE,
        { organizationId, spaceId }
      );
      
      return data.districtsBySpace;
    },
    enabled: !!organizationId && !!spaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDistrictStats = () => {
  return useQuery({
    queryKey: ['districtStats'],
    queryFn: async () => {
      const data = await graphqlClient.request<{ districtStats: DistrictStats }>(GET_DISTRICT_STATS);
      return data.districtStats;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Helper functions for districts
export const getDistrictById = (districts: District[], id: string) => {
  return districts.find(district => district.id === id);
};

export const getDistrictByZoneCode = (districts: District[], zoneCode: string) => {
  return districts.find(district => district.zoneCode === zoneCode);
};

export const getDistrictsOfType = (districts: District[], type: string) => {
  return districts.filter(district => district.districtType === type);
};

export const getDistrictAt = (districts: District[], x: number, y: number) => {
  return districts.find(district => {
    const bounds = district.bounds;
    return x >= bounds.x1 && x < bounds.x2 && y >= bounds.y1 && y < bounds.y2;
  });
};

export const DISTRICT_COLORS = {
  "D-0101": "#4A90E2",
  "D-0102": "#5CB85C", 
  "D-0103": "#F0AD4E",
  "D-0104": "#D9534F",
  "D-0201": "#9B59B6",
  "D-0202": "#3498DB",
  "D-0203": "#E67E22", 
  "D-0204": "#95A5A6",
  "D-0301": "#1ABC9C",
  "D-0302": "#F39C12",
  "D-0303": "#8E44AD",
  "D-0304": "#34495E",
  "D-0401": "#E74C3C",
  "D-0402": "#2ECC71",
  "D-0403": "#F1C40F",
  "D-0404": "#BDC3C7"
} as const;

export const CENTER_POINT = { x: 86, y: 59 };