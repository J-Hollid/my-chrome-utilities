import assert from "node:assert/strict";

export async function inspectSidePanelAccessibilityModes(socket, evaluate) {
  await socket.call("Emulation.setEmulatedMedia", {
    media:"screen",
    features:[{ name:"prefers-reduced-motion", value:"reduce" }],
  });
  const reducedMotion = await evaluate(
    socket,
    `(()=>({
      active:matchMedia("(prefers-reduced-motion: reduce)").matches,
      durations:getComputedStyle(document.getElementById("open-palette")).transitionDuration
        .split(",").map((value)=>parseFloat(value)*(/ms$/u.test(value)?1:1000))
    }))()`,
  );
  assert.equal(reducedMotion.active, true, "reduced-motion mode must be active");
  assert.ok(
    reducedMotion.durations.every((duration) => duration <= 0.001),
    "reduced-motion mode must suppress control transitions",
  );

  await socket.call("Emulation.setEmulatedMedia", {
    media:"screen",
    features:[{ name:"forced-colors", value:"active" }],
  });
  const forcedColors = await evaluate(
    socket,
    `(()=>{
      const selected=document.querySelector('[role="tab"][aria-selected="true"]');
      return {
        active:matchMedia("(forced-colors: active)").matches,
        selected:selected?.id,
        selectedVisible:Boolean(selected)&&getComputedStyle(selected).display!=="none",
        selectedName:selected?.textContent.trim()
      };
    })()`,
  );
  assert.equal(forcedColors.active, true, "forced-colors mode must be active");
  assert.equal(forcedColors.selectedVisible, true, "the selected state must remain visible");
  assert.ok(forcedColors.selectedName, "the selected state must retain its text label");

  await socket.call("Emulation.setEmulatedMedia", { media:"screen", features:[] });
  return { reducedMotion, forcedColors };
}
