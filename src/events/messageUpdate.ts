import { Events, Message, PartialMessage } from "discord.js";
import { editSnipes, editSnipeHistory, EditSnipeEntry } from "../snipeStore";

module.exports = {
  name: Events.MessageUpdate,
  once: false,
  async execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
    if (oldMessage.partial || oldMessage.author?.bot) return;
    if (!oldMessage.content || oldMessage.content === newMessage.content) return;

    const entry: EditSnipeEntry = {
      authorTag: oldMessage.author!.tag,
      authorAvatar: oldMessage.author!.displayAvatarURL({ size: 256 }),
      oldContent: oldMessage.content,
      newContent: newMessage.content ?? "",
    };

    editSnipes[oldMessage.channelId] = entry;
    editSnipeHistory.unshift(entry);
  },
};
