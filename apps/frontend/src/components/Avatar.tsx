'use client';

import { memo } from 'react';
import type { AvatarData } from '@/types/game';
import { UserStatus, Direction } from '@/types/game';

interface AvatarProps {
  avatar: AvatarData;
  isCurrentUser?: boolean;
  onClick?: (avatar: AvatarData) => void;
  onStatusChange?: (avatarId: string, status: UserStatus) => void;
}

/**
 * Avatar component - Represents a single avatar in the virtual office
 * This is a React component for UI representation, not the Pixi.js sprite
 * Used for avatar lists, status displays, and management interfaces
 */
export const Avatar = memo(function Avatar({
  avatar,
  isCurrentUser = false,
  onClick,
  onStatusChange,
}: AvatarProps) {
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.AVAILABLE:
        return 'bg-green-500';
      case UserStatus.BUSY:
        return 'bg-red-500';
      case UserStatus.AWAY:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case UserStatus.AVAILABLE:
        return 'Available';
      case UserStatus.BUSY:
        return 'Busy';
      case UserStatus.AWAY:
        return 'Away';
      default:
        return 'Offline';
    }
  };

  const getDirectionIcon = (direction: Direction) => {
    switch (direction) {
      case Direction.UP:
        return '↑';
      case Direction.DOWN:
        return '↓';
      case Direction.LEFT:
        return '←';
      case Direction.RIGHT:
        return '→';
      default:
        return '↓';
    }
  };

  const handleClick = () => {
    onClick?.(avatar);
  };

  const handleStatusChange = (newStatus: UserStatus) => {
    onStatusChange?.(avatar.id, newStatus);
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
        ${isCurrentUser
          ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-opacity-20'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={handleClick}
    >
      {/* Avatar Visual */}
      <div className="relative">
        {/* Avatar Circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
          style={{ backgroundColor: `#${avatar.color.toString(16).padStart(6, '0')}` }}
        >
          {avatar.name.charAt(0).toUpperCase()}
        </div>

        {/* Status Indicator */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(avatar.status)}`} />

        {/* Direction Indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 text-white text-xs rounded-full flex items-center justify-center">
          {getDirectionIcon(avatar.direction)}
        </div>
      </div>

      {/* Avatar Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">
            {avatar.name}
            {isCurrentUser && <span className="text-xs text-gray-500 ml-1">(You)</span>}
          </h4>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-600">
            {getStatusText(avatar.status)}
          </span>

          {/* Position Display */}
          <span className="text-xs text-gray-400">
            ({Math.round(avatar.position.x)}, {Math.round(avatar.position.y)})
          </span>
        </div>

        {/* Last Message */}
        {avatar.lastMessage && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <p className="text-gray-700 line-clamp-2">&ldquo;{avatar.lastMessage.content}&rdquo;</p>
            <p className="text-gray-500 mt-1">
              {new Date(avatar.lastMessage.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {/* Status Controls (for current user) */}
      {isCurrentUser && onStatusChange && (
        <div className="flex flex-col gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(UserStatus.AVAILABLE);
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              avatar.status === UserStatus.AVAILABLE
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            Available
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(UserStatus.BUSY);
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              avatar.status === UserStatus.BUSY
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            Busy
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(UserStatus.AWAY);
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              avatar.status === UserStatus.AWAY
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            Away
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * AvatarList component - Display a list of avatars
 */
interface AvatarListProps {
  avatars: AvatarData[];
  currentUserId?: string;
  onAvatarClick?: (avatar: AvatarData) => void;
  onStatusChange?: (avatarId: string, status: UserStatus) => void;
  maxHeight?: string;
}

export function AvatarList({
  avatars,
  currentUserId,
  onAvatarClick,
  onStatusChange,
  maxHeight = '400px',
}: AvatarListProps) {
  const sortedAvatars = [...avatars].sort((a, b) => {
    // Current user first, then by status, then by name
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;

    const statusOrder = [UserStatus.AVAILABLE, UserStatus.BUSY, UserStatus.AWAY];
    const aStatusIndex = statusOrder.indexOf(a.status);
    const bStatusIndex = statusOrder.indexOf(b.status);

    if (aStatusIndex !== bStatusIndex) {
      return aStatusIndex - bStatusIndex;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">
          Virtual Office ({avatars.length} user{avatars.length !== 1 ? 's' : ''})
        </h3>
      </div>

      <div className="p-4">
        <div
          className="space-y-3 overflow-y-auto"
          style={{ maxHeight }}
        >
          {sortedAvatars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users connected</p>
            </div>
          ) : (
            sortedAvatars.map((avatar) => (
              <Avatar
                key={avatar.id}
                avatar={avatar}
                isCurrentUser={avatar.id === currentUserId}
                onClick={onAvatarClick}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AvatarCard component - Compact avatar display for minimal space
 */
interface AvatarCardProps {
  avatar: AvatarData;
  isCurrentUser?: boolean;
  showPosition?: boolean;
  onClick?: (avatar: AvatarData) => void;
}

export function AvatarCard({
  avatar,
  isCurrentUser = false,
  showPosition = false,
  onClick,
}: AvatarCardProps) {
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.AVAILABLE:
        return 'bg-green-500';
      case UserStatus.BUSY:
        return 'bg-red-500';
      case UserStatus.AWAY:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded border transition-all duration-200
        ${isCurrentUser ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}
        ${onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-sm' : ''}
      `}
      onClick={() => onClick?.(avatar)}
    >
      {/* Compact Avatar */}
      <div className="relative">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-medium text-xs"
          style={{ backgroundColor: `#${avatar.color.toString(16).padStart(6, '0')}` }}
        >
          {avatar.name.charAt(0).toUpperCase()}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${getStatusColor(avatar.status)}`} />
      </div>

      {/* Compact Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {avatar.name}
          {isCurrentUser && <span className="text-xs text-gray-500 ml-1">(You)</span>}
        </div>
        {showPosition && (
          <div className="text-xs text-gray-500">
            ({Math.round(avatar.position.x)}, {Math.round(avatar.position.y)})
          </div>
        )}
      </div>
    </div>
  );
}