import { Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";
import { join } from "path";

const GIFS = ["attachment.gif", "attachment2.gif", "attachment3.gif", "attachment4.gif"].map(f =>
  join(__dirname, "..", "..", "assets", f)
);

const command: PrefixCommand = {
  name: "gif",
  async execute(message: Message) {
    const gif = GIFS[Math.floor(Math.random() * GIFS.length)];
    await (message.channel as TextChannel).send({ files: [gif] });
  },
};

module.exports = command;
