import {installedTealium} from '../../tealium/installed.mjs';
import {seedObservationProject} from '../../project-observation-sources/browser/installed.mjs';
import {inspectNavigation} from './appearance.mjs';
import {inspectContinuity} from './continuity.mjs';
export async function inspectUtilityIcons({appearance=true}={}) {
 const installed=await installedTealium({loopbackTarget:true,beforeSelect:async(browser,native)=>{
  await browser.evaluate(native,`(${seedObservationProject.toString()})({legacyPath:'dataLayer'})`);
  await browser.call('Page.reload',{},native);
  await browser.wait('icon host ready',()=>browser.evaluate(native,'document.querySelector("#side-panel-root")?.dataset.utilityShellReady==="true"'));
 }});
 try {return {appearance:appearance?await inspectNavigation(installed.browser,installed.native):[],continuity:await inspectContinuity(installed)};}
 finally {await installed.close();}
}
if(process.argv[1]?.endsWith('/navigation-icons/browser.mjs'))console.log(JSON.stringify({utilityIcons:await inspectUtilityIcons()}));
