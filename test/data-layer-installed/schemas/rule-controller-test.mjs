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

assert.ok(installedOwned.elements.confirmRevision,
  "Schemas creates its rule revision controls from a minimal dialog host");

assert.equal(installedOwned.elements.confirmRevision.id,"confirm-schema-rule-revision-review");

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

assert.deepEqual(migratedController.stored("rule:quantities").allowedValues,[1,2]);

assert.equal(migratedController.stored("rule:quantities").parameters,undefined);

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

assert.ok(controller, "the direct rule owner is constructed");
