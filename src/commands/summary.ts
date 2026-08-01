import { Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
const MAX_MESSAGES = 100;
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

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      await message.reply("OPENROUTER_API_KEY is not configured.");
      return;
    }

    try {
      await (message.channel as TextChannel).sendTyping();

      const fetched = await message.channel.messages.fetch({ limit: count, before: message.id });
      const lines = [...fetched.values()]
        .reverse()
        .map(formatMessage)
        .filter((line): line is string => line !== null);

      if (lines.length === 0) {
        await message.reply("No text messages found to summarize.");
        return;
      }

      const transcript = lines.join("\n");

      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
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
      });

      if (res.status === 429) {
        throw new Error("The AI is rate-limited for the day. Try again later.");
      }
      if (!res.ok) {
        console.error("[summary] OpenRouter API error", res.status, await res.text());
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
