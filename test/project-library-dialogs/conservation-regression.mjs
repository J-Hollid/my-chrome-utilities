import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFile} from "node:fs/promises";
import {runCompactConservationCommand} from "../../scripts/verification-registry/compact-conservation-command.mjs";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-values.mjs";

export async function verifyDialogConservationRepair(context) {
  const target="test/fixtures/verification-process-compact-conservation.json";
  const prior=execFileSync("git",["show",`619046d7:${target}`],{encoding:"utf8",timeout:5000,maxBuffer:1024*1024});
  const current=await readFile(target,"utf8");
  const check=async bytes=>{
    try {
      await runCompactConservationCommand(["check"],{read:(file,...args)=>file.endsWith(target)?Promise.resolve(bytes):readFile(file,...args)});
      return "accepted";
    } catch(error) {
      assert.match(error.message,/Compact conservation/);
      return "rejected";
    }
  };
  const before=JSON.parse(prior),after=JSON.parse(current);
  assert.deepEqual(after.semanticProjection,before.semanticProjection);
  assert.deepEqual(after.legacyBaseline,before.legacyBaseline);
  const changed=after.records.filter((record,index)=>JSON.stringify(record)!==JSON.stringify(before.records[index]));
  assert.deepEqual(changed.map(record=>record.boundaryIdentity.owner),["test/verification-contracts/registry-project-management-contract-test.mjs"]);
  const observed={prior:await check(prior),current:await check(current),projectionConserved:true};
  assert.deepEqual(observed,{prior:"rejected",current:"accepted",projectionConserved:true});
  const fixture={id:"project-library-dialog-conservation-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    expectedPreRepairFailure:{result:"rejected"},expectedRepairResult:{result:"accepted",projectionConserved:true}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{result:observed.prior}},
    repairResult:{status:"passed",fixtureDigest,observed:{result:observed.current,projectionConserved:true}}}}));
}
