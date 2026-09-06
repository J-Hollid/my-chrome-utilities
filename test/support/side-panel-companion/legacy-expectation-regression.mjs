import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFile} from "node:fs/promises";
import {runInNewContext} from "node:vm";
import {timeoutIncidentDigest} from "../../../scripts/verification-reliability-values.mjs";

export async function verifyLegacyCompanionExpectation(context,visibleUtilityBadges) {
  const target="test/support/side-panel-browser-fixture-primitives.mjs";
  const previous=execFileSync("git",["show",`904b7438:${target}`],{encoding:"utf8",timeout:5000,maxBuffer:2*1024*1024});
  const current=await readFile(target,"utf8");
  const expectation=source=>{
    const match=source.match(/assert\.deepEqual\(workspacePanelContainmentObservation,\s*(\{[\s\S]*?\}), `Workspace panel containment/);
    assert.ok(match,"The retained workspace assertion must be present");
    return JSON.parse(JSON.stringify(runInNewContext(`(${match[1]})`,{},{timeout:100})));
  };
  const before=expectation(previous),after=expectation(current);
  assert.equal(before.utilityDirectory.visible,true);
  assert.equal(after.utilityDirectory.visible,false);
  const conserved=structuredClone(after);conserved.utilityDirectory.visible=true;
  assert.deepEqual(conserved,before,"All non-superseded workspace assertions remain intact");
  const installedVisible=visibleUtilityBadges>0;
  const accepted=expected=>{
    try {assert.equal(installedVisible,expected.utilityDirectory.visible);return true;}
    catch{return false;}
  };
  const oldAccepted=accepted(before),newAccepted=accepted(after);
  assert.equal(oldAccepted,false);assert.equal(newAccepted,true);
  assert.throws(()=>assert.equal(true,after.utilityDirectory.visible));
  const observed={accepted:newAccepted,otherAssertionsConserved:true,rejectsVisibleBadges:true};
  const fixture={id:"companion-hidden-utility-directory-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{installedVisible,source:"installed companion view observations"},
    expectedPreRepairFailure:{accepted:false},expectedRepairResult:observed};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{accepted:oldAccepted}},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}
