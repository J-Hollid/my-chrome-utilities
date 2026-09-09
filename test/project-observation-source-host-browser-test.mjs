import {runBrowserTargetSession} from './support/browser-target-session.mjs';
import {prepareProbeExtension} from './utility-tab-expansion/fixture.mjs';
import {seedObservationProject} from './project-observation-sources/browser/installed.mjs';
import {observeSourceHostContinuity} from './project-observation-sources/browser/host-consumer.mjs';

const fixture=await prepareProbeExtension();
const id='SOURCE_HOST_CONTINUITY';
try {
  const result=await runBrowserTargetSession({extensionRoot:fixture.extensionRoot,
    definitions:{[id]:{pagePath:'side-panel.html',
      beforeExpression:()=>`localStorage.clear();await (${seedObservationProject.toString()})();return true;`,
      expression:()=>`return await (${observeSourceHostContinuity.toString()})();`}},
    environment:{...process.env,SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify([id]),
      SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify({[id]:{}})}});
  console.log(JSON.stringify(result));
} finally {await fixture.dispose();}
