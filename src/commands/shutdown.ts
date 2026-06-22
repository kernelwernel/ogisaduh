import { Message, TextChannel, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "shutdown",
  async execute(message: Message) {
    if (message.author.id !== process.env.OWNER_ID) {
      await (message.channel as TextChannel).send("no");
      return;
    }

    await (message.channel as TextChannel).send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔴 Shutdown")
          .setDescription("```> Shutting down...```")
          .setColor(0xff3333),
      ],
    });

    process.exit(0);
  },
};

module.exports = command;
