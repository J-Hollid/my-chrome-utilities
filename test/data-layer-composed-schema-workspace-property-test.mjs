import assert from "node:assert/strict";
import {
  composedCanonicalSchema,
  composedSchemaWorkspace,
  resetComposedSchemaLocalProperty,
  saveComposedCanonicalDocument,
  saveComposedSchemaLocalFacets,
} from "../dist/data-layer-composed-schema-workspace.js";
import {applyCanonicalCommand,canonicalPropertyPath} from "../dist/data-layer-canonical-schema.js";
import {createSpecificationProject} from "../dist/data-layer-specification-project.js";

let seed=0x636f6d70;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/0x100000000);
const token=(prefix)=>`${prefix}_${Math.floor(random()*1_000_000)}`;

for(let example=0;example<150;example+=1){
  const path=`/${token("property")}`,unrelatedPath=`/${token("unrelated")}`,parentValue=token("parent"),localValue=token("local"),state=createSpecificationProject({name:`Composition ${example}`,site:"shop.example",id:(kind)=>`${kind}:${example}`});
  state.project.collections.profiles.push({id:`profile:${example}`,name:`Profile ${example}`,schemaConstraints:[{path,type:"string",expectedValue:parentValue},{path:unrelatedPath,type:"string"}]});
  state.project.collections.pageGroups.push({id:`group:${example}`,name:`Group ${example}`,profileId:`profile:${example}`});
  state.project.collections.pages.push({id:`page:${example}`,name:`Page ${example}`,profileId:`profile:${example}`,pageGroupIds:[`group:${example}`],localSchemaContributions:[{path:unrelatedPath,documentation:"preserve me"}]});

  const saved=saveComposedSchemaLocalFacets(state,"pages",`page:${example}`,path,{expectedValue:localValue,documentation:""}),savedPage=saved.project.collections.pages[0],savedRows=composedSchemaWorkspace(saved,savedPage,"Page").rows;
  assert.deepEqual(savedPage.localSchemaContributions,[{path:unrelatedPath,documentation:"preserve me"},{path,expectedValue:localValue}]);
  assert.deepEqual(savedRows.map(({path:rowPath})=>rowPath),[...new Set(savedRows.map(({path:rowPath})=>rowPath))].sort((left,right)=>left.localeCompare(right)));
  assert.equal(savedRows.find(({path:rowPath})=>rowPath===path).effective.expectedValue,localValue);

  const reset=resetComposedSchemaLocalProperty(saved,"pages",`page:${example}`,path),resetPage=reset.project.collections.pages[0],resetRows=composedSchemaWorkspace(reset,resetPage,"Page").rows;
  assert.deepEqual(resetPage.localSchemaContributions,[{path:unrelatedPath,documentation:"preserve me"}]);
  assert.equal(resetRows.find(({path:rowPath})=>rowPath===path).effective.expectedValue,parentValue);

  const projected=composedCanonicalSchema(reset,resetPage,"Page"),node=Object.values(projected.nodes).find((candidate)=>canonicalPropertyPath(projected,candidate.id)===path);
  assert.ok(node,`example ${example} projects its inherited property into the canonical core`);
  const edited=applyCanonicalCommand(projected,{kind:"set",baseRevision:projected.revision,propertyId:node.id,patch:{expectedValue:localValue}});
  assert.equal(edited.status,"applied");
  const written=saveComposedCanonicalDocument(reset,"pages",`page:${example}`,edited.document),writtenPage=written.project.collections.pages[0];
  assert.equal(writtenPage.localSchemaContributions.length,2);
  assert.deepEqual(writtenPage.localSchemaContributions.find(({path:storedPath})=>storedPath===unrelatedPath),{path:unrelatedPath,documentation:"preserve me"},`example ${example} conserves an unrelated sparse contribution`);
  assert.deepEqual(writtenPage.localSchemaContributions.find(({path:storedPath})=>storedPath===path),{path,expectedValue:localValue},`example ${example} stores only its sparse local difference from the effective core`);
  assert.equal(composedSchemaWorkspace(written,writtenPage,"Page").rows.find(({path:rowPath})=>rowPath===path).effective.expectedValue,localValue);
}

console.log("data-layer composed schema workspace property tests passed");
