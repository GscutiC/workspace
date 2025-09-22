import { useState, useEffect } from 'react';

interface WorldStats {
  totalUsers: number;
  onlineUsers: number;
  activeRooms: number;
  serverStatus: 'online' | 'maintenance' | 'offline';
}

export function useWorldStats() {
  const [stats, setStats] = useState<WorldStats>({
    totalUsers: 0,
    onlineUsers: 0,
    activeRooms: 1,
    serverStatus: 'online'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Reemplazar con llamada real al backend
        // const response = await fetch('/api/world/stats');
        // const data = await response.json();
        
        // Por ahora, simulamos datos más realistas
        const mockStats: WorldStats = {
          totalUsers: 43, // Número base realista
          onlineUsers: Math.floor(Math.random() * 15) + 8, // Entre 8-22 usuarios
          activeRooms: 1,
          serverStatus: 'online'
        };
        
        setStats(mockStats);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching world stats:', error);
        setStats(prev => ({ ...prev, serverStatus: 'offline' }));
        setIsLoading(false);
      }
    };

    // Fetch inicial
    fetchStats();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  return { stats, isLoading };
}