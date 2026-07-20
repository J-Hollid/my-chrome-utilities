import assert from "node:assert/strict";
import {
  addCanonicalProperty,
  canonicalPropertyPath,
  canonicalTableRows,
  createCanonicalRepository,
  createCanonicalSchema,
  renameCanonicalProperty,
} from "../dist/data-layer-canonical-schema.js";

let seed=0x5eed1234;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/0x100000000);
const word=(prefix)=>`${prefix}_${Math.floor(random()*1_000_000)}`;

for(let example=0;example<200;example+=1){
  let sequence=0;
  const id=(kind)=>`${kind}:${example}:${++sequence}`;
  let document=createCanonicalSchema({id:`schema:${example}`,contributorId:`profile:${example}`,contributorName:`Profile ${example}`});
  const rootName=word("root"),childName=word("child"),renamedRoot=word("renamed");
  ({document}=addCanonicalProperty(document,{baseRevision:document.revision,name:rootName,type:"object",id}));
  const rootId=document.selectedPropertyId;
  ({document}=addCanonicalProperty(document,{baseRevision:document.revision,parentId:rootId,name:childName,type:"string",id}));
  const childId=document.selectedPropertyId,beforeRevision=document.revision;
  ({document}=renameCanonicalProperty(document,{baseRevision:document.revision,propertyId:rootId,name:renamedRoot}));

  assert.equal(document.nodes[childId].id,childId,"ancestor rename preserves descendant identity");
  assert.equal(canonicalPropertyPath(document,childId),`/${renamedRoot}/${childName}`);
  assert.equal(document.revision,beforeRevision+1);
  assert.deepEqual(new Set(canonicalTableRows(document).map(({id})=>id)).size,Object.keys(document.nodes).length);

  const repository=createCanonicalRepository(document),baseRevision=document.revision;
  const firstName=word("first"),secondName=word("second");
  assert.equal(repository.dispatch({kind:"add",baseRevision,name:firstName,type:"string",id}).status,"applied");
  assert.equal(repository.dispatch({kind:"add",baseRevision,name:secondName,type:"string",id}).status,"rebased");
  const current=repository.current(),names=Object.values(current.nodes).map(({name})=>name);
  assert.equal(names.filter((name)=>name===firstName).length,1);
  assert.equal(names.filter((name)=>name===secondName).length,1);
  assert.equal(current.revision,baseRevision+2);
}

console.log("data-layer canonical schema property tests passed");
