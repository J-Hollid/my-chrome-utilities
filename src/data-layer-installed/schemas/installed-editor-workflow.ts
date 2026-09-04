import type { SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { SchemaLibraryController } from "./library-controller.js";
import type { SchemaLibraryEditor } from "./library-editor.js";
import type { SchemaPropertyController } from "./property-controller.js";
import { schemaEditorDraft } from "./schema-model.js";

export interface SchemaInstalledEditorWorkflowPorts {
  root:ParentNode;
  library:SchemaLibraryController;
  editor:SchemaLibraryEditor;
  property:SchemaPropertyController;
  schemaEditor:HTMLElement|null;
  schemaDetailEmpty:HTMLElement|null;
  schemaEditorName:HTMLElement|null;
  propertyFilter:HTMLInputElement|null;
  subviews:readonly HTMLButtonElement[];
  panels:readonly HTMLElement[];
  liveEventQuery:HTMLElement|null;
  specificationBuilder:HTMLElement|null;
  renderProperty():void;
  renderAll():void;
  showSchemas():void;
  openRoute(trigger?:HTMLElement):void;
  createEmpty():void;
  settleCanonical:boolean;
  renderSpecification(root:HTMLElement,schema:SchemaDefinition,schemas:readonly SchemaDefinition[],surface:`published:${number}`|`historical:${number}`|"working-draft",close:()=>void):void;
}

/** Owns installed editor commands, subviews, property adapters, and specification UI. */
export class SchemaInstalledEditorWorkflow {
  readonly #ports:SchemaInstalledEditorWorkflowPorts;
  constructor(ports:SchemaInstalledEditorWorkflowPorts) { this.#ports=ports; }

  editorBindings(ops:{updateTree():void;recheck():void;persistTreeScroll():void;navigateTree(event:KeyboardEvent):void;rememberCanonicalScroll():void}) {
    return { ...ops,createSchema:() => this.openNew(),updateName:() => this.updateName(),saveDescription:() => this.saveDescription(),updateTarget:() => this.updateTarget(),changeParent:() => this.changeParent(),changeDeclaredOnly:() => this.changeDeclaredOnly(),openRevision:() => this.openRevision(),confirmRevision:() => this.confirmRevision(),cancelRevision:() => this.cancelRevision(),discardDraft:() => this.discardTransient(),keepEditing:() => this.keepEditing(),closeEditor:() => this.closeEditor(),saveAndClose:() => this.openRevision(),saveCloseReview:() => this.saveFromCloseReview(),discardWorking:() => this.discardWorking(),renderRevision:() => this.renderRevision(),duplicateRevision:() => this.duplicateRevision(),restoreRevision:() => this.restoreRevision() };
  }
  propertyBindings(ops:{render():void;undoCopy():void;cancelRulePicker(event:Event):void;navigateRulePicker(event:KeyboardEvent):void}) {
    return { ...ops,openManual:() => this.openManual(),clearFilter:() => this.clearPropertyFilter(),activateSubview:(event:Event) => this.activateSubview(event),confirmRemoval:() => this.confirmRemoval(),cancelRemoval:(event?:Event) => this.cancelRemoval(event),undoRemoval:() => this.undoRemoval(),confirmDocumentationRemoval:() => this.confirmDocumentationRemoval(),cancelDocumentationRemoval:(event?:Event) => this.cancelDocumentationRemoval(event),renderSpecificIndex:() => this.renderSpecificIndex(),submitSpecificIndex:(event:Event) => this.submitSpecificIndex(event),closeSpecificIndex:(event?:Event) => this.closeSpecificIndex(event),renderManual:() => this.renderManual(),submitManual:(event:Event) => this.submitManual(event),closeManual:(event?:Event) => this.closeManual(event),goToExisting:() => this.goToExisting() };
  }

  persistDraft():void { this.#ports.editor.persistDraft(); }
  updateName():void { this.#ports.editor.updateName(); }
  saveDescription():void { this.#ports.editor.saveDescription(); }
  updateTarget():void { this.#ports.editor.updateTarget(); }
  changeParent():void { this.#ports.editor.changeParent(); }
  changeDeclaredOnly():void { this.#ports.editor.changeAdditionalProperties(); }
  openRevision():void { this.#ports.editor.openRevisionReview(); }
  confirmRevision():void { this.#ports.editor.confirmRevision(); }
  cancelRevision():void { this.#ports.editor.cancelRevision(); }
  discardTransient():void { this.#ports.editor.discardTransient(); }
  keepEditing():void { this.#ports.editor.keepEditing(); }
  closeEditor():void { this.#ports.editor.closeEditor(); }
  discardWorking():void { this.#ports.editor.discardWorking(); }
  renderRevision():void { this.#ports.editor.render(); }
  duplicateRevision():void { this.#ports.editor.duplicateRevision(); }
  restoreRevision():void { this.#ports.editor.restoreRevision(); }
  publish(close=false):SchemaDefinition { return this.#ports.editor.publish(close); }

  saveFromCloseReview():void {
    const dialog=this.#ports.root.querySelector<HTMLDialogElement>("#close-schema-editor-review");
    dialog?.close(); if (dialog) dialog.hidden=true; this.openRevision();
  }

  clearPropertyFilter():void {
    const filter=this.#ports.propertyFilter;if (filter) filter.value="";
    this.#ports.renderProperty();filter?.focus();
  }

  showSubview(subview:string):void {
    for (const tab of this.#ports.subviews) {
      const target=tab.dataset.schemaSubview ?? tab.getAttribute("aria-controls"),selected=target===subview;
      tab.setAttribute("aria-selected",String(selected));tab.tabIndex=selected ? 0 : -1;
    }
    for (const panel of this.#ports.panels) panel.hidden=panel.id!==subview;
    if (this.#ports.liveEventQuery) this.#ports.liveEventQuery.hidden=subview!=="schema-master";
  }

  activateSubview(event:Event):void {
    const tab=event.currentTarget as HTMLButtonElement;
    const subview=tab.dataset.schemaSubview ?? tab.getAttribute("aria-controls") ?? undefined;
    if (subview) this.showSubview(subview);
  }

  requestRemoval(path:string,trigger?:HTMLButtonElement):void { this.#ports.property.requestRemoval(path,trigger); }
  confirmRemoval():void { this.#ports.property.confirmRemoval(); }
  cancelRemoval(event?:Event):void { this.#ports.property.cancelRemoval(event); }
  undoRemoval():void { this.#ports.property.undoRemoval(); }
  requestDocumentationRemoval(path:string,trigger?:HTMLElement):void { this.#ports.property.requestDocumentationRemoval(path,trigger); }
  confirmDocumentationRemoval():void {
    this.#ports.property.confirmDocumentationRemoval();
    this.#ports.schemaEditor?.setAttribute("aria-busy",String(this.#ports.settleCanonical));
  }
  cancelDocumentationRemoval(event?:Event):void { event?.preventDefault();this.#ports.property.closeDocumentationRemoval(); }
  openCopy(path:string,triggerOrDestination:HTMLButtonElement|string):void { this.#ports.property.openCopy(path,triggerOrDestination); }
  confirmCopy():void { this.#ports.property.confirmCopy(); }
  undoCopy():void { this.#ports.property.undoCopy(); }
  renderSpecificIndex():void { this.#ports.property.renderSpecificIndex(); }
  openSpecificIndex(path:string,trigger?:HTMLButtonElement):void { this.#ports.property.openSpecificIndex(path,trigger); }
  submitSpecificIndex(event:Event):void { this.#ports.property.submitSpecificIndex(event); }
  closeSpecificIndex(event?:Event):void { this.#ports.property.closeSpecificIndex(event); }
  renderManual():void { this.#ports.property.renderManual(); }
  openManual(parentPath?:string,trigger?:HTMLButtonElement):void { this.#ports.property.openManual(parentPath,trigger); }
  submitManual(event:Event):void { this.#ports.property.submitManual(event); }
  closeManual(event?:Event):void { event?.preventDefault();this.#ports.property.closeManual(); }
  goToExisting():void { this.#ports.property.goToExisting(); }

  openNew():void { this.#ports.openRoute();this.#ports.createEmpty(); }
  openDraft(schema:SchemaDefinition):void {
    this.#ports.library.activeSchemaId=schema.id;this.#ports.library.draft=schemaEditorDraft(schema);
    this.#ports.showSchemas();this.#ports.renderAll();this.#ports.schemaEditorName?.focus({ preventScroll:true });
  }

  openSpecification(schema:SchemaDefinition,surface:`published:${number}`|`historical:${number}`|"working-draft",trigger:HTMLButtonElement):void {
    const root=this.#ports.specificationBuilder;if (!root) return;root.hidden=false;
    if (this.#ports.schemaEditor) this.#ports.schemaEditor.hidden=true;
    if (this.#ports.schemaDetailEmpty) this.#ports.schemaDetailEmpty.hidden=true;
    this.#ports.renderSpecification(root,structuredClone(schema),structuredClone(this.#ports.library.schemas),surface,() => {
      root.hidden=true;this.#ports.editor.render();trigger.focus({ preventScroll:true });
    });
  }
}
