import assert from "node:assert/strict";

const { SchemaLibraryController } = await import(
  "../../../dist/data-layer-installed/schemas/library-controller.js"
);
const { SchemaLibraryEditor } = await import(
  "../../../dist/data-layer-installed/schemas/library-editor.js"
);
const { schemaEditorDraft, withSchemaParent } = await import(
  "../../../dist/data-layer-installed/schemas/schema-model.js"
);
const { proposeSchemaWorkingDraftName } = await import(
  "../../../dist/utilities/data-layer/schemas.js"
);

function fakeDom() {
  let document;
  const make = () => {
    const listeners = new Map();
    return {
      ownerDocument:document, children:[], dataset:{}, style:{ setProperty() {} },
      textContent:"", value:"", hidden:false, disabled:false, checked:false, open:false,
      addEventListener(type, listener) { listeners.set(type, listener); },
      removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
      dispatch(type, input={}) { listeners.get(type)?.({ target:this, currentTarget:this, preventDefault() {}, ...input }); },
      click() { this.dispatch("click"); this.onclick?.(); },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children=children; },
      setAttribute(name, value) { this[name]=value; },
      showModal() { this.open=true; }, close() { this.open=false; },
      focus(options) { this.focused=true; this.focusOptions=options; },
    };
  };
  document={ createElement:() => make() };
  const ids=[
    "schema-editor","schema-detail","schema-detail-empty","schema-editor-name","schema-editor-status",
    "schema-editor-description","schema-description-origin","schema-editor-target","schema-only-declared-properties",
    "schema-editor-parent","schema-inheritance-provenance","schema-rule-overrides","schema-rule-override-list",
    "save-schema","save-schema-reason","build-specification","schema-revision-selector","duplicate-schema-revision",
    "restore-schema-revision","build-historical-specification","close-schema-editor-review-summary",
    "confirm-schema-revision","schema-revision-comparison","schema-editor-name-assistance","schema-revision-review-summary",
    "schema-revision-review","close-schema-editor-review","schema-result","schema-inherited-rule-groups",
    "schema-effective-rule-preview",
  ];
  const elements=new Map(ids.map((id) => [`#${id}`,make()]));
  return { document, elements, root:{ querySelector:(selector) => elements.get(selector) ?? null } };
}

const page={
  id:"schema:page", name:"Page", version:1, published:true, assignments:[],
  document:{ type:"object", properties:{ title:{ type:"string" } } },
  attachedRules:[], documentation:{ description:"Original" },
};
const parent={
  id:"schema:parent", name:"Parent", version:2, published:true, assignments:[],
  document:{ type:"object", properties:{ inherited:{ type:"string" } } },
  attachedRules:[{ id:"rule:parent", version:1, propertyPath:"/inherited", enabled:true }],
};
const values=new Map([["library",JSON.stringify([page,parent])]]);
let schemaStorageWrites=0;
const library=new SchemaLibraryController({
  storage:{ getItem:() => values.get("library"), setItem:(_key,value) => { schemaStorageWrites+=1; values.set("library",value); } },
  changed() {},
});
const { document, elements, root }=fakeDom();
const calls={ render:0, property:0, live:0, specifications:[], closedCanonical:0 };
const relationshipActions=calls.specifications;
const canonical={ editorDocument:()=>undefined,editorLabel:()=>undefined,hasEditor:()=>false,
  closeEditor() { calls.closedCanonical+=1; } };
const ports={
  root, document, library, canonical,
  active:() => library.active(), editorDraft:schemaEditorDraft,
  replaceActive:(schema) => library.replaceActive(schema),
  persist:() => library.persist(), renderAll:() => { calls.render+=1; },
  renderProperty:() => { calls.property+=1; },
  revisionVersion:() => Number(elements.get("#schema-revision-selector").value),
  openSpecification:(schema,surface) => calls.specifications.push(`${schema.id}:${surface}`),
  listen:(target,type,listener) => target?.addEventListener(type,listener),
  proposeName:proposeSchemaWorkingDraftName,
  persistIfStored:() => { if (library.activeIndex() >= 0) library.persist(); },
  persistLibraries:() => library.persist(), closeCanonical:() => canonical.closeEditor(),
  beginSettlement:() => 1, clearSettlement() {}, mounted:() => true, renderCanonical() {},
  revalidate:() => { calls.live+=3; return 3; }, rules:() => [{ id:"rule:parent", name:"Parent required" }],
  addPublishedRules:() => false, withParent:withSchemaParent,
};
const editor=new SchemaLibraryEditor(ports);
canonical.editorDocument=()=>({revision:0});
canonical.editorLabel=()=>"Context contract";
canonical.hasEditor=()=>true;
editor.render();

// retired-schema-assertion: canonical-edit-history-settlement-overlay-021
assert.match(elements.get("#schema-editor-status").textContent,/Context contract · Schema revision 0/u,
  "an installed contributor presents its canonical revision instead of the unrelated Saved Schema draft status alone");
canonical.editorDocument=()=>undefined;
canonical.editorLabel=()=>undefined;
canonical.hasEditor=()=>false;

const sourceDraft={
  id:"schema:source", name:"Checkout", version:1, published:false,
  document:{ type:"object", properties:{ total:{ type:"number" } } },
  assignments:[{ sourceId:"gtm", eventName:"checkout", target:"payload" }],
  workingDraft:{
    baseVersion:0, sourceVersion:0, name:"Checkout",
    document:{ type:"object", properties:{ total:{ type:"number" } } },
    assignments:[{ sourceId:"gtm", eventName:"checkout", target:"payload" }],
    attachedRules:[], pendingChanges:["Library template fields loaded into a new schema draft."],
  },
};
const sourceLibraryBefore=library.schemas;
const sourceStorageBefore=values.get("library");
library.setDraft(sourceDraft);
editor.openRevisionReview();
// retired-schema-assertion: source-drafts-revision-publication-close-022
assert.equal(elements.get("#schema-revision-review").open,true);
editor.cancelRevision();
// retired-schema-assertion: source-drafts-revision-publication-close-023
assert.deepEqual(library.schemas,sourceLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-024
assert.equal(values.get("library"),sourceStorageBefore);
editor.discardTransient();
// retired-schema-assertion: source-drafts-revision-publication-close-025
assert.deepEqual(library.schemas,sourceLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-026
assert.equal(values.get("library"),sourceStorageBefore);
library.setDraft(sourceDraft);
const sourceWritesBeforePublish=schemaStorageWrites;
const sourcePublished=editor.publish(true);
// retired-schema-assertion: source-drafts-revision-publication-close-027
assert.equal(library.schemas.length,sourceLibraryBefore.length+1);
// retired-schema-assertion: source-drafts-revision-publication-close-028
assert.equal(elements.get("#schema-result").textContent,
  "Published Checkout revision 1. Revalidated 3 current Live events.");
editor.render();
// retired-schema-assertion: source-drafts-revision-publication-close-029
assert.equal(elements.get("#schema-result").textContent,
  "Published Checkout revision 1. Revalidated 3 current Live events.");
// retired-schema-assertion: source-drafts-revision-publication-close-030
assert.deepEqual(sourcePublished.assignments,[{ sourceId:"gtm", eventName:"checkout", target:"payload" }]);
// retired-schema-assertion: source-drafts-revision-publication-close-031
assert.equal(sourcePublished.document.properties.total.type,"number");
// retired-schema-assertion: source-drafts-revision-publication-close-032
assert.equal(schemaStorageWrites,sourceWritesBeforePublish+1);
// retired-schema-assertion: source-drafts-revision-publication-close-033
assert.equal(library.activeSchemaId,undefined);
// retired-schema-assertion: source-drafts-revision-publication-close-034
assert.equal(elements.get("#schema-editor").hidden,true);
// retired-schema-assertion: source-drafts-revision-publication-close-035
assert.equal(elements.get("#schema-revision-review").open,false);

library.replaceSchemas(sourceLibraryBefore);
library.clearSelection();
const newLibraryBefore=library.schemas;
const newStorageBefore=values.get("library");
const newDraft={ ...sourceDraft, id:"schema:new", name:"Transient New",
  assignments:[], workingDraft:{ ...sourceDraft.workingDraft, name:"Transient New", assignments:[] } };
library.setDraft(newDraft);
// retired-schema-assertion: source-drafts-revision-publication-close-036
assert.deepEqual(library.schemas,newLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-037
assert.equal(values.get("library"),newStorageBefore);
editor.openRevisionReview();
editor.cancelRevision();
editor.discardTransient();
// retired-schema-assertion: source-drafts-revision-publication-close-038
assert.deepEqual(library.schemas,newLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-039
assert.equal(values.get("library"),newStorageBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-040
assert.equal(elements.get("#close-schema-editor-review").open,false);
editor.render();
// retired-schema-assertion: source-drafts-revision-publication-close-041
assert.equal(elements.get("#schema-detail").hidden,false);
// retired-schema-assertion: source-drafts-revision-publication-close-042
assert.equal(elements.get("#schema-detail-empty").hidden,false);
library.setDraft({ ...newDraft, name:"Published New",
  workingDraft:{ ...newDraft.workingDraft, name:"Published New" } });
const newWritesBeforeReview=schemaStorageWrites;
editor.openRevisionReview();
// retired-schema-assertion: source-drafts-revision-publication-close-043
assert.equal(elements.get("#schema-revision-review").open,true);
// retired-schema-assertion: source-drafts-revision-publication-close-044
assert.deepEqual(library.schemas,newLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-045
assert.equal(schemaStorageWrites,newWritesBeforeReview);
const newWritesBeforePublish=schemaStorageWrites;
const newPublished=editor.publish(true);
// retired-schema-assertion: source-drafts-revision-publication-close-046
assert.equal(library.schemas.length,newLibraryBefore.length+1);
// retired-schema-assertion: source-drafts-revision-publication-close-047
assert.equal(newPublished.name,"Published New");
// retired-schema-assertion: source-drafts-revision-publication-close-048
assert.equal(schemaStorageWrites,newWritesBeforePublish+1);
// retired-schema-assertion: source-drafts-revision-publication-close-049
assert.equal(library.activeSchemaId,undefined);
editor.render();
// retired-schema-assertion: source-drafts-revision-publication-close-050
assert.equal(elements.get("#schema-editor").hidden,true);
library.replaceSchemas(sourceLibraryBefore);
library.setDraft({ ...newDraft, name:"Review boundary" });
const closeReviewWrites=schemaStorageWrites;
editor.openRevisionReview();
// retired-schema-assertion: source-drafts-revision-publication-close-051
assert.equal(elements.get("#schema-revision-review").open,true);
// retired-schema-assertion: source-drafts-revision-publication-close-052
assert.deepEqual(library.schemas,sourceLibraryBefore);
// retired-schema-assertion: source-drafts-revision-publication-close-053
assert.equal(schemaStorageWrites,closeReviewWrites);
editor.cancelRevision();
editor.discardTransient();

library.select(page.id,page);
library.replaceActive({ ...page, workingDraft:{
  baseVersion:1, sourceVersion:1, name:"Page", document:structuredClone(page.document),
  assignments:[], attachedRules:[], pendingChanges:["Begin draft"], documentation:{ description:"Original" },
} });
editor.render();
elements.get("#schema-revision-selector").value="1";
elements.get("#build-specification").onclick=() => ports.openSpecification(library.active(),"working-draft");
elements.get("#build-specification").click();
// retired-schema-assertion: source-drafts-revision-publication-close-054
assert.equal(relationshipActions.at(-1),"schema:page:working-draft");
assert.equal(elements.get("#schema-editor").hidden,false);
assert.equal(elements.get("#schema-detail-empty").hidden,true);
assert.equal(elements.get("#schema-revision-review").open,false);

elements.get("#schema-editor-parent").value=parent.id;
editor.changeParent();
// retired-schema-assertion: source-drafts-revision-publication-close-055
assert.equal(library.active().workingDraft.parentSchemaId,parent.id);
editor.render();
// retired-schema-assertion: source-drafts-revision-publication-close-056
assert.match(elements.get("#schema-inheritance-provenance").textContent,/Parent v2/u);
// retired-schema-assertion: source-drafts-revision-publication-close-057
assert.equal(elements.get("#schema-inherited-rule-groups").hidden,false);
// retired-schema-assertion: source-drafts-revision-publication-close-058
assert.match(elements.get("#schema-inherited-rule-groups").children[0].children[0].textContent,/Active inherited \(1\)/u);

elements.get("#schema-only-declared-properties").checked=true;
editor.changeAdditionalProperties();
// retired-schema-assertion: source-drafts-revision-publication-close-059
assert.equal(library.active().workingDraft.document.additionalProperties,false);
elements.get("#schema-editor-name").value="Page checkout";
editor.updateName();
elements.get("#schema-editor-description").value="Checkout payload";
editor.saveDescription();
editor.openRevisionReview();
// retired-schema-assertion: source-drafts-revision-publication-close-060
assert.equal(elements.get("#schema-revision-review").open,true);
assert.match(elements.get("#schema-revision-review-summary").textContent,/publishes revision 2/u);
const beforePublishWrites=schemaStorageWrites;
const published=editor.publish(true);
// retired-schema-assertion: source-drafts-revision-publication-close-061
assert.equal(published.version,2);
// retired-schema-assertion: source-drafts-revision-publication-close-062
assert.equal(published.name,"Page checkout");
// retired-schema-assertion: source-drafts-revision-publication-close-063
assert.equal(published.documentation.description,"Checkout payload");
assert.equal(schemaStorageWrites,beforePublishWrites+1);
// retired-schema-assertion: source-drafts-revision-publication-close-064
assert.equal(library.activeSchemaId,undefined);
assert.equal(elements.get("#schema-revision-review").open,false);
assert.equal(elements.get("#schema-result").textContent,
  "Published Page checkout revision 2. Revalidated 3 current Live events.");
editor.render();
// retired-schema-assertion: source-drafts-revision-publication-close-065
assert.equal(elements.get("#schema-editor").hidden,true);

library.select(page.id,library.schemas[0]);
editor.render();
// retired-schema-assertion: source-drafts-revision-publication-close-066
assert.deepEqual(elements.get("#schema-revision-selector").children.map(({value,textContent}) => ({value,textContent})),
  [{value:"1",textContent:"Revision 1"}]);
elements.get("#schema-revision-selector").value="1";
editor.render();
// retired-schema-assertion: source-drafts-revision-publication-close-067
assert.equal(elements.get("#schema-revision-comparison").textContent,
  "Revision 1 compared with current revision 2. 1 historical properties; 1 current properties.");
editor.restoreRevision();
assert.equal(editor.pendingRestoration,undefined,"revision restoration state is private");
assert.deepEqual(editor.pendingRestorationState(),{schemaId:page.id,version:1});
// retired-schema-assertion: source-drafts-revision-publication-close-068
assert.equal(elements.get("#schema-revision-review").open,true);
// retired-schema-assertion: source-drafts-revision-publication-close-069
assert.equal(library.active().workingDraft,undefined);
editor.cancelRevision();
// retired-schema-assertion: source-drafts-revision-publication-close-070
assert.equal(library.active().workingDraft,undefined);
editor.restoreRevision();
editor.confirmRevision();
// retired-schema-assertion: source-drafts-revision-publication-close-071
assert.equal(library.active().workingDraft.sourceVersion,1);
editor.discardWorking();
assert.equal(library.schemas.find(({id}) => id===page.id).workingDraft,undefined);

library.select(page.id,library.schemas.find(({id}) => id===page.id));
elements.get("#schema-revision-selector").value="1";
elements.get("#build-historical-specification").onclick=() => ports.openSpecification(library.active(),"historical:1");
elements.get("#build-historical-specification").click();
// retired-schema-assertion: source-drafts-revision-publication-close-072
assert.equal(relationshipActions.at(-1),"schema:page:historical:1");
editor.duplicateRevision();
// retired-schema-assertion: source-drafts-revision-publication-close-073
assert.equal(library.schemas.length,3);
library.select(page.id,library.schemas.find(({id}) => id===page.id));
library.replaceActive({ ...library.active(), workingDraft:{
  baseVersion:2, sourceVersion:2, name:"Page checkout", document:structuredClone(library.active().document),
  assignments:[], attachedRules:[], pendingChanges:["Retained"], documentation:library.active().documentation,
} });
const storedDraftWrites=schemaStorageWrites;
const storedDraftStorage=values.get("library");
editor.closeEditor();
// retired-schema-assertion: source-drafts-revision-publication-close-074
assert.equal(library.activeSchemaId,undefined);
// retired-schema-assertion: source-drafts-revision-publication-close-075
assert.equal(elements.get("#close-schema-editor-review").open,false);
// retired-schema-assertion: source-drafts-revision-publication-close-076
assert.equal(schemaStorageWrites,storedDraftWrites);
// retired-schema-assertion: source-drafts-revision-publication-close-077
assert.equal(values.get("library"),storedDraftStorage);
// retired-schema-assertion: source-drafts-revision-publication-close-078
assert.ok(library.schemas.find(({id}) => id===page.id).workingDraft);
// retired-schema-assertion: source-drafts-revision-publication-close-079
assert.equal(elements.get("#schema-result").textContent,"Working draft retained without publishing.");
library.select(page.id,library.schemas.find(({id}) => id===page.id));
const abandonWrites=schemaStorageWrites;
editor.discardTransient();
// retired-schema-assertion: source-drafts-revision-publication-close-080
assert.equal(schemaStorageWrites,abandonWrites);
// retired-schema-assertion: source-drafts-revision-publication-close-081
assert.ok(library.schemas.find(({id}) => id===page.id).workingDraft);
library.select(page.id,library.schemas.find(({id}) => id===page.id));
const discardStoredWrites=schemaStorageWrites;
editor.discardWorking();
// retired-schema-assertion: source-drafts-revision-publication-close-082
assert.equal(schemaStorageWrites,discardStoredWrites+1);
// retired-schema-assertion: source-drafts-revision-publication-close-083
assert.equal(library.schemas.find(({id}) => id===page.id).workingDraft,undefined);

assert.equal(calls.closedCanonical,4);
assert.ok(calls.render>0);
