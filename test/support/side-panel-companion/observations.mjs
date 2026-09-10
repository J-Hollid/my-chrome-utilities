import {emitIconCompanionRepair} from '../../utility-tab-expansion/navigation-icons/companion-repair.mjs';
import assert from "node:assert/strict";
import {writeFile} from "node:fs/promises";
import path from "node:path";
import {measureCompanion} from "./measure.mjs";

export async function observeCompanionViews(socket, evaluate, directory) {
  const reports=[];
  await emitIconCompanionRepair(socket,evaluate,measureCompanion);
  for (const width of [360,420,512]) {
    await socket.call("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:false});
    for (const view of ["projects","live","library","sessions","defects","schemas","hotkeys"]) {
      await evaluate(socket,`(async()=>{
        document.getElementById(${JSON.stringify(view === "hotkeys" ? "workspace-tab-hotkeys" : "workspace-tab-data-layer")}).click();
        document.getElementById(${JSON.stringify("data-layer-view-"+view)})?.click();
        await new Promise(resolve=>setTimeout(resolve,250));
      })()`);
      const report=await evaluate(socket,`(${measureCompanion.toString()})()`);
      reports.push({view,...report});
      await writeFile(path.join(directory,`companion-${view}-${width}.json`),JSON.stringify(report,null,2));
      const shot=await socket.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
      await writeFile(path.join(directory,`companion-${view}-${width}.png`),Buffer.from(shot.data,"base64"));
    }
  }
  await evaluate(socket,'document.getElementById("workspace-tab-data-layer").click();document.getElementById("data-layer-view-projects").click()');
  const failures=reports.flatMap(report=>[
    ...report.text.filter(text=>text.ratio<4.5).map(text=>({view:report.view,width:report.width,...text})),
    ...(report.overflow || report.workspaceOverflow ? [{view:report.view,width:report.width,overflow:report.overflow,workspaceOverflow:report.workspaceOverflow}] : []),
  ]);
  assert.deepEqual(failures,[],"Every visible descendant must have readable text and contained layout");
  for (const report of reports) {
    assert.equal(report.badgeCount,0);
    assert.deepEqual(report.emptyMessages,[],`${report.view}: empty decorated messages`);
    assert.equal(report.duplicateHeading,"");
    assert.ok(report.rows<=2);
    assert.deepEqual(report.controls.filter(control=>control.clipped),[],`${report.view}: clipped controls`);
    assert.ok(report.controls.every(control=>control.radius<=(control.utilityIcon?8:4)),`${report.view}: ordinary control radii`);
    if (["projects","hotkeys"].includes(report.view)) assert.equal(report.context,"");
    else assert.ok(report.context.includes("Retail website")&&!report.context.includes("project-retail"));
  }
  return reports;
}
