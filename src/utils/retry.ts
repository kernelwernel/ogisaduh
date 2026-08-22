// Transient network hiccups (a reset connection, a REST request that timed out) shouldn't
// sink an entire command — especially file uploads, which spend the longest in flight and
// are the most exposed to a flaky connection. Retry those a couple of times before giving up.
const RETRYABLE_CODES = new Set([
  "ECONNRESET", "ETIMEDOUT", "ECONNABORTED", "EPIPE",
  // undici (Node's built-in fetch) socket/timeout errors.
  "UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT",
]);

function codeOf(err: unknown): string | undefined {
  return (err as { code?: string } | undefined)?.code;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") return true;
  // fetch() wraps the real network error in a `TypeError: fetch failed`, with the actual
  // undici error (and its .code) sitting on .cause — check both.
  const code = codeOf(err) ?? codeOf((err as { cause?: unknown } | undefined)?.cause);
  return !!code && RETRYABLE_CODES.has(code);
}

/**
 * Retries `fn` on transient network errors (ECONNRESET, timeouts, aborts). Rethrows on the
 * last attempt. Backs off exponentially (500ms, 1s, 2s, 4s, ...) — this environment's network
 * resets aren't always a quick blip, so a longer window gives a real chance of riding it out.
 */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 5, baseDelayMs = 500): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= attempts || !isRetryable(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
}
