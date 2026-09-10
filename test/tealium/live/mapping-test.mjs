import {checkMappingConservation} from './metadata/mapping-conservation-check.mjs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {checkHandlerLoading} from './handler-loading-repair.mjs';
checkHandlerLoading();
const result=spawnSync('bb',['-e',"(require 'tealium.live.mapping-test '[clojure.test :as test]) (let [r (test/run-tests 'tealium.live.mapping-test)] (System/exit (+ (:fail r) (:error r))))"],{encoding:'utf8'});
assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
process.stdout.write(result.stdout);

checkMappingConservation(result.status);
