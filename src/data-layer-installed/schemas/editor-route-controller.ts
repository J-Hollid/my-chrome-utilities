export interface SchemaEditorRoutePorts {
  panel: HTMLElement | null;
  scrollOwner: HTMLElement | null;
  scheduleFrame(callback: () => void): void;
}

export interface SchemaEditorRouteController {
  mount(): void;
  dispose(): void;
  open(trigger?: HTMLElement, referenceKey?: string): void;
  close(resolveReference: (referenceKey: string) => HTMLElement | undefined): void;
  invokingReference(): string | undefined;
}

function installReachabilityStylesheet(panel: HTMLElement | null): void {
  const document = panel?.ownerDocument;
  if (!document?.head || document.querySelector("link[data-schema-editor-reachability-style]")) return;
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/side-panel-schema-editor-reachability.css";
  stylesheet.dataset.schemaEditorReachabilityStyle = "true";
  document.head.append(stylesheet);
}

export function createSchemaEditorRouteController(
  ports: SchemaEditorRoutePorts,
): SchemaEditorRouteController {
  let mounted = false;
  let trigger: HTMLElement | undefined;
  let referenceKey: string | undefined;
  let treeScrollTop: number | undefined;

  const handleEditorKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "PageDown" || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        ports.panel?.dataset.schemaEditorRoute !== "active") return;
    const detail = ports.panel.querySelector<HTMLElement>("#schema-detail");
    if (!detail) return;
    detail.scrollBy({ top:Math.max(1, Math.floor(detail.clientHeight * 0.85)), behavior:"auto" });
    event.preventDefault();
  };

  return {
    mount(): void {
      if (mounted) return;
      mounted = true;
      installReachabilityStylesheet(ports.panel);
      ports.panel?.addEventListener("keydown", handleEditorKeydown);
    },
    dispose(): void {
      if (!mounted) return;
      mounted = false;
      ports.panel?.removeEventListener("keydown", handleEditorKeydown);
      if (ports.panel) delete ports.panel.dataset.schemaEditorRoute;
      trigger = undefined;
      referenceKey = undefined;
      treeScrollTop = undefined;
    },
    open(nextTrigger, nextReferenceKey): void {
      if (treeScrollTop === undefined) treeScrollTop = ports.scrollOwner?.scrollTop ?? 0;
      trigger = nextTrigger ?? trigger;
      referenceKey = nextReferenceKey ?? referenceKey;
      if (ports.panel) ports.panel.dataset.schemaEditorRoute = "active";
      if (ports.scrollOwner) ports.scrollOwner.scrollTop = 0;
    },
    close(resolveReference): void {
      const restoreTrigger = trigger;
      const restoreReferenceKey = referenceKey;
      const restoreScrollTop = treeScrollTop;
      if (ports.panel) delete ports.panel.dataset.schemaEditorRoute;
      trigger = undefined;
      referenceKey = undefined;
      treeScrollTop = undefined;
      ports.scheduleFrame(() => {
        if (ports.scrollOwner && restoreScrollTop !== undefined) ports.scrollOwner.scrollTop = restoreScrollTop;
        (restoreReferenceKey ? resolveReference(restoreReferenceKey) : restoreTrigger)?.focus({ preventScroll:true });
      });
    },
    invokingReference: () => referenceKey,
  };
}
