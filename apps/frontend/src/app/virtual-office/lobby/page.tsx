'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWorldStats } from '@/hooks/useWorldStats';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';

interface AvatarOption {
  id: string;
  name: string;
  color: number;
  preview: string;
}

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'blue', name: 'Azul Profesional', color: 0x4F46E5, preview: '🔵' },
  { id: 'green', name: 'Verde Energético', color: 0x10B981, preview: '🟢' },
  { id: 'red', name: 'Rojo Dinámico', color: 0xEF4444, preview: '🔴' },
  { id: 'purple', name: 'Púrpura Creativo', color: 0x8B5CF6, preview: '🟣' },
  { id: 'orange', name: 'Naranja Vibrante', color: 0xF59E0B, preview: '🟠' },
  { id: 'pink', name: 'Rosa Innovador', color: 0xEC4899, preview: '🩷' },
];

export default function VirtualOfficeLobby() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { stats: worldStats, isLoading: statsLoading } = useWorldStats();
  const { config: savedConfig, saveConfig } = useAvatarConfig();
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption>(AVATAR_OPTIONS[0]);
  const [userName, setUserName] = useState('');
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setUserName(user.fullName || user.firstName || 'Usuario');
    }
  }, [isLoaded, user]);

  // Load saved avatar configuration
  useEffect(() => {
    if (savedConfig) {
      const foundAvatar = AVATAR_OPTIONS.find(avatar => avatar.id === savedConfig.avatar);
      if (foundAvatar) {
        setSelectedAvatar(foundAvatar);
      }
      // Use saved name if available, but don't override user's real name unless they changed it
      if (savedConfig.name && savedConfig.name !== (user?.fullName || user?.firstName || 'Usuario')) {
        setUserName(savedConfig.name);
      }
    }
  }, [savedConfig, user]);

  const handleEnterWorld = async () => {
    if (!userName.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }

    setIsEntering(true);
    
    try {
      // Preparar configuración del avatar
      const avatarConfig = {
        name: userName.trim(),
        avatar: selectedAvatar.id,
        color: selectedAvatar.color,
        userId: user?.id
      };
      
      // Guardar configuración usando el hook
      saveConfig(avatarConfig);
      
      // Simular tiempo de carga/inicialización
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navegar al mundo virtual
      router.push('/virtual-office');
    } catch (error) {
      console.error('Error entering virtual world:', error);
      alert('Error al entrar al mundo virtual. Inténtalo de nuevo.');
    } finally {
      setIsEntering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'maintenance': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'maintenance': return 'Mantenimiento';
      case 'offline': return 'Fuera de línea';
      default: return 'Desconocido';
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏢 Oficina Virtual Mercado
          </h1>
          <p className="text-gray-600 text-lg">
            Bienvenido al espacio de trabajo colaborativo del futuro
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? (
                <div className="animate-pulse bg-blue-200 h-8 w-12 mx-auto rounded"></div>
              ) : (
                worldStats.onlineUsers
              )}
            </div>
            <div className="text-sm text-gray-600">Usuarios en línea</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? (
                <div className="animate-pulse bg-green-200 h-8 w-12 mx-auto rounded"></div>
              ) : (
                worldStats.totalUsers
              )}
            </div>
            <div className="text-sm text-gray-600">Total usuarios</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? (
                <div className="animate-pulse bg-purple-200 h-8 w-12 mx-auto rounded"></div>
              ) : (
                worldStats.activeRooms
              )}
            </div>
            <div className="text-sm text-gray-600">Salas activas</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className={`text-sm font-semibold ${getStatusColor(worldStats.serverStatus)}`}>
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-4 w-16 mx-auto rounded"></div>
              ) : (
                `● ${getStatusText(worldStats.serverStatus)}`
              )}
            </div>
            <div className="text-sm text-gray-600">Estado del servidor</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Avatar Customization */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              👤 Personaliza tu Avatar
            </h2>
            
            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ingresa tu nombre"
              />
            </div>

            {/* Avatar Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona tu avatar
              </label>
              <div className="grid grid-cols-2 gap-3">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedAvatar.id === avatar.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{avatar.preview}</div>
                    <div className="text-sm font-medium text-gray-700">{avatar.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Preview */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">{selectedAvatar.preview}</div>
              <div className="font-medium text-gray-800">{userName || 'Tu Nombre'}</div>
              <div className="text-sm text-gray-600">{selectedAvatar.name}</div>
            </div>
          </div>

          {/* World Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🌍 Información del Mundo Virtual
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h3 className="font-medium text-gray-800">Sistema de movimiento</h3>
                  <p className="text-sm text-gray-600">
                    Haz clic para mover tu avatar por la oficina virtual
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-2xl">💬</div>
                <div>
                  <h3 className="font-medium text-gray-800">Sistema de chat</h3>
                  <p className="text-sm text-gray-600">
                    Comunícate con otros usuarios a través de burbujas de chat
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-2xl">👥</div>
                <div>
                  <h3 className="font-medium text-gray-800">Colaboración en tiempo real</h3>
                  <p className="text-sm text-gray-600">
                    Interactúa con otros profesionales en un entorno inmersivo
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🔧</div>
                <div>
                  <h3 className="font-medium text-gray-800">Tecnología avanzada</h3>
                  <p className="text-sm text-gray-600">
                    Construido con Pixi.js, WebGL y pathfinding inteligente
                  </p>
                </div>
              </div>
            </div>

            {/* Enter Button */}
            <div className="mt-8">
              <button
                onClick={handleEnterWorld}
                disabled={isEntering || !userName.trim() || worldStats.serverStatus !== 'online'}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isEntering ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Entrando al mundo virtual...</span>
                  </div>
                ) : (
                  '🚀 Entrar a la Oficina Virtual'
                )}
              </button>
              
              {worldStats.serverStatus !== 'online' && (
                <p className="text-red-500 text-sm text-center mt-2">
                  El servidor no está disponible en este momento
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}