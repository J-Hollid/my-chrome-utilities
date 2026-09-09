import {runChecks} from '../checks.mjs';
import {packagedTealium} from '../package.mjs';
const packaged=await packagedTealium();
try {
process.env.TEALIUM_EXTENSION_ROOT=packaged.extensionRoot;
const evidence=runChecks(import.meta.url,['browser-test.mjs','geometry-test.mjs','lifecycle-test.mjs','frame-lifecycle-test.mjs','startup-test.mjs','data-layer-continuity-test.mjs','access-recovery-test.mjs','closure-test.mjs']);
console.log(JSON.stringify({tealiumLive:{...evidence,packaged:true}}));

}finally{await packaged.close();}
