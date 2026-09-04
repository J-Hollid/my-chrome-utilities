import type {
  AppliedSchemaPropertyCopy,
  CanonicalSchemaDocument,
  SchemaPropertyRemoval,
} from "../../utilities/data-layer/schemas.js";
import type { SchemaPropertyCopyPlan } from "../../data-layer-schema-property-copy.js";

interface PropertyCopyReview { close():void }

/** Owns the transient state for installed Schema property authoring. */
export class SchemaPropertyController {
  selectedPath = "example";
  readonly expandedRulePaths = new Set<string>();
  pendingRemoval:{ path:string; trigger?:HTMLButtonElement } | undefined;
  lastRemoval:SchemaPropertyRemoval | undefined;
  lastCopy:AppliedSchemaPropertyCopy | undefined;
  pendingCopy:SchemaPropertyCopyPlan | undefined;
  pendingCopyReview:PropertyCopyReview | undefined;
  pendingCopyPosition:{ schemaId:string; settlementSchemaId:string; path:string; editorScroll:number; treeScroll:number } | undefined;
  pendingDocumentationRemoval:{ path:string; trigger?:HTMLElement } | undefined;
  specificIndexArrayPath:string | undefined;
  specificIndexTrigger:HTMLButtonElement | undefined;
  pendingManualContext:{ parentPath:string; trigger?:HTMLButtonElement } | undefined;
  pendingManualCanonicalBase:CanonicalSchemaDocument | undefined;
  interactionReturn:{ schemaId:string; path:string; triggerLabel:string; editorScroll:number; treeScroll:number; detailScroll:number } | undefined;
  renderSequence = 0;

  dispose(resetCopyDialog:()=>void):void {
    this.pendingRemoval = undefined;
    this.pendingDocumentationRemoval = undefined;
    this.lastRemoval = undefined;
    this.pendingCopyReview?.close();
    this.pendingCopyReview = undefined;
    resetCopyDialog();
    this.pendingCopy = undefined;
    this.lastCopy = undefined;
    this.pendingCopyPosition = undefined;
    this.specificIndexArrayPath = undefined;
    this.specificIndexTrigger = undefined;
    this.pendingManualContext = undefined;
    this.pendingManualCanonicalBase = undefined;
    this.interactionReturn = undefined;
    this.expandedRulePaths.clear();
  }
}
