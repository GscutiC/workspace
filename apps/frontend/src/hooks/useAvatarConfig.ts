import { useState, useEffect, useCallback } from 'react';

export interface AvatarConfig {
  name: string;
  avatar: string;
  color: number;
  userId?: string;
  timestamp?: number;
}

const STORAGE_KEY = 'virtualOffice_avatarConfig';

// ✅ FIXED: Default configuration to prevent initialization blocking
const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  name: 'Default User',
  avatar: 'default',
  color: 0x4287f5,
  timestamp: Date.now()
};

export function useAvatarConfig() {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration from localStorage with immediate fallback
  const loadConfig = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AvatarConfig;
        setConfig(parsed);
        // Loaded saved avatar config
      } else {
        // ✅ Use default config immediately, don't wait
        setConfig(DEFAULT_AVATAR_CONFIG);
        // Using default avatar config - no saved config found
      }
    } catch (error) {
      console.error('❌ Error loading avatar config:', error);
      // ✅ Fallback to default on error
      setConfig(DEFAULT_AVATAR_CONFIG);
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
      // Saved avatar config
      
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
    setConfig(DEFAULT_AVATAR_CONFIG);
    // Cleared avatar config
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
      // Avatar config changed externally
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