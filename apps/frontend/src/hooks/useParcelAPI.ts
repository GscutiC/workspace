import { useState, useEffect } from 'react';

// API Base URL
const API_BASE_URL = 'http://localhost:3001';

// Real IDs from our seeded data
const DEFAULT_ORG_ID = 'cmfvvwo9z0000ukbcotrz1tz2';
const DEFAULT_SPACE_ID = 'demo-space-id';

// Types based on our backend API
export interface BackendParcel {
  id: string;
  number: number;
  name: string | null;
  description: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  parcelType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE';
  status: 'AVAILABLE' | 'RESERVED' | 'OWNED' | 'UNDER_CONSTRUCTION' | 'DEVELOPED' | 'ABANDONED' | 'PUBLIC';
  buildingType: string | null;
  basePrice: number | null;
  currentPrice: number | null;
  monthlyTax: number | null;
  ownerId: string | null;
  organizationId: string;
  spaceId: string;
  mapConfig: string | null;
  preset: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  space: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface ParcelsResponse {
  parcels: BackendParcel[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ParcelStats {
  total: number;
  available: number;
  owned: number;
  reserved: number;
  underConstruction: number;
  totalValue: number;
  averagePrice: number;
  parcelsByType: Record<string, number>;
}

export function useParcelAPI(organizationId = DEFAULT_ORG_ID, spaceId = DEFAULT_SPACE_ID) {
  const [parcels, setParcels] = useState<BackendParcel[]>([]);
  const [stats, setStats] = useState<ParcelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all parcels
  const fetchParcels = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    parcelType?: string;
    priceMin?: number;
    priceMax?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams({
        organizationId,
        spaceId,
        ...params && Object.fromEntries(
          Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, value.toString()])
        )
      });

      const response = await fetch(`${API_BASE_URL}/parcels?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ParcelsResponse = await response.json();
      setParcels(data.parcels);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parcels';
      setError(errorMessage);
      console.error('Error fetching parcels:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch parcel statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/parcels/statistics/${organizationId}/${spaceId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ParcelStats = await response.json();
      setStats(data);
      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  };

  // Update parcel
  const updateParcel = async (parcelId: string, updates: {
    name?: string;
    description?: string;
    status?: string;
    buildingType?: string;
    basePrice?: number;
    currentPrice?: number;
    monthlyTax?: number;
    ownerId?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/parcels/${parcelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedParcel: BackendParcel = await response.json();
      
      // Update local state
      setParcels(prev => prev.map(p => p.id === parcelId ? updatedParcel : p));
      
      return updatedParcel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update parcel';
      setError(errorMessage);
      console.error('Error updating parcel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Purchase parcel
  const purchaseParcel = async (parcelId: string, ownerId: string, purchasePrice?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/parcels/${parcelId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerId, purchasePrice }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedParcel: BackendParcel = await response.json();
      
      // Update local state
      setParcels(prev => prev.map(p => p.id === parcelId ? updatedParcel : p));
      
      return updatedParcel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase parcel';
      setError(errorMessage);
      console.error('Error purchasing parcel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete parcel
  const deleteParcel = async (parcelId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/parcels/${parcelId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setParcels(prev => prev.filter(p => p.id !== parcelId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete parcel';
      setError(errorMessage);
      console.error('Error deleting parcel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchParcels();
    fetchStats();
  }, [organizationId, spaceId]);

  return {
    parcels,
    stats,
    loading,
    error,
    fetchParcels,
    fetchStats,
    updateParcel,
    purchaseParcel,
    deleteParcel,
  };
}