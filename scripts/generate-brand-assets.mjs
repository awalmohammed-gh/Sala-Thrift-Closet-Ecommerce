import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Keep the supplied logo unchanged; derive only web-sized and app-icon copies.
const app = path.resolve("apps/web");
const brand = path.join(app, "public/images/brand");
const icons = path.join(app, "public/icons");
const source = await fs.readFile(path.join(brand, "salasty-logo-source.png"));
await fs.mkdir(icons, { recursive: true });
await sharp(source).resize({ width: 768, withoutEnlargement: true }).webp({ quality: 92 }).toFile(path.join(brand, "salasty-logo.webp"));

async function appIcon(size, admin) {
  const inset = admin ? Math.round(size * 0.08) : 0;
  const logo = await sharp(source).resize(size - inset * 2, size - inset * 2, { fit: "contain", background: "#f5eee4" }).flatten({ background: "#f5eee4" }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background: admin ? "#0f2457" : "#f5eee4" } })
    .composite([{ input: logo, gravity: "centre" }]).removeAlpha().png().toBuffer();
}
for (const admin of [false, true]) {
  const label = admin ? "admin" : "store";
  for (const size of [192, 512]) await fs.writeFile(path.join(icons, `${label}-${size}x${size}.png`), await appIcon(size, admin));
  await fs.writeFile(path.join(icons, `${label}-apple-icon-180.png`), await appIcon(180, admin));
}
await fs.writeFile(path.join(app, "src/app/icon.png"), await appIcon(512, false));
const images = await Promise.all([16, 32, 48].map(async size => ({ size, buffer: await appIcon(size, false) })));
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + images.length * 16;
const entries = images.map(({ size, buffer }) => {
  const entry = Buffer.alloc(16);
  entry[0] = size;
  entry[1] = size;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(buffer.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += buffer.length;
  return entry;
});
await fs.writeFile(path.join(app, "public/favicon.ico"), Buffer.concat([header, ...entries, ...images.map(x => x.buffer)]));
console.log("Prepared the supplied SALASTY logo and app icons.");
