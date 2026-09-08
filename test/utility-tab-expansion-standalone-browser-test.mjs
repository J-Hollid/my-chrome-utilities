import { runBrowserTargetSession } from './support/browser-target-session.mjs';
import { prepareProbeExtension } from './utility-tab-expansion/fixture.mjs';
import { observeProbeUtility } from './utility-tab-expansion/common-probe.mjs';
const fixture=await prepareProbeExtension({hosted:false});
try {
  await runBrowserTargetSession({extensionRoot:fixture.extensionRoot,environment:{...process.env,
    SWARMFORGE_BROWSER_TARGET_IDS:'["UTILITY_STANDALONE"]',SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:'{"UTILITY_STANDALONE":{}}'},
    definitions:{UTILITY_STANDALONE:{pagePath:'probe.html?utility=probe&session=standalone-fixture&target=771&surface=standalone',
      readiness:{expression:"({ready:document.documentElement.dataset.ready==='true'})",description:'Standalone Probe ready'},
      expression:()=>`return {utilityStandalone:(${observeProbeUtility.toString()})(document)};`}}});
} finally {await fixture.dispose();}
