import assert from "node:assert/strict";
import {evaluate} from "./chrome.mjs";
export async function observeSourceKeyboard(side,name="Checkout",path="checkoutQueue") {
  await side.call("Page.bringToFront");
  const key=async(key,code,virtual)=>{
    await side.call("Input.dispatchKeyEvent",{type:"keyDown",key,code,windowsVirtualKeyCode:virtual,...(key==="Enter"?{text:"\r"}:{})});
    await side.call("Input.dispatchKeyEvent",{type:"keyUp",key,code,windowsVirtualKeyCode:virtual});
  };
  await evaluate(side,"document.querySelector('#add-observation-source').focus()");
  await key("Enter","Enter",13);
  assert.equal(await evaluate(side,"document.activeElement.id"),"observation-source-name","Add moves keyboard focus to Name");
  await side.call("Input.insertText",{text:name});
  await key("Tab","Tab",9);
  assert.equal(await evaluate(side,"document.activeElement.id"),"observation-source-path");
  await side.call("Input.insertText",{text:path});
  await key("Tab","Tab",9);
  await key("Enter","Enter",13);
  const settings=await evaluate(side,`(async()=>{
    const until=async test=>{for(let i=0;i<600&&!test();i++)await new Promise(requestAnimationFrame);if(!test())throw new Error('Keyboard save did not settle');};
    await until(()=>!document.querySelector('#observation-source-name'));
    const {openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');
    const repository=await openIndexedDbProjectRepository(),loaded=await repository.loadProject(await repository.activeProjectId());
    return {sources:loaded.state.project.eventTransport.observationSources,focused:document.activeElement.id,
      overflow:document.documentElement.scrollWidth>innerWidth};
  })()`);
  assert.ok(settings.sources.some(source=>source.name===name&&source.path===path&&source.enabled));
  assert.equal(settings.overflow,false);assert.equal(settings.focused,"add-observation-source");
  return settings;
}
