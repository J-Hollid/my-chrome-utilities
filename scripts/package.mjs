import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectName = "my-chrome-utilities";
const distDir = "dist";
const outputDir = path.join("build", "package");
const outputPath = path.join(outputDir, `${projectName}.zip`);

const crcTable = new Uint32Array(256);

for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUInt16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function writeUInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

async function collectFiles(dir, root = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, root)));
    } else if (entry.isFile()) {
      files.push({
        sourcePath: fullPath,
        zipPath: path.relative(root, fullPath).split(path.sep).join("/"),
      });
    }
  }

  return files.sort((left, right) => left.zipPath.localeCompare(right.zipPath));
}

function localHeader(name, data, crc) {
  const nameBuffer = Buffer.from(name, "utf8");
  return Buffer.concat([
    writeUInt32(0x04034b50),
    writeUInt16(20),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(33),
    writeUInt32(crc),
    writeUInt32(data.length),
    writeUInt32(data.length),
    writeUInt16(nameBuffer.length),
    writeUInt16(0),
    nameBuffer,
  ]);
}

function centralHeader(name, data, crc, offset) {
  const nameBuffer = Buffer.from(name, "utf8");
  return Buffer.concat([
    writeUInt32(0x02014b50),
    writeUInt16(20),
    writeUInt16(20),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(33),
    writeUInt32(crc),
    writeUInt32(data.length),
    writeUInt32(data.length),
    writeUInt16(nameBuffer.length),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt32(0),
    writeUInt32(offset),
    nameBuffer,
  ]);
}

function endOfCentralDirectory(entryCount, centralSize, centralOffset) {
  return Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entryCount),
    writeUInt16(entryCount),
    writeUInt32(centralSize),
    writeUInt32(centralOffset),
    writeUInt16(0),
  ]);
}

async function writeZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const data = await readFile(file.sourcePath);
    const crc = crc32(data);
    const header = localHeader(file.zipPath, data, crc);
    localParts.push(header, data);
    centralParts.push(centralHeader(file.zipPath, data, crc, offset));
    offset += header.length + data.length;
  }

  const central = Buffer.concat(centralParts);
  const archive = Buffer.concat([
    ...localParts,
    central,
    endOfCentralDirectory(files.length, central.length, offset),
  ]);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, archive);
}

await writeZip(await collectFiles(distDir));
console.log(outputPath);
