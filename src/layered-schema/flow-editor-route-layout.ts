export interface FlowEditorReturnState {
  scrollLeft: number;
  scrollTop: number;
  viewBox: string;
  expandedExample?: {selector:string;open:boolean};
  originSelector?: string;
}

interface FlowEditorRouteLayoutOptions {
  document: Pick<Document,"querySelector">;
  workspace: Pick<HTMLElement,"hidden">;
  editorHost: Pick<HTMLElement,"hidden"|"scrollTop">;
  editor: Pick<HTMLElement,"hidden"|"replaceChildren">;
}

export type FlowEditorContributorKind = "page-frame" | "occurrence" | "page-group";

const escapeSelector=(value:string):string=>globalThis.CSS?.escape(value)??
  value.replaceAll(/[^a-zA-Z0-9_-]/gu,(character)=>`\\${character}`);

export function createFlowEditorRouteLayout(options:FlowEditorRouteLayoutOptions) {
  const open=():void=>{
    options.workspace.hidden=true;
    options.editorHost.scrollTop=0;
    options.editorHost.hidden=false;
    options.editor.hidden=false;
  };
  const close=():void=>{
    options.editor.hidden=true;
    options.editorHost.hidden=true;
    options.workspace.hidden=false;
  };
  const depart=():void=>{
    close();
    options.editor.replaceChildren();
  };
  const captureReturn=(kind:FlowEditorContributorKind,idValue:string,originFocus?:HTMLElement):FlowEditorReturnState|undefined=>{
    const pane=options.document.querySelector<HTMLElement>("#workspace-pane"),
      graph=options.document.querySelector<SVGSVGElement>('[aria-label="Interactive directional Flow canvas"]');
    if(!pane)return undefined;
    const escaped=escapeSelector(idValue),exampleSelector=kind==="page-frame"
      ?`[data-page-example-for="${escaped}"]`
      :kind==="occurrence"?`[data-event-example-for="${escaped}"]`:undefined,
      example=exampleSelector?options.document.querySelector<HTMLDetailsElement>(exampleSelector):undefined,
      inline=originFocus?.closest('[aria-label="Selected Page instance inline actions"]'),
      originSelector=originFocus?(inline
        ?'[aria-label="Selected Page instance inline actions"] [data-flow-schema-contribution="true"]'
        :kind==="page-frame"?`[data-page-frame-id="${escaped}"] [data-flow-schema-contribution="true"]`:undefined)
        :undefined;
    return {scrollLeft:pane.scrollLeft,scrollTop:pane.scrollTop,
      viewBox:graph?.getAttribute("viewBox")??"",
      ...(example?{expandedExample:{selector:exampleSelector!,open:example.open}}:{}),
      ...(originSelector?{originSelector}:{})};
  };
  const restoreReturn=(saved:FlowEditorReturnState|undefined,returnFocus?:HTMLElement):void=>{
    if(!saved)return;
    const apply=()=>{
      const pane=options.document.querySelector<HTMLElement>("#workspace-pane"),
        graph=options.document.querySelector<SVGSVGElement>('[aria-label="Interactive directional Flow canvas"]');
      if(pane){pane.scrollLeft=saved.scrollLeft;pane.scrollTop=saved.scrollTop;}
      if(saved.expandedExample){
        const example=options.document.querySelector<HTMLDetailsElement>(saved.expandedExample.selector);
        if(example)example.open=saved.expandedExample.open;
      }
      if(graph&&saved.viewBox&&graph.getAttribute("viewBox")!==saved.viewBox){
        graph.setAttribute("viewBox",saved.viewBox);
      }
      const ownedFocus=saved.originSelector
        ?options.document.querySelector<HTMLElement>(saved.originSelector)
        :undefined,target=ownedFocus??(returnFocus?.isConnected?returnFocus:undefined);
      target?.focus({preventScroll:true});
    };
    apply();
    queueMicrotask(apply);
    setTimeout(apply,0);
    setTimeout(apply,50);
  };
  return {open,close,depart,captureReturn,restoreReturn};
}
