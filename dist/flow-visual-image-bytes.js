export const flowVisualAscii = (bytes, start, length) => new TextDecoder().decode(bytes.slice(start, start + length));
export const flowVisualU16be = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, false);
export const flowVisualU24le = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
export const flowVisualU32be = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, false);
export const flowVisualU32le = (bytes, offset) => new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
//# sourceMappingURL=flow-visual-image-bytes.js.map