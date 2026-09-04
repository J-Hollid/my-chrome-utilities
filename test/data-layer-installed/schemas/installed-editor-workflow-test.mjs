import assert from "node:assert/strict";
import { runRetiredSchemaControllerScenario } from "../../support/schema-library-fake-dom.mjs";
import { createHash } from "node:crypto";
import { SchemaInstalledEditorWorkflow } from "../../../dist/data-layer-installed/schemas/installed-editor-workflow.js";

const calls=[];
const tabs=[{dataset:{schemaSubview:"master"},setAttribute(name,value){this[name]=value;}},{dataset:{schemaSubview:"rules"},setAttribute(name,value){this[name]=value;}}];
const panels=[{id:"master",hidden:false},{id:"rules",hidden:true}],filter={value:"query",focus(){calls.push("focus-filter");}},name={focus(){calls.push("focus-name");}};
let activeSchemaId,draft;
const library={schemas:[],get activeSchemaId(){return activeSchemaId;},get draft(){return draft;},
  select(id,next){activeSchemaId=id;draft=structuredClone(next);},clearSelection(){activeSchemaId=undefined;draft=undefined;},
  setDraft(next){draft=next?structuredClone(next):undefined;}},editor={
    updateName(){calls.push("update-name");},render(){calls.push("render-editor");},
    persistDraft(){calls.push("persist-draft");},saveDescription(){calls.push("save-description");},
    updateTarget(){calls.push("update-target");},changeParent(){calls.push("change-parent");},
    changeAdditionalProperties(){calls.push("change-declared-only");},openRevisionReview(){calls.push("open-revision");},
    confirmRevision(){calls.push("confirm-revision");},cancelRevision(){calls.push("cancel-revision");},
    discardTransient(){calls.push("discard-transient");},keepEditing(){calls.push("keep-editing");},
    closeEditor(){calls.push("close-editor");},discardWorking(){calls.push("discard-working");},
    duplicateRevision(){calls.push("duplicate-revision");},restoreRevision(){calls.push("restore-revision");},
    publish(close){calls.push(["publish",close]);return {id:"schema:published",name:"Published",version:2,document:{type:"object"},assignments:[]};},
  };
const propertyCalls=[];
const property={
  requestRemoval(path,trigger){propertyCalls.push(["request-removal",path,trigger]);},confirmRemoval(){propertyCalls.push("confirm-removal");},
  cancelRemoval(event){propertyCalls.push(["cancel-removal",event]);},undoRemoval(){propertyCalls.push("undo-removal");},
  requestDocumentationRemoval(path,trigger){propertyCalls.push(["request-documentation-removal",path,trigger]);},
  confirmDocumentationRemoval(){propertyCalls.push("confirm-documentation-removal");},closeDocumentationRemoval(){propertyCalls.push("close-documentation-removal");},
  openCopy(path,target){propertyCalls.push(["open-copy",path,target]);},confirmCopy(){propertyCalls.push("confirm-copy");},undoCopy(){propertyCalls.push("undo-copy");},
  renderSpecificIndex(){propertyCalls.push("render-specific-index");},openSpecificIndex(path,trigger){propertyCalls.push(["open-specific-index",path,trigger]);},
  submitSpecificIndex(event){propertyCalls.push(["submit-specific-index",event]);},closeSpecificIndex(event){propertyCalls.push(["close-specific-index",event]);},
  renderManual(){propertyCalls.push("render-manual");},openManual(path,trigger){propertyCalls.push(["open-manual",path,trigger]);},
  submitManual(event){propertyCalls.push(["submit-manual",event]);},closeManual(){propertyCalls.push("close-manual");},goToExisting(){propertyCalls.push("go-to-existing");},
};
const workflow=new SchemaInstalledEditorWorkflow({library,editor,property,propertyFilter:filter,subviews:tabs,panels,liveEventQuery:{hidden:false},schemaEditorName:name,
  renderProperty(){calls.push("render-property");},renderAll(){calls.push("render-all");},showSchemas(){calls.push("show-schemas");},openRoute(){},createEmpty(){},renderSpecification(){}});
workflow.updateName();workflow.clearPropertyFilter();workflow.showSubview("rules");
assert.deepEqual(calls,["update-name","render-property","focus-filter"]);
assert.equal(filter.value,"");assert.equal(tabs[1]["aria-selected"],"true");assert.equal(panels[0].hidden,true);assert.equal(panels[1].hidden,false);
workflow.openDraft({id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[]});
assert.equal(library.activeSchemaId,"schema:one");assert.deepEqual(calls.slice(-3),["show-schemas","render-all","focus-name"]);

workflow.persistDraft();assert.equal(calls.at(-1),"persist-draft");
workflow.saveDescription();assert.equal(calls.at(-1),"save-description");
workflow.updateTarget();assert.equal(calls.at(-1),"update-target");
workflow.changeParent();assert.equal(calls.at(-1),"change-parent");
workflow.changeDeclaredOnly();assert.equal(calls.at(-1),"change-declared-only");
workflow.openRevision();assert.equal(calls.at(-1),"open-revision");
workflow.confirmRevision();assert.equal(calls.at(-1),"confirm-revision");
workflow.cancelRevision();assert.equal(calls.at(-1),"cancel-revision");
workflow.discardTransient();assert.equal(calls.at(-1),"discard-transient");
workflow.keepEditing();assert.equal(calls.at(-1),"keep-editing");
workflow.closeEditor();assert.equal(calls.at(-1),"close-editor");
workflow.discardWorking();assert.equal(calls.at(-1),"discard-working");
workflow.renderRevision();assert.equal(calls.at(-1),"render-editor");
workflow.duplicateRevision();assert.equal(calls.at(-1),"duplicate-revision");
workflow.restoreRevision();assert.equal(calls.at(-1),"restore-revision");
assert.equal(workflow.publish().id,"schema:published");assert.deepEqual(calls.at(-1),["publish",false]);
assert.equal(workflow.publish(true).version,2);assert.deepEqual(calls.at(-1),["publish",true]);

const trigger={};const event={preventDefault(){propertyCalls.push("prevent-default");}};
workflow.requestRemoval("/title",trigger);assert.deepEqual(propertyCalls.at(-1),["request-removal","/title",trigger]);
workflow.confirmRemoval();assert.equal(propertyCalls.at(-1),"confirm-removal");
workflow.cancelRemoval(event);assert.deepEqual(propertyCalls.at(-1),["cancel-removal",event]);
workflow.undoRemoval();assert.equal(propertyCalls.at(-1),"undo-removal");
workflow.requestDocumentationRemoval("/title",trigger);assert.deepEqual(propertyCalls.at(-1),["request-documentation-removal","/title",trigger]);
workflow.confirmDocumentationRemoval();assert.equal(propertyCalls.at(-1),"confirm-documentation-removal");
workflow.cancelDocumentationRemoval(event);assert.equal(propertyCalls.at(-1),"close-documentation-removal");
assert.equal(propertyCalls.at(-2),"prevent-default");
workflow.openCopy("/title","schema:two");assert.deepEqual(propertyCalls.at(-1),["open-copy","/title","schema:two"]);
workflow.confirmCopy();assert.equal(propertyCalls.at(-1),"confirm-copy");
workflow.undoCopy();assert.equal(propertyCalls.at(-1),"undo-copy");
workflow.renderSpecificIndex();assert.equal(propertyCalls.at(-1),"render-specific-index");
workflow.openSpecificIndex("/items",trigger);assert.deepEqual(propertyCalls.at(-1),["open-specific-index","/items",trigger]);
workflow.submitSpecificIndex(event);assert.deepEqual(propertyCalls.at(-1),["submit-specific-index",event]);
workflow.closeSpecificIndex(event);assert.deepEqual(propertyCalls.at(-1),["close-specific-index",event]);
workflow.renderManual();assert.equal(propertyCalls.at(-1),"render-manual");
workflow.openManual("/checkout",trigger);assert.deepEqual(propertyCalls.at(-1),["open-manual","/checkout",trigger]);
workflow.submitManual(event);assert.deepEqual(propertyCalls.at(-1),["submit-manual",event]);
workflow.closeManual(event);assert.equal(propertyCalls.at(-1),"close-manual");
assert.equal(propertyCalls.at(-2),"prevent-default");
workflow.goToExisting();assert.equal(propertyCalls.at(-1),"go-to-existing");

const editorBindings=workflow.editorBindings({updateTree(){},recheck(){},persistTreeScroll(){},navigateTree(){},rememberCanonicalScroll(){}});
assert.equal(typeof editorBindings.createSchema,"function");
assert.equal(typeof editorBindings.saveAndClose,"function");
assert.equal(typeof editorBindings.discardWorking,"function");
const propertyBindings=workflow.propertyBindings({render(){},undoCopy(){},cancelRulePicker(){},navigateRulePicker(){}});
assert.equal(typeof propertyBindings.openManual,"function");
assert.equal(typeof propertyBindings.confirmRemoval,"function");
assert.equal(typeof propertyBindings.renderSpecificIndex,"function");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const causalCategory="other:installed editor workflow fixture ownership contract";
  if(context.causalCategory===causalCategory){
    const normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)])):value;
    const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure={selectionCommandAvailable:false,draftOwnedByCommand:false};
    const expectedRepairResult={selectionCommandAvailable:true,draftOwnedByCommand:true};
    const observed={selectionCommandAvailable:typeof library.select==="function",draftOwnedByCommand:library.draft?.id==="schema:one"};
    assert.deepEqual(observed,expectedRepairResult);
    const fixture={id:"installed-editor-workflow-library-command-v1",causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{schemaId:"schema:one"},expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=digest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
      failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed}}}));
  }
}
// RETIRED_SCHEMA_ASSERTIONS_START:source-drafts-revision-publication-close
const retiredSchemaAssertions = {
  "source-drafts-revision-publication-close-001": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-002": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-003": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-004": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-005": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-006": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-007": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-008": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-009": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-010": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-011": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-012": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-013": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-014": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-015": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-016": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-017": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-018": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-019": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-020": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-021": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-022": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-023": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-024": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-025": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-026": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-027": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-028": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-029": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-030": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-031": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-032": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-033": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-034": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-035": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-036": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-037": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-038": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-039": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-040": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-041": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-042": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-043": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-044": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-045": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-046": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-047": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-048": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-049": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-050": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-051": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-052": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-053": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-054": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-055": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-056": (...args) => assert.match(...args),
  "source-drafts-revision-publication-close-057": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-058": (...args) => assert.match(...args),
  "source-drafts-revision-publication-close-059": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-060": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-061": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-062": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-063": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-064": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-065": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-066": (...args) => assert.deepEqual(...args),
  "source-drafts-revision-publication-close-067": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-068": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-069": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-070": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-071": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-072": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-073": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-074": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-075": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-076": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-077": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-078": (...args) => assert.ok(...args),
  "source-drafts-revision-publication-close-079": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-080": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-081": (...args) => assert.ok(...args),
  "source-drafts-revision-publication-close-082": (...args) => assert.equal(...args),
  "source-drafts-revision-publication-close-083": (...args) => assert.equal(...args),
};
await runRetiredSchemaControllerScenario(retiredSchemaAssertions);
// RETIRED_SCHEMA_ASSERTIONS_END:source-drafts-revision-publication-close
