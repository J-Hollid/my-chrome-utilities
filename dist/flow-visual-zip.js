const encoder = new TextEncoder(), decoder = new TextDecoder();
const ZIP_STREAM_CHUNK_BYTES = 64 * 1024;
const crcTable = Array.from({ length: 256 }, (_, index) => { let value = index; for (let bit = 0; bit < 8; bit += 1)
    value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1; return value >>> 0; });
const crcUpdate = (value, bytes) => { for (const byte of bytes)
    value = crcTable[(value ^ byte) & 255] ^ (value >>> 8); return value; };
const u16 = (value) => Uint8Array.of(value & 255, (value >>> 8) & 255), u32 = (value) => Uint8Array.of(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
const concat = (parts) => { const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0)); let offset = 0; for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
} return output; };
const view32 = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true), view16 = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, true);
export const safeFlowVisualArchivePath = (name) => Boolean(name && !name.startsWith("/") && !name.includes("\\") && !name.split("/").some(part => part === "" || part === "." || part === ".."));
async function blobCrc(body, signal) {
    let value = 0xffffffff;
    for (let offset = 0; offset < body.size; offset += ZIP_STREAM_CHUNK_BYTES) {
        if (signal?.aborted)
            throw new DOMException("Project archive work was cancelled.", "AbortError");
        value = crcUpdate(value, new Uint8Array(await body.slice(offset, offset + ZIP_STREAM_CHUNK_BYTES).arrayBuffer()));
    }
    return (value ^ 0xffffffff) >>> 0;
}
export async function writeStoredZip(entries, sink, options = {}) {
    const directory = [];
    let offset = 0, index = 0, maxChunkBytes = 0;
    for await (const entry of entries) {
        if (!safeFlowVisualArchivePath(entry.name))
            throw new DOMException(`The archive contains an unsafe path: ${entry.name}.`, "DataError");
        if (entry.body.size > 0xffffffff)
            throw new DOMException(`Archive entry ${entry.name} is too large for ZIP32.`, "QuotaExceededError");
        const name = encoder.encode(entry.name), crc = await blobCrc(entry.body, options.signal), size = entry.body.size, localHeader = concat([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(name.length), u16(0), name]);
        await sink.write(localHeader);
        let written = localHeader.length;
        for (let bodyOffset = 0; bodyOffset < entry.body.size; bodyOffset += ZIP_STREAM_CHUNK_BYTES) {
            if (options.signal?.aborted)
                throw new DOMException("Project archive work was cancelled.", "AbortError");
            const chunk = new Uint8Array(await entry.body.slice(bodyOffset, bodyOffset + ZIP_STREAM_CHUNK_BYTES).arrayBuffer());
            await sink.write(chunk);
            written += chunk.length;
            maxChunkBytes = Math.max(maxChunkBytes, chunk.length);
        }
        directory.push(concat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]));
        offset += written;
        index += 1;
        options.onEntry?.(entry.name, index);
    }
    if (index > 0xffff)
        throw new DOMException("The archive has excessive entry count.", "QuotaExceededError");
    const central = concat(directory), end = concat([u32(0x06054b50), u16(0), u16(0), u16(index), u16(index), u32(central.length), u32(offset), u16(0)]);
    await sink.write(central);
    await sink.write(end);
    return { bytesWritten: offset + central.length + end.length, entryCount: index, maxChunkBytes };
}
async function readBytes(source, start, length) { return new Uint8Array(await source.slice(start, start + length).arrayBuffer()); }
export async function readStoredZip(source, limits = { entries: 10_000, unpackedBytes: 512 * 1024 * 1024 }, options = {}) {
    const entries = new Map();
    let offset = 0, total = 0;
    while (offset + 4 <= source.size) {
        const signature = await readBytes(source, offset, 4);
        if (view32(signature, 0) !== 0x04034b50)
            break;
        if (entries.size >= limits.entries)
            throw new DOMException("The archive has excessive entry count.", "DataError");
        const header = await readBytes(source, offset, 30), flags = view16(header, 6), method = view16(header, 8), crc = view32(header, 14), compressed = view32(header, 18), size = view32(header, 22), nameLength = view16(header, 26), extraLength = view16(header, 28);
        if (flags & 0x0008)
            throw new DOMException("The archive uses unsupported data descriptors.", "NotSupportedError");
        if (method !== 0)
            throw new DOMException("The archive uses an unsupported entry method.", "NotSupportedError");
        const name = decoder.decode(await readBytes(source, offset + 30, nameLength));
        if (!safeFlowVisualArchivePath(name) || entries.has(name))
            throw new DOMException(`The archive contains an unsafe or duplicate path: ${name}.`, "DataError");
        if (compressed !== size)
            throw new DOMException(`Archive entry ${name} has inconsistent stored lengths.`, "DataError");
        const start = offset + 30 + nameLength + extraLength, end = start + size;
        if (end > source.size)
            throw new DOMException(`Archive entry ${name} is incomplete.`, "DataError");
        total += size;
        if (total > limits.unpackedBytes)
            throw new DOMException("The archive exceeds the aggregate unpacked limit.", "QuotaExceededError");
        const body = source.slice(start, end);
        if (await blobCrc(body, options.signal) !== crc)
            throw new DOMException(`Archive entry ${name} failed CRC validation.`, "DataError");
        entries.set(name, body);
        offset = end;
        options.onEntry?.(name, entries.size);
    }
    if (!entries.size)
        throw new DOMException("Choose a readable version 3 project archive.", "DataError");
    return entries;
}
//# sourceMappingURL=flow-visual-zip.js.map