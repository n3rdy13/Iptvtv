import React, { memo } from 'react';
import { Star, Film } from 'lucide-react';

interface PosterCardProps {
  title: string;
  poster?: string;
  rating?: number | string;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export const PosterCard = memo(function PosterCard({
  title,
  poster,
  rating,
  isFavorite,
  onPress,
  onToggleFavorite,
}: PosterCardProps) {
  const displayRating = rating !== undefined && rating !== null && rating !== '' && rating !== '0'
    ? typeof rating === 'number' ? rating.toFixed(1) : parseFloat(rating).toFixed(1)
    : null;

  return (
    <div
      onClick={onPress}
      className="relative flex-shrink-0 cursor-pointer group"
      style={{ width: 130 }}
    >
      {/* Poster */}
      <div
        className="relative rounded-xl overflow-hidden bg-[var(--color-bg-elevated)]"
        style={{ width: 130, height: 190 }}
      >
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={32} className="text-[var(--color-txt-muted)]" />
          </div>
        )}

        {/* Favorite overlay button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            size={14}
            className={isFavorite ? 'fill-[var(--color-warning)] text-[var(--color-warning)]' : 'text-white'}
          />
        </button>

        {/* Rating badge */}
        {displayRating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-xs text-[var(--color-warning)] font-medium">
            <Star size={10} className="fill-[var(--color-warning)] text-[var(--color-warning)]" />
            {displayRating}
          </div>
        )}
      </div>

      {/* Title */}
      <p className="mt-2 text-xs text-[var(--color-txt)] leading-tight line-clamp-2">
        {title}
      </p>
    </div>
  );
});
