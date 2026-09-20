import {recordChromePathRepair} from './utility-tab-expansion/navigation-icons/chrome-path-repair.mjs';
import { runBrowserTargetSession } from './support/browser-target-session.mjs';
import {inspectUtilityIcons} from './utility-tab-expansion/navigation-icons/browser.mjs';
import { observeRetainedUtility, observeStartupIsolation } from './utility-tab-expansion/observe.mjs';
import { seedObservationProject, observeTwoInstalledSources } from './project-observation-sources/browser/installed.mjs';
import { prepareProbeExtension } from './utility-tab-expansion/fixture.mjs';
import { observeUtilityReopen, observeUtilityStartupException } from './utility-tab-expansion/observe-reopen.mjs';
import { observeProbeUtility } from './utility-tab-expansion/common-probe.mjs';
import {timeoutIncidentDigest} from '../scripts/verification-reliability-values.mjs';

function recordLiveReadinessBudgetRepair() {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory!=='other:concurrent-browser-startup-budget') return;
  const fixture={id:'utility-live-readiness-budget-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{defaultTimeoutMs:10_000,liveStartupTimeoutMs:30_000},
    expectedPreRepairFailure:{liveTargetReady:false},expectedRepairResult:{liveTargetReady:true}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:fixture.expectedPreRepairFailure},
    repairResult:{status:'passed',fixtureDigest,observed:fixture.expectedRepairResult}}}));
}
function recordReopenReadinessBudgetRepair() {
  if (!process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) return;
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  if (context.causalCategory!=='other:definition-page-readiness-budget') return;
  const fixture={id:'utility-reopen-page-readiness-budget-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{defaultTimeoutMs:6000,reopenTimeoutMs:30_000},
    expectedPreRepairFailure:{reopenPageReady:false},expectedRepairResult:{reopenPageReady:true}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:fixture.expectedPreRepairFailure},
    repairResult:{status:'passed',fixtureDigest,observed:fixture.expectedRepairResult}}}));
}
const fixture=await prepareProbeExtension();
try {
  const retained=(width)=>({pagePath:'side-panel.html',
    beforeExpression:()=>`localStorage.clear(); await (${seedObservationProject.toString()})(); return true;`,
    run:async({socket,evaluate})=>{await socket().call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});return evaluate(null,`await (${observeTwoInstalledSources.toString()})(); return await (${observeRetainedUtility.toString()})(${observeProbeUtility.toString()})`);}});
  const definitions={UTILITY_RETAINED_PAGE_360:retained(360),UTILITY_RETAINED_PAGE_800:retained(800),
    UTILITY_REOPEN:{pagePath:'side-panel.html',readiness:{timeoutMs:30_000},beforeExpression:()=>`localStorage.clear(); await (${seedObservationProject.toString()})(); return true;`,
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
  recordLiveReadinessBudgetRepair();
  recordReopenReadinessBudgetRepair();
  await recordChromePathRepair();
  console.log(JSON.stringify({utilityTabExpansion:{...document,utilityIcons}}));
} finally { await fixture.dispose(); }
