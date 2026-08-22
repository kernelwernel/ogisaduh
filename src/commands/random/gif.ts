import { Message } from "discord.js";
import { PrefixCommand } from "../../types";

const command: PrefixCommand = {
  name: "gif",
  async execute(message: Message) {
    await message.reply("🚧 `$gif` is under construction — fixing a bug with it. Back soon.");
  },
};

module.exports = command;
