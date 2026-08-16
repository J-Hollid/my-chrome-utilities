import { flowVisualAscii, flowVisualU16be, flowVisualU24le, flowVisualU32le } from "./flow-visual-image-bytes.js";
export function inspectFlowVisualWebpDimensions(bytes) {
    if (!hasWebpHeader(bytes))
        return undefined;
    const kind = flowVisualAscii(bytes, 12, 4);
    return kind === "VP8X" ? inspectExtendedWebp(bytes) : kind === "VP8 " ? inspectLossyWebp(bytes) : kind === "VP8L" ? inspectLosslessWebp(bytes) : undefined;
}
const hasWebpHeader = (bytes) => bytes.length >= 30 && flowVisualAscii(bytes, 0, 4) === "RIFF" && flowVisualAscii(bytes, 8, 4) === "WEBP";
const inspectExtendedWebp = (bytes) => ({ width: 1 + flowVisualU24le(bytes, 24), height: 1 + flowVisualU24le(bytes, 27) });
const hasLossyWebpFrame = (bytes) => bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a;
const inspectLossyWebp = (bytes) => hasLossyWebpFrame(bytes) ? { width: flowVisualU16be(Uint8Array.of(bytes[27], bytes[26]), 0) & 0x3fff, height: flowVisualU16be(Uint8Array.of(bytes[29], bytes[28]), 0) & 0x3fff } : undefined;
const inspectLosslessWebp = (bytes) => { if (bytes.length < 25 || bytes[20] !== 0x2f)
    return undefined; const bits = flowVisualU32le(bytes, 21); return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }; };
//# sourceMappingURL=flow-visual-webp-inspection.js.map