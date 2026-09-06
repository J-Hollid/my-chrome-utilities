import {walkCompanionFocus} from "./focus-walk.mjs";
import assert from "node:assert/strict";
import {measureCompanion} from "./measure.mjs";

export async function key(socket,name,code=name) {
  await socket.call("Input.dispatchKeyEvent",{type:"keyDown",key:name,code,...(name==="Enter"?{text:"\r",unmodifiedText:"\r"}:{}),windowsVirtualKeyCode:name==="Enter"?13:name==="Tab"?9:27});
  await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key:name,code});
}

export async function verifyCompanionAccessibility(socket,evaluate) {
  const reports=[];
  for(const mode of ["keyboard only","200 percent zoom","forced colours","reduced motion"]) {
    await socket.call("Emulation.setDeviceMetricsOverride",{width:mode==="200 percent zoom"?180:360,height:900,deviceScaleFactor:mode==="200 percent zoom"?2:1,mobile:false});
    const features=mode==="forced colours"?[{name:"forced-colors",value:"active"}]:mode==="reduced motion"?[{name:"prefers-reduced-motion",value:"reduce"}]:[];
    await socket.call("Emulation.setEmulatedMedia",{media:"screen",features});
    await evaluate(socket,`(()=>{
      document.getElementById("workspace-tab-data-layer").click();document.getElementById("data-layer-view-projects").click();
      const summary=document.querySelector('#project-library-list > li[data-active=true] summary');
      summary.parentElement.open=false;summary.focus();
    })()`);
    await key(socket,"Enter");
    const details=await evaluate(socket,`(()=>{
      const row=document.querySelector('#project-library-list > li[data-active=true]'),details=row.querySelector('details');
      const summary=details.querySelector('summary'),style=getComputedStyle(summary);
      return {open:details.open,identity:details.querySelector('code').textContent,saved:details.querySelector('time').textContent,
        focus:document.activeElement===summary,outline:style.outlineStyle,selectable:getComputedStyle(details.querySelector('code')).userSelect!=='none'};
    })()`);
    assert.ok(details.open&&details.focus&&details.selectable,`${mode}: native details ${JSON.stringify(details)}`);
    assert.equal(details.identity,"project-retail");
    assert.match(details.saved,/^\d{4}-\d\d-\d\dT/);
    assert.notEqual(details.outline,"none");
    await key(socket,"Enter");
    await evaluate(socket,'document.getElementById("open-palette").focus()');
    await key(socket,"Enter");
    assert.equal(await evaluate(socket,'document.getElementById("palette").hidden'),false);
    await key(socket,"Escape");
    assert.equal(await evaluate(socket,'document.activeElement.id'),"open-palette");
    const measured=await evaluate(socket,`(${measureCompanion.toString()})()`);
    assert.ok(measured.focus.visible&&measured.focus.ratio>=3,`${mode}: Commands focus`);
    assert.deepEqual(measured.controls.filter(control=>control.clipped),[],`${mode}: clipped controls`);
    assert.equal(measured.overflow,0,`${mode}: document overflow`);
    assert.equal(measured.workspaceOverflow,0,`${mode}: workspace overflow`);
    assert.ok(measured.rows<=2,`${mode}: tab rows`);
    const reachable=await walkCompanionFocus(socket,evaluate,key,mode);
    reports.push({mode,details,reachable,rows:measured.rows,overflow:measured.overflow});
  }
  await socket.call("Emulation.setEmulatedMedia",{media:"screen",features:[]});
  await socket.call("Emulation.setDeviceMetricsOverride",{width:360,height:900,deviceScaleFactor:1,mobile:false});
  return reports;
}
