import assert from "node:assert/strict";
import { SchemaCanonicalPersistenceWorkflow } from "../../../dist/data-layer-installed/schemas/canonical-persistence-workflow.js";
import { SchemaPersistenceController } from "../../../dist/data-layer-installed/schemas/persistence-controller.js";

const calls=[],schemas=[{id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[]}];
const library={schemas,persist(){calls.push("persist");}},rules={rules:[],render(){calls.push("rules-render");},persist(){calls.push("rules-persist");}},canonical={settlementClaims:new Map([[7,"schema:one"]]),editor:undefined,settlementSchemaId:undefined,
  hasEditor(){return false;},projectionPendingForSchema(){return false;},
  beginSettlement(id){calls.push(["begin",id]);return 7;},clearSettlement(id,claim){calls.push(["clear",id,claim]);return true;},queueLibraryPersistence(id,current,persist){calls.push(["queue",id,current.length]);persist();}};
const view={renderContext(){calls.push("context");},render(){calls.push("render");},open(adapter){calls.push(["open",adapter.key]);},close(value){calls.push(["close",value]);},openSaved(schema){calls.push(["saved",schema.id]);},projection(){return schemas[0];},facet(){return "facet";}};
const workflow=new SchemaCanonicalPersistenceWorkflow({root:{querySelector(){return null;}},storage:{setItem(){},getItem(){return null;},removeItem(){}},library,rules,property:{},canonical,view,editor:{setAttribute(name,value){calls.push([name,value]);}},save:{disabled:false},scheduleFrame(run){run();},renderAll(){calls.push("all");},editorDraft:(schema)=>schema});
workflow.renderContext();workflow.render();workflow.queueLibraryPersistence("schema:one");

assert.deepEqual(calls.slice(0,5),["context","render",["queue","schema:one",1],"persist"]);

assert.equal(workflow.beginSettlement("schema:one"),7);await workflow.settle({type:"saved",schemaId:"schema:one"});

assert.equal(calls.some((entry)=>Array.isArray(entry)&&entry[0]==="clear"),true);
const completion=workflow.begin("guided","schema:one",schemas,[],schemas,[]);await workflow.settle({type:"saved",schemaId:"schema:one"});await completion;

let transactionSchemas=[...schemas],transactionRules=[];
const transactionLibrary={get schemas(){return structuredClone(transactionSchemas);},activeSchemaId:undefined,
  replaceSchemas(next){transactionSchemas=structuredClone(next);},reload(){}};
const transactionRuleOwner={get rules(){return structuredClone(transactionRules);},replaceRules(next){transactionRules=structuredClone(next);},persist(){}};
const transactionCanonical={settlementClaims:new Map(),settlementSchemaId:undefined,hasEditor:()=>false,
  projectionPendingForSchema:()=>false,rejectDurableChange(){}};
const persistenceController=new SchemaPersistenceController({root:{querySelector:()=>null},storage:{setItem(){}},library:transactionLibrary,
  rules:transactionRuleOwner,property:{pendingCopyPosition:undefined},canonical:transactionCanonical,scheduleFrame:(run)=>run(),renderAll(){},
  renderRules(){},renderCanonical(){},clearCanonicalSettlement(){},editorDraft:(schema)=>schema});
assert.equal(persistenceController.promotion,undefined,"promotion persistence transactions are private");
assert.equal(persistenceController.guided,undefined,"guided persistence transactions are private");
const retryRule={id:"rule:guided-retry",name:"Guided retry",kind:"Required",version:1,enabled:true};
const previousRules=[];
const nextRules=[retryRule];
persistenceController.apply(transactionSchemas,nextRules);
const retryCompletion=persistenceController.begin("guided","schema:one",transactionSchemas,previousRules,transactionSchemas,nextRules);
persistenceController.settle({type:"failed",schemaId:"schema:one",error:new Error("offline")});

// retired-schema-assertion: guided-selection-continuation-promotion-040
assert.equal(transactionRuleOwner.rules.some(({id})=>id==="rule:guided-retry"),false);
persistenceController.settle({type:"retried",schemaId:"schema:one"});
await retryCompletion;

// retired-schema-assertion: guided-selection-continuation-promotion-041
assert.equal(transactionRuleOwner.rules.some(({id})=>id==="rule:guided-retry"),true);
persistenceController.settle({type:"rejected",schemaId:"schema:one",error:new Error("stale rejection")});

// retired-schema-assertion: guided-selection-continuation-promotion-043
assert.equal(transactionRuleOwner.rules.some(({id})=>id==="rule:guided-retry"),true);
const rejectedRule={id:"rule:guided-reject",name:"Guided reject",kind:"Required",version:1,enabled:true};
const beforeRejectedRules=transactionRuleOwner.rules;
const rejectedNextRules=[...beforeRejectedRules,rejectedRule];
persistenceController.apply(transactionSchemas,rejectedNextRules);
const rejectedCompletion=persistenceController.begin("guided","schema:one",transactionSchemas,beforeRejectedRules,
  transactionSchemas,rejectedNextRules);
const observedRejection=rejectedCompletion.then(()=>undefined,(error)=>error);
persistenceController.settle({type:"failed",schemaId:"schema:one",error:new Error("conflict")});
persistenceController.settle({type:"rejected",schemaId:"schema:one",error:new Error("rejected by operator")});

// retired-schema-assertion: guided-selection-continuation-promotion-044
assert.match(String(await observedRejection),/rejected by operator/);

// retired-schema-assertion: guided-selection-continuation-promotion-045
assert.equal(transactionRuleOwner.rules.some(({id})=>id==="rule:guided-reject"),false);

const disposedCompletion=persistenceController.begin("guided","schema:one",transactionSchemas,transactionRuleOwner.rules,
  transactionSchemas,transactionRuleOwner.rules);
const disposedRejection=disposedCompletion.then(()=>undefined,(error)=>error);
persistenceController.dispose(new Error("Schemas controller disposed before durable persistence settled"));

// retired-schema-assertion: canonical-stale-work-lifecycle-disposal-005
assert.match(String(await disposedRejection),/disposed before durable persistence settled/);
