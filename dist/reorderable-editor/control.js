import { reorderControlModel, reorderPlacementIndex, } from "./model.js";
let identity = 0;
let dragSession;
const liveRegions = new WeakMap();
const undoRegions = new WeakMap();
const localDraftMoves = new WeakMap();
const triggerScopes = new WeakMap();
const focusKey = (scopeId, itemId) => `${encodeURIComponent(scopeId)}|${encodeURIComponent(itemId)}`;
const clearDropIndicator = (target) => {
    target.classList.remove("reorder-drop-before", "reorder-drop-after");
    styles(target, { borderBlockStart: "", borderBlockEnd: "" });
};
const button = (doc, label) => {
    const control = doc.createElement("button");
    control.type = "button";
    control.textContent = label;
    styles(control, { boxSizing: "border-box", maxWidth: "100%", whiteSpace: "normal", overflowWrap: "anywhere" });
    return control;
};
const reorderGrip = (doc) => {
    const grip = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    grip.dataset.reorderGrip = "true";
    grip.setAttribute("data-reorder-grip", "true");
    grip.setAttribute("viewBox", "0 0 16 16");
    grip.setAttribute("aria-hidden", "true");
    grip.setAttribute("focusable", "false");
    grip.setAttribute("fill", "currentColor");
    styles(grip, { display: "block", width: "16px", height: "16px", flex: "0 0 16px" });
    for (const y of [3, 8, 13])
        for (const x of [5, 11]) {
            const dot = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", String(x));
            dot.setAttribute("cy", String(y));
            dot.setAttribute("r", "1.5");
            grip.append(dot);
        }
    return grip;
};
const styles = (element, values) => {
    if (!element.style)
        return;
    Object.assign(element.style, values);
};
export function renderReorderableItemRow(options) {
    const dom = options.primaryContent.ownerDocument ?? options.control?.ownerDocument ?? document, row = dom.createElement("div"), actionable = Boolean(options.control && !options.control.hidden);
    row.dataset.reorderItemRow = "true";
    row.setAttribute("data-reorder-item-row", "true");
    styles(row, { boxSizing: "border-box", display: "grid",
        gridTemplateColumns: actionable
            ? `44px minmax(0, 1fr)${options.trailingContent ? " max-content" : ""}`
            : `minmax(0, 1fr)${options.trailingContent ? " max-content" : ""}`,
        alignItems: "center", columnGap: "8px", width: "100%", maxWidth: "100%", minWidth: "0px" });
    if (options.control)
        styles(options.control, { gridColumn: actionable ? "1" : "", gridRow: "1", alignSelf: "center" });
    styles(options.primaryContent, { gridColumn: actionable ? "2" : "1", gridRow: "1", minWidth: "0px",
        maxWidth: "100%", overflowWrap: "anywhere" });
    row.append(...[options.control, options.primaryContent].filter((element) => Boolean(element)));
    if (options.trailingContent) {
        styles(options.trailingContent, { gridColumn: actionable ? "3" : "2", gridRow: "1", minWidth: "0px" });
        row.append(options.trailingContent);
    }
    if (options.secondaryContent?.length) {
        const secondary = dom.createElement("div");
        styles(secondary, { gridColumn: actionable ? "2 / -1" : "1 / -1", gridRow: "2", display: "flex", flexWrap: "wrap",
            alignItems: "center", gap: "8px", minWidth: "0px", maxWidth: "100%", overflowWrap: "anywhere" });
        secondary.append(...options.secondaryContent);
        row.append(secondary);
    }
    return row;
}
function liveRegion(doc) {
    const existing = liveRegions.get(doc);
    if (existing)
        return existing;
    const output = doc.createElement("output");
    output.dataset.reorderStatus = "true";
    output.setAttribute("data-reorder-status", "true");
    output.setAttribute("aria-live", "polite");
    output.setAttribute("aria-atomic", "true");
    styles(output, { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)" });
    (doc.body ?? doc.documentElement)?.append?.(output);
    liveRegions.set(doc, output);
    return output;
}
const stableTrigger = (doc, itemId, fallback) => {
    const origin = triggerScopes.get(fallback), itemSelector = `[data-reorder-item-id="${itemId.replaceAll('"', '\\"')}"]`, selector = origin?.id ? `[data-reorder-focus-key="${focusKey(origin.id, itemId)}"]` : itemSelector;
    const scoped = origin?.root.querySelector?.(selector);
    return scoped?.isConnected ? scoped : doc.querySelector?.(selector) ?? fallback;
};
function focusTrigger(doc, itemId, fallback) {
    const origin = triggerScopes.get(fallback);
    if (origin?.id && typeof MutationObserver !== "undefined") {
        const observer = new MutationObserver(() => {
            if (fallback.isConnected)
                return;
            const replacement = stableTrigger(doc, itemId, fallback);
            if (replacement === fallback || !replacement.isConnected)
                return;
            observer.disconnect();
            clearTimeout(expiry);
            replacement.focus({ preventScroll: true });
        }), expiry = setTimeout(() => observer.disconnect(), 1000);
        observer.observe(doc.documentElement ?? origin.root, { childList: true, subtree: true });
    }
    queueMicrotask(() => stableTrigger(doc, itemId, fallback).focus({ preventScroll: true }));
}
export function announceReorderCompletion(doc, completion) {
    liveRegion(doc).textContent = `${completion.itemLabel} moved from position ${completion.fromIndex + 1} to position ${completion.toIndex + 1}`;
    const fallback = completion.fallbackTrigger ?? doc.querySelector?.(`[data-reorder-focus-key="${focusKey(completion.focusScopeId, completion.itemId)}"]`);
    if (fallback)
        focusTrigger(doc, completion.itemId, fallback);
}
function undoRegion(doc) {
    const existing = undoRegions.get(doc);
    if (existing)
        return existing;
    const region = doc.createElement("div");
    region.dataset.reorderUndo = "true";
    region.setAttribute("data-reorder-undo", "true");
    region.hidden = true;
    (doc.body ?? doc.documentElement)?.append?.(region);
    undoRegions.set(doc, region);
    return region;
}
function legalOrder(options) {
    if (!options.legalDestinationIds)
        return options.completeOrder;
    const ids = new Set([...options.legalDestinationIds, options.itemId]);
    return options.completeOrder.filter(({ id }) => ids.has(id));
}
function actionIndex(options, action) {
    const scoped = legalOrder(options), index = scoped.findIndex(({ id }) => id === options.itemId);
    if (index < 0)
        return options.completeOrder.findIndex(({ id }) => id === options.itemId);
    const target = action === "first" ? scoped[0] : action === "last" ? scoped.at(-1) :
        action === "earlier" ? scoped[index - 1] : scoped[index + 1];
    if (!target)
        return options.completeOrder.findIndex(({ id }) => id === options.itemId);
    return reorderPlacementIndex(options.completeOrder, options.itemId, target.id, action === "first" || action === "earlier" ? "before" : "after");
}
export function renderReorderControl(options) {
    const doc = options.dropTarget?.ownerDocument ?? globalThis.document, model = reorderControlModel(options);
    const wrapper = doc.createElement("span");
    if (!model.actionable) {
        wrapper.hidden = true;
        return wrapper;
    }
    const ownedMenu = !options.existingActionsMenu, trigger = options.existingActionsMenu?.trigger ?? button(doc, ""), handle = options.existingActionsMenu ? doc.createElement("span") : trigger, menu = options.existingActionsMenu?.menu ?? doc.createElement("div"), dialog = doc.createElement("div");
    const menuId = `reorder-menu-${++identity}`, dialogId = `reorder-dialog-${identity}`;
    wrapper.className = "reorderable-editor-control";
    styles(wrapper, { display: "inline-flex", position: "relative", maxWidth: "44px", alignItems: "center", alignSelf: "center", verticalAlign: "middle", flex: "0 0 44px", order: "-1" });
    handle.className = "reorderable-editor-trigger reorderable-editor-drag-handle";
    handle.dataset.reorderTrigger = "true";
    handle.dataset.reorderItemId = options.itemId;
    const stableFocusKey = focusKey(options.focusScopeId, options.itemId);
    trigger.dataset.reorderFocusKey = stableFocusKey;
    trigger.setAttribute("data-reorder-focus-key", stableFocusKey);
    if (options.localDraftUndo)
        localDraftMoves.set(trigger, options.onMove);
    triggerScopes.set(trigger, { root: options.focusScope ?? options.orderedContainer ?? options.dropTarget?.parentElement ?? options.dropTarget ?? doc, id: options.focusScopeId });
    handle.setAttribute("data-reorder-trigger", "true");
    handle.setAttribute("data-reorder-item-id", options.itemId);
    handle.append(reorderGrip(doc));
    if (options.existingActionsMenu)
        trigger.dataset.reorderMenuButton = "true";
    if (ownedMenu)
        trigger.setAttribute("aria-label", model.accessibleName);
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", String(options.existingActionsMenu?.expanded ?? false));
    trigger.setAttribute("aria-controls", menu.id || menuId);
    const currentDragScope = () => options.dragScopeId ?? options.orderedContainer ?? options.dropTarget?.parentElement ?? undefined;
    handle.draggable = model.canDrag && Boolean(options.dragScopeId ?? options.orderedContainer ?? options.dropTarget);
    styles(handle, { boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", minWidth: "44px", minHeight: "44px", padding: "0px", margin: "0px", background: "transparent", border: "0px", boxShadow: "none", whiteSpace: "nowrap", overflow: "visible", touchAction: "manipulation", cursor: handle.draggable ? "grab" : "default" });
    handle.addEventListener("pointerenter", () => { handle.dataset.reorderHover = "true"; styles(handle, { background: "color-mix(in srgb, currentColor 14%, Canvas 86%)" }); });
    handle.addEventListener("pointerleave", () => { delete handle.dataset.reorderHover; styles(handle, { background: "transparent" }); });
    menu.id = menu.id || menuId;
    if (ownedMenu) {
        menu.setAttribute("role", "menu");
        menu.hidden = true;
        menu.className = "reorderable-editor-menu";
        styles(menu, { position: "absolute", zIndex: "20", maxWidth: "calc(100vw - 16px)", insetInlineStart: "0", top: "100%" });
    }
    dialog.id = dialogId;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", `Move ${options.itemLabel}`);
    dialog.hidden = true;
    dialog.className = "reorderable-editor-dialog";
    styles(dialog, { position: "fixed", zIndex: "30", inset: "8px", maxWidth: "calc(100vw - 16px)", maxHeight: "calc(100vh - 16px)", overflow: "auto", overflowWrap: "anywhere" });
    const closeMenu = () => { if (!ownedMenu)
        return; menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); };
    const openMenu = () => { if (!ownedMenu)
        return; menu.hidden = false; trigger.setAttribute("aria-expanded", "true"); queueMicrotask(() => menu.querySelector?.('button:not([disabled])')?.focus()); };
    const announceAndFocus = (fromIndex, toIndex, result) => {
        if (result !== true)
            return;
        announceReorderCompletion(doc, { itemId: options.itemId, itemLabel: options.itemLabel, fromIndex, toIndex, fallbackTrigger: trigger });
    };
    const offerUndo = (fromIndex, toIndex) => {
        if (!options.localDraftUndo)
            return;
        const region = undoRegion(doc), undo = button(doc, "Undo move");
        region.replaceChildren(undo);
        region.hidden = false;
        undo.addEventListener("click", () => { const currentTrigger = stableTrigger(doc, options.itemId, trigger), apply = localDraftMoves.get(currentTrigger) ?? options.onMove, result = apply({ itemId: options.itemId, fromIndex: toIndex, toIndex: fromIndex, method: "menu" }); if (result !== true)
            return; region.hidden = true; announceReorderCompletion(doc, { itemId: options.itemId, itemLabel: options.itemLabel, fromIndex: toIndex, toIndex: fromIndex, fallbackTrigger: currentTrigger }); });
    };
    const move = (toIndex, method, destination, placement) => {
        const fromIndex = options.completeOrder.findIndex(({ id }) => id === options.itemId);
        if (fromIndex < 0 || (fromIndex === toIndex && destination?.parentId === undefined))
            return;
        const result = options.onMove({ itemId: options.itemId, fromIndex, toIndex, method,
            ...(destination ? { destinationId: destination.itemId, ...(destination.parentId !== undefined ? { destinationParentId: destination.parentId } : {}), ...(placement ? { placement } : {}) } : {}) });
        announceAndFocus(fromIndex, toIndex, result);
        if (result === true)
            offerUndo(fromIndex, toIndex);
    };
    const closeDialog = () => { dialog.hidden = true; focusTrigger(doc, options.itemId, trigger); };
    const openDialog = () => {
        closeMenu();
        dialog.replaceChildren();
        const summary = doc.createElement("p");
        summary.textContent = `${options.itemLabel}, position ${model.position} of ${model.count}`;
        dialog.append(summary);
        if (model.guidance)
            dialog.append(Object.assign(doc.createElement("p"), { textContent: model.guidance }));
        for (const destination of model.destinations) {
            for (const placement of ["before", "after"]) {
                const location = destination.parentLabel ? ` in ${destination.parentLabel}` : "";
                const control = button(doc, `Move ${placement} ${destination.label}${location}`);
                control.addEventListener("click", () => { const toIndex = reorderPlacementIndex(options.completeOrder, options.itemId, destination.itemId, placement); dialog.hidden = true; move(toIndex, "dialog", destination, placement); });
                dialog.append(control);
            }
        }
        const cancel = button(doc, "Cancel");
        cancel.addEventListener("click", closeDialog);
        dialog.append(cancel);
        dialog.hidden = false;
        queueMicrotask(() => dialog.querySelector?.("button")?.focus());
    };
    for (const item of model.actions) {
        const control = button(doc, item.label);
        control.setAttribute("role", "menuitem");
        control.dataset.reorderMovementAction = item.id;
        control.disabled = item.disabled;
        control.addEventListener("click", () => { if (item.disabled)
            return; if (item.id === "move") {
            openDialog();
            return;
        } closeMenu(); move(actionIndex(options, item.id), "menu"); });
        control.addEventListener("keydown", event => {
            const controls = Array.from(menu.querySelectorAll("button")).filter(candidate => !candidate.disabled), current = controls.indexOf(control);
            if (event.key === "Escape") {
                event.preventDefault();
                closeMenu();
                trigger.focus();
                return;
            }
            const next = event.key === "ArrowDown" ? current + 1 : event.key === "ArrowUp" ? current - 1 : event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1 : -1;
            if (next < 0)
                return;
            event.preventDefault();
            controls[(next + controls.length) % controls.length]?.focus();
        });
        menu.append(control);
    }
    if (ownedMenu) {
        trigger.addEventListener("click", () => menu.hidden ? openMenu() : closeMenu());
        trigger.addEventListener("keydown", event => { if ([" ", "Enter", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            openMenu();
        }
        else if (event.key === "Escape")
            closeMenu(); });
    }
    handle.addEventListener("dragstart", event => { const dragScope = currentDragScope(); if (!model.canDrag || dragScope === undefined) {
        event.preventDefault();
        dragSession = undefined;
        return;
    } handle.dataset.reorderDragging = "true"; styles(handle, { cursor: "grabbing" }); dragSession = { itemId: options.itemId, itemLabel: options.itemLabel, completeOrder: options.completeOrder, legalDestinationIds: new Set(options.legalDestinationIds ?? options.completeOrder.map(({ id }) => id)), dragScope, onMove: options.onMove, ...(options.localDraftUndo ? { offerUndo } : {}), trigger }; event.dataTransfer?.setData("application/x-reorderable-editor-item", options.itemId); });
    handle.addEventListener("dragend", () => { delete handle.dataset.reorderDragging; styles(handle, { cursor: handle.draggable ? "grab" : "default" }); dragSession = undefined; if (options.dropTarget)
        clearDropIndicator(options.dropTarget); });
    dialog.addEventListener("keydown", event => { if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
    } });
    if (options.orderedContainer)
        options.orderedContainer.setAttribute("role", "list");
    if (options.dropTarget) {
        const target = options.dropTarget;
        target.draggable = false;
        if (!options.preserveTargetSemantics) {
            target.setAttribute("role", "listitem");
            target.setAttribute("aria-label", options.itemLabel);
            target.setAttribute("aria-posinset", String(model.position));
            target.setAttribute("aria-setsize", String(model.count));
        }
        const legalDrag = () => { const session = dragSession, dragScope = currentDragScope(); if (!session || session.itemId === options.itemId || !session.legalDestinationIds.has(options.itemId) || dragScope === undefined || session.dragScope !== dragScope)
            return undefined; return session; };
        target.addEventListener("dragover", event => { if (!legalDrag())
            return; event.preventDefault(); const after = event.clientY >= target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2; target.classList.toggle("reorder-drop-before", !after); target.classList.toggle("reorder-drop-after", after); styles(target, { borderBlockStart: after ? "" : "3px solid currentColor", borderBlockEnd: after ? "3px solid currentColor" : "" }); });
        target.addEventListener("dragleave", () => clearDropIndicator(target));
        target.addEventListener("drop", event => { const session = legalDrag(), transferId = event.dataTransfer?.getData("application/x-reorderable-editor-item"); if (!session || transferId && transferId !== session.itemId)
            return; event.preventDefault(); const after = event.clientY >= target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2, fromIndex = session.completeOrder.findIndex(({ id }) => id === session.itemId), toIndex = reorderPlacementIndex(session.completeOrder, session.itemId, options.itemId, after ? "after" : "before"); clearDropIndicator(target); dragSession = undefined; if (fromIndex < 0 || fromIndex === toIndex)
            return; const result = session.onMove({ itemId: session.itemId, fromIndex, toIndex, method: "drag", destinationId: options.itemId, placement: after ? "after" : "before" }); if (result !== true)
            return; announceReorderCompletion(doc, { itemId: session.itemId, itemLabel: session.itemLabel, fromIndex, toIndex, fallbackTrigger: session.trigger }); session.offerUndo?.(fromIndex, toIndex); });
    }
    wrapper.append(handle, ...(ownedMenu ? [menu] : []), dialog);
    return wrapper;
}
export function renderLocalDraftReorderControl(options) {
    return renderReorderControl({ ...options, localDraftUndo: true });
}
//# sourceMappingURL=control.js.map