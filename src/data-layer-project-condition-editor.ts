import type {Condition} from "./data-layer-specification-project.js";
import {
  renderSharedProjectConditionTree,
  type SharedProjectCondition,
} from "./data-layer-shared-condition-tree-editor.js";

const values=new WeakMap<HTMLFieldSetElement,Condition>();
const emptyCondition=():Condition=>({kind:"all",conditions:[]});
const clone=<T>(value:T):T=>structuredClone(value);

export function projectConditionEditorDraft(condition:Condition|undefined):Condition {
  return clone(condition??emptyCondition());
}

export function mountProjectConditionEditor(
  host:HTMLFieldSetElement,
  condition:Condition|undefined,
):void {
  host.dataset.conditionBuilder="true";
  host.dataset.conditionPresentation="shared";
  values.set(host,projectConditionEditorDraft(condition));
  renderSharedProjectConditionTree(host,{
    dom:host.ownerDocument,
    ...(condition?{condition:condition as SharedProjectCondition}:{}),
    onChange:(next)=>{
      values.set(host,clone((next as Condition|undefined)??emptyCondition()));
    },
  });
}

export function projectConditionEditorValue(host:HTMLFieldSetElement):Condition {
  return clone(values.get(host)??emptyCondition());
}
