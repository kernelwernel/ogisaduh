import { Message } from "discord.js";
import { PrefixCommand } from "../types";
import { join } from "path";

const command: PrefixCommand = {
  name: "jews",
  async execute(message: Message) {
    await message.reply({ files: [join(__dirname, "..", "..", "assets", "jews.gif")] });
  },
};

module.exports = command;
