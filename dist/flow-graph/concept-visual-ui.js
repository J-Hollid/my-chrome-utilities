import { FLOW_CONCEPT_VISUAL_LIMITS, flowConceptVisualAssets, validateFlowConceptVisualSource } from "./concept-visuals.js";
export { openFlowConceptVisualViewer } from "./concept-visual-viewer-ui.js";
export { FLOW_CONCEPT_VISUAL_MAX_VIEWER_SCALE, flowConceptVisualFitScale, flowConceptVisualPan, flowConceptVisualZoomAt } from "./concept-visual-viewer-state.js";
const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const signatureValid = (type, bytes) => type === "image/png" ? bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) : type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : type === "image/webp" ? new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP" : false;
const dataUrl = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("The visual could not be read")); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); });
const dimensions = (file) => new Promise((resolve, reject) => { const image = new Image(), url = URL.createObjectURL(file); image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The visual could not be read")); }; image.src = url; });
const hex = (bytes) => Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, "0")).join("");
const mediaNames = { "image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WebP" };
const validateFileEnvelope = (file) => { if (!acceptedTypes.has(file.type))
    throw new Error("Choose a PNG, JPEG, or WebP image"); if (file.size > FLOW_CONCEPT_VISUAL_LIMITS.sourceBytes)
    throw new Error("The visual is too large"); };
const readFileBuffer = async (file) => { try {
    return await file.arrayBuffer();
}
catch {
    throw new Error("The visual could not be read");
} };
const requireValidSignature = (type, buffer) => { if (!signatureValid(type, new Uint8Array(buffer)))
    throw new Error(`Choose a valid ${mediaNames[type]} image`); };
const availableStorageBytes = async () => { try {
    const estimate = await navigator.storage?.estimate();
    return estimate?.quota === undefined ? undefined : Math.max(0, estimate.quota - (estimate.usage ?? 0));
}
catch {
    return undefined;
} };
const requireValidRaster = async (raster, file) => { const available = await availableStorageBytes(), validation = validateFlowConceptVisualSource({ ...raster, sourceByteLength: file.size, ...(available === undefined ? {} : { availableStorageBytes: available }) }); if (!validation.valid)
    throw new Error(validation.diagnostic); };
export async function readFlowConceptVisualFile(file, project) {
    validateFileEnvelope(file);
    const buffer = await readFileBuffer(file);
    requireValidSignature(file.type, buffer);
    const decoded = await dimensions(file), bytes = await dataUrl(file), digest = hex(await crypto.subtle.digest("SHA-256", buffer)), raster = { mediaType: file.type, ...decoded, byteLength: file.size, bytes, digest };
    await requireValidRaster(raster, file);
    return raster;
}
const labelled = (text, control) => { const label = document.createElement("label"); label.append(text, control); return label; };
export const flowConceptVisualEditorDiagnostic = (description, fileDiagnostic) => fileDiagnostic || (!description.trim() ? "Description is required" : "");
export function createFlowConceptVisualEditor(options) {
    const root = document.createElement("section"), target = document.createElement("div"), choose = document.createElement("button"), file = document.createElement("input"), preview = document.createElement("img"), description = document.createElement("textarea"), caption = document.createElement("input"), source = document.createElement("input"), storage = document.createElement("p"), diagnostic = document.createElement("p"), save = document.createElement("button"), cancel = document.createElement("button");
    let raster = options.existing?.raster, fileDiagnostic = "", thumbnailBytes = 0;
    root.dataset.flowVisualEditor = "true";
    root.setAttribute("aria-label", "Concept Visual editor");
    target.tabIndex = 0;
    target.setAttribute("role", "button");
    target.setAttribute("aria-label", "Paste image or drop image file");
    target.textContent = "Paste image or drop image file";
    choose.type = "button";
    choose.textContent = "Choose image file";
    file.type = "file";
    file.accept = "image/png,image/jpeg,image/webp";
    file.hidden = true;
    preview.alt = "Staged complete concept visual preview";
    Object.assign(preview.style, { display: raster ? "block" : "none", width: "100%", aspectRatio: "16 / 10", objectFit: "contain" });
    description.required = true;
    description.setAttribute("aria-label", "Description (required)");
    caption.setAttribute("aria-label", "Caption (optional)");
    source.setAttribute("aria-label", "Source reference (optional)");
    storage.dataset.flowVisualStorage = "true";
    diagnostic.setAttribute("role", "alert");
    diagnostic.id = `flow-visual-diagnostic-${Math.random().toString(36).slice(2)}`;
    description.setAttribute("aria-describedby", diagnostic.id);
    save.type = "button";
    save.textContent = "Save";
    cancel.type = "button";
    cancel.textContent = "Cancel";
    if (options.existing) {
        preview.src = options.existing.raster.bytes;
        description.value = options.existing.attachment.description;
        caption.value = options.existing.attachment.caption ?? "";
        source.value = options.existing.attachment.sourceReference ?? "";
    }
    const refresh = () => { const assets = flowConceptVisualAssets(options.project()), originalBytes = assets.reduce((sum, asset) => sum + asset.byteLength, 0); storage.textContent = `Project visuals: ${assets.length} assets · ${originalBytes} original bytes · ${thumbnailBytes} thumbnail cache bytes · estimated export ${originalBytes + JSON.stringify(options.project()).length} bytes.`; save.disabled = !raster || !description.value.trim() || Boolean(fileDiagnostic); diagnostic.textContent = flowConceptVisualEditorDiagnostic(description.value, fileDiagnostic); };
    const refreshThumbnailBytes = () => { try {
        const reported = options.thumbnailCacheBytes?.() ?? 0;
        if (typeof reported === "number") {
            thumbnailBytes = reported;
            refresh();
            return;
        }
        void reported.then(value => { thumbnailBytes = value; refresh(); }, () => { });
    }
    catch { /* Storage reporting must not block visual editing. */ } };
    const stage = async (candidate) => { if (!candidate)
        return; fileDiagnostic = ""; try {
        raster = await readFlowConceptVisualFile(candidate, options.project());
        preview.src = raster.bytes;
        preview.style.display = "block";
    }
    catch (error) {
        fileDiagnostic = error instanceof Error ? error.message : String(error);
    } refresh(); };
    choose.addEventListener("click", () => file.click());
    file.addEventListener("change", () => void stage(file.files?.[0]));
    target.addEventListener("paste", event => { event.preventDefault(); void stage(Array.from(event.clipboardData?.files ?? [])[0]); });
    target.addEventListener("dragover", event => event.preventDefault());
    target.addEventListener("drop", event => { event.preventDefault(); void stage(Array.from(event.dataTransfer?.files ?? [])[0]); });
    description.addEventListener("input", refresh);
    save.addEventListener("click", () => { if (raster && description.value.trim())
        options.save({ raster, description: description.value, ...(caption.value ? { caption: caption.value } : {}), ...(source.value ? { sourceReference: source.value } : {}) }); });
    cancel.addEventListener("click", options.cancel);
    root.append(target, choose, file, preview, storage, labelled("Description", description), labelled("Caption", caption), labelled("Source reference", source), diagnostic, save, cancel);
    refresh();
    refreshThumbnailBytes();
    return { root, firstControl: target };
}
//# sourceMappingURL=concept-visual-ui.js.map