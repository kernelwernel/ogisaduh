import { readFileSync } from "fs";

/**
 * Reads a Docker/Compose secret from /run/secrets/<name>, falling back to an env var.
 * Prefer secrets for anything sensitive — env vars end up in `.env`, shell history,
 * process listings, etc., all of which are far easier to leak than a mounted secret file.
 */
export function getSecret(name: string, envFallback?: string): string {
  try {
    return readFileSync(`/run/secrets/${name}`, "utf8").trim();
  } catch {
    const val = envFallback ? process.env[envFallback] : undefined;
    if (!val) throw new Error(`Secret "${name}" not found: no secrets file and env var "${envFallback}" is unset`);
    return val;
  }
}

/** Same as {@link getSecret}, but returns undefined instead of throwing when the secret is missing. */
export function getOptionalSecret(name: string, envFallback?: string): string | undefined {
  try {
    return getSecret(name, envFallback);
  } catch {
    return undefined;
  }
}
