import type {CanonicalPredicate} from "./data-layer-canonical-schema.js";
import {focusedConditionLabel} from "./data-layer-focused-schema-property-ui.js";
import {renderSharedConditionTree} from "./data-layer-shared-condition-tree-editor.js";
import type {ComposedFocusedSectionContext} from "./data-layer-composed-schema-workspace-focused-sections.js";

export function renderComposedFocusedCondition(
  host:HTMLElement,
  context:ComposedFocusedSectionContext,
):void {
  const {dom}=context;
  const draft=context.getDraft();
  if(!draft) return;

  const summary=dom.createElement("p");
  const tree=dom.createElement("div");
  summary.setAttribute("aria-label","Condition tree summary");
  summary.textContent=focusedConditionLabel(
    draft.condition as unknown as Record<string,unknown>|undefined,
  );

  renderSharedConditionTree(tree,{
    dom,
    ...(draft.condition
      ? {condition:draft.condition as unknown as CanonicalPredicate}
      : {}),
    properties:()=>context.model.rows.map(({path,effective})=>({
      id:effective.definitionId??path,
      name:path.split("/").filter(Boolean).at(-1)??path,
      ...(effective.type?{type:effective.type}:{}),
    })),
    id:(kind)=>`${kind}:${crypto.randomUUID()}`,
    onChange:(condition)=>{
      if(condition) {
        draft.condition=condition as typeof draft.condition;
      } else {
        draft.condition={kind:"all",children:[]};
      }
      summary.textContent=focusedConditionLabel(
        condition as unknown as Record<string,unknown>|undefined,
      );
    },
  });

  host.append(summary,tree);
}
