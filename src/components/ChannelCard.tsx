import React, { memo } from 'react';
import { Star, Tv } from 'lucide-react';
import type { HealthStatus } from '../lib/types';

interface ChannelCardProps {
  name: string;
  logo?: string;
  isFavorite: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  healthStatus?: HealthStatus;
  compact?: boolean;
}

const healthColors: Record<HealthStatus, string> = {
  alive: 'bg-[var(--color-success)]',
  dead: 'bg-[var(--color-error)]',
  expired: 'bg-[var(--color-warning)]',
  unknown: 'bg-[var(--color-txt-muted)]',
};

const healthLabels: Record<HealthStatus, string> = {
  alive: 'Live',
  dead: 'Dead',
  expired: 'Expired',
  unknown: '?',
};

export const ChannelCard = memo(function ChannelCard({
  name,
  logo,
  isFavorite,
  onPlay,
  onToggleFavorite,
  healthStatus,
  compact,
}: ChannelCardProps) {
  return (
    <div
      onClick={onPlay}
      className={`flex items-center gap-3 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] rounded-xl cursor-pointer transition-colors ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      {/* Logo / Placeholder */}
      <div
        className={`flex-shrink-0 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center overflow-hidden ${
          compact ? 'w-8 h-8' : 'w-10 h-10'
        }`}
      >
        {logo ? (
          <img
            src={logo}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Tv size={compact ? 16 : 20} className={`text-[var(--color-txt-muted)] ${logo ? 'hidden' : ''}`} />
      </div>

      {/* Name */}
      <span className={`flex-1 truncate text-[var(--color-txt)] ${compact ? 'text-sm' : 'text-sm font-medium'}`}>
        {name}
      </span>

      {/* Health badge */}
      {healthStatus && (
        <span
          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium text-white ${healthColors[healthStatus]}`}
        >
          {healthLabels[healthStatus]}
        </span>
      )}

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="flex-shrink-0 p-1.5 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star
          size={compact ? 16 : 18}
          className={isFavorite ? 'fill-[var(--color-warning)] text-[var(--color-warning)]' : 'text-[var(--color-txt-muted)]'}
        />
      </button>
    </div>
  );
});
