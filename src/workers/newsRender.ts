import { workerData, parentPort } from "worker_threads";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import sharp from "sharp";
import { readdirSync } from "fs";
import { join } from "path";

interface WorkerInput {
  headline: string;
  celebBuffer: Buffer;
  topicImagesDir: string;
  profileImgPath: string;
  topicBuffer?: Buffer;
}

const TOPIC_KEYWORDS = [
  "VMAWARE", "QEMU", "BATTLEYE", "VANGUARD", "FACEIT",
  "RICOCHET", "VAC", "VALORANT", "ROBLOX",
  "EAC", "HWID", "AUTOVIRT", "SMBIOS", "NVRAM", "MHYPROT",
];

function resolveTopicImage(headline: string, topicImagesDir: string): string | null {
  const upper = headline.toUpperCase();
  let files: string[];
  try { files = readdirSync(topicImagesDir); } catch { return null; }
  for (const keyword of TOPIC_KEYWORDS) {
    if (!upper.includes(keyword)) continue;
    const match = files.find(f =>
      f.toLowerCase().startsWith(keyword.toLowerCase() + ".") ||
      f.toLowerCase() === keyword.toLowerCase()
    );
    if (match) return join(topicImagesDir, match);
  }
  return null;
}

const stripMarkers = (word: string) => word.replace(/[{}]/g, "");
const isRed = (word: string) => word.startsWith("{") && word.endsWith("}");

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const clean = stripMarkers(word);
    const testClean = line ? `${stripMarkers(line)} ${clean}` : clean;
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(testClean).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function render(): Promise<Buffer> {
  const { headline, celebBuffer, topicImagesDir, profileImgPath, topicBuffer }: WorkerInput = workerData;

  const celeb = await loadImage(Buffer.from(celebBuffer));

  const W = 1080;
  const photoH = 648;
  const badgePadding = 28, badgeH = 36, headlinePadTop = 54, lineH = 66;
  const H = 1200;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, W, H);

  const topicImagePath = topicBuffer ? null : resolveTopicImage(headline, topicImagesDir);

  if (topicImagePath || topicBuffer) {
    ctx.save();
    ctx.rect(0, 0, Math.floor(W * 0.50), photoH);
    ctx.clip();
    const scale = Math.max((W * 0.50) / celeb.width, photoH / celeb.height);
    const cx = (W * 0.50 - celeb.width * scale) / 2;
    const cy = (photoH - celeb.height * scale) / 2;
    ctx.drawImage(celeb, cx, cy, celeb.width * scale, celeb.height * scale);
    ctx.restore();

    const panelX = Math.floor(W * 0.50) + 10;
    const panelY = 10;
    const panelW = W - panelX - 10;
    const panelH = photoH - 20;
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    const topicImgBuf = topicBuffer
      ? await sharp(Buffer.from(topicBuffer)).png().toBuffer()
      : await sharp(topicImagePath!).png().toBuffer();
    const topicImg = await loadImage(topicImgBuf);
    const tScale = panelW / topicImg.width;
    const tW = topicImg.width * tScale;
    const tH = topicImg.height * tScale;
    const tX = panelX + (panelW - tW) / 2;
    const tY = panelY + (panelH - tH) / 2;
    ctx.drawImage(topicImg, tX, tY, tW, tH);

    const blendW = 120;
    const blendX = Math.floor(W * 0.50) - blendW;
    const hGrad = ctx.createLinearGradient(blendX, 0, blendX + blendW, 0);
    hGrad.addColorStop(0, "rgba(13,13,13,0)");
    hGrad.addColorStop(1, "rgba(13,13,13,1)");
    ctx.fillStyle = hGrad;
    ctx.fillRect(blendX, 0, blendW, photoH);
  } else {
    ctx.save();
    ctx.rect(0, 0, W, photoH);
    ctx.clip();
    const scale = Math.max(W / celeb.width, photoH / celeb.height);
    const cx = (W - celeb.width * scale) / 2;
    const cy = (photoH - celeb.height * scale) / 2;
    ctx.drawImage(celeb, cx, cy, celeb.width * scale, celeb.height * scale);
    ctx.restore();
  }

  const barY = photoH;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, barY, W, H - barY);

  const gradientH = 350;
  const grad = ctx.createLinearGradient(0, barY - gradientH, 0, barY);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, barY - gradientH, W, gradientH);

  const badgeX = 28, badgeY = barY + badgePadding;
  const badgeW = 110;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
  ctx.fillStyle = "#000000";
  ctx.font = "bold 20px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("NEWS", badgeX + 14, badgeY + badgeH / 2);
  ctx.textBaseline = "alphabetic";

  ctx.font = "bold 56px sans-serif";
  const lines = wrapText(ctx, headline, W - 56);

  let headlineY = badgeY + badgeH + headlinePadTop;
  for (const line of lines) {
    let x = 28;
    const words = line.split(" ");
    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      const clean = stripMarkers(word);
      const token = w < words.length - 1 ? clean + " " : clean;
      ctx.fillStyle = isRed(word) ? "#ff2222" : "#ffffff";
      ctx.fillText(token, x, headlineY);
      x += ctx.measureText(token).width;
    }
    headlineY += lineH;
  }

  try {
    const profileBuf = await sharp(profileImgPath).png().toBuffer();
    const profileImg = await loadImage(profileBuf);
    const wmSize = 80;
    const wmX = 18, wmY = 18;
    ctx.save();
    ctx.beginPath();
    ctx.arc(wmX + wmSize / 2, wmY + wmSize / 2, wmSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileImg, wmX, wmY, wmSize, wmSize);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(wmX + wmSize / 2, wmY + wmSize / 2, wmSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.stroke();
  } catch { /* skip watermark if unavailable */ }

  const cropH = Math.ceil(headlineY - lineH + 40);
  return sharp(canvas.toBuffer("image/png"))
    .extract({ left: 0, top: 0, width: W, height: cropH })
    .toBuffer();
}

render()
  .then(buf => parentPort!.postMessage({ buf }))
  .catch(err => {
    console.error("[newsRender worker]", err);
    parentPort!.postMessage({ error: String(err) });
  });
