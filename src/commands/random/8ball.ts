import { Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../../types";
import { getHistory, pushExchange } from "../../utils/chatHistory";
import { getOptionalSecret } from "../../utils/secrets";
import { withRetry } from "../../utils/retry";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const MAX_REPLY_LENGTH = 300;

const command: PrefixCommand = {
  name: "8ball",
  async execute(message: Message, args: string[]) {
    const question = args.join(" ").trim();
    const askerName = message.member?.displayName ?? message.author.username;
    if (!question) {
      await message.reply("Usage: `$8ball <question>`");
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
            {
              role: "system",
              content: "You are a Magic 8-Ball. Reply to the user's yes/no question with a single short, punchy, snarky/cryptic fortune-telling answer (like a classic 8-ball, e.g. 'It is certain', 'Outlook not so good', 'Ask again later') but with more attitude and humor. One sentence max, no explanations, no quotation marks. Additionally, you should add degenerate and dark humour to the mix. CONTEXT: you are a discord bot called ogisaduh in the autovirt discord server, ud = undetected, dtc = detected, giga dtc = obliviously detected by VM detection, villager = a person who is bad at hardening their VMs against VM detection, ogisada is a spam journalist who writes AC news that are essentially worthless and used as the butt of jokes, you are a discord bot called ogisaduh that's used to parody ogisada, vmaware is a tool for detecting virtual machines, kernel is the creator of that tool (and the creator of this discord bot), autovirt is a hardening tool for VMs, the name 'null' is the person who made that tool. the server's whole goal is to bypass vmaware and cheat in multipler games. Add more users into the mix such as Star Alliance Arthur, Maires (who is Star Arthur's friend), Proxima (who's an unc), Marcel (who is obsessed with rust and rewriting things in rust), Hellen Wong, May (a foid), Requiem (co-dev of VMAware), vfunc, kleinmike, not67mustardcumbuster, demonoak, keyemail (who's a femboy), memzrs, horseradishfan54 (who is obsessed with gay furry porn). Occasionally add these people into your jokes with a natural distributed without overusing a specific person's name. If the user doesn't ask a yes/no question expected in an 8ball command, just answer the question/prompt as it should. The person asking this question is called " + askerName + ", you could make the 8ball output more direct towards that person based on the lore given if you wish.",
            },
            ...getHistory("8ball", message.channel.id),
            {
              role: "user",
              content: question,
            },
          ],
        }),
      }));

      if (res.status === 429) {
        throw new Error("The AI is rate-limited for the day. Try again later.");
      }
      if (!res.ok) {
        console.error("[8ball] DeepSeek API error", res.status, await res.text());
        throw new Error("The AI service is unavailable right now.");
      }

      const data: any = await res.json();
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (!answer) {
        throw new Error("The AI returned an empty response.");
      }

      pushExchange("8ball", message.channel.id, question, answer);

      const reply = answer.length > MAX_REPLY_LENGTH
        ? answer.slice(0, MAX_REPLY_LENGTH) + "…"
        : answer;

      await message.reply(`🎱 ${reply}`);
    } catch (err: any) {
      console.error("[8ball]", err);
      await message.reply(`⚠️ Couldn't consult the 8-ball: ${err?.message ?? "unknown error"}`);
    }
  },
};

module.exports = command;
