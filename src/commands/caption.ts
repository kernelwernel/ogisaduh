import { Attachment, AttachmentBuilder, Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";
import { createCanvas, loadImage } from "canvas";

const FONT = "bold 40px sans-serif";
const PADDING = 15;
const LINE_HEIGHT = 48;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

function isImage(a: Attachment): boolean {
  if (a.contentType?.startsWith("image/")) return true;
  return IMAGE_EXT.test(a.name ?? "");
}

async function findImageUrl(message: Message): Promise<string | undefined> {
  const own = [...message.attachments.values()].find(isImage);
  if (own) return own.url;

  for (const snapshot of message.messageSnapshots.values()) {
    const fromSnapshot = [...snapshot.attachments.values()].find(isImage);
    if (fromSnapshot) return fromSnapshot.url;
  }

  if (message.reference?.messageId) {
    try {
      const replied = await message.channel.messages.fetch(message.reference.messageId);
      const fromReply = [...replied.attachments.values()].find(isImage);
      if (fromReply) return fromReply.url;

      const embedImage = replied.embeds.find(e => e.image || e.thumbnail);
      if (embedImage) return (embedImage.image ?? embedImage.thumbnail)!.url;
    } catch (err) {
      console.error("[caption] failed to fetch replied message", err);
    }
  }

  return undefined;
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const command: PrefixCommand = {
  name: "caption",
  async execute(message: Message, args: string[]) {
    const imageUrl = await findImageUrl(message);
    if (!imageUrl) {
      await message.reply("Attach an image (or reply to/forward one) to caption");
      return;
    }

    const text = args.join(" ").trim();
    if (!text) {
      await message.reply("Usage: `$caption <text>` (with an image attached)");
      return;
    }

    try {
      const res = await fetch(imageUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      const image = await loadImage(buf);

      const measureCanvas = createCanvas(1, 1);
      const measureCtx = measureCanvas.getContext("2d");
      measureCtx.font = FONT;
      const maxWidth = image.width - PADDING * 2;
      const lines = wrapText(measureCtx, text, maxWidth);

      const captionHeight = lines.length * LINE_HEIGHT + PADDING * 2;
      const canvas = createCanvas(image.width, image.height + captionHeight);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(image, 0, captionHeight);

      ctx.font = FONT;
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      lines.forEach((line, i) => {
        const y = PADDING + LINE_HEIGHT * i + LINE_HEIGHT / 2;
        ctx.fillText(line, canvas.width / 2, y);
      });

      const out = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "caption.png" });
      await (message.channel as TextChannel).send({ files: [out] });
    } catch (err: any) {
      console.error("[caption]", err);
      await message.reply(`Failed to caption image: ${err?.message ?? "unknown error"}`);
    }
  },
};

module.exports = command;
