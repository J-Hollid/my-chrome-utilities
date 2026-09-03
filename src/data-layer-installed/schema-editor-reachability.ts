interface SchemaEditorReachabilityOptions {
  panel:HTMLElement | null;
  scrollOwner:HTMLElement | null;
  scheduleFrame(callback:()=>void):void;
}

function installReachabilityStylesheet(panel:HTMLElement | null):void {
  const document = panel?.ownerDocument;
  if (!document?.head || document.querySelector("link[data-schema-editor-reachability-style]")) return;
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/side-panel-schema-editor-reachability.css";
  stylesheet.dataset.schemaEditorReachabilityStyle = "true";
  document.head.append(stylesheet);
}

export function createSchemaEditorReachability({ panel, scrollOwner, scheduleFrame }:SchemaEditorReachabilityOptions) {
  installReachabilityStylesheet(panel);
  let trigger:HTMLElement | undefined;
  let referenceKey:string | undefined;
  let treeScrollTop:number | undefined;

  return {
    open(nextTrigger?:HTMLElement, nextReferenceKey?:string):void {
      if (treeScrollTop === undefined) treeScrollTop = scrollOwner?.scrollTop ?? 0;
      trigger = nextTrigger ?? trigger;
      referenceKey = nextReferenceKey ?? referenceKey;
      if (panel) panel.dataset.schemaEditorRoute = "active";
      if (scrollOwner) scrollOwner.scrollTop = 0;
    },
    close(resolveReference:(referenceKey:string)=>HTMLElement | undefined):void {
      const restoreTrigger = trigger;
      const restoreReferenceKey = referenceKey;
      const restoreScrollTop = treeScrollTop;
      if (panel) delete panel.dataset.schemaEditorRoute;
      trigger = undefined;
      referenceKey = undefined;
      treeScrollTop = undefined;
      scheduleFrame(() => {
        if (scrollOwner && restoreScrollTop !== undefined) scrollOwner.scrollTop = restoreScrollTop;
        (restoreReferenceKey ? resolveReference(restoreReferenceKey) : restoreTrigger)?.focus({ preventScroll:true });
      });
    },
    reset():void {
      if (panel) delete panel.dataset.schemaEditorRoute;
      trigger = undefined;
      referenceKey = undefined;
      treeScrollTop = undefined;
    },
  };
}
