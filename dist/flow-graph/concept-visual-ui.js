import { FLOW_CONCEPT_VISUAL_LIMITS, flowConceptVisualAssets, validateFlowConceptVisualSource } from "./concept-visuals.js";
const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const signatureValid = (type, bytes) => type === "image/png" ? bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) : type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : type === "image/webp" ? new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP" : false;
const dataUrl = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("The visual could not be read")); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); });
const dimensions = (file) => new Promise((resolve, reject) => { const image = new Image(), url = URL.createObjectURL(file); image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The visual could not be read")); }; image.src = url; });
const hex = (bytes) => Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, "0")).join("");
export async function readFlowConceptVisualFile(file, project) {
    if (!acceptedTypes.has(file.type))
        throw new Error("Choose a PNG, JPEG, or WebP image");
    if (file.size > FLOW_CONCEPT_VISUAL_LIMITS.sourceBytes)
        throw new Error("The visual is too large");
    let buffer;
    try {
        buffer = await file.arrayBuffer();
    }
    catch {
        throw new Error("The visual could not be read");
    }
    if (!signatureValid(file.type, new Uint8Array(buffer)))
        throw new Error(`Choose a valid ${file.type === "image/png" ? "PNG" : file.type === "image/jpeg" ? "JPEG" : "WebP"} image`);
    const decoded = await dimensions(file), bytes = await dataUrl(file), digest = hex(await crypto.subtle.digest("SHA-256", buffer)), raster = { mediaType: file.type, ...decoded, byteLength: file.size, bytes, digest }, stored = flowConceptVisualAssets(project).reduce((sum, asset) => sum + asset.byteLength, 0), existing = flowConceptVisualAssets(project).find((asset) => asset.digest === digest), validation = validateFlowConceptVisualSource({ ...raster, sourceByteLength: file.size, projectStoredBytes: existing ? stored - existing.byteLength : stored });
    if (!validation.valid)
        throw new Error(validation.diagnostic);
    return raster;
}
const labelled = (text, control) => { const label = document.createElement("label"); label.append(text, control); return label; };
export const flowConceptVisualEditorDiagnostic = (description, fileDiagnostic) => fileDiagnostic || (!description.trim() ? "Description is required" : "");
export function createFlowConceptVisualEditor(options) {
    const root = document.createElement("section"), target = document.createElement("div"), choose = document.createElement("button"), file = document.createElement("input"), preview = document.createElement("img"), description = document.createElement("textarea"), caption = document.createElement("input"), source = document.createElement("input"), diagnostic = document.createElement("p"), save = document.createElement("button"), cancel = document.createElement("button");
    let raster = options.existing?.raster, fileDiagnostic = "";
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
    const refresh = () => { save.disabled = !raster || !description.value.trim() || Boolean(fileDiagnostic); diagnostic.textContent = flowConceptVisualEditorDiagnostic(description.value, fileDiagnostic); };
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
    root.append(target, choose, file, preview, labelled("Description", description), labelled("Caption", caption), labelled("Source reference", source), diagnostic, save, cancel);
    refresh();
    return { root, firstControl: target };
}
export function openFlowConceptVisualViewer(value, invoker, fallbackInvoker) {
    const dialog = document.createElement("dialog"), heading = document.createElement("h3"), viewport = document.createElement("div"), image = document.createElement("img"), description = document.createElement("p"), metadata = document.createElement("dl"), controls = document.createElement("section"), status = document.createElement("p"), close = document.createElement("button");
    let zoom = 1, mode = "fit";
    dialog.setAttribute("aria-label", "Concept Visual viewer");
    heading.textContent = value.attachment.caption ?? "Concept visual";
    viewport.dataset.flowVisualViewport = "true";
    viewport.setAttribute("aria-label", "Concept Visual viewport");
    Object.assign(viewport.style, { width: "min(80vw, 800px)", height: "min(60vh, 520px)", overflow: "auto", overscrollBehavior: "contain" });
    image.src = value.raster.bytes;
    image.alt = value.attachment.description;
    Object.assign(image.style, { display: "block", maxWidth: "none", maxHeight: "none", objectFit: "contain" });
    viewport.append(image);
    description.textContent = value.attachment.description;
    const addMeta = (term, text) => { if (!text)
        return; const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = term; dd.textContent = text; metadata.append(dt, dd); };
    addMeta("Caption", value.attachment.caption);
    addMeta("Source reference", value.attachment.sourceReference);
    const control = (label, action) => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.addEventListener("click", action); return button; }, fitScale = () => Math.min(1, viewport.clientWidth / value.raster.width, viewport.clientHeight / value.raster.height), panMaximum = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth), updatePan = () => { viewport.dataset.panX = String(viewport.scrollLeft); panLeft.disabled = viewport.scrollLeft <= 0; panRight.disabled = viewport.scrollLeft >= panMaximum(); status.textContent = `${mode === "fit" ? "Fit" : "Actual size"} at ${Math.round(zoom * 100)}%, pan ${Math.round(viewport.scrollLeft)} of ${panMaximum()}.`; }, apply = (resetPan = false) => { const scale = (mode === "fit" ? fitScale() : 1) * zoom; image.style.width = `${value.raster.width * scale}px`; image.style.height = `${value.raster.height * scale}px`; viewport.dataset.viewMode = mode; viewport.dataset.zoom = String(zoom); if (resetPan)
        viewport.scrollTo({ left: 0, top: 0 });
    else
        viewport.scrollLeft = Math.min(viewport.scrollLeft, panMaximum()); updatePan(); }, pan = (delta) => { viewport.scrollLeft = Math.max(0, Math.min(panMaximum(), viewport.scrollLeft + delta)); updatePan(); }, fit = control("Fit", () => { mode = "fit"; zoom = 1; apply(true); }), actual = control("Actual size", () => { mode = "actual"; zoom = 1; apply(true); }), zoomIn = control("Zoom in", () => { zoom = Math.min(4, zoom + .25); apply(); }), zoomOut = control("Zoom out", () => { zoom = Math.max(.25, zoom - .25); apply(); }), reset = control("Reset", () => { mode = "fit"; zoom = 1; apply(true); }), panLeft = control("Pan left", () => pan(-80)), panRight = control("Pan right", () => pan(80));
    status.setAttribute("role", "status");
    viewport.addEventListener("scroll", updatePan);
    controls.setAttribute("aria-label", "Visual fit, actual size, zoom, reset, and pan controls");
    controls.append(fit, actual, zoomIn, zoomOut, reset, panLeft, panRight);
    close.type = "button";
    close.textContent = "Close";
    dialog.append(heading, viewport, description, metadata, controls, status, close);
    document.body.append(dialog);
    const background = Array.from(document.body.children).filter((element) => element !== dialog && element instanceof HTMLElement).map(element => ({ element, inert: element.inert }));
    for (const { element } of background)
        element.inert = true;
    const suppressBackgroundActivation = (event) => { if (event.target instanceof Node && !dialog.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
    } };
    document.addEventListener("click", suppressBackgroundActivation, true);
    let finished = false;
    const finish = () => { if (finished)
        return; finished = true; document.removeEventListener("click", suppressBackgroundActivation, true); for (const { element, inert } of background)
        element.inert = inert; dialog.close(); dialog.remove(); (invoker.isConnected ? invoker : fallbackInvoker)?.focus({ preventScroll: true }); };
    close.addEventListener("click", finish);
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(); });
    dialog.addEventListener("keydown", event => { if (event.key === "Escape") {
        event.preventDefault();
        finish();
        return;
    } if (event.key !== "Tab")
        return; const focusable = Array.from(dialog.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")); if (!focusable.length)
        return; const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    }
    else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    } });
    dialog.showModal();
    apply(true);
    close.focus();
}
//# sourceMappingURL=concept-visual-ui.js.map