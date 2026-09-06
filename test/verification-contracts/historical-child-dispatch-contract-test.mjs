import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {chmod,mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {timeoutIncidentDigest} from "../../scripts/verification-reliability-incidents.mjs";
const exec=(command,args,options={})=>new Promise((resolve,reject)=>{
  execFile(command,args,options,(error,stdout,stderr)=>error
    ?reject(Object.assign(error,{stdout,stderr})):resolve(stdout.trim()));
});
let childDispatchRepairEvidence;
if (process.platform !== "win32") {
  const noNodeDirectory = await mkdtemp(path.join(os.tmpdir(), "verification-no-node-"));
  const fakeNode = path.join(noNodeDirectory, "node");
  const sentinel = path.join(noNodeDirectory, "node-launched");
  try {
    await writeFile(fakeNode,
      "#!/bin/sh\nprintf launched > \"$SWARMFORGE_NODE_LAUNCH_SENTINEL\"\nexit 86\n");
    await chmod(fakeNode, 0o755);
    const environment = {
      ...process.env,
      PATH:`${noNodeDirectory}:${process.env.PATH}`,
      SWARMFORGE_BUILD_PREPARED:"1",
      SWARMFORGE_PACK_RUNNER_OWNS_JS:"1",
      SWARMFORGE_NODE_LAUNCH_SENTINEL:sentinel,
    };
    // Execute the repository's task bodies through Babashka, but replace the
    // aggregate Clojure test dependency. Loading/running that aggregate belongs
    // to the separate checkpoint and can exceed this dispatch probe's deadline.
    const dispatchConfig = path.join(noNodeDirectory, "bb.edn");
    const aggregateConfig = path.join(noNodeDirectory, "aggregate.edn");
    await exec("bb", ["-e", `
      (let [tasks (:tasks (read-string (slurp "bb.edn")))
            aggregate (into {} (for [name '[test:unit test:property]]
              [name (assoc (get tasks name) :requires
                '([serena.dispatch.aggregate-load-sentinel]))]))
            fixture (into {} (for [name '[test:unit test:property]]
              [name {:task (:task (get tasks name))}]))
            fixture (assoc fixture
                     :requires '([clojure.test :as test] [babashka.process :as process])
                     :init '(alter-var-root #'test/run-tests
                       (constantly (fn [& namespaces]
                         (assert (seq namespaces)) {:fail 0 :error 0}))))]
        (spit (first *command-line-args*) (pr-str {:tasks fixture}))
        (spit (second *command-line-args*) (pr-str {:tasks aggregate})))`,
    dispatchConfig, aggregateConfig],
    { timeout:10_000 });
    const observed = {aggregateFailures:0, runnerOwnedPasses:0, nodeControls:0};
    for (const task of ["test:unit", "test:property"]) {
      // Make unwanted aggregate loading fail immediately, without waiting for
      // the production timeout. Both configurations retain the real task body.
      await assert.rejects(exec("bb", ["--config", aggregateConfig, task],
        { env:environment, timeout:10_000 }), (error) => {
        assert.equal(error.killed, false);
        assert.match(error.stderr, /serena.dispatch.aggregate-load-sentinel/u);
        observed.aggregateFailures += 1;
        return true;
      });
      const args = ["--config", dispatchConfig, task];
      await exec("bb", args, { env:environment, timeout:10_000 });
      await assert.rejects(readFile(sentinel), (error) => error?.code === "ENOENT",
        `${task} must not launch Node when the runner owns JavaScript`);
      observed.runnerOwnedPasses += 1;
      // A control proves that the real task body still dispatches Node when
      // ownership is disabled; an empty or unconditional bypass cannot pass.
      await assert.rejects(exec("bb", args, { timeout:10_000,
        env:{...environment, SWARMFORGE_PACK_RUNNER_OWNS_JS:"0"} }));
      assert.equal(await readFile(sentinel, "utf8"), "launched");
      observed.nodeControls += 1;
      await rm(sentinel);
    }
    assert.deepEqual(observed, {aggregateFailures:2, runnerOwnedPasses:2, nodeControls:2});
    childDispatchRepairEvidence = observed;
  } finally {
    await rm(noNodeDirectory, { recursive:true, force:true });
  }
}

const childRepairContext = process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) : undefined;
const reportChildDispatchRepair = childRepairContext?.causalCategory === "duplicated or unbounded workload";
if (reportChildDispatchRepair) {
  assert.ok(childDispatchRepairEvidence, "child dispatch regression must run before reporting proof");
  const preRepairObserved = {aggregateFailures:childDispatchRepairEvidence.aggregateFailures};
  const repairObserved = {runnerOwnedPasses:childDispatchRepairEvidence.runnerOwnedPasses,
    nodeControls:childDispatchRepairEvidence.nodeControls};
  const fixture = {id:"child-dispatch-aggregate-isolation-v1",
    causalCategory:childRepairContext.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(childRepairContext.diagnosedBoundary),
    expectedPreRepairFailure:{aggregateFailures:2},
    expectedRepairResult:{runnerOwnedPasses:2, nodeControls:2}};
  const fixtureDigest = timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:childRepairContext.incidentId, failureDigest:childRepairContext.failureDigest, fixture,
    preRepairResult:{status:"failed", fixtureDigest, observed:preRepairObserved},
    repairResult:{status:"passed", fixtureDigest, observed:repairObserved}}}));
}

