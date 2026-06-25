import { Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";
import { join } from "path";

const GIFS = ["attachment.gif", "attachment2.gif", "attachment3.gif", "attachment4.gif", "pfp.jpg"].map(f =>
  join(__dirname, "..", "..", "assets", f)
);

let gifPool: string[] = [];

function pickGif(): string {
  if (gifPool.length === 0) {
    gifPool = [...GIFS].sort(() => Math.random() - 0.5);
  }
  return gifPool.pop()!;
}

const command: PrefixCommand = {
  name: "gif",
  async execute(message: Message) {
    await (message.channel as TextChannel).send({ files: [pickGif()] });
  },
};

module.exports = command;
