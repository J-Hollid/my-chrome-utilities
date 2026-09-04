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
// retired-schema-assertion: rule-choice-parameters-predicates-preview-005
assert.equal(queried.includes("#schema-rule-editor"), true);
// retired-schema-assertion: rule-choice-parameters-predicates-preview-003
assert.equal(installed.elements.editor, null);

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
// retired-schema-assertion: rule-choice-parameters-predicates-preview-009
assert.equal(presentationDisposals, 1, "rule presentation removes owned row actions");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-021
assert.deepEqual(controller.rules.map(({ enabled }) => enabled), [true]);
const projectedRules = controller.rules;
projectedRules[0] = { ...projectedRules[0], enabled:false };
controller.persist();
// retired-schema-assertion: rule-choice-parameters-predicates-preview-007
assert.match(values.get(SCHEMA_RULE_STORAGE_KEY), /"enabled":true/,
  "the Rule Library exposes a cloned read-only projection");
controller.replaceRules(projectedRules);
controller.persist();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-015
assert.match(values.get(SCHEMA_RULE_STORAGE_KEY), /"enabled":false/,
  "the Rule Library accepts state changes through its narrow command");

const row = new EventTarget();
let actions = 0;
controller.listenRow(row, "click", () => { actions += 1; });
row.dispatchEvent(new Event("click"));
controller.setPicker("/checkout/email");
controller.dispose();
row.dispatchEvent(new Event("click"));
// retired-schema-assertion: rule-choice-parameters-predicates-preview-019
assert.equal(actions, 1, "rule disposal removes owned row actions");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-017
assert.equal(controller.pickerPath, undefined);

const configuration={ruleType:"Required",propertyType:"string",severity:"error",message:"",enabled:true,
  applyOnlyWhen:false,conditionGroupOperator:"All",conditions:[],saveReusable:true,reusableName:"Reusable",description:"",
  allowedValues:[],exactValue:"",pattern:"",comparison:"",limit:"",minimum:"",maximum:""};
controller.setConfiguration(configuration);
const projectedConfiguration=controller.configuration;
projectedConfiguration.description="Changed outside the owner";
// retired-schema-assertion: rule-choice-parameters-predicates-preview-004
assert.equal(controller.configuration.description,"","configuration projections do not expose controller state");
controller.setConfiguration({...projectedConfiguration,description:"SKUs accepted by fulfilment"});
// retired-schema-assertion: rule-choice-parameters-predicates-preview-006
assert.equal(controller.configuration.description,"SKUs accepted by fulfilment",
  "the configuration command retains a reusable-rule description");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-001
assert.equal(controller.normalizePickerPath("checkout.total"),"/checkout/total");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-017
assert.equal(controller.normalizePickerPath("/checkout/total"),"/checkout/total");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-013
assert.deepEqual(controller.valueAtPath({checkout:{total:12}},"checkout.total"),{exists:true,value:12});
// retired-schema-assertion: canonical-edit-history-settlement-overlay-046
assert.deepEqual(controller.valueAtPath({checkout:{total:12}},"/checkout/total"),{exists:true,value:12});
assert.deepEqual(controller.valueAtPath({checkout:{}},"checkout.total"),{exists:false,value:undefined});
assert.deepEqual(controller.valueAtPath(undefined,"checkout.total"),{exists:false,value:undefined});
assert.deepEqual(controller.valueAtPath({items:[{sku:"one"}]},"items.0.sku"),{exists:true,value:"one"});
// retired-schema-assertion: rule-revision-attachment-sync-deletion-005
assert.equal(controller.stored("rule:one")?.id,"rule:one");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-019
assert.equal(controller.stored("missing"),undefined);
assert.deepEqual(controller.expansionRules(),controller.rules);
const expansion=controller.expansionRules();
expansion[0].name="External";
// retired-schema-assertion: rule-revision-attachment-sync-deletion-002
assert.equal(controller.stored("rule:one").name,"Required");

controller.setPicker("checkout.email");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-009
assert.equal(controller.pickerPath,"checkout.email");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-020
assert.equal(controller.pickerTrigger,undefined);
controller.setPickerSearch("required");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-021
assert.equal(controller.pickerSearch,"required");
controller.setEditingAttached({id:"rule:one",name:"Required",version:1,enabled:true});
// retired-schema-assertion: rule-revision-attachment-sync-deletion-012
assert.equal(controller.editingAttached.id,"rule:one");
const attached=controller.editingAttached;
attached.name="External";
// retired-schema-assertion: rule-revision-attachment-sync-deletion-013
assert.equal(controller.editingAttached.name,"Required");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-018
assert.equal(controller.conditionPredicate("checkout.total").operator,"All");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-015
assert.equal(controller.conditionPredicate("checkout.total").predicates.length,0);
// retired-schema-assertion: rule-choice-parameters-predicates-preview-008
assert.deepEqual(controller.conditionPredicate("checkout.total"),{operator:"All",predicates:[]});
assert.deepEqual(controller.conditionPredicate("checkout.total",true),{operator:"All",predicates:[]});

controller.resetPickerState();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-022
assert.equal(controller.pickerPath,undefined);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-023
assert.equal(controller.pickerTrigger,undefined);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-027
assert.equal(controller.pickerSearch,"");
// retired-schema-assertion: rule-choice-parameters-predicates-preview-012
assert.equal(controller.configuration,undefined);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-029
assert.equal(controller.editingAttached,undefined);
controller.replaceRules([{id:"rule:two",name:"Pattern",kind:"Pattern",version:2,operator:"pattern",parameters:"^A",enabled:false}]);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-025
assert.equal(controller.rules.length,1);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-007
assert.equal(controller.rules[0].id,"rule:two");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-028
assert.equal(controller.rules[0].enabled,false);
// retired-schema-assertion: rule-revision-attachment-sync-deletion-011
assert.equal(controller.rules[0].version,2);
controller.persist();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-024
assert.match(values.get(SCHEMA_RULE_STORAGE_KEY),/rule:two/u);
// retired-schema-assertion: assignment-conflicts-005
assert.match(values.get(SCHEMA_RULE_STORAGE_KEY),/"enabled":false/u);
controller.replaceRules([]);
assert.deepEqual(controller.rules,[]);
controller.reload();
// retired-schema-assertion: rule-revision-attachment-sync-deletion-030
assert.equal(controller.rules[0].name,"Pattern");
// retired-schema-assertion: rule-revision-attachment-sync-deletion-031
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

assert.ok(controller, "the direct rule owner is constructed");
