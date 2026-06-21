import { Message, ActivityType, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "status",
  async execute(message: Message, args: string[]) {
    const text = args.join(" ");
    if (!text) {
      await (message.channel as TextChannel).send("Usage: `$status <text>`");
      return;
    }
    message.client.user?.setActivity(text, { type: ActivityType.Custom });
    await (message.channel as TextChannel).send(`Status updated to: **${text}**`);
  },
};

module.exports = command;
