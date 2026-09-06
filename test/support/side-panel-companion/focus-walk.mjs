import assert from "node:assert/strict";
import {measureCompanion} from "./measure.mjs";

export async function walkCompanionFocus(socket,evaluate,key,mode) {
  const expected=await evaluate(socket,`(()=>{
    const controls=[...document.querySelectorAll('button,input,textarea,select,summary,a[href],[tabindex]')]
      .filter(element=>element.tabIndex>=0&&!element.disabled&&element.checkVisibility({checkVisibilityCSS:true}));
    controls.forEach((element,index)=>element.dataset.companionFocusIndex=String(index));
    document.getElementById('open-palette').focus();
    return controls.length;
  })()`);
  assert.ok(expected>10&&expected<120,"The fixture focus walk must stay bounded");
  const visited=new Set([await evaluate(socket,'document.activeElement.dataset.companionFocusIndex')]);
  try {
    for(let attempt=0;attempt<expected+3&&visited.size<expected;attempt++) {
      await key(socket,"Tab");
      const index=await evaluate(socket,'document.activeElement.dataset.companionFocusIndex');
      if(index===undefined)continue;
      visited.add(index);
      const focus=await evaluate(socket,`(${measureCompanion.toString()})(true)`);
      assert.ok(focus.visible,`${mode}: visible keyboard focus for control ${index}`);
      assert.ok(focus.ratio>=3,`${mode}: focus contrast ${focus.ratio} for control ${index}`);
    }
    assert.equal(visited.size,expected,`${mode}: every visible control must be reachable`);
    return expected;
  } finally {
    await evaluate(socket,'document.querySelectorAll("[data-companion-focus-index]").forEach(element=>delete element.dataset.companionFocusIndex)');
  }
}
