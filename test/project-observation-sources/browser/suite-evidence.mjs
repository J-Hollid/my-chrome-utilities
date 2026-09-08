import assert from 'node:assert/strict';
import {evaluate} from './chrome.mjs';
import {installSourceControls} from './controls.mjs';
import {observeSourceEvidence} from './evidence.mjs';
import {observeSourcePush} from './push.mjs';
export async function runEvidenceCases(open,selected) {
  const results={};
  if(!selected||selected==='evidence'){
    results.evidence=[];
    for(const [payload,source] of [[{event:'purchase',value:10},'Marketing'],[{event:'pageview',page:'/'},'Application']]){
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeSourceEvidence.toString()})(${JSON.stringify(payload)},${JSON.stringify(source)})`);
      assert.equal(report.original.length,2);assert.notEqual(report.original[0].id,report.original[1].id);
      assert.equal(report.filtered.length,1);assert.equal(report.count,'1 event');assert.match(report.inspector,new RegExp(source));
      for(const event of report.original)for(const saved of [report.saved.find(saved=>saved.id===event.id),report.restored.find(saved=>saved.id===event.id)])
        for(const field of ['sourceId','sourceName','sourcePath','projectId','pageLoadId'])assert.equal(saved[field],event[field],field);
      assert.equal(report.defect.occurrenceMatch.sourceId,source.toLowerCase());
      assert.equal(report.assignment[0].winner,'assignment:marketing-only');assert.ok(report.assignment[0].issues.length>0);
      assert.equal(report.assignment[1].winner,undefined);assert.deepEqual(report.assignment[1].issues,[]);assert.ok(report.assignment[1].rejected.includes('source'));
      assert.deepEqual(report.cleared.map(event=>event.id),report.original.map(event=>event.id));assert.equal(report.unchanged,true);
      results.evidence.push(report);
    }
  }
  if(!selected||selected==='push'){
    results.push=[];
    for(const source of ['Marketing','Application']){
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeSourcePush.toString()})(${JSON.stringify(source)})`);
      assert.equal(report.directDestination,'commandQueue');assert.deepEqual(report.direct,[['direct_new',{}]]);
      assert.deepEqual(report.explicit,[['explicit_saved',{value:10}]]);assert.deepEqual(report.observationLengths,[1,1]);
      assert.equal(report.libraryUnchanged,true);assert.equal(report.draftDestination,'commandQueue');assert.equal(report.renderedDestination,'commandQueue');
      assert.deepEqual(report.settings.observationSources.map(source=>source.path),['dataLayer','event.history']);results.push.push(report);
    }
  }
  return results;
}
