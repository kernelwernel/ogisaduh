import { Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../../types";
import { getPrependMessage } from "../../utils/prependPrompt";
import { getServerContext } from "../../utils/serverContext";
import { getOptionalSecret } from "../../utils/secrets";
import { withRetry } from "../../utils/retry";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const MAX_MESSAGES = 500;
const FETCH_BATCH_SIZE = 100; // Discord's per-request fetch limit
const MAX_CONTENT_LENGTH = 500;
const MAX_REPLY_LENGTH = 1900;

function formatMessage(message: Message): string | null {
  const content = message.content.trim();
  if (!content) return null;
  const truncated = content.length > MAX_CONTENT_LENGTH
    ? content.slice(0, MAX_CONTENT_LENGTH) + "…"
    : content;
  return `${message.author.username}: ${truncated}`;
}

const command: PrefixCommand = {
  name: "summary",
  async execute(message: Message, args: string[]) {
    const count = parseInt(args[0], 10);
    if (!Number.isInteger(count) || count < 1 || count > MAX_MESSAGES) {
      await message.reply(`Usage: \`$summary <number>\` (1-${MAX_MESSAGES})`);
      return;
    }

    const apiKey = getOptionalSecret("deepseek_api_key", "DEEPSEEK_API_KEY");
    if (!apiKey) {
      await message.reply("DEEPSEEK_API_KEY is not configured.");
      return;
    }

    try {
      await (message.channel as TextChannel).sendTyping();

      const collected: Message[] = [];
      let before = message.id;
      while (collected.length < count) {
        const batchSize = Math.min(FETCH_BATCH_SIZE, count - collected.length);
        const fetched = await message.channel.messages.fetch({ limit: batchSize, before });
        if (fetched.size === 0) break;
        collected.push(...fetched.values());
        before = fetched.last()!.id;
        if (fetched.size < batchSize) break;
      }

      const lines = collected
        .reverse()
        .map(formatMessage)
        .filter((line): line is string => line !== null);

      if (lines.length === 0) {
        await message.reply("No text messages found to summarize.");
        return;
      }

      const transcript = lines.join("\n");

      const res = await withRetry(() => fetch(DEEPSEEK_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            ...(getServerContext() ? [{ role: "system", content: getServerContext() }] : []),
            ...(getPrependMessage() ? [{ role: "system", content: getPrependMessage() }] : []),
            {
              role: "system",
              content: "You summarize Discord chat logs concisely. Focus on the key points, decisions, and topics discussed. Keep the summary short and easy to skim.",
            },
            {
              role: "user",
              content: `Summarize the following chat log:\n\n${transcript}`,
            },
          ],
        }),
      }));

      if (res.status === 429) {
        throw new Error("The AI is rate-limited for the day. Try again later.");
      }
      if (!res.ok) {
        console.error("[summary] DeepSeek API error", res.status, await res.text());
        throw new Error("The AI service is unavailable right now.");
      }

      const data: any = await res.json();
      const summary = data?.choices?.[0]?.message?.content?.trim();
      if (!summary) {
        throw new Error("The AI returned an empty response.");
      }

      const reply = summary.length > MAX_REPLY_LENGTH
        ? summary.slice(0, MAX_REPLY_LENGTH) + "…"
        : summary;

      await message.reply(reply);
    } catch (err: any) {
      console.error("[summary]", err);
      await message.reply(`⚠️ Couldn't generate a summary: ${err?.message ?? "unknown error"}`);
    }
  },
};

module.exports = command;
