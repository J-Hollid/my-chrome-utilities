import { typedCanonicalValue } from "./data-layer-canonical-schema-facets.js";
export { bindSchemaTableQuickEdit, schemaTableEditableFacets, schemaTableQuickEditCommitsOnChange, schemaTableQuickEditDestination, schemaTableQuickEditFocusGenerationAfterFocus, schemaTableQuickEditIntent } from "./data-layer-schema-table-quick-edit.js";
export const schemaTableColumns = [
    { key: "property-editor", label: "" },
    { key: "path", label: "Path" },
    { key: "concept", label: "Concept" },
    { key: "type", label: "Type" },
    { key: "presence", label: "Presence" },
    { key: "description", label: "Description" },
    { key: "expected-or-allowed", label: "Allowed values" },
    { key: "example", label: "Example" },
    { key: "source", label: "Source" },
    { key: "local-effective-state", label: "State" },
];
export const schemaTableCellMetadata = schemaTableColumns.map(({ key, label }) => ({ key, label }));
export const schemaTableSortOptions = [
    { label: "Tree order", value: "path" },
    { label: "Concept", value: "concept" },
    { label: "Source", value: "source" },
];
export function schemaTableSortComparison(left, right, mode) {
    const order = () => left.order !== undefined && right.order !== undefined ? left.order - right.order : left.path.localeCompare(right.path);
    if (mode === "concept") {
        const leftConcept = left.concept?.trim(), rightConcept = right.concept?.trim();
        if (Boolean(leftConcept) !== Boolean(rightConcept))
            return leftConcept ? -1 : 1;
        return (leftConcept ?? "").localeCompare(rightConcept ?? "", undefined, { sensitivity: "base" }) || order();
    }
    if (mode === "source")
        return String(left.source ?? "").localeCompare(String(right.source ?? ""), undefined, { sensitivity: "base" }) || order();
    return order();
}
export const schemaTableFormerPropertyPathAllocation = "20rem";
export function applySchemaTablePathAllocation(cell) {
    cell.dataset.formerPropertyPathAllocation = schemaTableFormerPropertyPathAllocation;
    cell.style.width = schemaTableFormerPropertyPathAllocation;
    cell.style.minWidth = schemaTableFormerPropertyPathAllocation;
    cell.style.maxWidth = schemaTableFormerPropertyPathAllocation;
}
export const schemaTableOverlayStyle = "position:fixed;right:auto;bottom:auto;margin:0;box-sizing:border-box;max-width:calc(100vw - 1rem);max-height:calc(100vh - 1rem);overflow:hidden;background:Canvas;border:1px solid ButtonBorder;padding:0.75rem;";
const overlayPadding = 8, overlayGap = 8;
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
export function schemaTableOverlayPlacement(anchor, size, viewport) {
    const maxWidth = Math.max(0, viewport.width - overlayPadding * 2), maxHeight = Math.max(0, viewport.height - overlayPadding * 2), width = Math.min(size.width, maxWidth), height = Math.min(size.height, maxHeight), right = anchor.right + overlayGap, left = anchor.left - overlayGap - width;
    const preferredLeft = right + width <= viewport.width - overlayPadding ? right : left >= overlayPadding ? left : anchor.left;
    return { left: clamp(preferredLeft, overlayPadding, viewport.width - overlayPadding - width), top: clamp(anchor.top, overlayPadding, viewport.height - overlayPadding - height), width, height, maxHeight };
}
const mountedSchemaTableOverlays = new WeakMap();
const mountedSchemaTableOverlayInventory = new Set();
export function clearSchemaTableOverlay(owner) {
    const mounted = mountedSchemaTableOverlays.get(owner);
    if (!mounted)
        return;
    mounted.abort.abort();
    mounted.resizeObserver?.disconnect();
    if (mounted.resizeFrame !== undefined)
        owner.ownerDocument.defaultView?.cancelAnimationFrame(mounted.resizeFrame);
    if (mounted.dialog.open)
        mounted.dialog.close();
    mounted.dialog.remove();
    const owned = (owner.getAttribute("aria-owns") ?? "").split(/\s+/).filter((id) => id && id !== mounted.dialog.id);
    if (owned.length)
        owner.setAttribute("aria-owns", owned.join(" "));
    else
        owner.removeAttribute("aria-owns");
    mountedSchemaTableOverlays.delete(owner);
    mountedSchemaTableOverlayInventory.delete(mounted);
}
export function schemaTableOverlayTarget(owner, selector) {
    return mountedSchemaTableOverlays.get(owner)?.dialog.querySelector(selector) ?? undefined;
}
export function mountSchemaTableOverlay(owner, trigger, path, layers, onCancel) {
    for (const mounted of Array.from(mountedSchemaTableOverlayInventory))
        if (mounted.owner !== owner)
            clearSchemaTableOverlay(mounted.owner);
    clearSchemaTableOverlay(owner);
    const dom = owner.ownerDocument, dialog = dom.createElement("dialog"), stack = dom.createElement("section"), abort = new AbortController();
    const ownerId = owner.id || `schema-overlay-owner-${crypto.randomUUID()}`, dialogId = `schema-property-overlay-${crypto.randomUUID()}`;
    if (!owner.id)
        owner.id = ownerId;
    dialog.id = dialogId;
    dialog.dataset.schemaRowOverlay = "true";
    dialog.dataset.schemaPropertyOverlayHost = "true";
    dialog.dataset.schemaOverlayOwner = ownerId;
    dialog.setAttribute("aria-label", `${path} property overlay`);
    dialog.style.cssText = schemaTableOverlayStyle;
    stack.dataset.schemaOverlayStack = "true";
    stack.style.cssText = "display:flex;align-items:flex-start;gap:0.5rem;max-width:100%;overflow:hidden;";
    layers.forEach((layer, index) => { layer.style.boxSizing = "border-box"; layer.style.minWidth = "0"; layer.style.maxWidth = layers.length === 1 ? "min(42rem,calc(100vw - 2.5rem))" : `calc((100vw - ${1.5 + 0.5 * (layers.length - 1)}rem) / ${layers.length})`; layer.style.maxHeight = "calc(100vh - 2.5rem)"; layer.style.overflowY = index === layers.length - 1 ? "auto" : "hidden"; layer.style.overscrollBehavior = "contain"; });
    stack.append(...layers);
    dialog.append(stack);
    dom.body.append(dialog);
    owner.setAttribute("aria-owns", owner.getAttribute("aria-owns") ? [owner.getAttribute("aria-owns"), dialogId].join(" ") : dialogId);
    const mounted = { owner, dialog, abort };
    mountedSchemaTableOverlays.set(owner, mounted);
    mountedSchemaTableOverlayInventory.add(mounted);
    const place = (remeasureWidth = false) => {
        if (!dialog.isConnected || !trigger.isConnected)
            return;
        if (remeasureWidth)
            dialog.style.removeProperty("width");
        const anchor = trigger.getBoundingClientRect(), bounds = dialog.getBoundingClientRect(), view = dom.defaultView, placement = schemaTableOverlayPlacement(anchor, { width: bounds.width, height: Math.max(bounds.height, dialog.scrollHeight) }, { width: Math.min(view?.innerWidth ?? dom.documentElement.clientWidth, dom.documentElement.clientWidth), height: Math.min(view?.innerHeight ?? dom.documentElement.clientHeight, dom.documentElement.clientHeight) });
        dialog.style.left = `${placement.left}px`;
        dialog.style.top = `${placement.top}px`;
        dialog.style.width = `${placement.width}px`;
        dialog.style.maxHeight = `${placement.maxHeight}px`;
    };
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); onCancel(); }, { signal: abort.signal });
    dom.defaultView?.addEventListener("resize", () => place(true), { signal: abort.signal });
    queueMicrotask(() => {
        if (!dialog.isConnected || !trigger.isConnected)
            return;
        const scrollNodes = [dom.scrollingElement, ...Array.from(owner.querySelectorAll("[data-schema-editor-scroll-region]"))].filter((node) => Boolean(node)), scrollState = scrollNodes.map((node) => ({ node, top: node.scrollTop, left: node.scrollLeft })), restoreScroll = () => scrollState.forEach(({ node, top, left }) => { node.scrollTop = top; node.scrollLeft = left; });
        if (!dialog.open)
            dialog.showModal();
        place(true);
        restoreScroll();
        const view = dom.defaultView, schedulePlace = () => {
            if (!view)
                return;
            if (mounted.resizeFrame !== undefined)
                view.cancelAnimationFrame(mounted.resizeFrame);
            mounted.resizeFrame = view.requestAnimationFrame(() => { delete mounted.resizeFrame; place(); restoreScroll(); });
        };
        schedulePlace();
        if (view?.ResizeObserver) {
            mounted.resizeObserver = new view.ResizeObserver(schedulePlace);
            mounted.resizeObserver.observe(dialog);
            mounted.resizeObserver.observe(stack);
            const active = layers.at(-1);
            if (active)
                mounted.resizeObserver.observe(active);
        }
        const active = layers.at(-1), focus = active?.querySelector("button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])");
        focus?.focus({ preventScroll: true });
    });
    return dialog;
}
export function schemaTableOverlayTransition(state, event) {
    if (event.kind === "open")
        return { phase: "menu", path: event.path };
    if (event.kind === "cancel" || event.kind === "escape")
        return { phase: "closed", ...("path" in state ? { restorePath: state.path } : {}) };
    if (!("path" in state))
        return state;
    return { phase: event.kind === "focus" ? "focused" : "review", path: state.path };
}
const formattedOrdinaryValue = (value) => {
    if (typeof value !== "string")
        return JSON.stringify(value);
    return value === "" || value.trim() !== value || /[,\\"[\]{}]/.test(value) ? JSON.stringify(value) : value;
};
export function schemaTableValueFacet(value) {
    if (value.expectedValue !== undefined)
        return { kind: "expected", text: formattedOrdinaryValue(value.expectedValue), value: value.expectedValue };
    const values = value.allowedValues ?? [];
    return { kind: "allowed", text: values.map(formattedOrdinaryValue).join(", "), values };
}
export function schemaTableExpectedOrAllowed(value) {
    return schemaTableValueFacet(value).text;
}
const parsedScalar = (text, previous) => {
    if (typeof previous === "string") {
        try {
            const parsed = JSON.parse(text);
            return typeof parsed === "string" ? parsed : text;
        }
        catch {
            return text;
        }
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
};
const ordinaryEntries = (text) => {
    const entries = [];
    let start = 0, depth = 0, quote = false, escaped = false;
    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (quote) {
            if (escaped)
                escaped = false;
            else if (character === "\\")
                escaped = true;
            else if (character === '"')
                quote = false;
            continue;
        }
        if (character === '"') {
            quote = true;
            continue;
        }
        if (character === "[" || character === "{")
            depth += 1;
        else if (character === "]" || character === "}")
            depth = Math.max(0, depth - 1);
        else if (character === "," && depth === 0) {
            entries.push(text.slice(start, index).trim());
            start = index + 1;
        }
    }
    entries.push(text.slice(start).trim());
    return entries.filter((entry) => entry.length > 0);
};
export function schemaTableAllowedValues(value) {
    const values = value.allowedValues?.length ? value.allowedValues : value.expectedValue === undefined ? [] : [value.expectedValue];
    return values.map(formattedOrdinaryValue).join(", ");
}
export function schemaTableStageAllowedValues(previous, text, type) {
    const entries = ordinaryEntries(text);
    return entries.map((entry, index) => {
        if (type === "string" || type === undefined)
            return parsedScalar(entry, typeof previous[index] === "string" ? previous[index] : "");
        return typedCanonicalValue(type, entry);
    });
}
export function schemaTableExampleControl(method, allowedValues) {
    if (method === "blank")
        return { kind: "none" };
    if (method === "allowed-value")
        return { kind: "select", values: allowedValues };
    return { kind: "input" };
}
export function schemaTableRuleConditionSummary(condition, properties) {
    if (!condition)
        return "Always";
    if (condition.kind === "predicate") {
        const property = properties.find(({ id, name }) => id === condition.propertyId || name === condition.propertyId)?.name ?? condition.propertyId;
        const operator = !condition.operator ? "choose operator" : condition.operator === "Exists" ? "exists" : condition.operator === "Does not exist" ? "does not exist" : condition.operator.toLowerCase();
        return `${property} ${operator}${condition.value === undefined ? "" : ` ${formattedOrdinaryValue(condition.value)}`}`;
    }
    const relation = condition.kind === "all" ? "All" : condition.kind === "any" ? "Any" : "Not";
    return `${relation}: ${condition.children.map((child) => schemaTableRuleConditionSummary(child, properties)).join(condition.kind === "any" ? " or " : " and ")}`;
}
export function schemaTableRuleOutcomeSummary(rule) {
    if (rule.kind === "cardinality") {
        const parts = [rule.minItems === undefined ? "" : `minimum items ${rule.minItems}`, rule.maxItems === undefined ? "" : `maximum items ${rule.maxItems}`].filter(Boolean);
        return parts.join(", ") || "cardinality";
    }
    if (rule.kind === "range") {
        const parts = [rule.minimum === undefined ? "" : `minimum ${rule.minimum}`, rule.maximum === undefined ? "" : `maximum ${rule.maximum}`].filter(Boolean);
        return parts.join(", ") || "range";
    }
    if (rule.kind === "presence")
        return String(rule.presence ?? "presence");
    if (rule.kind === "pattern")
        return `pattern ${String(rule.pattern ?? "")}`.trim();
    if (rule.kind === "value")
        return `allowed values ${schemaTableAllowedValues(rule)}`.trim();
    return String(rule.name ?? rule.kind ?? "reusable rule");
}
export function schemaTableStageExpectedOrAllowed(source, text) {
    const facet = schemaTableValueFacet(source);
    const entries = ordinaryEntries(text), { expectedValue: _, allowedValues: __, ...rest } = source, previous = facet.kind === "expected" ? facet.value : facet.values[0];
    if (entries.length > 1)
        return { ...rest, allowedValues: entries.map((entry) => parsedScalar(entry, previous)) };
    if (!entries.length)
        return { ...rest, allowedValues: [] };
    return { ...rest, expectedValue: parsedScalar(entries[0], previous) };
}
export function schemaTableReplaceExpectedOrAllowed(source, text) {
    const staged = schemaTableStageExpectedOrAllowed(source, text);
    if (staged.expectedValue === undefined)
        return staged;
    const { allowedValueIds: _, allowedValueProvenance: __, ...expected } = staged;
    return { ...expected, allowedValues: [] };
}
//# sourceMappingURL=data-layer-schema-table.js.map