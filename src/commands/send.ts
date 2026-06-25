import { Message } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "send",
  async execute(message: Message, args: string[]) {
    const [target, ...rest] = args;
    if (!target || !rest.length) {
      await message.reply("Usage: `$send <@user|id> <message>`");
      return;
    }

    const userId = message.mentions.users.first()?.id
      ?? (target.match(/^\d{17,20}$/) ? target : null);

    if (!userId) {
      await message.reply("Usage: `$send <@user|id> <message>`");
      return;
    }

    const text = rest.join(" ");

    try {
      const user = await message.client.users.fetch(userId);
      await user.send(text);
      await message.react("✅");
    } catch (err) {
      console.error("[send] Failed to send message:", err);
      try { await message.reply("Failed to send message."); } catch {}
    }
  },
};

module.exports = command;
