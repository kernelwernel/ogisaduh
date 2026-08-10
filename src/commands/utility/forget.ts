import { Message } from "discord.js";
import { PrefixCommand } from "../../types";
import { clearAllHistory } from "../../utils/chatHistory";

const command: PrefixCommand = {
  name: "forget",
  async execute(message: Message) {
    const cleared = clearAllHistory(message.channel.id);
    await message.reply(cleared ? "🧹 Forgot this channel's $prompt and $8ball history." : "There's no history to forget here.");
  },
};

module.exports = command;
