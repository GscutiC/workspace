import { GraphQLClient } from 'graphql-request';

export const graphqlClient = new GraphQLClient('http://localhost:3000/graphql', {
  headers: {
    'Content-Type': 'application/json',
  },
});

// District Queries
export const GET_DISTRICTS = `
  query GetDistricts {
    districts {
      id
      name
      description
      bounds {
        x1
        y1
        x2
        y2
      }
      districtType
      color
      zoneCode
      basePriceMultiplier
      taxRate
      organizationId
      spaceId
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
      createdAt
      updatedAt
    }
  }
`;

export const GET_DISTRICT_BY_ZONE = `
  query GetDistrictByZone($zoneCode: String!) {
    districtByZone(zoneCode: $zoneCode) {
      id
      name
      description
      bounds {
        x1
        y1
        x2
        y2
      }
      districtType
      color
      zoneCode
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

export const GET_DISTRICTS_BY_SPACE = `
  query GetDistrictsBySpace($organizationId: String!, $spaceId: String!) {
    districtsBySpace(organizationId: $organizationId, spaceId: $spaceId) {
      id
      name
      description
      bounds {
        x1
        y1
        x2
        y2
      }
      districtType
      color
      zoneCode
      basePriceMultiplier
      taxRate
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

export const GET_DISTRICT_STATS = `
  query GetDistrictStats {
    districtStats {
      totalDistricts
      districtsByType {
        districtType
        _count
      }
      stats {
        id
        name
        zoneCode
        districtType
        basePriceMultiplier
        parcelCount
        avgPrice
        totalValue
      }
    }
  }
`;

// District Types
export interface District {
  id: string;
  name: string;
  description?: string;
  bounds: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  districtType: string;
  color: string;
  zoneCode: string;
  basePriceMultiplier: number;
  taxRate: number;
  organizationId: string;
  spaceId: string;
  parcels?: Parcel[];
  createdAt: string;
  updatedAt: string;
}

export interface Parcel {
  id: string;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  parcelType: string;
  status: string;
  currentPrice?: number;
}

export interface DistrictStats {
  totalDistricts: number;
  totalParcels?: number;
  occupiedParcels?: number;
  availableParcels?: number;
  districtsByType: Array<{
    districtType: string;
    _count: number;
  }>;
  stats: Array<{
    id: string;
    name: string;
    zoneCode: string;
    districtType: string;
    basePriceMultiplier: number;
    parcelCount: number;
    avgPrice: number;
    totalValue: number;
  }>;
}