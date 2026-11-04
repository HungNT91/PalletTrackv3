import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function calculateCrc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = Buffer.alloc(4 + len);
  chunk.copy(crcTarget, 0, 4, 8 + len);
  const crc = calculateCrc(crcTarget);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePngBuffer(width, height, isMaskable = false) {
  // Create RGBA image buffer with scanlines (filter type 0 at start of each line)
  const lineLength = 1 + width * 4;
  const rawData = Buffer.alloc(lineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.44;

  for (let y = 0; y < height; y++) {
    const lineOffset = y * lineLength;
    rawData[lineOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelOffset = lineOffset + 1 + x * 4;

      // Background gradient: from #0052d9 (top) to #00358e (bottom)
      const ratio = y / height;
      let r = Math.round(0 * (1 - ratio) + 0 * ratio);
      let g = Math.round(82 * (1 - ratio) + 53 * ratio);
      let b = Math.round(217 * (1 - ratio) + 142 * ratio);
      let a = 255;

      // For non-maskable icons, round the corners (squircle)
      if (!isMaskable) {
        const cornerRadius = width * 0.22;
        let inside = true;
        if (x < cornerRadius && y < cornerRadius) {
          const dx = cornerRadius - x;
          const dy = cornerRadius - y;
          if (dx * dx + dy * dy > cornerRadius * cornerRadius) inside = false;
        } else if (x > width - cornerRadius && y < cornerRadius) {
          const dx = x - (width - cornerRadius);
          const dy = cornerRadius - y;
          if (dx * dx + dy * dy > cornerRadius * cornerRadius) inside = false;
        } else if (x < cornerRadius && y > height - cornerRadius) {
          const dx = cornerRadius - x;
          const dy = y - (height - cornerRadius);
          if (dx * dx + dy * dy > cornerRadius * cornerRadius) inside = false;
        } else if (x > width - cornerRadius && y > height - cornerRadius) {
          const dx = x - (width - cornerRadius);
          const dy = y - (height - cornerRadius);
          if (dx * dx + dy * dy > cornerRadius * cornerRadius) inside = false;
        }
        if (!inside) {
          a = 0;
        }
      }

      if (a > 0) {
        // Draw Pallet graphic in center
        // Safe scaling factor
        const s = isMaskable ? 0.72 : 1.0;
        const nx = (x - cx) / s;
        const ny = (y - cy) / s;

        // Pallet top boards
        // Board 1: ny from 35 to 50, nx from -150 to 150
        if (ny >= 35 && ny <= 52 && nx >= -150 && nx <= 150) {
          r = 255; g = 255; b = 255;
        }
        // Board 2: ny from 72 to 86, nx from -150 to 150
        if (ny >= 72 && ny <= 86 && nx >= -150 && nx <= 150) {
          r = 230; g = 240; b = 255;
        }
        // Blocks: left (-130 to -90), mid (-20 to 20), right (90 to 130)
        if (ny > 52 && ny < 72) {
          if ((nx >= -135 && nx <= -95) || (nx >= -20 && nx <= 20) || (nx >= 95 && nx <= 135)) {
            r = 220; g = 235; b = 255;
          }
        }

        // Cargo box 1 (Left): nx from -130 to -10, ny from -60 to 30
        if (nx >= -130 && nx <= -10 && ny >= -60 && ny <= 30) {
          r = 245; g = 250; b = 255;
          // Inner detail
          if (Math.abs(ny - (-20)) <= 2) {
            r = 0; g = 74; b = 198;
          }
          // QR mini mark
          if (nx >= -100 && nx <= -70 && ny >= -10 && ny <= 20) {
            r = 0; g = 74; b = 198;
          }
        }

        // Cargo box 2 (Right): nx from 5 to 135, ny from -90 to 30
        if (nx >= 5 && nx <= 135 && ny >= -90 && ny <= 30) {
          r = 255; g = 255; b = 255;
          // Inner detail
          if (Math.abs(ny - (-40)) <= 2) {
            r = 0; g = 74; b = 198;
          }
          // Green check circle
          const cdx = nx - 85;
          const cdy = ny - 0;
          if (cdx * cdx + cdy * cdy <= 324) {
            r = 16; g = 185; b = 129; // Emerald green
          }
        }

        // Scan line: ny from -110 to -104, nx from -160 to 160
        if (ny >= -110 && ny <= -104 && nx >= -160 && nx <= 160) {
          r = 56; g = 189; b = 248; // Sky blue laser
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT Chunk
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192
const buf192 = generatePngBuffer(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buf192);

// 512x512
const buf512 = generatePngBuffer(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buf512);

// 512x512 Maskable
const bufMaskable = generatePngBuffer(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), bufMaskable);

// Apple touch icon 180x180
const bufApple = generatePngBuffer(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), bufApple);

// Favicon 48x48 PNG (browsers accept PNG as favicon)
const bufFavicon = generatePngBuffer(48, 48, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), bufFavicon);

console.log('Successfully generated all PWA PNG icons!');
