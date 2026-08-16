import { FlowVisualSha256 } from "./flow-visual-sha256.js";
import { inspectFlowVisualImage, requireCompleteFlowVisualDecode } from "./flow-visual-image-inspection.js";
export const FLOW_VISUAL_LIMITS = { sourceBytes: 5 * 1024 * 1024, dimension: 4096, pixels: 16_000_000 };
export const flowVisualDigest = async (value) => {
    const digest = new FlowVisualSha256();
    if (value instanceof Blob) {
        for (let offset = 0; offset < value.size; offset += 64 * 1024)
            digest.update(new Uint8Array(await value.slice(offset, offset + 64 * 1024).arrayBuffer()));
    }
    else
        digest.update(value);
    return `sha256:${digest.hex()}`;
};
export function validateFlowVisualMetadata(value) {
    requireFlowVisualIdentity(value);
    requireFlowVisualDimensions(value);
    requireFlowVisualByteLength(value);
    requireFlowVisualDigest(value);
}
const requireFlowVisualIdentity = (value) => { if (!value.id || !/^image\/(?:png|jpeg|webp)$/.test(value.mediaType))
    throw new DOMException("A visual asset has unsupported metadata.", "DataError"); };
const validDimension = (value) => Number.isInteger(value) && value >= 1 && value <= FLOW_VISUAL_LIMITS.dimension;
const requireFlowVisualDimensions = (value) => { if (!validDimension(value.width) || !validDimension(value.height) || value.width * value.height > FLOW_VISUAL_LIMITS.pixels)
    throw new DOMException(`Visual ${value.id} dimensions exceed the supported limit.`, "DataError"); };
const requireFlowVisualByteLength = (value) => { if (!Number.isInteger(value.byteLength) || value.byteLength < 1 || value.byteLength > FLOW_VISUAL_LIMITS.sourceBytes)
    throw new DOMException(`Visual ${value.id} exceeds the supported byte limit.`, "DataError"); };
const requireFlowVisualDigest = (value) => { if (!/^sha256:[0-9a-f]{64}$/.test(value.digest))
    throw new DOMException(`Visual ${value.id} has an invalid SHA-256 digest.`, "DataError"); };
export async function inspectFlowVisualBody(body, mediaType) {
    return inspectFlowVisualImage(body, mediaType);
}
export async function validateFlowVisualBody(metadata, body) {
    validateFlowVisualMetadata(metadata);
    if (body.size !== metadata.byteLength)
        throw new DOMException(`Visual ${metadata.id} byte length does not match its metadata.`, "DataError");
    const dimensions = await inspectFlowVisualBody(body, metadata.mediaType);
    if (dimensions.width !== metadata.width || dimensions.height !== metadata.height)
        throw new DOMException(`Visual ${metadata.id} decoded dimensions do not match its metadata.`, "DataError");
    await requireCompleteFlowVisualDecode(body, metadata.mediaType);
    if (await flowVisualDigest(body) !== metadata.digest)
        throw new DOMException(`Visual ${metadata.id} digest does not match its original body.`, "DataError");
}
//# sourceMappingURL=flow-visual-asset-validation.js.map