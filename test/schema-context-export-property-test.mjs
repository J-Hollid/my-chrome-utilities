import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import {canonicalSchemaFromJsonSchema} from "../dist/data-layer-canonical-schema.js";
import {createContextExportSnapshot,contextExportIdentity} from "../dist/schema-context-export/snapshot.js";

let cases=0;
for(let depth=1;depth<=6;depth++)for(const [type,value,wrong] of [["string","text",1],["number",12.5,"12.5"],["boolean",false,"false"],["null",null,0]]){
  let items={type},valid=value,invalid=wrong;
  for(let n=0;n<depth;n++){items={type:"array",items};valid=[valid];invalid=[invalid];}
  const canonical=canonicalSchemaFromJsonSchema({id:`depth-${depth}-${type}`,contributorId:"profile",contributorName:"Nested",sourceIdentity:"nested",sourceRevision:1,document:{type:"object",properties:{matrix:items}},idFactory:()=>crypto.randomUUID()});
  const source={key:canonical.id,name:"../ Safe / 名称",role:"Shared Profile",context:"Flow",version:"Draft",canonical};
  const before=JSON.stringify(source),snapshot=createContextExportSnapshot(source),validate=new Ajv2020({strict:false}).compile(snapshot.document);
  assert.equal(validate({matrix:valid}),true);assert.equal(validate({matrix:invalid}),false);
  assert.equal(JSON.stringify(source),before);assert.equal(snapshot.document.$id,undefined);assert.match(snapshot.filename,/^[a-z0-9-]+\.schema\.json$/);
  const identity=contextExportIdentity(source);canonical.view="table";canonical.selectedPropertyId=Object.keys(canonical.nodes)[0];assert.equal(contextExportIdentity(source),identity);
  assert.equal(snapshot.text,`${JSON.stringify(snapshot.document,null,2)}\n`);cases++;
}
console.log(`Schema export properties: ${cases} recursive typed-array cases passed.`);
