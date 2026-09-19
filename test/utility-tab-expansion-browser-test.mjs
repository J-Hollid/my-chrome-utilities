import {recordChromePathRepair} from './utility-tab-expansion/navigation-icons/chrome-path-repair.mjs';
import { runBrowserTargetSession } from './support/browser-target-session.mjs';
import {inspectUtilityIcons} from './utility-tab-expansion/navigation-icons/browser.mjs';
import { observeRetainedUtility, observeStartupIsolation } from './utility-tab-expansion/observe.mjs';
import { seedObservationProject, observeTwoInstalledSources } from './project-observation-sources/browser/installed.mjs';
import { prepareProbeExtension } from './utility-tab-expansion/fixture.mjs';
import { observeUtilityReopen, observeUtilityStartupException } from './utility-tab-expansion/observe-reopen.mjs';
import { observeProbeUtility } from './utility-tab-expansion/common-probe.mjs';
const fixture=await prepareProbeExtension();
try {
  const retained=(width)=>({pagePath:'side-panel.html',
    beforeExpression:()=>`localStorage.clear(); await (${seedObservationProject.toString()})(); return true;`,
    run:async({socket,evaluate})=>{await socket().call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});return evaluate(null,`await (${observeTwoInstalledSources.toString()})(); return await (${observeRetainedUtility.toString()})(${observeProbeUtility.toString()})`);}});
  const definitions={UTILITY_RETAINED_PAGE_360:retained(360),UTILITY_RETAINED_PAGE_800:retained(800),
    UTILITY_REOPEN:{pagePath:'side-panel.html',beforeExpression:()=>`localStorage.clear(); await (${seedObservationProject.toString()})(); return true;`,
      run:async({socket,evaluate})=>{const prior=await evaluate(null,`return await (${observeUtilityReopen.toString()})();`);await socket().call('Page.enable');const loaded=new Promise(resolve=>socket().on('Page.loadEventFired',resolve));await socket().call('Page.reload',{ignoreCache:true});await loaded;
        return evaluate(null,`return await (${observeUtilityReopen.toString()})(${JSON.stringify(prior)});`);}},
    UTILITY_STARTUP_EXCEPTION:{pagePath:'side-panel.html',beforeExpression:()=>`localStorage.clear();localStorage.setItem('probe.crash','true');await (${seedObservationProject.toString()})();return true;`,
      expression:()=>`await (${observeTwoInstalledSources.toString()})();return await (${observeUtilityStartupException.toString()})();`},
    UTILITY_WAITING_STARTUP:{pagePath:'side-panel.html',beforeExpression:()=>`localStorage.clear();localStorage.setItem('probe.startup','waiting');return true;`,expression:()=>`return await (${observeStartupIsolation.toString()})()`},
    UTILITY_FAILED_STARTUP:{pagePath:'side-panel.html',beforeExpression:()=>`localStorage.clear();localStorage.setItem('probe.startup','failed');return true;`,expression:()=>`return await (${observeStartupIsolation.toString()})()`}};
  const document=await runBrowserTargetSession({extensionRoot:fixture.extensionRoot,definitions,environment:{...process.env,
    SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify(Object.keys(definitions)),SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify(Object.fromEntries(Object.keys(definitions).map(id=>[id,{}]))),
    SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH:process.env.UTILITY_PROBE_WIDTH??'360'}});
  const utilityIcons=await inspectUtilityIcons();
  await recordChromePathRepair();
  console.log(JSON.stringify({utilityTabExpansion:{...document,utilityIcons}}));
} finally { await fixture.dispose(); }
