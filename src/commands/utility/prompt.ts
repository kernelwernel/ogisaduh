import { Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../../types";
import { getPrependMessage } from "../../utils/prependPrompt";
import { getServerContext } from "../../utils/serverContext";
import { getHistory, pushExchange } from "../../utils/chatHistory";
import { getOptionalSecret } from "../../utils/secrets";
import { withRetry } from "../../utils/retry";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const MAX_REPLY_LENGTH = 1900;

// Discord supports **bold**, *italic*, ~~strikethrough~~, `code`, ```blocks```,
// > blockquotes and - bullets natively, but not GFM headers/tables/hr rules.
// Strip those out so replies don't look like a dumped markdown file.
function sanitizeForDiscord(text: string): string {
  return text
    .replace(/^ {0,3}#{1,6}\s+(.*)$/gm, "**$1**") // # Heading -> **Heading**
    .replace(/^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "") // --- / *** / ___ hr rules
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const command: PrefixCommand = {
  name: "prompt",
  async execute(message: Message, args: string[]) {
    const prompt = args.join(" ").trim();
    if (!prompt) {
      await message.reply("Usage: `$prompt <text>`");
      return;
    }

    const apiKey = getOptionalSecret("deepseek_api_key", "DEEPSEEK_API_KEY");
    if (!apiKey) {
      await message.reply("DEEPSEEK_API_KEY is not configured.");
      return;
    }

    try {
      await (message.channel as TextChannel).sendTyping();

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
              content: "You are a helpful assistant replying in a Discord chat. Keep responses concise and easy to skim. Format using Discord's markdown only: **bold**, *italic*, ~~strikethrough~~, `inline code`, ```code blocks```, > blockquotes, and - bullet points. Do not use headers (#), tables, or horizontal rules (---) since Discord doesn't render them.",
            },
            ...getHistory("prompt", message.channel.id),
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }));

      if (res.status === 429) {
        throw new Error("The AI is rate-limited for the day. Try again later.");
      }
      if (!res.ok) {
        console.error("[prompt] DeepSeek API error", res.status, await res.text());
        throw new Error("The AI service is unavailable right now.");
      }

      const data: any = await res.json();
      const raw = data?.choices?.[0]?.message?.content?.trim();
      if (!raw) {
        throw new Error("The AI returned an empty response.");
      }

      pushExchange("prompt", message.channel.id, prompt, raw);

      const output = sanitizeForDiscord(raw);
      const reply = output.length > MAX_REPLY_LENGTH
        ? output.slice(0, MAX_REPLY_LENGTH) + "…"
        : output;

      await message.reply(reply);
    } catch (err: any) {
      console.error("[prompt]", err);
      await message.reply(`⚠️ Couldn't get a response: ${err?.message ?? "unknown error"}`);
    }
  },
};

module.exports = command;
