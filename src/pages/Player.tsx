import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Loader2,
} from 'lucide-react';
import Hls from 'hls.js';
import { useApp } from '../components/AppProvider';
import { buildStreamUrl } from '../lib/xtream';
import { isSafePlaybackUrl } from '../lib/url';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isHlsUrl(url: string): boolean {
  if (url.includes('.m3u8')) return true;
  // If no common file extension, try HLS
  const commonExts = ['.mp4', '.mkv', '.avi', '.ts', '.flv', '.webm', '.mov'];
  return !commonExts.some((ext) => url.includes(ext));
}

export default function Player() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { playlists, history } = useApp();

  const streamId = searchParams.get('streamId') || '';
  const type = (searchParams.get('type') || 'live') as 'live' | 'vod' | 'series';
  const name = searchParams.get('name') || 'Unknown Stream';
  const playlistId = searchParams.get('playlistId') || '';
  const logo = searchParams.get('logo') || '';
  const ext = searchParams.get('ext') || '';

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const historyTimerRef = useRef<ReturnType<typeof setInterval>>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState('');

  // Build stream URL
  const playlist = playlists.playlists.find((p) => p.id === playlistId);
  let streamUrl = '';
  if (playlist?.type === 'xtream' && streamId) {
    streamUrl = buildStreamUrl(playlist, Number(streamId), type, ext || undefined);
  } else {
    // For M3U or direct URL, streamId is the direct URL
    streamUrl = streamId;
  }

  // The address can come straight from the link the page was opened with, so
  // only ever hand a real web address to the media element.
  const streamUrlIsSafe = isSafePlaybackUrl(streamUrl);

  // Setup video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if (!streamUrlIsSafe) {
      setBuffering(false);
      setError('This stream address is not valid and cannot be played.');
      return;
    }

    setError('');
    setBuffering(true);

    // Resume position
    const resumePos = history.getResumePosition(playlistId, streamId);

    if (isHlsUrl(streamUrl) && Hls.isSupported()) {
      const hls = new Hls({
        startPosition: resumePos > 0 ? resumePos : -1,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setError('Playback error. The stream may be unavailable.');
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (isHlsUrl(streamUrl) && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = streamUrl;
      if (resumePos > 0) video.currentTime = resumePos;
      video.play().catch(() => {});
    } else {
      video.src = streamUrl;
      if (resumePos > 0) video.currentTime = resumePos;
      video.play().catch(() => {});
    }

    return () => {
      video.src = '';
    };
  }, [streamUrl, streamUrlIsSafe]);

  // Track history periodically
  useEffect(() => {
    historyTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !playlistId || !streamId) return;
      if (video.currentTime > 0) {
        history.addOrUpdateHistory({
          playlistId,
          streamId,
          name,
          type,
          logo: logo || undefined,
          position: video.currentTime,
          duration: video.duration || 0,
        });
      }
    }, 10000);

    return () => {
      if (historyTimerRef.current) clearInterval(historyTimerRef.current);
      // Save final position
      const video = videoRef.current;
      if (video && video.currentTime > 0 && playlistId && streamId) {
        history.addOrUpdateHistory({
          playlistId,
          streamId,
          name,
          type,
          logo: logo || undefined,
          position: video.currentTime,
          duration: video.duration || 0,
        });
      }
    };
  }, [playlistId, streamId, name, type, logo]);

  // Video event handlers
  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };
  const onDurationChange = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };
  const onWaiting = () => setBuffering(true);
  const onCanPlay = () => setBuffering(false);
  const onError = () => setError('Failed to load stream');

  // Controls auto-hide
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = fraction * duration;
  };

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center"
      onClick={resetControlsTimer}
      onMouseMove={resetControlsTimer}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTimeUpdate}
        onDurationChange={onDurationChange}
        onWaiting={onWaiting}
        onCanPlay={onCanPlay}
        onError={onError}
      />

      {/* Buffering indicator */}
      {buffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 size={48} className="text-white animate-spin" />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <p className="text-white text-lg">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium"
          >
            Go Back
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)' }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate text-sm">{name}</p>
          </div>
        </div>

        {/* Center controls */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => skip(-10)}
            className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <SkipBack size={24} />
          </button>
          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            {playing ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button
            onClick={() => skip(10)}
            className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <SkipForward size={24} />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="p-4 space-y-2">
          {/* Progress bar */}
          {duration > 0 && (
            <div
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group"
              onClick={seekTo}
            >
              <div
                className="h-full bg-[var(--color-primary)] rounded-full relative"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-xs">
              {formatTime(currentTime)}
              {duration > 0 && ` / ${formatTime(duration)}`}
            </span>
            <button
              onClick={toggleMute}
              className="p-2 rounded-full text-white hover:bg-black/40 transition-colors"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
