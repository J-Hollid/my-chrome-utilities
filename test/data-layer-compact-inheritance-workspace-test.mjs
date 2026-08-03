import assert from "node:assert/strict";

import {composedSchemaInheritanceStatus,composedSchemaTableColumns} from "../dist/data-layer-composed-schema-workspace-rows.js";
import {composedSchemaWorkspace,saveComposedSchemaLocalFacetsAndStructures,schemaContributorUsesEffectiveWorkspace} from "../dist/data-layer-composed-schema-workspace.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";
import {profileInheritanceEditorStartingPoint} from "../dist/data-layer-selective-profile-inheritance.js";

assert.equal(profileInheritanceEditorStartingPoint("everything"),"everything","Everything remains an explicit editor starting point");
assert.equal(profileInheritanceEditorStartingPoint("empty"),"empty","Start empty remains an explicit editor starting point");
assert.equal(profileInheritanceEditorStartingPoint("concepts"),"empty","legacy Choose concepts recipes reopen from Start empty");
assert.equal(profileInheritanceEditorStartingPoint("properties"),"empty","legacy Choose properties recipes reopen from Start empty");

assert.deepEqual(composedSchemaTableColumns.map(({label})=>label),["","Path","Concept","Type","Presence","Description","Allowed values","Example","Inheritance"],"composed effective-schema tables replace Source and State with one Inheritance column");
assert.equal(composedSchemaInheritanceStatus({inherited:{path:"/parent"},local:{path:"/parent"}}),"Inherited");
assert.equal(composedSchemaInheritanceStatus({local:{path:"/local",type:"string"}}),"Local");
assert.equal(composedSchemaInheritanceStatus({inherited:{path:"/mixed",type:"string"},local:{path:"/mixed",documentation:"Local"}}),"Mixed / overridden");

for(const scope of ["Property Set","Page","Event","Flow Page-instance","Event-occurrence"]){
  assert.equal(schemaContributorUsesEffectiveWorkspace(scope),true,`${scope} keeps the complete effective workspace after sparse saves`);
}
assert.equal(schemaContributorUsesEffectiveWorkspace("Shared Profile"),false,"Shared Profiles retain their canonical source editor");

let continuity=createSpecificationProject({name:"Inherited continuity",site:"shop.example",id:(kind)=>`${kind}:continuity`});
continuity.project.collections.profiles.push({id:"profile:continuity",name:"Sitewide",schemaConstraints:[
  {path:"/customer_status",type:"string"},
  {path:"/order_total",type:"number"},
]});
continuity.project.collections.propertySets.push({id:"group:continuity",name:"Checkout",profileId:"profile:continuity",localSchemaContributions:[{path:"/checkout_note",type:"string"}]});
const continuityGroup=()=>continuity.project.collections.propertySets[0],rowPaths=()=>composedSchemaWorkspace(continuity,continuityGroup(),"Property Set").rows.map(({path})=>path),initialOrder=rowPaths(),initialUndo=continuity.history.undo.length;
continuity=saveComposedSchemaLocalFacetsAndStructures(continuity,"propertySets",continuityGroup().id,"/customer_status",{documentation:"Current customer status"},[],(kind)=>`${kind}:first`);
let continuityWorkspace=composedSchemaWorkspace(continuity,continuityGroup(),"Property Set");
assert.deepEqual(rowPaths(),initialOrder,"the first repository-backed sparse save preserves every effective row and its order");
assert.deepEqual(continuityWorkspace.rows.map((row)=>[row.path,composedSchemaInheritanceStatus(row)]),[
  ["/checkout_note","Local"],
  ["/customer_status","Mixed / overridden"],
  ["/order_total","Inherited"],
]);
continuity=saveComposedSchemaLocalFacetsAndStructures(continuity,"propertySets",continuityGroup().id,"/order_total",{examples:[125]},[],(kind)=>`${kind}:second`);
continuityWorkspace=composedSchemaWorkspace(continuity,continuityGroup(),"Property Set");
assert.deepEqual(rowPaths(),initialOrder,"a second inherited edit remains possible without reopening the workspace");
assert.deepEqual(continuityWorkspace.rows.map((row)=>[row.path,composedSchemaInheritanceStatus(row)]),[
  ["/checkout_note","Local"],
  ["/customer_status","Mixed / overridden"],
  ["/order_total","Mixed / overridden"],
]);
assert.deepEqual(continuityGroup().localSchemaContributions,[
  {path:"/checkout_note",type:"string"},
  {path:"/customer_status",documentation:"Current customer status"},
  {path:"/order_total",examples:[125]},
],"repository persistence retains the local-only row and only the two sparse inherited facets");
assert.equal(continuity.history.undo.length,initialUndo+2,"two inherited-row saves create exactly two Undo commands");

console.log("compact inheritance workspace tests passed");
