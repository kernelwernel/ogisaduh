import { Message } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "send",
  async execute(message: Message, args: string[]) {
    if (!args.length) {
      await message.reply("Usage: `$send <message>`");
      return;
    }
    try {
      const target = await message.client.users.fetch(process.env.TARGET_USER_ID!);
      await target.send(args.join(" "));
      await message.react("✅");
    } catch (err) {
      console.error("[send] Failed to send message:", err);
      try { await message.reply("Failed to send message."); } catch {}
    }
  },
};

module.exports = command;
