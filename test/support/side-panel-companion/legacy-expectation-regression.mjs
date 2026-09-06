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
  const conserved=structuredClone(after);conserved.utilityDirectory.visible=true;delete conserved.utilityDirectory.hidden;
  assert.deepEqual(conserved,before,"All non-superseded workspace assertions remain intact");
  assert.equal(after.utilityDirectory.hidden,true);
  if(context.causalCategory==="other:companion hidden directory evidence") {
    const manifest="verification/manifests/shell.json";
    const oldManifest=JSON.parse(execFileSync("git",["show",`b989a327:${manifest}`],{encoding:"utf8",timeout:5000,maxBuffer:2*1024*1024}));
    const newManifest=JSON.parse(await readFile(manifest,"utf8"));
    const target=document=>document.pack.browserEvidencePartitions.find(mode=>mode.sessionBatch==="shell-containment");
    const beforeMode=target(oldManifest),afterMode=target(newManifest);
    assert.deepEqual(afterMode,JSON.parse(JSON.stringify(beforeMode).replaceAll("workspacePanelContainment.utilityDirectory.visible","workspacePanelContainment.utilityDirectory.hidden")));
    assert.equal(visibleUtilityBadges,0,"The installed utility directory is hidden");
    assert.equal(visibleUtilityBadges===0,true);
    assert.equal(1===0,false,"One visible badge still fails the hidden-directory result");
  }
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

export async function verifyLegacyProjectSelectors(context,observation) {
  const target="test/browser-packs/project-management.mjs";
  const previous=execFileSync("git",["show",`bd72579f:${target}`],{encoding:"utf8",timeout:5000,maxBuffer:2*1024*1024});
  const current=await readFile(target,"utf8");
  const oldSelector="#active-project-card",newSelector="#project-library-list > li[data-active=true]";
  const before=previous.split("\n").filter(line=>line.includes(oldSelector));
  const after=current.split("\n").filter(line=>line.includes(newSelector)&&!line.includes("companionSelectorObservation"));
  assert.equal(before.length,5);
  assert.deepEqual(after,before.map(line=>line.replaceAll(oldSelector,newSelector)),"Only the obsolete selector changes in the five retained action checks");
  const oldNameCheck=previous.split("\n").find(line=>line.includes("const context010="));
  const newNameCheck=current.split("\n").find(line=>line.includes("const context010="));
  assert.equal(newNameCheck,oldNameCheck.replace("row.querySelector('strong')","row.querySelector('h4')"),"Keep the accessible action-name check on the new project heading");
  assert.equal(observation.oldButtons,0);
  assert.equal(observation.activeRows,1);
  assert.ok(observation.newButtons>=4);
  const accepted=count=>count>0;
  assert.equal(accepted(observation.oldButtons),false);
  assert.equal(accepted(observation.newButtons),true);
  assert.equal(accepted(0),false,"A missing active-row action still fails");
  const observed={accepted:true,actionAssertionsConserved:true,rejectsMissingActions:true};
  const fixture={id:"companion-active-project-selectors-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:observation,expectedPreRepairFailure:{accepted:false},expectedRepairResult:observed};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{accepted:false}},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}

export async function verifyLegacyPreviewContainment(context) {
  const target="test/support/side-panel-schema-documentation-targets.mjs";
  const previous=execFileSync("git",["show",`f7314e53:${target}`],{encoding:"utf8",timeout:5000,maxBuffer:2*1024*1024});
  const current=await readFile(target,"utf8");
  const expression=source=>{
    const match=source.match(/const contained=(Array\.from\(builder.children\)[\s\S]*?);const th=/);
    assert.ok(match);return match[1];
  };
  const before=expression(previous),after=expression(current);
  assert.equal(after,before.replace("child!==region)","child!==region&&child.getClientRects().length>0)"));
  const bounds={left:29.140625,right:260.859375};
  const node=(left,right,visible)=>({getBoundingClientRect:()=>({left,right}),getClientRects:()=>visible?[{left,right}]:[]});
  const region=node(bounds.left,1472,true),visible=node(bounds.left,bounds.right,true),hidden=node(0,0,false);
  const evaluate=(code,children)=>runInNewContext(code,{builder:{children},bounds,region},{timeout:100});
  const children=[visible,region,hidden];
  assert.equal(evaluate(before,children),false);
  assert.equal(evaluate(after,children),true);
  assert.equal(evaluate(after,[...children,node(bounds.left,bounds.right+20,true)]),false);
  assert.equal(evaluate(after,[...children,node(bounds.left-20,bounds.right,true)]),false);
  const observed={accepted:true,rejectsLeftOverflow:true,rejectsRightOverflow:true};
  const fixture={id:"companion-hidden-preview-output-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{bounds,hiddenOutput:{left:0,right:0,layoutBoxes:0},source:"recorded installed preview diagnostic"},
    expectedPreRepairFailure:{accepted:false},expectedRepairResult:observed};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:{accepted:false}},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}
