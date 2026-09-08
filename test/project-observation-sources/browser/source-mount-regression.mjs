import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";

export async function verifySourceMountRegression(context) {
  const file=new URL("../../../dist/data-layer-installed/project-event-transport/source-controller.js",import.meta.url);
  const source=await readFile(file,"utf8"),mount=source.indexOf("mount()");
  const reset=source.indexOf("loadedKey = undefined;",mount);
  assert.ok(reset>mount,"the first UI mount invalidates the preloaded settings key");
  const before=source.slice(0,reset)+source.slice(reset+"loadedKey = undefined;".length);
  async function announcesInitialConfiguration(program) {
    const resolved=program.replace(/from "(\.[^"]+)"/g,(_,relative)=>`from "${new URL(relative,file).href}"`);
    const {createInstalledSourceSettings}=await import("data:text/javascript;base64,"+Buffer.from(resolved).toString("base64"));
    let announced=0;
    const settings=createInstalledSourceSettings({querySelector:()=>null},{
      projectId:()=>"retail",configurationKey:()=>"retail:source-one",
      load:async()=>({projectId:"retail",sources:[{id:"one",name:"History",path:"dataLayer",enabled:true}]}),save:async()=>{},
    },async()=>undefined,()=>{announced++;},()=>{});
    await settings.refresh();
    settings.mount();await new Promise(setImmediate);settings.dispose();
    return {initialConfigurationAnnounced:announced>0};
  }
  const preRepairResult=await announcesInitialConfiguration(before),repairResult=await announcesInitialConfiguration(source);
  const expectedPreRepairFailure={initialConfigurationAnnounced:false},expectedRepairResult={initialConfigurationAnnounced:true};
  assert.deepEqual(preRepairResult,expectedPreRepairFailure);assert.deepEqual(repairResult,expectedRepairResult);
  if (!context) return;
  const normalize=value=>Array.isArray(value)?value.map(normalize):value&&typeof value==="object"
    ?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalize(item)])):value;
  const digest=value=>createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
  const fixture={id:"preloaded-source-settings-first-mount-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{preload:true,thenMount:true},
    expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:preRepairResult},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
}
