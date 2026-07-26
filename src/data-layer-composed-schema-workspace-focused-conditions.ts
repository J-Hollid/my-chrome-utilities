import type {CanonicalPredicate} from "./data-layer-canonical-schema.js";
import {focusedConditionLabel} from "./data-layer-focused-schema-property-ui.js";
import {renderSharedConditionTree} from "./data-layer-shared-condition-tree-editor.js";
import type {ComposedFocusedSectionContext} from "./data-layer-composed-schema-workspace-focused-sections.js";

/** Assign missing identities once; subsequent structural moves retain them. */
export const ensureComposedConditionIds=(
  condition:Record<string,unknown>,
  id:(kind:string)=>string=()=>`condition:${crypto.randomUUID()}`,
):Record<string,unknown>=>{
  const withId:Record<string,unknown>={
    ...condition,
    id:String(condition.id??id("condition")),
  };
  if(withId.kind!=="predicate") {
    withId.children=(Array.isArray(withId.children)?withId.children:[]).map(
      (child:unknown)=>ensureComposedConditionIds(child as Record<string,unknown>,id),
    );
  }
  return withId;
};

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
