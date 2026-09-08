import type {LiveEvent, LiveObserverState} from "../../../data-layer-live-observer.js";

export function createObservationSourceFilter(root: ParentNode, changed: (sourceId: string | undefined) => void) {
  const host = root.querySelector<HTMLElement>("#live-event-list");
  let select: HTMLSelectElement | undefined, count: HTMLOutputElement | undefined, fingerprint = "";
  return {
    render(state: LiveObserverState, visibleCount: number): void {
      if (!host) return;
      if (!select) {
        const label = document.createElement("label");
        label.textContent = "Source";
        select = document.createElement("select"); select.id = "live-source-filter"; select.setAttribute("aria-label", "Source");
        select.addEventListener("change", () => changed(select?.value || undefined));
        count = document.createElement("output"); count.id = "live-source-filter-count"; count.setAttribute("aria-live", "polite");
        label.append(select,count); host.prepend(label);
      }
      const sources = new Map<string,{id:string;name:string;path:string}>();
      for (const event of state.events) {
        sources.set(event.sourceId,{id:event.sourceId,name:event.sourceName ?? event.sourceId,path:event.sourcePath ?? ""});
      }
      for (const source of state.sources) sources.set(source.id,{id:source.id,name:source.name,path:source.path??""});
      const next = JSON.stringify([...sources.values()]);
      if (next !== fingerprint) {
        fingerprint = next;
        select.replaceChildren(new Option("All sources",""),
          ...[...sources.values()].map(source => new Option(source.name + (source.path ? " — " + source.path : ""),source.id)));
      }
      select.value = state.sourceFilterId ?? "";
      if (count) count.textContent = `${visibleCount} event${visibleCount === 1 ? "" : "s"}`;
    },
    dispose(): void { select?.parentElement?.remove(); select = undefined; count = undefined; },
  };
}
export function renderObservationSourceDetails(host: HTMLElement | null, event: LiveEvent): void {
  if (!host || !event.sourcePath) return;
  host.querySelector("[data-observation-source-details]")?.remove();
  const detail = document.createElement("p"); detail.dataset.observationSourceDetails = event.sourceId;
  detail.textContent = `Source: ${event.sourceName ?? event.sourceId} — ${event.sourcePath}`;
  host.prepend(detail);
}
