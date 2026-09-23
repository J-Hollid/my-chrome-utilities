import assert from "node:assert/strict";

import {createDurableProjectConfigurationRepository} from
  "../../dist/configuration-portability/durable-project-adapter.js";
import {createMemoryDurableProjectRepository} from
  "../../dist/data-layer-durable-project-repository.js";
import {createSpecificationProject} from
  "../../dist/data-layer-specification-project.js";

const project=(id,name)=>createSpecificationProject({name,site:`${id}.example`,id:kind=>
  kind==="project"?id:`${kind}:${id}`});

for(let index=0;index<12;index+=1){
  const source=createMemoryDurableProjectRepository({token:()=>`source:${index}`,now:()=>"2026-09-14T00:00:00.000Z"});
  const target=createMemoryDurableProjectRepository({token:()=>`target:${index}`,now:()=>"2026-09-14T00:00:00.000Z"});
  await source.putProject(project(`project:source:${index}`,`Source ${index}`),{active:true,draftSequence:index});
  await target.putProject(project(`project:target:${index}`,`Target ${index}`),{active:true,draftSequence:index});
  const sourcePort=createDurableProjectConfigurationRepository(source),targetPort=createDurableProjectConfigurationRepository(target);
  const stoppedRead=new AbortController();stoppedRead.abort();
  await assert.rejects(()=>sourcePort.read({signal:stoppedRead.signal}),({name})=>name==="AbortError",
    "a cancelled project read stops before creating archive bodies");
  const snapshot=await sourcePort.read(),record=snapshot.sections.projects[0];
  assert.match(record.value.archiveContentDigest,/^[a-f0-9]{64}$/u,"each project record binds its archive bytes");
  const before=await targetPort.read();target.injectFailure("transaction aborted");
  await assert.rejects(()=>targetPort.commit(snapshot),({name})=>name==="AbortError");target.clearFailure();
  assert.deepEqual(await targetPort.read(),before,"a failed durable generation switch retains all prior project state");
  await targetPort.commit(snapshot);
  assert.deepEqual(await targetPort.read(),snapshot,"a durable generation switch round-trips one coherent project snapshot");
  const corrupt=structuredClone(snapshot);corrupt.bodies[0].bytes[0]^=1;
  await assert.rejects(()=>targetPort.commit(corrupt),/bound digest/u);
  assert.deepEqual(await targetPort.read(),snapshot,"invalid staged bytes do not change visible project state");
}

console.log("complete configuration portability properties passed");
