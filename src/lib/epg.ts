import { XMLParser } from 'fast-xml-parser';
import type { EpgData, EpgChannel, EpgProgram } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  trimValues: true,
  isArray: (nodeName) => nodeName === 'programme' || nodeName === 'channel',
});

export function parseEpgXml(xml: string): EpgData {
  const parsed = parser.parse(xml);
  const channels = new Map<string, EpgChannel>();

  const tvData = parsed.tv;
  if (!tvData) return { channels, generatedAt: Date.now() };

  // Parse channels
  const channelList = tvData.channel || [];
  for (const ch of channelList) {
    const id = ch['@_id'];
    if (!id) continue;
    const displayName = ch['display-name']?.['#text'] || ch['display-name'] || id;
    channels.set(id, {
      id,
      displayName: typeof displayName === 'string' ? displayName : id,
      programs: [],
    });
  }

  // Parse programmes
  const programmeList = tvData.programme || [];
  for (const prog of programmeList) {
    const channelId = prog['@_channel'];
    if (!channelId) continue;

    const channel = channels.get(channelId);
    if (!channel) continue;

    const startStr = prog['@_start'];
    const stopStr = prog['@_stop'];
    const start = parseXmlTvTime(startStr);
    const stop = parseXmlTvTime(stopStr);

    const title = getTextValue(prog.title);
    const desc = getTextValue(prog.desc);
    const category = getTextValue(prog.category);

    const program: EpgProgram = {
      start,
      stop,
      title: title || 'No title',
      desc: desc || '',
      category: category || '',
      id: `${channelId}_${start}`,
      channel: channelId,
    };

    channel.programs.push(program);
  }

  // Sort programs by start time
  for (const channel of channels.values()) {
    channel.programs.sort((a, b) => a.start - b.start);
  }

  return { channels, generatedAt: Date.now() };
}

function getTextValue(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node['#text']) return node['#text'];
  return '';
}

function parseXmlTvTime(timeStr: string): number {
  if (!timeStr) return 0;
  // XMLTV format: 20240101120000 +0000 or 20240101120000Z
  const match = timeStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4}|Z)?$/);
  if (!match) return 0;

  const [, year, month, day, hour, min, sec, tz] = match;
  const date = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(min),
    parseInt(sec),
  ));

  if (tz && tz !== 'Z') {
    const tzSign = tz[0];
    const tzHours = parseInt(tz.substring(1, 3));
    const tzMins = parseInt(tz.substring(3, 5));
    const offset = (tzHours * 60 + tzMins) * 60000;
    if (tzSign === '+') {
      return date.getTime() - offset;
    } else {
      return date.getTime() + offset;
    }
  }

  return date.getTime();
}

export function getCurrentProgram(channel: EpgChannel, now = Date.now()): EpgProgram | null {
  for (const prog of channel.programs) {
    if (prog.start <= now && prog.stop > now) {
      return prog;
    }
  }
  return null;
}

export function getNextProgram(channel: EpgChannel, now = Date.now()): EpgProgram | null {
  for (const prog of channel.programs) {
    if (prog.start > now) {
      return prog;
    }
  }
  return null;
}

export async function fetchEpg(url: string): Promise<EpgData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseEpgXml(xml);
  } finally {
    clearTimeout(timeout);
  }
}
