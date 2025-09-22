import { useState, useEffect, useCallback } from 'react';

export interface AvatarConfig {
  name: string;
  avatar: string;
  color: number;
  userId?: string;
  timestamp?: number;
}

const STORAGE_KEY = 'virtualOffice_avatarConfig';

export function useAvatarConfig() {
  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration from localStorage
  const loadConfig = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AvatarConfig;
        setConfig(parsed);
        console.log('🎨 Loaded avatar config:', parsed);
      } else {
        console.log('🎨 No saved avatar config found');
      }
    } catch (error) {
      console.error('Error loading avatar config:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = useCallback((newConfig: AvatarConfig) => {
    try {
      const configToSave = {
        ...newConfig,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
      setConfig(configToSave);
      console.log('🎨 Saved avatar config:', configToSave);
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('avatarConfigChanged', {
        detail: configToSave
      }));
    } catch (error) {
      console.error('Error saving avatar config:', error);
    }
  }, []);

  // Clear configuration
  const clearConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConfig(null);
    console.log('🎨 Cleared avatar config');
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Listen for external changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadConfig();
      }
    };

    const handleConfigChange = (e: CustomEvent) => {
      setConfig(e.detail);
      console.log('🎨 Avatar config changed externally:', e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('avatarConfigChanged', handleConfigChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarConfigChanged', handleConfigChange as EventListener);
    };
  }, [loadConfig]);

  return {
    config,
    isLoading,
    saveConfig,
    clearConfig,
    reloadConfig: loadConfig
  };
}