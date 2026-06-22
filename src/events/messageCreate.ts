import { Events, Message } from "discord.js";
import { BotClient } from "../types";
import { readdirSync } from "fs";
import { join } from "path";

const PREFIX = process.env.PREFIX!;
const OGISADA_USER_ID = process.env.TARGET_USER_ID!;

const GIFS_DIR = join(__dirname, "..", "..", "assets");
const GIFS = ["attachment.gif", "attachment2.gif", "attachment3.gif", "attachment4.gif"].map(f => join(GIFS_DIR, f));

function randomGif(): string {
  return GIFS[Math.floor(Math.random() * GIFS.length)];
}
const URL_REGEX = /https?:\/\/[^\s]+/;
const MEDIA_DIR = join(__dirname, "..", "..", "reaction_media");
const MEDIA_COOLDOWN_TRIGGERS = 15;
const recentlyUsed = new Map<string, number>();
let triggerCount = 0;

function randomMedia(): string {
  triggerCount++;
  const files = readdirSync(MEDIA_DIR).filter(f => {
    const lastTrigger = recentlyUsed.get(f);
    return lastTrigger === undefined || triggerCount - lastTrigger >= MEDIA_COOLDOWN_TRIGGERS;
  });
  const pool = files.length > 0 ? files : readdirSync(MEDIA_DIR);
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  recentlyUsed.set(chosen, triggerCount);
  return join(MEDIA_DIR, chosen);
}

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message, client: BotClient) {
    if (message.author.bot) return;

    if (message.channel.isDMBased()) {
      console.log(`[${new Date().toLocaleTimeString()}] ${message.author.tag}: ${message.content}`);
    }

    if (message.author.id === OGISADA_USER_ID && URL_REGEX.test(message.content)) {
      try {
        await message.author.send({ files: [randomGif()] });
        await message.reply({ files: [randomMedia()] });
      } catch {}
    }

    if (!message.content.startsWith(PREFIX)) return;
    const [commandName, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = client.prefixCommands.get(commandName.toLowerCase());
    if (!command) return;
    console.log(`[${new Date().toLocaleTimeString()}] ${message.author.tag} ran: ${message.content}`);
    try {
      await command.execute(message, args);
    } catch (err) {
      console.error(err);
    }
  },
};
