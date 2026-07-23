import assert from "node:assert/strict";
import {canonicalMigrationDurablyAcknowledged} from "../dist/data-layer-side-panel-schema-editor.js";

const canonical={
  id:"canonical:event:legacy-clean",
  contributorId:"event:legacy-clean",
  contributorName:"Legacy Clean Event",
  revision:1,
  rootIds:["property:clean"],
  nodes:{"property:clean":{id:"property:clean",name:"clean_value",type:"string",order:0,provenance:[]}},
};
const project=(event)=>({
  project:{
    id:"project:migration",
    name:"Migration",
    collections:{profiles:[],pageGroups:[],pages:[],events:[event],flows:[]},
    documentationFlowGraphs:{},
  },
  history:{undo:[],redo:[]},
});
const pending=project({
  id:"event:legacy-clean",
  name:"Legacy Clean Event",
  schemaConstraints:[{path:"/clean_value",type:"string"}],
});
const committed=project({
  id:"event:legacy-clean",
  name:"Legacy Clean Event",
  canonicalSchema:canonical,
});

assert.equal(
  canonicalMigrationDurablyAcknowledged(pending,"events:event:legacy-clean",canonical),
  false,
  "a pending compatibility projection cannot acknowledge migration completion",
);
assert.equal(
  canonicalMigrationDurablyAcknowledged(committed,"events:event:legacy-clean",canonical),
  true,
  "the exact canonical document with no editable legacy representation acknowledges completion",
);
const reorderedCanonical={
  nodes:canonical.nodes,
  rootIds:canonical.rootIds,
  revision:canonical.revision,
  contributorName:canonical.contributorName,
  contributorId:canonical.contributorId,
  id:canonical.id,
};
assert.equal(
  canonicalMigrationDurablyAcknowledged(
    project({id:"event:legacy-clean",name:"Legacy Clean Event",canonicalSchema:reorderedCanonical}),
    "events:event:legacy-clean",
    canonical,
  ),
  true,
  "repository reconstruction order does not make equal canonical content look unacknowledged",
);
assert.equal(
  canonicalMigrationDurablyAcknowledged(
    project({...committed.project.collections.events[0],schemaConstraints:[{path:"/clean_value",type:"string"}]}),
    "events:event:legacy-clean",
    canonical,
  ),
  false,
  "canonical bytes do not acknowledge completion while an editable legacy source remains",
);

console.log("canonical migration acknowledgement tests passed");
