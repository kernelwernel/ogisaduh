import { Events, Message, PartialMessage } from "discord.js";
import { snipes, snipeHistory, SnipeEntry } from "../snipeStore";

module.exports = {
  name: Events.MessageDelete,
  once: false,
  async execute(message: Message | PartialMessage) {
    if (message.partial || message.author?.bot) return;
    if (!message.content && !message.attachments.size) return;

    const entry: SnipeEntry = {
      authorTag: message.author!.tag,
      authorAvatar: message.author!.displayAvatarURL({ size: 256 }),
      content: message.content ?? "",
      image: message.attachments.first()?.proxyURL ?? null,
      createdAt: message.createdTimestamp,
    };

    snipes[message.channelId] = entry;
    snipeHistory.unshift(entry);
  },
};
