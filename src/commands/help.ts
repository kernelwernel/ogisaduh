import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "help",
  async execute(message: Message) {
    const embed = new EmbedBuilder()
      .setTitle("Commands")
      .setDescription(
        [
          "`$ping`: check bot latency",
          "`$status <text>`: change bot status",
          "`$send <message>`: DM ogisada a message",
          "`$gif`: send a random ogisada gif",

          "`$snipe [number]`: snipe the last deleted message",
          "`$editsnipe [number]`: snipe the last edited message",
          "`$uptime`: show bot uptime",
          "`$news`: generate a fake celebrity VMaware article",
          "`$restart`: restart the bot",
          "`$shutdown`: shut down the bot (owner only)",
          "`$help`: show this message",
        ].join("\n")
      )
      .setColor(0x5865f2);
    await (message.channel as TextChannel).send({ embeds: [embed] });
  },
};

module.exports = command;
