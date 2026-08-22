export function compactFlowPageIdentity({ sourceName, nameInFlow, status }) {
    const visibleName = nameInFlow?.trim() || sourceName;
    return {
        visibleName,
        accessibleName: `${visibleName}. Context-setting Page. Source Page ${sourceName}. ${status}. Drag or use Arrow keys to move.`,
    };
}
export function decorateCompactFlowCards(canvas, duplicateFrames, outline) {
    for (const card of Array.from(duplicateFrames?.querySelectorAll("[data-page-frame-id]") ?? [])) {
        const frameId = card.dataset.pageFrameId;
        const group = frameId ? canvas.querySelector(`[data-page-frame-id="${CSS.escape(frameId)}"]`) : undefined;
        if (!group || group.querySelector(".flow-page-identity"))
            continue;
        const nameControl = card.querySelector('[aria-label^="Name in this Flow for "]');
        const source = nameControl?.getAttribute("aria-label")?.replace("Name in this Flow for ", "") ?? "Page";
        const status = card.querySelector("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
        const identity = compactFlowPageIdentity({ sourceName: source, nameInFlow: nameControl?.value, status });
        const visibleIdentity = Array.from(group.children).find((child) => child.tagName.toLowerCase() === "text" && !child.classList.contains("flow-readiness"));
        if (!visibleIdentity)
            continue;
        visibleIdentity.textContent = identity.visibleName;
        visibleIdentity.classList.add("flow-page-identity");
        for (const staleSource of Array.from(group.querySelectorAll(".flow-page-source")))
            staleSource.remove();
        const readiness = document.createElementNS(canvas.namespaceURI, "text");
        readiness.setAttribute("x", "14");
        readiness.setAttribute("y", "54");
        readiness.classList.add("flow-readiness");
        readiness.textContent = status;
        group.classList.add("flow-page-card");
        group.append(readiness);
        group.setAttribute("aria-label", identity.accessibleName);
    }
    for (const row of Array.from(outline?.querySelectorAll("[data-occurrence-id]") ?? [])) {
        const occurrenceId = row.dataset.occurrenceId;
        const group = occurrenceId ? canvas.querySelector(`[data-occurrence-id="${CSS.escape(occurrenceId)}"]`) : undefined;
        if (!group || group.querySelector(".flow-readiness"))
            continue;
        const status = row.querySelector("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
        const readiness = document.createElementNS(canvas.namespaceURI, "text");
        readiness.setAttribute("x", "12");
        readiness.setAttribute("y", "76");
        readiness.classList.add("flow-readiness");
        readiness.textContent = status;
        group.append(readiness);
        group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Event occurrence"}. ${status}.`);
    }
}
//# sourceMappingURL=workspace-card-ui.js.map