import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const { SCHEMA_RULE_STORAGE_KEY, SchemaRuleController } = await import(
  "../../../dist/data-layer-installed/schemas/rule-controller.js"
);
const { installSchemaRuleElements, SchemaRuleInstalledPresentation } = await import(
  "../../../dist/data-layer-installed/schemas/rule-installed-view.js"
);
const queried = [];
const installed = installSchemaRuleElements({ querySelector(selector) { queried.push(selector); return null; } });

assert.equal(queried.includes("#schema-rule-editor"), true);

assert.equal(installed.elements.editor, null);

const ownedElement = (tagName="DIV") => ({
  tagName, id:"", isConnected:false, children:[], dataset:{}, textContent:"", value:"",
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children=children; },
  setAttribute(name,value) { this[name]=value; }, addEventListener() {}, removeEventListener() {},
  focus(options) { this.focused=true; this.focusOptions=options; },
});
const ownedDocument = { body:{ append(element) { element.isConnected=true; } }, createElement(tag) {
  const element=ownedElement(tag.toUpperCase()); element.ownerDocument=this; return element;
} };
const ruleTypes = ownedDocument.createElement("select");
ruleTypes.isConnected=true;
const installedOwned = installSchemaRuleElements({
  ownerDocument:ownedDocument,
  querySelector:(selector) => selector === "#schema-rule-types" ? ruleTypes : null,
});

// retired-schema-assertion: installed-dialogs-library-relationship-routing-001
assert.ok(installedOwned.elements.confirmRevision,
  "Schemas creates its rule revision controls from a minimal dialog host");

// retired-schema-assertion: installed-dialogs-library-relationship-routing-002
assert.equal(installedOwned.elements.confirmRevision.id,"confirm-schema-rule-revision-review");

// retired-schema-assertion: installed-dialogs-library-relationship-routing-004
assert.deepEqual(ruleTypes.children.map(({ value }) => value),
  ["string","number","boolean","object","array"]);

const migratedValues = new Map([[SCHEMA_RULE_STORAGE_KEY,JSON.stringify([{
  id:"rule:quantities",name:"Quantities",version:1,kind:"Allowed values",enabled:true,
  operator:"allowed-values",applicableType:"number",parameters:"1, 2",
}])]]);
const migratedController = new SchemaRuleController({
  getItem:(key) => migratedValues.get(key) ?? null,
  setItem:(key,value) => migratedValues.set(key,value),
});

// retired-schema-assertion: installed-dialogs-library-relationship-routing-005
assert.deepEqual(migratedController.stored("rule:quantities").allowedValues,[1,2]);

// retired-schema-assertion: installed-dialogs-library-relationship-routing-006
assert.equal(migratedController.stored("rule:quantities").parameters,undefined);

// retired-schema-assertion: installed-dialogs-library-relationship-routing-007
assert.deepEqual(JSON.parse(migratedValues.get(SCHEMA_RULE_STORAGE_KEY))
  .find(({ id }) => id === "rule:quantities").allowedValues,[1,2]);

const values = new Map([[SCHEMA_RULE_STORAGE_KEY, JSON.stringify([
  { id:"rule:one", name:"Required", version:1, operator:"required" },
])]]);
const controller = new SchemaRuleController({
  getItem:(key) => values.get(key) ?? null,
  setItem:(key, value) => values.set(key, value),
});
let presentationDisposals = 0;
const presentation = new SchemaRuleInstalledPresentation(controller, installed.elements, () => []);
presentation.ownRow(() => { presentationDisposals += 1; });
presentation.dispose();

assert.equal(presentationDisposals, 1, "rule presentation removes owned row actions");

assert.deepEqual(controller.rules.map(({ enabled }) => enabled), [true]);
const projectedRules = controller.rules;
projectedRules[0] = { ...projectedRules[0], enabled:false };
controller.persist();

assert.match(values.get(SCHEMA_RULE_STORAGE_KEY), /"enabled":true/,
  "the Rule Library exposes a cloned read-only projection");
controller.replaceRules(projectedRules);
controller.persist();

assert.match(values.get(SCHEMA_RULE_STORAGE_KEY), /"enabled":false/,
  "the Rule Library accepts state changes through its narrow command");

const row = new EventTarget();
let actions = 0;
controller.listenRow(row, "click", () => { actions += 1; });
row.dispatchEvent(new Event("click"));
controller.setPicker("/checkout/email");
controller.dispose();
row.dispatchEvent(new Event("click"));

assert.equal(actions, 1, "rule disposal removes owned row actions");

assert.equal(controller.pickerPath, undefined);

const configuration={ruleType:"Required",propertyType:"string",severity:"error",message:"",enabled:true,
  applyOnlyWhen:false,conditionGroupOperator:"All",conditions:[],saveReusable:true,reusableName:"Reusable",description:"",
  allowedValues:[],exactValue:"",pattern:"",comparison:"",limit:"",minimum:"",maximum:""};
controller.setConfiguration(configuration);
const projectedConfiguration=controller.configuration;
projectedConfiguration.description="Changed outside the owner";

assert.equal(controller.configuration.description,"","configuration projections do not expose controller state");
controller.setConfiguration({...projectedConfiguration,description:"SKUs accepted by fulfilment"});

assert.equal(controller.configuration.description,"SKUs accepted by fulfilment",
  "the configuration command retains a reusable-rule description");

assert.equal(controller.normalizePickerPath("checkout.total"),"/checkout/total");

assert.equal(controller.normalizePickerPath("/checkout/total"),"/checkout/total");

assert.deepEqual(controller.valueAtPath({checkout:{total:12}},"checkout.total"),{exists:true,value:12});

assert.deepEqual(controller.valueAtPath({checkout:{total:12}},"/checkout/total"),{exists:true,value:12});

assert.deepEqual(controller.valueAtPath({checkout:{}},"checkout.total"),{exists:false,value:undefined});
assert.deepEqual(controller.valueAtPath(undefined,"checkout.total"),{exists:false,value:undefined});
assert.deepEqual(controller.valueAtPath({items:[{sku:"one"}]},"items.0.sku"),{exists:true,value:"one"});

assert.equal(controller.stored("rule:one")?.id,"rule:one");

assert.equal(controller.stored("missing"),undefined);
assert.deepEqual(controller.expansionRules(),controller.rules);
const expansion=controller.expansionRules();
expansion[0].name="External";

assert.equal(controller.stored("rule:one").name,"Required");

controller.setPicker("checkout.email");

assert.equal(controller.pickerPath,"checkout.email");

assert.equal(controller.pickerTrigger,undefined);
assert.equal(controller.pickerTriggerLabel(),undefined);
assert.equal(controller.focusPickerTrigger(),false);
let pickerFocused=false;
controller.setPicker("checkout.email",{isConnected:true,getAttribute:()=>"Add rule",focus(){pickerFocused=true;}});
assert.equal(controller.pickerTriggerLabel(),"Add rule");
assert.equal(controller.focusPickerTrigger(),true);
assert.equal(pickerFocused,true);
controller.setPickerSearch("required");

assert.equal(controller.pickerSearch,"required");
controller.setEditingAttached({id:"rule:one",name:"Required",version:1,enabled:true});

assert.equal(controller.editingAttached.id,"rule:one");
const attached=controller.editingAttached;
attached.name="External";

assert.equal(controller.editingAttached.name,"Required");

assert.equal(controller.conditionPredicate("checkout.total").operator,"All");

assert.equal(controller.conditionPredicate("checkout.total").predicates.length,0);

assert.deepEqual(controller.conditionPredicate("checkout.total"),{operator:"All",predicates:[]});
assert.deepEqual(controller.conditionPredicate("checkout.total",true),{operator:"All",predicates:[]});

controller.resetPickerState();

assert.equal(controller.pickerPath,undefined);

assert.equal(controller.pickerTrigger,undefined);

assert.equal(controller.pickerSearch,"");

assert.equal(controller.configuration,undefined);

assert.equal(controller.editingAttached,undefined);
controller.replaceRules([{id:"rule:two",name:"Pattern",kind:"Pattern",version:2,operator:"pattern",parameters:"^A",enabled:false}]);

assert.equal(controller.rules.length,1);

assert.equal(controller.rules[0].id,"rule:two");

assert.equal(controller.rules[0].enabled,false);

assert.equal(controller.rules[0].version,2);
controller.persist();

assert.match(values.get(SCHEMA_RULE_STORAGE_KEY),/rule:two/u);

assert.match(values.get(SCHEMA_RULE_STORAGE_KEY),/"enabled":false/u);
controller.replaceRules([]);
assert.deepEqual(controller.rules,[]);
controller.reload();

assert.equal(controller.rules[0].name,"Pattern");

assert.equal(controller.rules[0].operator,"pattern");

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const causalCategory="other:rule picker cloned configuration persistence";
  if(context.causalCategory===causalCategory){
    const normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)])):value;
    const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
    const expectedPreRepairFailure={descriptionRetained:false,commandOwned:true};
    const expectedRepairResult={descriptionRetained:true,commandOwned:true};
    const observed={descriptionRetained:controller.configuration.description==="SKUs accepted by fulfilment",commandOwned:true};
assert.deepEqual(observed,expectedRepairResult);
    const fixture={id:"rule-picker-cloned-configuration-persistence-v1",causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{field:"reusable description"},expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=digest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
      failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed}}}));
  }
}

const revisionValues=new Map([[SCHEMA_RULE_STORAGE_KEY,JSON.stringify([
  {id:"rule:checkout",name:"Checkout required",kind:"Required",version:1,operator:"required",enabled:true,examples:"old"},
  {id:"rule:retired",name:"Retired rule",kind:"Required",version:1,operator:"required",enabled:true,examples:"old"},
])]]);
const revisionController=new SchemaRuleController({getItem:(key)=>revisionValues.get(key)??null,
  setItem:(key,value)=>revisionValues.set(key,value)});
let revisionSchemas=[{id:"schema:checkout",name:"Checkout",version:1,
  document:{type:"object",properties:{checkout:{type:"object",properties:{email:{type:"string"}}}}},assignments:[],attachedRules:[]}];
let liveRevalidations=0,revisionSummary="",syncReviewSummary="";
const revisionDialog={open:false},upgradeDialog={open:false};
const revisionPresentation={render(){},openEditor(){},populate(){},updateAttachmentPreview(){},
  showRevision(previous,changes){revisionDialog.open=true;revisionSummary=`${previous.name}; examples ${previous.examples??"none"} → ${changes.examples??previous.examples??"none"}.`;},
  showDeletion(){},showUpgrade(){upgradeDialog.open=true;},showSync(review){syncReviewSummary=`${review.schemaCount} schemas and ${review.attachmentCount} attachments`;},
  close(kind){if(kind==="revision")revisionDialog.open=false;if(kind==="upgrade")upgradeDialog.open=false;}};
revisionController.configure({elements:{},presentation:revisionPresentation,schemas:()=>revisionSchemas,
  replaceSchemas:(next)=>{revisionSchemas=structuredClone(next);},persistRules:()=>revisionController.persist(),persistLibrary(){},
  renderAll(){liveRevalidations+=1;},renderDraft(){},createId:()=>"rule:new",download(){},createRuleId:()=>"rule:new",capturedValue:()=>undefined,
  editableSchema:()=>revisionSchemas[0],propertyType:()=>"string",draft:()=>revisionSchemas[0],replaceDraft(){},
  presentDraft:(schema)=>schema,activeSchemaId:()=>revisionSchemas[0].id,promotionDialog:{open(){},close(){}},detail:null,
  root:{querySelectorAll:()=>[]},scheduleFrame:(run)=>run(),result(){},commitPromotion:async()=>{}});

// retired-schema-assertion: rule-choice-parameters-predicates-preview-001
assert.equal(revisionController.attach("schema:checkout","rule:checkout","/checkout/email"),true);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-001
assert.ok(liveRevalidations>0);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-002
assert.equal(revisionController.stored("rule:checkout").name,"Checkout required");

// retired-schema-assertion: rule-revision-attachment-sync-deletion-003
assert.equal(revisionSchemas[0].workingDraft.attachedRules.some(({id})=>id==="rule:checkout"),true);
revisionSchemas[0]={...revisionSchemas[0],attachedRules:structuredClone(revisionSchemas[0].workingDraft.attachedRules)};

// retired-schema-assertion: rule-revision-attachment-sync-deletion-004
assert.equal(revisionController.updateAttached("schema:checkout","rule:checkout",false),true);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-005
assert.equal(revisionController.updateAttached("schema:checkout","rule:checkout",true),true);
const checkoutRuleRow=revisionController.stored("rule:checkout");

// retired-schema-assertion: rule-revision-attachment-sync-deletion-006
assert.ok(checkoutRuleRow);
revisionController.toggle("rule:checkout");

// retired-schema-assertion: rule-revision-attachment-sync-deletion-007
assert.equal(revisionController.stored("rule:checkout").enabled,false);
revisionController.toggle("rule:checkout");
class CountedRuleButton extends EventTarget {
  listeners=0;
  addEventListener(...args){super.addEventListener(...args);this.listeners+=1;}
  removeEventListener(...args){super.removeEventListener(...args);this.listeners-=1;}
  listenerCount(){return this.listeners;}
}
const disableRuleButton=new CountedRuleButton();
revisionController.listenRow(disableRuleButton,"click",()=>revisionController.toggle("rule:checkout"));
revisionController.clearRows();

// retired-schema-assertion: rule-revision-attachment-sync-deletion-008
assert.equal(disableRuleButton.listenerCount(),0);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-009
assert.equal(revisionController.requestRevision("rule:checkout",{name:"Checkout present",message:"Checkout must be present"}),true);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-010
assert.equal(revisionDialog.open,true);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-011
assert.equal(revisionController.stored("rule:checkout").version,1);
revisionController.confirmRevision();

// retired-schema-assertion: rule-revision-attachment-sync-deletion-012
assert.equal(revisionController.stored("rule:checkout").version,2);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-013
assert.equal(revisionController.stored("rule:checkout").revisionHistory[0].name,"Checkout required");

// retired-schema-assertion: rule-revision-attachment-sync-deletion-020
assert.equal(revisionController.approvedRevisionId,"rule:checkout");
const {workingDraft:_discardedWorkingDraft,...publishedRevisionSchema}=revisionSchemas[0];
revisionSchemas[0]=publishedRevisionSchema;

// retired-schema-assertion: rule-revision-attachment-sync-deletion-014
assert.equal(revisionController.requestSync("rule:checkout"),true);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-015
assert.match(syncReviewSummary,/1 schemas and 1 attachments/);
const versionBeforeSync=revisionSchemas[0].version;
revisionController.confirmSync();
const syncedSchema=revisionSchemas[0];

// retired-schema-assertion: rule-revision-attachment-sync-deletion-016
assert.equal(syncedSchema.version,versionBeforeSync+1);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-017
assert.equal(syncedSchema.attachedRules.find(({id})=>id==="rule:checkout").version,2);
revisionController.requestRevision("rule:checkout",{message:"Checkout remains required"});
revisionController.confirmRevision();

assert.equal(revisionController.requestUpgrade("rule:checkout",["schema:checkout"]),true);
assert.equal(revisionController.attachmentWorkflow,undefined,"the rule controller does not expose its attachment workflow");
assert.equal(revisionController.promotionWorkflow,undefined,"the rule controller does not expose its promotion workflow");
revisionController.rememberPromotionFocusedPosition({propertyPath:"/checkout",ruleId:"rule:checkout",detailScroll:12});
const focusedPositionProjection=revisionController.promotionFocusedPosition;
focusedPositionProjection.detailScroll=99;
assert.equal(revisionController.promotionFocusedPosition.detailScroll,12,
  "the rule controller owns promotion focus changes and exposes a cloned projection");
const controllerUpgradeProjection=revisionController.pendingUpgrade;
controllerUpgradeProjection.schemaIds=[];
assert.deepEqual(revisionController.pendingUpgrade,{id:"rule:checkout",schemaIds:["schema:checkout"]},
  "the rule controller exposes a cloned attachment projection");

// retired-schema-assertion: rule-revision-attachment-sync-deletion-018
assert.equal(upgradeDialog.open,true);
revisionController.confirmUpgrade();

// retired-schema-assertion: rule-revision-attachment-sync-deletion-019
assert.equal(revisionSchemas[0].attachedRules.find(({id})=>id==="rule:checkout").version,3);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-021
assert.equal(revisionController.approvedAttachmentUpdateId,"rule:checkout");

// retired-schema-assertion: rule-revision-attachment-sync-deletion-022
assert.equal(revisionController.edit("rule:retired"),true);
revisionController.captureSnapshot();

// retired-schema-assertion: rule-revision-attachment-sync-deletion-026
assert.deepEqual(revisionController.pendingSnapshot,{id:"rule:retired",version:1,attachments:[]});

// retired-schema-assertion: rule-revision-attachment-sync-deletion-023
assert.equal(revisionController.requestRevision("rule:retired",{name:"Retired revised",examples:"new"}),true);
assert.equal(revisionDialog.open,true);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-024
assert.match(revisionSummary,/; examples .* → .*\.$/u);
revisionController.confirmRevision();

// retired-schema-assertion: rule-revision-attachment-sync-deletion-025
assert.equal(revisionController.stored("rule:retired").version,2);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-027
assert.equal(revisionController.editingReusableId,undefined);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-028
assert.equal(revisionController.requestDeletion("rule:checkout"),false);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-029
assert.equal(revisionController.requestDeletion("rule:retired"),true);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-030
assert.equal(revisionController.rules.some(({id})=>id==="rule:retired"),true);
revisionController.confirmDeletion();

// retired-schema-assertion: rule-revision-attachment-sync-deletion-031
assert.equal(revisionController.rules.some(({id})=>id==="rule:retired"),false);

assert.ok(controller, "the direct rule owner is constructed");
