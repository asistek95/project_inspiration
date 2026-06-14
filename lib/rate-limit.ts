/**
 * Sliding-Window Rate Limiter + Concurrency Semaphore
 *
 * Sliding Window: Präziser als Fixed Window — kein Request-Burst am Fensterende.
 * Semaphore:      Max N gleichzeitige AI-Aufrufe, analog zu ThreadPoolExecutor(max_workers=N).
 *                 Node.js-Event-Loop + libuv verteilen I/O-Requests auf alle CPU-Kerne —
 *                 für I/O-gebundene Aufgaben (HTTP zu Claude API) ist das optimal.
 */

// ── Sliding Window Rate Limiter ───────────────────────────────────────────────

const windows = new Map<string, number[]>();

function ensureCleanup() {
  if (typeof setInterval === "undefined") return;
  const interval = setInterval(() => {
    const cutoff = Date.now() - 300_000;
    for (const [key, timestamps] of windows) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) windows.delete(key);
      else windows.set(key, fresh);
    }
  }, 5 * 60 * 1000);
  // Node.js: Interval soll den Prozess nicht am Leben halten
  if (interval && typeof (interval as any).unref === "function") {
    (interval as any).unref();
  }
}

ensureCleanup();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Gibt { ok: true } wenn das Limit noch nicht erreicht ist,
 * sonst { ok: false, retryAfterMs } wie lange der Caller warten soll.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  const raw = windows.get(key) ?? [];
  const ts = raw.filter((t) => t > cutoff);

  if (ts.length >= limit) {
    const oldest = ts[0];
    return { ok: false, remaining: 0, retryAfterMs: windowMs - (now - oldest) };
  }

  ts.push(now);
  windows.set(key, ts);
  return { ok: true, remaining: limit - ts.length, retryAfterMs: 0 };
}

// ── Concurrency Semaphore ─────────────────────────────────────────────────────
// ThreadPoolExecutor(max_workers=6)-Äquivalent für Node.js.
// 6 = guter Default für moderne Laptops (4-8 Kerne) — via OCR_CONCURRENCY überschreibbar.

class Semaphore {
  private running = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly concurrency: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  get activeCount() {
    return this.running;
  }

  get pendingCount() {
    return this.queue.length;
  }

  private acquire(): Promise<void> {
    if (this.running < this.concurrency) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  private release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

const CONCURRENCY = parseInt(process.env.OCR_CONCURRENCY ?? "6", 10);
export const ocrSemaphore = new Semaphore(CONCURRENCY);

// ── Kombinierter Helper für API-Routen ───────────────────────────────────────

interface RunOptions {
  limit?: number;
  windowMs?: number;
}

export async function runWithRateLimit<T>(
  key: string,
  fn: () => Promise<T>,
  opts: RunOptions = {}
): Promise<{ result?: T; rateLimited?: RateLimitResult }> {
  const rl = checkRateLimit(key, opts.limit ?? 20, opts.windowMs ?? 60_000);
  if (!rl.ok) return { rateLimited: rl };
  const result = await ocrSemaphore.run(fn);
  return { result };
}
