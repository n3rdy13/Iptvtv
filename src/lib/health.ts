import type { HealthCheckResult, HealthCheckSummary, HealthStatus } from './types';

export async function checkStreamHealth(
  url: string,
  name: string,
  streamId: string,
  timeoutMs = 8000,
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let status: HealthStatus = 'unknown';
  let httpStatus: number | undefined;

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    httpStatus = res.status;

    if (res.ok) {
      status = 'alive';
    } else if (res.status === 401 || res.status === 403) {
      status = 'expired';
    } else if (res.status === 404 || res.status === 410 || res.status === 451) {
      status = 'dead';
    } else if (res.status >= 500) {
      status = 'dead';
    } else {
      status = 'alive';
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      status = 'dead';
    } else {
      // Try a GET request with range header as fallback (some servers don't support HEAD)
      try {
        const res2 = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-1' },
          signal: controller.signal,
        });
        httpStatus = res2.status;
        if (res2.ok || res2.status === 206) {
          status = 'alive';
        } else if (res2.status === 401 || res2.status === 403) {
          status = 'expired';
        } else {
          status = 'dead';
        }
      } catch {
        status = 'dead';
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return {
    streamId,
    url,
    name,
    status,
    responseTime: Date.now() - startTime,
    checkedAt: Date.now(),
    httpStatus,
  };
}

export async function runHealthChecks(
  streams: { url: string; name: string; streamId: string }[],
  concurrency = 10,
  timeoutMs = 8000,
  onProgress?: (completed: number, total: number, result: HealthCheckResult) => void,
): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  let index = 0;
  let completed = 0;

  async function worker() {
    while (index < streams.length) {
      const currentIndex = index++;
      if (currentIndex >= streams.length) break;
      const stream = streams[currentIndex];
      const result = await checkStreamHealth(stream.url, stream.name, stream.streamId, timeoutMs);
      results.push(result);
      completed++;
      onProgress?.(completed, streams.length, result);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, streams.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

export function summarizeHealthResults(results: HealthCheckResult[]): HealthCheckSummary {
  const summary: HealthCheckSummary = {
    total: results.length,
    alive: 0,
    dead: 0,
    expired: 0,
    unknown: 0,
    checkedAt: Date.now(),
  };

  for (const r of results) {
    summary[r.status]++;
  }

  return summary;
}
