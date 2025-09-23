import { useQuery } from '@tanstack/react-query';
import { graphqlClient, GET_DISTRICTS, GET_DISTRICTS_BY_SPACE, GET_DISTRICT_STATS, District, DistrictStats } from '@/lib/graphql';

export const useDistricts = () => {
  return useQuery({
    queryKey: ['districts'],
    queryFn: async () => {
      const data = await graphqlClient.request<{ districts: District[] }>(GET_DISTRICTS);
      console.log('✅ Districts loaded:', data.districts.length);
      return data.districts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 1000,
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