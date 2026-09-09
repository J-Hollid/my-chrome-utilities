import {runChecks} from '../checks.mjs';
const evidence=runChecks(import.meta.url,['browser-test.mjs','real-runtime-test.mjs','states-browser-test.mjs','frame-access-test.mjs','../live/data-layer-continuity-test.mjs']);
console.log(JSON.stringify({tealiumDetection:evidence}));
