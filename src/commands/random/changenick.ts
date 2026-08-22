import { Message } from "discord.js";
import { PrefixCommand } from "../../types";

const command: PrefixCommand = {
  name: "changenick",
  async execute(message: Message, args: string[]) {
    if (!message.guild) {
      await message.reply("This command only works in a server.");
      return;
    }

    const nickname = args.join(" ").trim();
    if (!nickname) {
      await message.reply("Usage: `$changenick <new nickname>`");
      return;
    }
    if (nickname.length > 32) {
      await message.reply("⚠️ Nicknames can't be longer than 32 characters.");
      return;
    }

    const ogisadaId = process.env.OGISADA_ID;
    if (!ogisadaId) {
      await message.reply("⚠️ OGISADA_ID is not configured.");
      return;
    }

    try {
      const member = await message.guild.members.fetch(ogisadaId);
      await member.setNickname(nickname);
      await message.react("✅");
    } catch (err: any) {
      console.error("[changenick]", err);
      await message.reply(`Failed to change nickname: ${err?.rawError?.message ?? err?.message ?? "unknown error"}`);
    }
  },
};

module.exports = command;
