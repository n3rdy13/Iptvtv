import type { M3UEntry, Playlist } from './types';

export function parseM3U(content: string): M3UEntry[] {
  const entries: M3UEntry[] = [];
  const lines = content.split('\n');

  let currentEntry: Partial<M3UEntry> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF')) {
      currentEntry = parseExtInf(line);
    } else if (line.startsWith('#EXTGRP')) {
      const group = line.replace('#EXTGRP:', '').trim();
      if (currentEntry) currentEntry.groupTitle = group;
    } else if (!line.startsWith('#')) {
      if (currentEntry) {
        currentEntry.url = line;
        currentEntry.type = guessType(line, currentEntry.groupTitle || '');
        entries.push(currentEntry as M3UEntry);
        currentEntry = null;
      }
    }
  }

  return entries;
}

function parseExtInf(line: string): Partial<M3UEntry> {
  const entry: Partial<M3UEntry> = {};

  // Extract duration
  const durationMatch = line.match(/#EXTINF:(-?\d+)/);
  if (durationMatch) {
    entry.duration = parseInt(durationMatch[1], 10);
  }

  // Extract attributes
  const attrRegex = /([a-zA-Z_-]+)="([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(line)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2];
    switch (key) {
      case 'tvg-logo':
        entry.logo = value;
        break;
      case 'tvg-id':
        entry.tvgId = value;
        break;
      case 'tvg-name':
        entry.tvgName = value;
        break;
      case 'group-title':
        entry.groupTitle = value;
        break;
      case 'catchup':
        entry.catchup = value;
        break;
    }
  }

  // Extract name (after the last comma)
  const commaIndex = line.lastIndexOf(',');
  if (commaIndex !== -1) {
    entry.name = line.substring(commaIndex + 1).trim();
  }

  return entry;
}

function guessType(url: string, groupTitle: string): 'live' | 'vod' | 'series' {
  const lowerUrl = url.toLowerCase();
  const lowerGroup = groupTitle.toLowerCase();

  if (lowerGroup.includes('series') || lowerGroup.includes('tv shows') || lowerGroup.includes('shows')) {
    return 'series';
  }
  if (lowerGroup.includes('movie') || lowerGroup.includes('film') || lowerGroup.includes('vod')) {
    return 'vod';
  }
  if (lowerUrl.includes('/movie/') || lowerUrl.includes('/series/')) {
    return lowerUrl.includes('/movie/') ? 'vod' : 'series';
  }
  // Default to live
  return 'live';
}

export async function fetchM3U(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function groupM3UEntries(entries: M3UEntry[]): {
  live: Map<string, M3UEntry[]>;
  vod: Map<string, M3UEntry[]>;
  series: Map<string, M3UEntry[]>;
} {
  const live = new Map<string, M3UEntry[]>();
  const vod = new Map<string, M3UEntry[]>();
  const series = new Map<string, M3UEntry[]>();

  for (const entry of entries) {
    const group = entry.groupTitle || 'Uncategorized';
    const target = entry.type === 'live' ? live : entry.type === 'vod' ? vod : series;
    if (!target.has(group)) target.set(group, []);
    target.get(group)!.push(entry);
  }

  return { live, vod, series };
}
