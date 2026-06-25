import { Message } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "setprofile",
  async execute(message: Message) {
    const attachment = [...message.attachments.values()].find(a =>
      a.contentType?.startsWith("image/") ?? false
    );
    if (!attachment) {
      await message.reply("Attach an image to set as the bot's avatar");
      return;
    }

    try {
      const res = await fetch(attachment.url);
      const buf = Buffer.from(await res.arrayBuffer());
      await message.client.user.setAvatar(buf);
      await message.react("✅");
    } catch (err: any) {
      console.error("[setprofile]", err);
      await message.reply(`Failed to set avatar: ${err?.rawError?.message ?? "unknown error"}`);
    }
  },
};

module.exports = command;
