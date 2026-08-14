import React from 'react';
import { Activity, Wifi, Zap, Gauge, Minus, Plus } from 'lucide-react';
import type { BufferSettings, BufferPreset } from '../lib/types';

interface BufferControlPanelProps {
  settings: BufferSettings;
  onChange: (settings: BufferSettings) => void;
  compact?: boolean;
}

const presets: { id: BufferPreset; label: string; icon: React.ReactNode }[] = [
  { id: 'auto', label: 'Auto', icon: <Activity size={16} /> },
  { id: 'low_data', label: 'Low Data', icon: <Wifi size={16} /> },
  { id: 'smooth', label: 'Smooth', icon: <Zap size={16} /> },
  { id: 'custom', label: 'Custom', icon: <Gauge size={16} /> },
];

const presetValues: Record<Exclude<BufferPreset, 'custom'>, Omit<BufferSettings, 'preset'>> = {
  auto: { cacheSize: 64, initialBufferMs: 2000, rebufferThresholdMs: 1000, maxBufferMs: 30000 },
  low_data: { cacheSize: 32, initialBufferMs: 3000, rebufferThresholdMs: 2000, maxBufferMs: 15000 },
  smooth: { cacheSize: 128, initialBufferMs: 5000, rebufferThresholdMs: 3000, maxBufferMs: 60000 },
};

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled: boolean;
  onChange: (value: number) => void;
}

function SliderRow({ label, value, min, max, step, unit, disabled, onChange }: SliderRowProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-txt-secondary)]">{label}</span>
        <span className="text-xs font-medium text-[var(--color-txt)]">
          {value}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={decrement}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-txt-secondary)] hover:text-[var(--color-txt)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={14} />
        </button>
        <div className="flex-1 h-2 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <button
          onClick={increment}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-txt-secondary)] hover:text-[var(--color-txt)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
          aria-label={`Increase ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function BufferControlPanel({ settings, onChange, compact }: BufferControlPanelProps) {
  const isCustom = settings.preset === 'custom';

  const selectPreset = (preset: BufferPreset) => {
    if (preset === 'custom') {
      onChange({ ...settings, preset: 'custom' });
    } else {
      onChange({ preset, ...presetValues[preset] });
    }
  };

  const updateField = (field: keyof Omit<BufferSettings, 'preset'>, value: number) => {
    onChange({ ...settings, preset: 'custom', [field]: value });
  };

  return (
    <div className={`space-y-4 ${compact ? 'space-y-3' : ''}`}>
      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPreset(p.id)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-colors ${
              settings.preset === p.id
                ? 'bg-[var(--color-primary)] text-[var(--color-txt-on-primary)]'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-txt-secondary)] hover:bg-[var(--color-bg-card-hover)]'
            }`}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>

      {/* Slider rows */}
      <div className="space-y-4">
        <SliderRow
          label="Cache Size"
          value={settings.cacheSize}
          min={16}
          max={256}
          step={16}
          unit=" MB"
          disabled={!isCustom}
          onChange={(v) => updateField('cacheSize', v)}
        />
        <SliderRow
          label="Initial Buffer"
          value={settings.initialBufferMs}
          min={500}
          max={10000}
          step={500}
          unit=" ms"
          disabled={!isCustom}
          onChange={(v) => updateField('initialBufferMs', v)}
        />
        <SliderRow
          label="Rebuffer Threshold"
          value={settings.rebufferThresholdMs}
          min={500}
          max={5000}
          step={250}
          unit=" ms"
          disabled={!isCustom}
          onChange={(v) => updateField('rebufferThresholdMs', v)}
        />
        <SliderRow
          label="Max Buffer"
          value={settings.maxBufferMs}
          min={5000}
          max={120000}
          step={5000}
          unit=" ms"
          disabled={!isCustom}
          onChange={(v) => updateField('maxBufferMs', v)}
        />
      </div>
    </div>
  );
}
