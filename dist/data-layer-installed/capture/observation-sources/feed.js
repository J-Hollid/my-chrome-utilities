export function createObservationSourceFilter(root, changed) {
    const host = root.querySelector("#live-event-list");
    let select, count, fingerprint = "";
    return {
        render(state, visibleCount) {
            if (!host)
                return;
            if (!select) {
                const label = document.createElement("label");
                label.textContent = "Source";
                select = document.createElement("select");
                select.id = "live-source-filter";
                select.setAttribute("aria-label", "Source");
                select.addEventListener("change", () => changed(select?.value || undefined));
                count = document.createElement("output");
                count.id = "live-source-filter-count";
                count.setAttribute("aria-live", "polite");
                label.append(select, count);
                host.prepend(label);
            }
            const sources = new Map();
            for (const event of state.events) {
                sources.set(event.sourceId, { id: event.sourceId, name: event.sourceName ?? event.sourceId, path: event.sourcePath ?? "" });
            }
            for (const source of state.sources)
                sources.set(source.id, { id: source.id, name: source.name, path: source.path ?? "" });
            const next = JSON.stringify([...sources.values()]);
            if (next !== fingerprint) {
                fingerprint = next;
                select.replaceChildren(new Option("All sources", ""), ...[...sources.values()].map(source => new Option(source.name + (source.path ? " — " + source.path : ""), source.id)));
            }
            select.value = state.sourceFilterId ?? "";
            if (count)
                count.textContent = `${visibleCount} event${visibleCount === 1 ? "" : "s"}`;
        },
        dispose() { select?.parentElement?.remove(); select = undefined; count = undefined; },
    };
}
export function renderObservationSourceDetails(host, event) {
    if (!host || !event.sourcePath)
        return;
    host.querySelector("[data-observation-source-details]")?.remove();
    const detail = document.createElement("p");
    detail.dataset.observationSourceDetails = event.sourceId;
    detail.textContent = `Source: ${event.sourceName ?? event.sourceId} — ${event.sourcePath}`;
    host.prepend(detail);
}
//# sourceMappingURL=feed.js.map