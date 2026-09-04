import assert from "node:assert/strict";
import { SchemaRuleAttachmentWorkflow } from "../../../dist/data-layer-installed/schemas/rule-attachment-workflow.js";

const rule={id:"rule:one",name:"Required",kind:"Required",version:2,operator:"required",enabled:true},schemas=[{id:"schema:one",name:"One",version:1,document:{type:"object"},assignments:[],attachedRules:[{id:"rule:one",name:"Required",version:1,operator:"required",enabled:true}]}],closed=[];
const behavior={schemas:()=>schemas,replaceSchemas(next){schemas.splice(0,schemas.length,...next);},persistLibrary(){},renderAll(){},presentation:{showUpgrade(){},showSync(){},close(kind){closed.push(kind);}}};
const workflow=new SchemaRuleAttachmentWorkflow({behavior:()=>behavior,stored:(id)=>id===rule.id?rule:undefined});

// retired-schema-assertion: rule-revision-attachment-sync-deletion-019
assert.equal(workflow.requestUpgrade(rule.id,["schema:one"]),true);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-026
assert.deepEqual(workflow.pendingUpgrade,{id:rule.id,schemaIds:["schema:one"]});workflow.confirmUpgrade();

// retired-schema-assertion: rule-revision-attachment-sync-deletion-017
assert.equal(schemas[0].attachedRules[0].version,2);

// retired-schema-assertion: rule-revision-attachment-sync-deletion-008
assert.equal(workflow.pendingUpgrade,undefined);
schemas[0]={...schemas[0],attachedRules:[{...schemas[0].attachedRules[0],version:1}]};

// retired-schema-assertion: rule-revision-attachment-sync-deletion-011
assert.equal(workflow.requestSync(rule.id),true);schemas[0]={...schemas[0],attachedRules:[]};
assert.throws(()=>workflow.confirmSync(),/changed after review/);workflow.dispose();

// retired-schema-assertion: rule-revision-attachment-sync-deletion-009
assert.equal(workflow.pendingSync,undefined);
assert.deepEqual(closed,["upgrade"]);
