import { Message, TextChannel, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../types";
import { execFile } from "child_process";
import { readFileSync } from "fs";

const MAX_OUTPUT = 1900;
const TIMEOUT_MS = 15_000;

const TOKEN: string = (() => {
  try { return readFileSync("/run/secrets/discord_token", "utf8").trim(); } catch {}
  return process.env.TOKEN ?? "";
})();

async function tokenLeakShutdown(message: Message) {
  await (message.channel as TextChannel).send({
    embeds: [
      new EmbedBuilder()
        .setTitle("⚠️ Token Leak Detected")
        .setDescription("Bot token was detected in eval output. Shutting down immediately.\nRotate the token at discord.com/developers/applications.")
        .setColor(0xff0000),
    ],
  });
  process.exit(1);
}

const command: PrefixCommand = {
  name: "eval",
  async execute(message: Message, args: string[]) {
    if (!args.length) {
      await message.reply("Usage: `$eval <command>`");
      return;
    }

    const cmd = args.join(" ");
    const thinking = await message.reply(`\`${cmd}\``);

    const output = await new Promise<string>((resolve) => {
      execFile("su", ["-s", "/bin/sh", "nobody", "-c", cmd], { timeout: TIMEOUT_MS }, (err, stdout, stderr) => {
        const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
        if (!combined) return resolve(err ? `error: ${err.message}` : "(no output)");
        resolve(combined);
      });
    });

    if (TOKEN && output.includes(TOKEN)) {
      await thinking.edit("⚠️ Token leak detected — shutting down.");
      await tokenLeakShutdown(message);
      return;
    }

    const truncated = output.length > MAX_OUTPUT
      ? output.slice(0, MAX_OUTPUT) + "\n... (truncated)"
      : output;

    await thinking.edit(`\`${cmd}\`\n\`\`\`\n${truncated}\n\`\`\``);
  },
};

module.exports = command;
