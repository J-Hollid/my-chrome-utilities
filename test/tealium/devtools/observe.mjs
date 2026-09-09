import {runChecks} from '../checks.mjs';
const evidence=runChecks(import.meta.url,['browser-test.mjs','limits-test.mjs','clipboard-test.mjs','protocol-test.mjs','lifecycle-test.mjs']);
console.log(JSON.stringify({tealiumDevtools:evidence}));
