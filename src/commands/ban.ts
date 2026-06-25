import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../types";
import { ban, unban } from "../utils/banlist";

const command: PrefixCommand = {
  name: "ban",
  async execute(message: Message, args: string[]) {
    if (message.author.id !== process.env.OWNER_ID) return;

    const [subcommand] = args;
    const target = message.mentions.users.first()?.id ?? args[1];

    if (!target || !["add", "remove"].includes(subcommand)) {
      await message.reply("Usage: `$ban <add|remove> <@user|id>`");
      return;
    }

    if (subcommand === "add") {
      const banned = ban(target);
      await message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(banned ? "🔨 User Banned" : "⚠️ Already Banned")
          .setDescription(banned ? `<@${target}> is now banned from using the bot.` : `<@${target}> is already banned.`)
          .setColor(banned ? 0xff3333 : 0xff9900)],
      });
    } else {
      const unbanned = unban(target);
      await message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(unbanned ? "✅ User Unbanned" : "⚠️ Not Banned")
          .setDescription(unbanned ? `<@${target}> is no longer banned.` : `<@${target}> is not banned.`)
          .setColor(unbanned ? 0x57f287 : 0xff9900)],
      });
    }
  },
};

module.exports = command;
