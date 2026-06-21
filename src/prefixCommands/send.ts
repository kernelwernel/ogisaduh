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
      const target = await message.client.users.fetch("550095505347051546");
      await target.send(args.join(" "));
      await message.react("✅");
    } catch (err) {
      console.error("[send] Failed to send message:", err);
      await message.reply("Failed to send message.");
    }
  },
};

module.exports = command;
