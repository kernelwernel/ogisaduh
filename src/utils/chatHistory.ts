// In-memory per-channel, per-command chat history. Resets on restart.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Kept as message pairs (user + assistant), so this is 5 exchanges per command per channel.
const MAX_HISTORY_MESSAGES = 10;

const histories = new Map<string, ChatMessage[]>();

function key(command: string, channelId: string): string {
  return `${command}:${channelId}`;
}

export function getHistory(command: string, channelId: string): ChatMessage[] {
  return histories.get(key(command, channelId)) ?? [];
}

export function pushExchange(command: string, channelId: string, userContent: string, assistantContent: string): void {
  const k = key(command, channelId);
  const hist = histories.get(k) ?? [];
  hist.push({ role: "user", content: userContent }, { role: "assistant", content: assistantContent });
  while (hist.length > MAX_HISTORY_MESSAGES) hist.shift();
  histories.set(k, hist);
}

/** Clears history for a specific command in a channel. Returns true if there was anything to clear. */
export function clearHistory(command: string, channelId: string): boolean {
  return histories.delete(key(command, channelId));
}

/** Clears history for every command in a channel (e.g. $forget). Returns true if anything was cleared. */
export function clearAllHistory(channelId: string): boolean {
  let cleared = false;
  for (const k of histories.keys()) {
    if (k.endsWith(`:${channelId}`)) {
      histories.delete(k);
      cleared = true;
    }
  }
  return cleared;
}
