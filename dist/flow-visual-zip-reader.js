import { flowVisualBlobCrc, flowVisualZipDecoder as decoder, flowVisualZipView16 as view16, flowVisualZipView32 as view32, readFlowVisualZipBytes as readBytes, safeFlowVisualArchivePath } from "./flow-visual-zip-primitives.js";
import { readFlowVisualZipDirectory, validateFlowVisualZipDirectory } from "./flow-visual-zip-directory.js";
const cancelled = (signal) => { if (signal?.aborted)
    throw new DOMException("Project archive work was cancelled.", "AbortError"); };
const assertLocalHeader = (flags, method, nameLength, extraLength) => { if (flags & 0x0008)
    throw new DOMException("The archive uses unsupported data descriptors.", "NotSupportedError"); if (method !== 0)
    throw new DOMException("The archive uses an unsupported entry method.", "NotSupportedError"); if (!nameLength || nameLength > 4096 || extraLength > 4096)
    throw new DOMException("The archive contains an excessive entry header.", "DataError"); };
const assertStoredEntry = (name, compressed, size, start, end, source, entries) => { if (!safeFlowVisualArchivePath(name) || entries.has(name))
    throw new DOMException(`The archive contains an unsafe or duplicate path: ${name}.`, "DataError"); if (compressed !== size)
    throw new DOMException(`Archive entry ${name} has inconsistent stored lengths.`, "DataError"); if (end > source.size)
    throw new DOMException(`Archive entry ${name} is incomplete.`, "DataError"); };
async function readLocalEntries(source, limits, options) {
    const entries = new Map();
    let offset = 0, total = 0;
    while (offset + 4 <= source.size) {
        cancelled(options.signal);
        const signature = await readBytes(source, offset, 4);
        if (view32(signature, 0) !== 0x04034b50)
            break;
        if (entries.size >= limits.entries)
            throw new DOMException("The archive has excessive entry count.", "DataError");
        const header = await readBytes(source, offset, 30), flags = view16(header, 6), method = view16(header, 8), crc = view32(header, 14), compressed = view32(header, 18), size = view32(header, 22), nameLength = view16(header, 26), extraLength = view16(header, 28);
        assertLocalHeader(flags, method, nameLength, extraLength);
        const name = decoder.decode(await readBytes(source, offset + 30, nameLength)), start = offset + 30 + nameLength + extraLength, end = start + size;
        assertStoredEntry(name, compressed, size, start, end, source, entries);
        total += size;
        if (total > limits.unpackedBytes)
            throw new DOMException("The archive exceeds the aggregate unpacked limit.", "QuotaExceededError");
        const body = source.slice(start, end);
        if (await flowVisualBlobCrc(body, options.signal) !== crc)
            throw new DOMException(`Archive entry ${name} failed CRC validation.`, "DataError");
        entries.set(name, body);
        offset = end;
        options.onEntry?.(name, entries.size);
    }
    return { entries, directory: { offset, size: source.size - offset } };
}
export async function readStoredZip(source, limits = { entries: 10_000, unpackedBytes: 512 * 1024 * 1024 }, options = {}) {
    const local = await readLocalEntries(source, limits, options), directory = await readFlowVisualZipDirectory(source, local.entries, local.directory.offset);
    await validateFlowVisualZipDirectory(source, local.entries, directory);
    return local.entries;
}
//# sourceMappingURL=flow-visual-zip-reader.js.map