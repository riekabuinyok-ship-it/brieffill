const fs = require("fs");
const zlib = require("zlib");

function createPNG(width, height, r, g, b) {
  // Create raw pixel data (RGBA)
  const raw = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Rounded rectangle effect: corners are transparent
      const cx = width / 2, cy = height / 2;
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
      const rx = width * 0.4, ry = height * 0.4;
      const inRoundedRect = (dx / rx) ** 2 + (dy / ry) ** 2 <= 1;
      if (inRoundedRect || (x >= width * 0.15 && x <= width * 0.85 && y >= height * 0.15 && y <= height * 0.85)) {
        raw[idx] = r;
        raw[idx + 1] = g;
        raw[idx + 2] = b;
        raw[idx + 3] = 255;
      } else {
        raw[idx + 3] = 0; // transparent
      }
    }
  }

  // Add filter byte per row (0 = None)
  const filtered = Buffer.alloc(width * height + height);
  for (let y = 0; y < height; y++) {
    filtered[y * (width * 4 + 1)] = 0; // filter byte
    raw.copy(filtered, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  // Compress
  const compressed = zlib.deflateSync(filtered);

  // Build PNG
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crc]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const sizes = [
  { size: 16, r: 79, g: 70, b: 229 },
  { size: 48, r: 79, g: 70, b: 229 },
  { size: 128, r: 79, g: 70, b: 229 },
];

for (const s of sizes) {
  const png = createPNG(s.size, s.size, s.r, s.g, s.b);
  fs.writeFileSync(`icons/icon${s.size}.png`, png);
  console.log(`Created icons/icon${s.size}.png (${png.length} bytes)`);
}
