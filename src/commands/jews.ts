import { Message } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "jews",
  async execute(message: Message) {
    await message.reply("https://media.discordapp.net/attachments/1337901418664824903/1519242718520414288/jews.gif?ex=6a3cd88a&is=6a3b870a&hm=e6421fda26add74f23909257b70b3f3308694ca36f3096d21a048fe2348022e3&=&width=664&height=376");
  },
};

module.exports = command;
