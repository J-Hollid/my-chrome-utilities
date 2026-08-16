import { flowVisualZipDecoder as decoder, flowVisualZipView16 as view16, flowVisualZipView32 as view32, readFlowVisualZipBytes as readBytes } from "./flow-visual-zip-primitives.js";
const hasExpectedDirectoryCounts = (end, count) => view16(end, 8) === count && view16(end, 10) === count;
const hasExpectedDirectoryBounds = (end, sourceSize, localEnd) => { const size = view32(end, 12), offset = view32(end, 16); return offset === localEnd && offset + size === sourceSize - 22; };
const validEndRecord = (end, count, sourceSize, localEnd) => view32(end, 0) === 0x06054b50 && hasExpectedDirectoryCounts(end, count) && view16(end, 20) === 0 && hasExpectedDirectoryBounds(end, sourceSize, localEnd);
export async function readFlowVisualZipDirectory(source, entries, localEnd) {
    if (!entries.size)
        throw new DOMException("Choose a readable version 3 project archive.", "DataError");
    if (source.size < 22)
        throw new DOMException("The project archive is incomplete.", "DataError");
    const end = await readBytes(source, source.size - 22, 22);
    if (!validEndRecord(end, entries.size, source.size, localEnd))
        throw new DOMException("The project archive directory is incomplete or inconsistent.", "DataError");
    return { offset: view32(end, 16), size: view32(end, 12) };
}
const assertCentralHeader = (header) => { if (header.length !== 46 || view32(header, 0) !== 0x02014b50)
    throw new DOMException("The project archive central directory is malformed.", "DataError"); };
const centralRecordLength = (header, offset, end) => { const nameLength = view16(header, 28), length = 46 + nameLength + view16(header, 30) + view16(header, 32); if (!nameLength || offset + length > end)
    throw new DOMException("The project archive central directory is incomplete.", "DataError"); return { nameLength, length }; };
const assertKnownDirectoryEntry = (entries, seen, name) => { if (!entries.has(name))
    throw new DOMException(`The project archive directory declares unknown entry ${name}.`, "DataError"); if (seen.has(name))
    throw new DOMException(`The project archive directory declares duplicate entry ${name}.`, "DataError"); seen.add(name); };
const assertCompleteDirectory = (offset, end, count, expected, seen) => { if (offset !== end || count !== expected || seen.size !== expected)
    throw new DOMException("The project archive central directory entry count is inconsistent.", "DataError"); };
export async function validateFlowVisualZipDirectory(source, entries, directory) {
    let offset = directory.offset, count = 0, end = directory.offset + directory.size;
    const seen = new Set();
    while (offset < end) {
        const header = await readBytes(source, offset, 46);
        assertCentralHeader(header);
        const record = centralRecordLength(header, offset, end), name = decoder.decode(await readBytes(source, offset + 46, record.nameLength));
        assertKnownDirectoryEntry(entries, seen, name);
        count += 1;
        offset += record.length;
    }
    assertCompleteDirectory(offset, end, count, entries.size, seen);
}
//# sourceMappingURL=flow-visual-zip-directory.js.map