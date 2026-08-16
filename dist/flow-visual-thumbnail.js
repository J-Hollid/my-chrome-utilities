export const FLOW_VISUAL_THUMBNAIL_SIZE = { width: 320, height: 200, maxBytes: 256 * 1024 };
const canvasBlob = (canvas) => new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new DOMException("The visual thumbnail could not be encoded.", "EncodingError")), "image/webp", .82));
export async function createFlowVisualThumbnail(original) {
    if (typeof createImageBitmap !== "function")
        throw new DOMException("Image decoding is unavailable.", "NotSupportedError");
    const bitmap = await createImageBitmap(original);
    try {
        const scale = Math.min(FLOW_VISUAL_THUMBNAIL_SIZE.width / bitmap.width, FLOW_VISUAL_THUMBNAIL_SIZE.height / bitmap.height, 1), width = Math.max(1, Math.round(bitmap.width * scale)), height = Math.max(1, Math.round(bitmap.height * scale));
        let result;
        if (typeof OffscreenCanvas !== "undefined") {
            const canvas = new OffscreenCanvas(width, height), context = canvas.getContext("2d");
            if (!context)
                throw new DOMException("The visual thumbnail canvas is unavailable.", "InvalidStateError");
            context.drawImage(bitmap, 0, 0, width, height);
            result = await canvas.convertToBlob({ type: "image/webp", quality: .82 });
        }
        else {
            const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
            canvas.width = width;
            canvas.height = height;
            if (!context)
                throw new DOMException("The visual thumbnail canvas is unavailable.", "InvalidStateError");
            context.drawImage(bitmap, 0, 0, width, height);
            result = await canvasBlob(canvas);
        }
        if (result.size > FLOW_VISUAL_THUMBNAIL_SIZE.maxBytes)
            throw new DOMException("The generated visual thumbnail exceeds its cache bound.", "QuotaExceededError");
        return result;
    }
    finally {
        bitmap.close();
    }
}
//# sourceMappingURL=flow-visual-thumbnail.js.map