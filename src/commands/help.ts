import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "help",
  async execute(message: Message) {
    const embed = new EmbedBuilder()
      .setTitle("Commands")
      .setDescription(
        [
          "**General**",
          "`$ping`: check bot latency",
          "`$uptime`: show bot uptime",
          "`$help`: show this message",
          "",
          "**Random**",
          "`$gif`: send a random ogisada gif",
          "`$jews`: ✡️",
          "`$news [headline] [image(s)]`: generate real news (better than ogisada)",
          "`$status <text>`: change bot status",
          "`$setprofile`: set the bot's avatar (attach image)",
          "",
          "**Utility**",
          "`$eval <command>`: run a linux shell command in the bot container",
          "`$snipe [number]`: snipe the last deleted message",
          "`$editsnipe [number]`: snipe the last edited message",
          "`$send <@user|id> <message>`: DM a user",
          "`$restart`: restart the bot",
          "",
          "**Owner only**",
          "`$shutdown`: shut down the bot",
        ].join("\n")
      )
      .setColor(0x5865f2);
    await (message.channel as TextChannel).send({ embeds: [embed] });
  },
};

module.exports = command;