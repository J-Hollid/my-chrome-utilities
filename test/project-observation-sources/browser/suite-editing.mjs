import assert from 'node:assert/strict';
import {evaluate} from './chrome.mjs';
import {installSourceControls} from './controls.mjs';
import {observeSourceEdit,observeReceiptFilter} from './edits.mjs';
import {observeSourceKeyboard} from './keyboard.mjs';
export async function runEditingCases(open,selected) {
  const results={};
  if(!selected||selected==='edits'){
    results.edits=[];
    for(const input of [
      {action:'disable',first:'pageview',later:'purchase'},{action:'disable',first:'consent',later:'signup'},
      {action:'disable',first:'M1',later:'M2, M3'},
      {action:'change path',first:'pageview',name:'Analytics',path:'analyticsQueue'},
      {action:'change path',first:'purchase',name:'Store',path:'store.history'},
      {action:'confirmed removal',first:'M1'},
    ]) {
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeSourceEdit.toString()})(${JSON.stringify(input)})`);
      assert.equal(report.staleRejected,true);assert.equal(report.applicationUnchanged,true);assert.equal(report.pushDefault,'commandQueue');
      assert.deepEqual(report.retained,report.original[0]);
      assert.equal(report.whileChanged.some(event=>event.name===(input.later??'Later')),false);
      if(input.action==='disable'){
        assert.equal(report.status,'Disabled');
        assert.deepEqual(report.resumed.filter(event=>event.sourceId==='marketing').map(event=>event.name),[input.first,...input.later.split(', ')]);
      }
      if(input.path){const next=report.resumed.find(event=>event.name==='NewPath');assert.equal(next.sourceId,'marketing');assert.equal(next.sourceName,input.name);assert.equal(next.sourcePath,input.path);}
      results.edits.push(report);
    }
  }
  if(!selected||selected==='filter'){
    results.filter=[];
    for(const input of [{receipt_order:'Marketing:A, Application:B, Marketing:C',selected_source:'Marketing',count:2},
      {receipt_order:'Application:A, Marketing:B',selected_source:'Application',count:1}]){
      const side=await open();await evaluate(side,`(${installSourceControls.toString()})()`);
      const report=await evaluate(side,`(${observeReceiptFilter.toString()})(${JSON.stringify(input)})`);
      assert.deepEqual(report.captured.map(event=>`${event.sourceName}:${event.name}`),input.receipt_order.split(', '));
      assert.deepEqual(report.all.map(event=>event.id),report.captured.map(event=>event.id));
      assert.equal(report.selected.length,input.count);assert.equal(report.count,`${input.count} event${input.count===1?'':'s'}`);
      assert.deepEqual(report.cleared,report.all);assert.equal(report.unchanged,true);results.filter.push(report);
    }
  }
  if(!selected||selected==='keyboard-matrix'){
    results.keyboard=[];
    for(const [width,name,path] of [[360,'Checkout','checkoutQueue'],[800,'Consent','consent.log']]){
      const side=await open({width});await evaluate(side,`(${installSourceControls.toString()})()`);
      await evaluate(side,'sourceControls.start()');
      const saved=await observeSourceKeyboard(side,name,path);
      const ready=await evaluate(side,`sourceControls.until(()=>sourceControls.rows().find(source=>source.path===${JSON.stringify(path)})?.status==='Ready','new source Ready')`);
      await side.call('Page.reload');await evaluate(side,`(${installSourceControls.toString()})()`);
      const reloaded=await evaluate(side,'sourceControls.rows()');
      assert.deepEqual(reloaded.map(({status,...source})=>source),saved.sources);
      results.keyboard.push({width,name,path,saved,reloaded,ready});
    }
  }
  return results;
}
