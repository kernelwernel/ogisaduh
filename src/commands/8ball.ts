import { Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
const MAX_REPLY_LENGTH = 300;

const command: PrefixCommand = {
  name: "8ball",
  async execute(message: Message, args: string[]) {
    const question = args.join(" ").trim();
    if (!question) {
      await message.reply("Usage: `$8ball <question>`");
      return;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      await message.reply("OPENROUTER_API_KEY is not configured.");
      return;
    }

    try {
      await (message.channel as TextChannel).sendTyping();

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
              content: "You are a Magic 8-Ball. Reply to the user's yes/no question with a single short, punchy, snarky/cryptic fortune-telling answer (like a classic 8-ball, e.g. 'It is certain', 'Outlook not so good', 'Ask again later') but with more attitude and humor. One sentence max, no explanations, no quotation marks. Additionally, you should add degenerate and dark humour to the mix. CONTEXT: ud = undetected, ogisada is a spam journalist who writes AC news that are essentially worthless and used as the butt of jokes, vmaware is a tool for detecting virtual machines, kernel is the creator of that tool, autovirt is a hardening tool for VMs, null is the person who made that tool. the server's whole goal is to bypass vmaware and cheat in multipler games",
            },
            {
              role: "user",
              content: question,
            },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenRouter API error ${res.status}: ${text}`);
      }

      const data: any = await res.json();
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (!answer) {
        throw new Error("Empty response from model.");
      }

      const reply = answer.length > MAX_REPLY_LENGTH
        ? answer.slice(0, MAX_REPLY_LENGTH) + "…"
        : answer;

      await message.reply(`🎱 ${reply}`);
    } catch (err: any) {
      console.error("[8ball]", err);
      await message.reply(`Failed to consult the 8-ball: ${err?.message ?? "unknown error"}`);
    }
  },
};

module.exports = command;
