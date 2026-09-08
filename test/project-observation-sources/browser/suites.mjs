import assert from "node:assert/strict";
import {evaluate} from "./chrome.mjs";
import {installSourceControls} from "./controls.mjs";
import {observeSourceSettings} from "./settings.mjs";
import {observeSourceActivation,observeUnavailableSource} from "./activation.mjs";
import {observeSourceTransition,observeSourceDisposal,observeArrayRelation} from "./transitions.mjs";
import {installSourceProjectControls,observeProjectSwitch,observeSourcePortability} from "./projects.mjs";
import {runEditingCases} from './suite-editing.mjs';
import {runEvidenceCases} from './suite-evidence.mjs';
export async function runInstalledSourceSuites(open,selected) {
  const results={};
  if(!selected||selected==='projects') {
    const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
    await evaluate(side,`(${installSourceProjectControls.toString()})()`);
    const report=await evaluate(side,`(${observeProjectSwitch.toString()})()`);
    assert.deepEqual(report.partnerEvents.map(event=>event.name),['P0','P1']);
    assert.ok(report.partnerEvents.every(event=>event.projectId===report.partnerId&&event.sourceId==='partner'));
    assert.deepEqual(report.storedRetail,report.expectedRetail);assert.deepEqual(report.reopened.map(source=>source.id),['marketing','application']);
    assert.equal(report.closed.sources,0);assert.equal(report.closed.active,undefined);assert.match(report.closed.guidance,/Open project/);
    assert.equal(report.savedUnchanged,true);
    await side.call('Page.reload');await evaluate(side,`(${installSourceControls.toString()})()`);
    const reloaded=await evaluate(side,'sourceControls.rows()');
    assert.deepEqual(reloaded.map(({status,...source})=>source),report.reopened.map(({status,...source})=>source));
    results.projects={...report,reloaded};
  }
  if(!selected||selected==='portability') {
    results.portability=[];
    for(const [path,pushPath] of [['queue.history','queue'],['dataLayer','dataLayer']]) {
      const side=await open({legacyPath:path,pushPath});await evaluate(side,`(${installSourceControls.toString()})()`);
      await evaluate(side,`(${installSourceProjectControls.toString()})()`);
      const report=await evaluate(side,`(${observeSourcePortability.toString()})(${JSON.stringify(path)},${JSON.stringify(pushPath)})`);
      assert.deepEqual(report.migrated,report.second);assert.equal(report.migrated.length,1);
      assert.equal(report.migrated[0].id,'event-history');assert.equal(report.migrated[0].path,path);
      const configuration=transport=>({...transport,observationSources:transport.observationSources.map(({id,...source})=>source)});
      assert.deepEqual(configuration(report.imported),configuration(report.expected));assert.deepEqual(report.original,report.expected);
      assert.deepEqual(report.importedReferences,[report.imported.observationSources[0].id]);
      assert.equal(report.sourceUnchanged,true);assert.equal(report.libraryUnchanged,true);assert.deepEqual(report.releases,[]);
      assert.ok(report.events.every(event=>event.projectId===report.copyId),JSON.stringify({copyId:report.copyId,events:report.events}));
      assert.equal(new Set(report.events.map(event=>event.sourceId)).size,2);
      results.portability.push(report);
    }
  }
  if(!selected||selected==='transitions') {
    results.transitions=[];
    for(const transition of ['selected target reload at the same URL','selected target navigation to another page','replacement of the dataLayer array on the page']) {
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeSourceTransition.toString()})(${JSON.stringify(transition)})`);
      assert.deepEqual(report.retained,report.original);assert.equal(report.names.includes('staleGeneration'),false);
      assert.equal(report.names.includes('oldArrayAfterReplacement'),false);assert.equal(report.names.filter(name=>name==='R0').length,1);
      if(transition.startsWith('selected target'))assert.notEqual(report.replacementPageLoad,report.original[0].pageLoadId);
      assert.equal(report.subscriptions,2);assert.deepEqual(report.targets,[771]);results.transitions.push(report);
    }
  }
  if(!selected||selected==='disposal') {
    results.disposal=[];
    for(const action of ['Stop testing','selected target closure','selected-origin permission removal']) {
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeSourceDisposal.toString()})(${JSON.stringify(action)})`);
      assert.deepEqual(report.current,report.original);assert.equal(report.newerPushPreserved,true);assert.equal(report.savedUnchanged,true);results.disposal.push(report);
    }
  }
  if(!selected||selected==='aliases') {
    results.aliases=[];
    for(const relation of ['two distinct arrays','the same array']) {
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeArrayRelation.toString()})(${JSON.stringify(relation)})`);
      assert.equal(report.original.length,2);assert.deepEqual(report.resumed,report.original);
      assert.equal(report.initialCalls,relation==='the same array'?1:2);assert.ok(report.results.every(result=>result===1));
      assert.equal(report.receivers,true);assert.equal(report.last.sourceId,'application');assert.equal(report.subscriptions,1);
      results.aliases.push(report);
    }
  }
  if(!selected||selected==='activation') {
    results.activation=[];
    for(const input of [
      {marketing_before:'M0',application_before:'A0',handoff:'Marketing:M1, Application:A1',live:'Application:A2, Marketing:M2'},
      {marketing_before:'M3',application_before:'A3',handoff:'Application:A4, Marketing:M4',live:'Marketing:M5, Application:A5'},
    ]) {
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeSourceActivation.toString()})(${JSON.stringify(input)})`);
      assert.deepEqual(report.order,[`Marketing:${input.marketing_before}`,`Application:${input.application_before}`,...input.handoff.split(', '),...input.live.split(', ')]);
      assert.deepEqual(report.rendered,report.ids);assert.equal(new Set(report.ids).size,6);
      assert.deepEqual(report.sequences,[1,2,3,4,5,6]);assert.equal(new Set(report.captureTimes).size,1);
      assert.equal(report.calls.length,4);assert.ok(report.calls.every(call=>call.receiver));assert.ok(report.results.every(Boolean));
      assert.equal(report.subscriptions,2);assert.deepEqual(report.targets,[771]);results.activation.push(report);
    }
  }
  if(!selected||selected==='unavailable') {
    results.unavailable=[];
    for(const [value,eventName] of [['absent','A1'],['a scalar','A1'],['absent','checkout_started'],['a scalar','consent_updated']]) {
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeUnavailableSource.toString()})(${JSON.stringify(value)},${JSON.stringify(eventName)})`);
      assert.deepEqual(report.names,['M1',eventName]);assert.equal(report.firstUnchanged,true);assert.equal(report.channelsUnchanged,true);
      assert.equal(report.subscriptions,2);results.unavailable.push(report);
    }
  }
  if(!selected||selected==='settings') {
    const side=await open();
    await evaluate(side,`(${installSourceControls.toString()})()`);
    const report=await evaluate(side,`(${observeSourceSettings.toString()})()`);
    for(const row of report.invalid){assert.equal(row.associated,true);assert.equal(row.unchanged,true);assert.equal(row.subscriptions,2);}
    assert.equal(report.failed.failedWrites,1);assert.equal(report.failed.edit,'analyticsQueue');assert.equal(report.failed.retry,'Retry');
    assert.equal(report.failed.oldActive,true);assert.equal(report.failed.committed[0].path,'dataLayer');
    assert.equal(report.retried.oldDetached,true);assert.equal(report.retried.attachedOnce,true);assert.equal(report.retried.subscriptions,2);
    assert.equal(report.disabled.startDisabled,true);assert.equal(report.disabled.guidance,'Enable an observation source');
    assert.deepEqual(report.empty,[]);
    await side.call('Page.reload');
    const reloaded=await evaluate(side,`(async()=>{
      const deadline=performance.now()+10000;
      while(document.querySelector('#side-panel-root')?.dataset.utilityShellReady!=='true'){
        if(performance.now()>deadline)throw new Error('Reload did not complete');await new Promise(requestAnimationFrame);
      }
      return {rows:document.querySelectorAll('.observation-source-row').length,disabled:document.querySelector('#start-data-layer-testing').disabled};
    })()`);
    assert.equal(reloaded.rows,0);assert.equal(reloaded.disabled,true);
    results.settings={...report,reloaded};
  }
  Object.assign(results,await runEditingCases(open,selected));
  Object.assign(results,await runEvidenceCases(open,selected));
  return results;
}
