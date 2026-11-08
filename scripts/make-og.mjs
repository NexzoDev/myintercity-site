import { writeFile } from "node:fs/promises";
import sharp from "sharp";

/* Generates the social share card (public/og-image.jpg, 1200x630).

   Run from the project root:
     node scripts/make-og.mjs            -> writes public/og-image.jpg
     node scripts/make-og.mjs out.jpg    -> writes somewhere else (safe test run)

   Re-run it if the headline copy, the logo or the site URL changes. sharp is not a
   dependency of this project on its own — it arrives with Astro's image pipeline.
   If it is ever missing: npm i -D sharp. */

const W = 1200;
const H = 630;

const photo = "src/assets/images/kuala-20lumpur-20skyline.webp";
const logoPath = "src/assets/images/ics-20logo-20w-20text.webp";
const outPath = process.argv[2] ?? "public/og-image.jpg";

// The logo artwork is navy (#1e1a56) on transparent, 614x87, so it needs a
// light plate behind it to stay legible over a night-cityscape photo.
const LOGO_H = 58;
const LOGO_W = Math.round((LOGO_H * 614) / 87);
const PAD = 80;
const PLATE_PAD = 26;
const plate = {
  x: PAD - PLATE_PAD,
  y: 64,
  w: LOGO_W + PLATE_PAD * 2,
  h: LOGO_H + PLATE_PAD * 2,
  rx: 12,
};

const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#03005b" stop-opacity="0.97"/>
      <stop offset="0.45" stop-color="#03005b" stop-opacity="0.90"/>
      <stop offset="1" stop-color="#03005b" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="${plate.x}" y="${plate.y}" width="${plate.w}" height="${plate.h}" rx="${plate.rx}" fill="#ffffff"/>
  <rect x="${PAD}" y="286" width="88" height="6" rx="3" fill="#1f6fff"/>
  <text x="${PAD}" y="372" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="bold" fill="#ffffff">All your travel needs</text>
  <text x="${PAD}" y="440" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="bold" fill="#ffffff">in one place.</text>
  <text x="${PAD}" y="496" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#cfd8ff">Corporate &amp; leisure travel · Kuala Lumpur, Malaysia</text>
  <text x="${W - PAD}" y="592" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="23" fill="#9fb0ff">www.myintercity.com</text>
  <rect x="0" y="624" width="${W}" height="6" fill="#1f6fff"/>
</svg>`;

const base = await sharp(photo).resize(W, H, { fit: "cover", position: "centre" }).toBuffer();

const logo = await sharp(logoPath).resize({ height: LOGO_H }).png().toBuffer();

const out = await sharp(base)
  .composite([
    { input: Buffer.from(overlay), top: 0, left: 0 },
    { input: logo, top: plate.y + PLATE_PAD, left: PAD },
  ])
  .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toBuffer();

await writeFile(outPath, out);

const meta = await sharp(out).metadata();
console.log(`wrote ${outPath}`, `${meta.width}x${meta.height}`, `${(out.length / 1024).toFixed(1)} KB`);

// Sanity check: the headline should be near-white glyphs on a dark field.
const band = await sharp(out)
  .extract({ left: PAD, top: 320, width: 900, height: 70 })
  .greyscale()
  .stats();
console.log("headline band px — max:", band.channels[0].max, "stdev:", band.channels[0].stdev.toFixed(1));
