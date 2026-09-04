import type { AssignmentDataConditionEditorState } from "../../data-layer-schema-assignment-data-conditions-ui.js";

/** Owns installed Schema assignment editor and condition state. */
export class SchemaAssignmentController {
  editing:{ schemaId:string; assignmentId?:string } | undefined;
  conditions:AssignmentDataConditionEditorState = { target:"payload", suggestions:[] };
  readonly #disposers:Array<() => void> = [];

  own(dispose:()=>void):void { this.#disposers.push(dispose); }
  dispose():void {
    this.editing = undefined;
    this.conditions = { target:"payload", suggestions:[] };
    for (const dispose of this.#disposers.splice(0)) dispose();
  }
}
