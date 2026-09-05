import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

execFileSync("bb", ["-e", `
  (require '[acceptance.pack-runtime :as packs]
           '[acceptance.steps.calibration-receipt-independence :as calibration])
  (let [text "historical calibration data is distinct from fresh verification evidence"
        world {:acceptance/feature-name "Calibration receipt independence"}
        selected (first (filter #(and (re-matches (:pattern %) text)
                                      (or (nil? (:applies? %)) ((:applies? %) world)))
                                (packs/handlers-for-feature (first calibration/feature-files))))]
    (assert (some #{selected} calibration/handlers)
            "The registered calibration handler must execute before general handlers"))
`], {encoding:"utf8"});

const consumerOutput = execFileSync(process.execPath,
  [fileURLToPath(new URL("./calibration-receipt-consumer-test.mjs",import.meta.url))],
  {encoding:"utf8"});
const consumerObservation = JSON.parse(consumerOutput.trim().split("\n").filter(line =>
  line.startsWith("{")).at(-1));
assert.deepEqual(consumerObservation, {
  calibrationConsumer:{historicalClosed:true,ledgerReads:0,activeRetained:true,
    missingActiveIndexRejected:true,malformedRejected:true},
  calibrationOtherConsumers:{pendingReview:true,activeIncident:true},
}, "the acceptance JSON line must contain both consumer observations");

const root = await mkdtemp(path.resolve("tmp/calibration-source-test-"));
try {
  const test = fileURLToPath(new URL("./calibration-rule-test.mjs",import.meta.url));
  const run = () => execFileSync(process.execPath,[test],{cwd:root,encoding:"utf8"});
  const absent = run();
  await mkdir(path.join(root,"tmp/verification-receipts"),{recursive:true});
  await writeFile(path.join(root,"tmp/verification-receipts/unrelated.json"),"not a receipt");
  const populated = run();
  assert.equal(populated,absent,"unrelated ambient receipt bytes cannot affect authored rule inputs");
  console.log(JSON.stringify({calibrationSources:{absent:true,populated:true,identical:true}}));
} finally {await rm(root,{recursive:true,force:true});}
