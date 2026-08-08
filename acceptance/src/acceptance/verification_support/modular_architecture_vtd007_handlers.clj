(ns acceptance.verification-support.modular-architecture-vtd007-handlers
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.java.shell :as shell]
            [clojure.set :as set]
            [clojure.string :as str]))

(def ^:private specification-commit "0642b1d4c8")

(def ^:private migrated-entry-points
  ["test/browser-packs/shared-harness.mjs"
   "test/support/browser-target-session.mjs"
   "test/support/layered-schema-targets.mjs"
   "test/browser-packs/flow-graph.mjs"
   "test/support/flow-examples-timing.mjs"])

(def ^:private deadline-production-boundaries
  {"Chrome debug-port startup" "Chrome debug-port startup"
   "DevTools protocol call" "Flow DevtoolsSocket.call"
   "logical target outer work" ["Flow logical target" "installed-session logical target"]
   "Chrome termination" "stopHeadlessChrome"
   "profile cleanup" "removeChromeProfile"})

(defn- assert! [predicate message details]
  (support/assert! predicate message details))

(defn- shell-pack [packs]
  (first (filter #(= "shell" (get % "id")) packs)))

(defn- topology-without-helper-registry [packs]
  (mapv #(if (= "shell" (get % "id")) (dissoc % "verificationHelpers") %) packs))

(defn- output-evidence [output prefix key]
  (some->> (str/split-lines output)
           (filter #(str/starts-with? % prefix))
           first
           (#(json/parse-string % true))
           key))

(defn- run-production-probes! []
  (let [unit (shell/sh "env" "SWARMFORGE_VTD007_REAL_RUNNER_PROBES=1"
                       "node" "test/flow-examples-timing-test.mjs")
        lifecycle (shell/sh "env" "SWARMFORGE_VTD007_REAL_RUNNER_PROBES=1"
                            "node" "test/headless-chrome-lifecycle-test.mjs")
        evidence (output-evidence (:out unit) "{\"vtd007Acceptance\"" :vtd007Acceptance)
        lifecycle-evidence (output-evidence (:out lifecycle)
                                            "{\"vtd007LifecycleAcceptance\""
                                            :vtd007LifecycleAcceptance)]
    (assert! (zero? (:exit unit)) "Shared browser control production tests failed."
             {:stderr (:err unit)})
    (assert! (zero? (:exit lifecycle)) "Concrete browser lifecycle tests failed."
             {:stderr (:err lifecycle)})
    (assert! evidence "Shared browser control acceptance evidence is missing."
             {:output (:out unit)})
    (assert! lifecycle-evidence "Browser lifecycle acceptance evidence is missing."
             {:output (:out lifecycle)})
    {:evidence evidence :lifecycle-evidence lifecycle-evidence}))

(defn- registry-context! []
  (let [current-packs (json/parse-string (slurp "verification/packs.json"))
        base-result (shell/sh "git" "show" (str specification-commit ":verification/packs.json"))]
    (assert! (zero? (:exit base-result)) "The authoritative VTD-007 registry is unavailable."
             {:stderr (:err base-result)})
    (let [base-packs (json/parse-string (:out base-result))
          helper (->> (get (shell-pack current-packs) "verificationHelpers")
                      (filter #(= "test/support/browser-observation-control.mjs" (get % "path")))
                      first)]
      {:helper helper
       :topology-conserved? (= (topology-without-helper-registry base-packs)
                               (topology-without-helper-registry current-packs))})))

(defn- source-context []
  (let [sources (into {} (map (juxt identity slurp) migrated-entry-points))]
    {:sources sources
     :control-source (slurp "test/support/browser-observation-control.mjs")
     :delegates-to-control? (every? #(str/includes? % "browser-observation-control.mjs")
                                   (vals sources))
     :fixed-attempts-removed? (not-any? #(re-find #"attempt\s*<\s*(?:100|160|200|240|300)" %)
                                       (vals sources))}))

(defn- verify-source-context! [{:keys [sources control-source delegates-to-control?
                                       fixed-attempts-removed?]}]
  (let [shared-source (get sources "test/browser-packs/shared-harness.mjs")
        session-source (get sources "test/support/browser-target-session.mjs")
        flow-source (get sources "test/browser-packs/flow-graph.mjs")]
    (assert! delegates-to-control? "A migrated browser entry point does not delegate to the common API."
             {:entry-points (keys sources)})
    (assert! fixed-attempts-removed? "A migrated entry point retains fixed-attempt readiness." {})
    (assert! (every? #(and (str/includes? % "transmitDevtoolsProgram")
                           (not (str/includes? % "validatedProgram")))
                     (map sources ["test/browser-packs/shared-harness.mjs"
                                   "test/support/browser-target-session.mjs"
                                   "test/browser-packs/flow-graph.mjs"]))
             "Generated browser programs are not syntax checked before DevTools." {})
    (assert! (every? #(str/includes? control-source %)
                     ["waitForChromeDebuggingPort" "withDevtoolsProtocolDeadline"
                      "withLogicalTargetLifecycle" "ready(last)" "snapshot(last)" "readySince"])
             "The shared control lacks a concrete deadline or readiness semantic." {})
    (assert! (< (.lastIndexOf shared-source "waitForChromeDebuggingPort")
                (.lastIndexOf shared-source "timer=createBrowserPhaseTimer"))
             "Shared-harness startup is charged to a target." {})
    (assert! (every? #(str/includes? session-source %)
                     ["withLogicalTargetLifecycle({" "boundary:\"installed-session logical target\""
                      "cleanup:async" "timer.transition(\"target cleanup\")"])
             "Installed-session cleanup escapes its logical-target deadline." {})
    (assert! (every? #(str/includes? flow-source %)
                     ["withLogicalTargetLifecycle({" "boundary:\"Flow logical target\""
                      "cleanup:async" "transitionPhase(\"cleanup\")"])
             "Flow cleanup escapes its logical-target deadline." {})))

(defn- conservation-context! []
  (let [characterization (json/parse-string (slurp "verification/flow-examples-characterization.json"))
        current (json/parse-string (slurp "verification/performance-calibration.json"))
        base-result (shell/sh "git" "show" (str specification-commit
                                                   ":verification/performance-calibration.json"))
        base (when (zero? (:exit base-result)) (json/parse-string (:out base-result)))
        without-digest #(update % "conservation" dissoc "verificationTopologyDigest")
        src-diff (:out (shell/sh "git" "diff" "--name-only" specification-commit "--" "src/"))
        characterization-diff (:out (shell/sh "git" "diff" "--name-only" specification-commit "--"
                                              "verification/flow-examples-characterization.json"))]
    {:characterization characterization
     :src-diff src-diff
     :characterization-diff characterization-diff
     :calibration-conserved? (and (zero? (:exit base-result))
                                  (= (without-digest base) (without-digest current))
                                  (str/blank? characterization-diff))}))

(defn- verify-conservation! [{:keys [characterization src-diff characterization-diff
                                     calibration-conserved?]} topology-conserved?]
  (assert! topology-conserved?
           "VTD-007 changed a planned task, evidence leaf, owner, or browser target." {})
  (assert! (str/blank? src-diff) "VTD-007 changed product behavior." {:paths src-diff})
  (assert! calibration-conserved?
           "VTD-007 changed conserved calibration data rather than only its topology binding."
           {:characterization-paths characterization-diff})
  (assert! (= 12891 (get characterization "focusedBudgetMilliseconds"))
           "The accepted Flow examples p90 budget changed." {}))

(def ^:private surface-contracts
  {"the shared side-panel harness"
   {:entryPoint "test/browser-packs/shared-harness.mjs"
    :predicateOwner "test/browser-packs/shared-harness.mjs"
    :phases ["navigation" "post-fixture reload" "installed reload"]
    :sharedCalls 1
    :compoundPredicateOutcomes [true false false false]}
   "the installed Layered Schema batch"
   {:entryPoints #{"test/support/browser-target-session.mjs"
                   "test/support/layered-schema-targets.mjs"}
    :predicateOwner "test/support/layered-schema-workflows.mjs"
    :predicates #{"installed extension service worker discovery"
                  "connected, completely loaded editor hydration"}
    :stabilityMilliseconds [50]
    :createProjectPredicateOutcomes [true false]
    :hydrationPredicateOutcomes [true false false false]}
   "the Flow graph browser program"
   {:entryPoint "test/browser-packs/flow-graph.mjs"
    :predicates #{"installed extension service worker discovery"
                  "create-project form mounted"
                  "Flows navigation mounted"
                  "[aria-label=\"Flow canvas viewport\"]"}
    :stabilityMilliseconds [250]}})

(defn- contract-value-matches? [actual expected]
  (if (set? expected)
    (set/subset? expected (set actual))
    (= expected actual)))

(defn- surface-production-valid? [{:keys [browserSurface productionFacts]}]
  (when-let [contract (get surface-contracts browserSurface)]
    (every? (fn [[key expected]]
              (contract-value-matches? (get productionFacts key) expected))
            contract)))

(defn- real-timing-valid? [timing phase-names applicable-phases]
  (and (= phase-names (:phaseNames timing))
       (= applicable-phases (:applicableNonZeroPhases timing))
       (number? (:phaseTotal timing))
       (number? (:durationMs timing))
       (<= (Math/abs (double (- (:phaseTotal timing) (:durationMs timing)))) 0.01)))

(def ^:private flow-phase-names
  ["target setup" "navigation" "fixture" "readiness" "interaction"
   "persistence" "assertion" "cleanup"])

(def ^:private flow-applicable-phases
  ["target setup" "navigation" "interaction" "cleanup"])

(def ^:private installed-phase-names
  ["target setup" "navigation" "fixture" "interaction" "persistence"
   "assertion" "target cleanup"])

(def ^:private installed-applicable-phases
  ["target setup" "navigation" "interaction" "target cleanup"])

(def ^:private plan-conservation-program
  (str "import {readFileSync} from 'node:fs';"
       "import {execFileSync} from 'node:child_process';"
       "import {planVerification,verificationTaskIdentity} from './scripts/verification-packs.mjs';"
       "const current=JSON.parse(readFileSync('verification/packs.json','utf8'));"
       "const base=JSON.parse(execFileSync('git',['show','0642b1d4c8:verification/packs.json'],{encoding:'utf8'}));"
       "const ids=current.filter(p=>['unit','property','browserAdapters','browserObservations','checkpointCommands'].some(k=>p[k]?.length)).map(p=>p.id);"
       "if(ids.length!==20)throw new Error('expected 20 runnable packs');"
       "const migration=new Map(['capture','event-library','schemas','defects','shell'].map(x=>[`test/browser-packs/side-panel-${x}.mjs`,'test/side-panel-component-layout-runtime-test.mjs']));"
       "const normalize=x=>{let s=JSON.stringify(x);for(const [a,b]of migration)s=s.replaceAll(a,b);return JSON.parse(s)};"
       "const identity=p=>p.tasks.map(x=>normalize(verificationTaskIdentity(x))),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),unique=(xs,k)=>new Set(xs.map(x=>x[k])).size===xs.length;"
       "const exact=planVerification(current,{packIds:ids,includeProperties:true}),baseExact=planVerification(base,{packIds:ids,includeProperties:true}),terminal=planVerification(current,{terminalFull:true}),baseTerminal=planVerification(base,{terminalFull:true});"
       "const executions=packs=>normalize({targets:packs.flatMap(p=>(p.browserObservations??[]).map(x=>({packId:p.id,id:x.id,path:x.path,environment:x.environment,features:x.features}))),features:packs.flatMap(p=>(p.features??[]).map(feature=>({packId:p.id,feature}))),handlers:packs.flatMap(p=>(p.handlers??[]).map(handler=>({packId:p.id,handler}))),evidence:packs.flatMap(p=>(p.browserEvidencePartitions??[]).map(x=>({packId:p.id,path:x.path,sessionBatch:x.sessionBatch,originalLeaves:x.originalLeaves,targets:x.targets}))) });"
       "const now=executions(current),prior=executions(base);"
       "console.log(JSON.stringify({exactPlanConserved:same(identity(exact),identity(baseExact)),terminalPlanConserved:same(identity(terminal),identity(baseTerminal)),tasksExactlyOnce:unique(exact.tasks,'key')&&unique(terminal.tasks,'key'),targetsExactlyOnce:unique(now.targets,'id')&&same(now.targets,prior.targets),featuresExactlyOnce:unique(now.features,'feature')&&same(now.features,prior.features),handlersExactlyOnce:unique(now.handlers,'handler')&&same(now.handlers,prior.handlers),evidenceLeavesConserved:same(now.evidence,prior.evidence),exactTaskCount:exact.tasks.length,terminalTaskCount:terminal.tasks.length,targetCount:now.targets.length,featureCount:now.features.length,handlerCount:now.handlers.length}));"))

(defn- plan-conservation-evidence! []
  (let [result (shell/sh "node" "--input-type=module" "--eval" plan-conservation-program)]
    (assert! (zero? (:exit result)) "Canonical verification plans could not be compared."
             {:stderr (:err result)})
    (json/parse-string (str/trim (:out result)) true)))

(defn- verify-production-boundary! []
  (let [{:keys [evidence lifecycle-evidence]} (run-production-probes!)
        {:keys [helper topology-conserved?]} (registry-context!)
        {:keys [delegates-to-control? fixed-attempts-removed?] :as sources} (source-context)
        conservation (conservation-context!)
        plan-evidence (plan-conservation-evidence!)]
    (assert! (= 20 (count (get helper "consumers")))
             "The common browser control helper does not have all 20 exact consumers." {:helper helper})
    (verify-source-context! sources)
    (verify-conservation! conservation
                          (or topology-conserved?
                              (every? true? (map #(get plan-evidence %)
                                                 [:exactPlanConserved :terminalPlanConserved
                                                  :targetsExactlyOnce :featuresExactlyOnce
                                                  :handlersExactlyOnce :evidenceLeavesConserved]))))
    (-> evidence
        (update :deadlineRows into (:deadlineRows lifecycle-evidence))
        (assoc-in [:timing :realRunners :installedFailure]
                  (:installedRunner lifecycle-evidence))
        (assoc-in [:timing :flowExamplesBudgetMilliseconds]
                  (get-in conservation [:characterization "focusedBudgetMilliseconds"]))
        (assoc :planConservation plan-evidence)
        (assoc :conservation
               {:consumerCount (count (get helper "consumers"))
                :sharedImplementations (count migrated-entry-points)
                :targetsOnce (every? true? (map #(get plan-evidence %)
                                                [:targetsExactlyOnce :featuresExactlyOnce
                                                 :handlersExactlyOnce]))
                :tasksUnchanged (every? true? (map #(get plan-evidence %)
                                                   [:exactPlanConserved :terminalPlanConserved
                                                    :tasksExactlyOnce :evidenceLeavesConserved]))
                :durableBytesUnchanged (and (str/blank? (:src-diff conservation))
                                            (:calibration-conserved? conservation))
                :flowBehaviorConserved (and delegates-to-control? fixed-attempts-removed?
                                            (every? surface-production-valid?
                                                    (:surfaces evidence)))}))))

(defonce ^:private production-boundary (delay (verify-production-boundary!)))

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn- ready [world]
  (assoc world :vtd007/evidence @production-boundary))

(defn- assert-world [world predicate message details]
  (assert! predicate message details)
  world)

(defn- evidence [world & path]
  (get-in world (into [:vtd007/evidence] path)))

(defn- deadline-row [world]
  (first (filter #(= (:vtd007/forced-failure world) (:failure %))
                 (evidence world :deadlineRows))))

(defn- readiness-row [world]
  (first (filter #(and (= (:stabilityInterval %) (:vtd007/stability world))
                       (= (:readyStates %) (:vtd007/states world)))
                 (evidence world :readinessRows))))

(defn- readiness-handlers [example-values]
  [{:pattern #"^a shared browser readiness check for target TARGET-READY, phase navigation, and predicate \"the requested workspace is mounted\"$"
    :handler (fn [world _ _] (ready world))}
   {:pattern #"^its monotonic deadline is 100 milliseconds, poll interval is 25 milliseconds, maximum snapshot is 80 characters, and stability interval is (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd007/stability (first (values example-values example captures))))}
   {:pattern #"^its observed ready states are (.+)$"
    :handler (fn [world example captures]
               (let [prepared (assoc world :vtd007/states
                                     (first (values example-values example captures)))]
                 (assert-world prepared (some? (readiness-row prepared))
                               "Readiness example has no production observation." {:world prepared})))}
   {:pattern #"^the readiness outcome is (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))]
                 (assert-world world (= expected (:outcome (readiness-row world)))
                               "Readiness outcome differs from the observed monotonic execution."
                               {:expected expected :row (readiness-row world)})))}
   {:pattern #"^it performs (.+) sleeps$"
    :handler (fn [world example captures]
               (let [expected (parse-long (first (values example-values example captures)))]
                 (assert-world world (= expected (:sleepCount (readiness-row world)))
                               "Readiness sleep count differs from production execution."
                               {:expected expected :row (readiness-row world)})))}
   {:pattern #"^the caller receives the final observed state when readiness succeeds$"
    :handler (fn [world _ _]
               (assert-world world (true? (:finalState (readiness-row world)))
                             "Readiness discarded its final observed state." {}))}

   {:pattern #"^a shared browser readiness check never satisfies its predicate before its monotonic deadline$"
    :handler (fn [world _ _] (ready world))}
   {:pattern #"^its last observed state is larger than the configured diagnostic bound$"
    :handler (fn [world _ _]
               (assert-world world (evidence world :timeout :bounded)
                             "Timeout snapshot was not bounded." {}))}
   {:pattern #"^its timeout names TARGET-READY, navigation, \"the requested workspace is mounted\", and the elapsed milliseconds$"
    :handler (fn [world _ _]
               (let [timeout (evidence world :timeout)]
                 (assert-world world (and (= "TARGET-READY" (:targetId timeout))
                                          (= "navigation" (:phase timeout))
                                          (number? (:elapsedMs timeout)) (:predicate timeout))
                               "Timeout omitted semantic readiness identity." {:timeout timeout})))}
   {:pattern #"^it includes the bounded final state without exceeding the configured snapshot length$"
    :handler (fn [world _ _]
               (assert-world world (<= (evidence world :timeout :snapshotLength) 80)
                             "Timeout diagnostic exceeds its configured bound." {}))}
   {:pattern #"^a circular, undefined, or otherwise non-JSON snapshot still produces a bounded diagnostic$"
    :handler (fn [world _ _]
               (assert-world world (every? true? (map #(evidence world :timeout %)
                                                       [:circular :undefined :nonJson :bounded]))
                             "Hostile snapshots do not retain bounded diagnostics." {}))}])

(defn- surface-handlers [example-values]
  [
   {:pattern #"^(.+) currently owns local fixed-attempt readiness loops$"
    :handler (fn [world example captures]
               (let [surface (first (values example-values example captures))
                     prepared (assoc (ready world) :vtd007/surface surface)]
                 (assert-world prepared (some #(and (= surface (:browserSurface %))
                                                    (surface-production-valid? %))
                                              (evidence prepared :surfaces))
                               "Browser surface lacks production migration evidence." {:surface surface})))}
   {:pattern #"^VTD-007 adopts the shared browser readiness API$" :handler (fn [world _ _] world)}
   {:pattern #"^(.+) uses one monotonic deadline and returns as soon as it is ready$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     row (first (filter #(= (:vtd007/surface world) (:browserSurface %))
                                        (evidence world :surfaces)))]
                 (assert-world world (= expected (:readinessBoundary row))
                               "Migrated readiness boundary differs from its production surface."
                               {:expected expected :row row})))}
   {:pattern #"^its timeout identifies the logical target, active phase, unmet predicate, elapsed time, and bounded last state$"
    :handler (fn [world _ _]
               (let [row (first (filter #(= (:vtd007/surface world) (:browserSurface %))
                                        (evidence world :surfaces)))]
                 (assert-world world (and (evidence world :timeout :bounded)
                                          (surface-production-valid? row))
                             "Shared timeout evidence is incomplete." {})))}
   {:pattern #"^(.+) is enforced by elapsed stable time rather than a sample count$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     row (first (filter #(= (:vtd007/surface world) (:browserSurface %))
                                        (evidence world :surfaces)))]
                 (assert-world world (= expected (:stabilityRequirement row))
                               "Surface stability requirement is not production-backed."
                               {:expected expected :row row})))}])

(defn- timing-handlers []
  [
   {:pattern #"^a browser target records target setup, navigation, fixture, interaction, persistence, assertion, and cleanup when those phases apply$"
    :handler (fn [world _ _] (ready world))}
   {:pattern #"^the target passes or fails$" :handler (fn [world _ _] world)}
   {:pattern #"^its existing swarmforgeBrowserTargetTiming identity and duration remain compatible$"
    :handler (fn [world _ _]
               (assert-world world
                             (and (= "swarmforgeBrowserTargetTiming"
                                     (evidence world :timing :identity))
                                  (= 1 (evidence world :timing :realRunners
                                                 :flowFailure :timingRecords))
                                  (= 1 (evidence world :timing :realRunners
                                                 :installedFailure :timingRecords)))
                             "Real target runners did not retain one timing identity." {}))}
   {:pattern #"^its target-scoped phase durations are finite, non-negative, ordered, and cover the target duration exactly once within rounding tolerance$"
    :handler (fn [world _ _]
               (assert-world world
                             (and (real-timing-valid?
                                    (evidence world :timing :realRunners :flowFailure :timing)
                                    flow-phase-names flow-applicable-phases)
                                  (real-timing-valid?
                                    (evidence world :timing :realRunners :installedFailure :timing)
                                    installed-phase-names installed-applicable-phases))
                             "Real runner phase conservation failed." {}))}
   {:pattern #"^a failure retains completed phase durations and identifies the active partial phase$"
    :handler (fn [world _ _]
               (assert-world world
                             (and (seq (evidence world :timing :failurePartialPhase))
                                  (= "interaction" (evidence world :timing :realRunners
                                                             :flowFailure :activePhase))
                                  (= "interaction" (evidence world :timing :realRunners
                                                             :installedFailure :activePhase))
                                  (real-timing-valid?
                                    (evidence world :timing :realRunners :flowFailure :timing)
                                    flow-phase-names flow-applicable-phases)
                                  (real-timing-valid?
                                    (evidence world :timing :realRunners :installedFailure :timing)
                                    installed-phase-names installed-applicable-phases))
                             "Failed real runner timing lost its caller-owned phase." {}))}
   {:pattern #"^browser startup remains process-scoped rather than being charged to every logical target$"
    :handler (fn [world _ _] (assert-world world (evidence world :timing :processStartupScoped) "Browser startup is target-scoped." {}))}
   {:pattern #"^the Flow examples target preserves its accepted phase names, characterized receipts, 12\.891 second budget, and 16 second limit$"
    :handler (fn [world _ _]
               (assert-world world (and (= 12891 (evidence world :timing :flowExamplesBudgetMilliseconds))
                                        (= 16000 (evidence world :timing :flowExamplesLimitMilliseconds))
                                        (= ["browser startup" "target setup" "fixture setup" "readiness"
                                            "example compilation" "rendering" "persistence" "assertion" "cleanup"]
                                           (evidence world :timing :flowExamplesPhases)))
                             "Flow examples timing contract changed." {}))}])

(defn- deadline-boundary-handlers [example-values]
  [
   {:pattern #"^the browser boundary (.+) has its own bounded deadline$"
    :handler (fn [world example captures]
               (assoc (ready world) :vtd007/deadline-owner
                      (first (values example-values example captures))))}
   {:pattern #"^(.+) is forced independently$"
    :handler (fn [world example captures]
               (let [prepared (assoc world :vtd007/forced-failure
                                     (first (values example-values example captures)))
                     row (deadline-row prepared)]
                 (assert-world prepared
                               (and (= (:vtd007/deadline-owner prepared) (:deadlineOwner row))
                                    (= (get deadline-production-boundaries
                                            (:vtd007/deadline-owner prepared))
                                       (:productionBoundary row))
                                    (if (= "DevTools protocol call" (:deadlineOwner row))
                                      (and (= "Runtime.enable" (:method row))
                                           (pos? (:limitMs row))
                                           (<= (:limitMs row) (:enclosingLimitMs row)))
                                      true))
                               "Forced failure does not exercise the specified production boundary."
                               {:failure (:vtd007/forced-failure prepared)
                                :expected-owner (:vtd007/deadline-owner prepared)
                                :row row})))}])

(defn- deadline-diagnostic-handlers [example-values]
  [
   {:pattern #"^the failure names (.+) rather than a product readiness predicate$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     row (deadline-row world)]
                 (assert-world world (and (= expected (:vtd007/deadline-owner world))
                                          (= (:vtd007/forced-failure world) (:failure row))
                                          (= expected (:deadlineOwner row))
                                          (some? (:productionBoundary row)))
                               "Forced boundary failure lost its concrete owner."
                               {:expected expected :row row})))}
   {:pattern #"^no product readiness timeout replaces, extends, or disables that deadline$"
    :handler (fn [world _ _]
               (let [row (deadline-row world)]
                 (assert-world world
                               (and (= (:vtd007/deadline-owner world) (:deadlineOwner row))
                                    (if (= "DevTools protocol call" (:deadlineOwner row))
                                      (<= (:limitMs row) (:enclosingLimitMs row))
                                      true))
                               "Product readiness replaced an infrastructure deadline."
                               {:row row})))}])

(defn- program-handlers []
  [
   {:pattern #"^shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation$"
    :handler (fn [world _ _] (ready world))}
   {:pattern #"^a generated program has invalid syntax$" :handler (fn [world _ _] world)}
   {:pattern #"^it is rejected before transmission with its logical target and phase$"
    :handler (fn [world _ _]
               (assert-world world
                             (and (evidence world :programs :invalidRejected)
                                  (evidence world :programs :targetAndPhase)
                                  (= 5 (evidence world :programs :invalidCaseCount))
                                  (zero? (evidence world :programs :invalidTransmissionCount))
                                  (= 3 (count (evidence world :programs :protocolAdapters)))
                                  (every? :allValidated
                                          (evidence world :programs :protocolAdapters)))
                             "Invalid browser program was transmitted." {}))}
   {:pattern #"^valid setup, workflow, readiness, persistence, and observation programs retain their current results$"
    :handler (fn [world _ _]
               (assert-world world
                             (and (= 5 (evidence world :programs :validProgramCount))
                                  (= ["setup" "workflow" "readiness" "persistence" "observation"]
                                     (mapv :phase (evidence world :programs :validResults))))
                             "One of the five production program shapes changed." {}))}
   {:pattern #"^fixed waits in those shared entry points remain only where elapsed time or animation is the behavior under test and the reason is adjacent$"
    :handler (fn [world _ _]
               (assert-world world
                             (and (seq (evidence world :programs :fixedDelays))
                                  (evidence world :programs :fixedWaitsBehaviorOnly)
                                  (= migrated-entry-points
                                     (evidence world :programs :policyEntryPoints))
                                  (every? :reasonAdjacent
                                          (evidence world :programs :fixedDelays))
                                  (every? :reasonAdjacent
                                          (evidence world :programs :fixedAttempts)))
                             "Unexplained fixed wait remains." {}))}])

(defn- conservation-handlers []
  [
   {:pattern #"^VTD-007 adds one shared browser-observation control helper consumed transitively by all 20 runnable packs$"
    :handler (fn [world _ _] (ready world))}
   {:pattern #"^the common control helper replaces the five shared polling implementations$"
    :handler (fn [world _ _] (assert-world world (= 5 (evidence world :conservation :sharedImplementations)) "Shared polling implementation count changed." {}))}
   {:pattern #"^every logical browser target, feature, and handler executes exactly once as before$"
    :handler (fn [world _ _] (assert-world world (evidence world :conservation :targetsOnce) "Browser targets are not conserved exactly once." {}))}
   {:pattern #"^the migration neither adds nor removes a planned task or evidence leaf in exact-pack and terminal-full scope$"
    :handler (fn [world _ _] (assert-world world (evidence world :conservation :tasksUnchanged) "Verification task topology changed." {}))}
   {:pattern #"^product behavior, durable bytes, browser-target budgets, pack calibrations, and changed-path ownership are unchanged$"
    :handler (fn [world _ _] (assert-world world (evidence world :conservation :durableBytesUnchanged) "Conserved product or calibration bytes changed." {}))}
   {:pattern #"^the former Flow-only readiness behavior is conserved by the shared API without duplicate polling implementations$"
    :handler (fn [world _ _] (assert-world world (and (= 20 (evidence world :conservation :consumerCount)) (evidence world :conservation :flowBehaviorConserved)) "Flow readiness behavior was not conserved." {}))}])

(defn handlers [{:keys [example-values]}]
  (vec (concat (readiness-handlers example-values)
               (surface-handlers example-values)
               (timing-handlers)
               (deadline-boundary-handlers example-values)
               (deadline-diagnostic-handlers example-values)
               (program-handlers)
               (conservation-handlers))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-08T12:21:14.684468539+02:00", :module-hash "685407090", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 6, :hash "-446500778"} {:id "def/specification-commit", :kind "def", :line 8, :end-line 8, :hash "-916954367"} {:id "def/migrated-entry-points", :kind "def", :line 10, :end-line 15, :hash "-1995674027"} {:id "def/deadline-production-boundaries", :kind "def", :line 17, :end-line 22, :hash "310858959"} {:id "defn-/assert!", :kind "defn-", :line 24, :end-line 25, :hash "-398636236"} {:id "defn-/shell-pack", :kind "defn-", :line 27, :end-line 28, :hash "359235976"} {:id "defn-/topology-without-helper-registry", :kind "defn-", :line 30, :end-line 31, :hash "1896199684"} {:id "defn-/output-evidence", :kind "defn-", :line 33, :end-line 38, :hash "-1531892017"} {:id "defn-/run-production-probes!", :kind "defn-", :line 40, :end-line 57, :hash "-902952003"} {:id "defn-/registry-context!", :kind "defn-", :line 59, :end-line 70, :hash "432947997"} {:id "defn-/source-context", :kind "defn-", :line 72, :end-line 79, :hash "-1321455434"} {:id "defn-/verify-source-context!", :kind "defn-", :line 81, :end-line 109, :hash "211966241"} {:id "defn-/conservation-context!", :kind "defn-", :line 111, :end-line 126, :hash "-502739238"} {:id "defn-/verify-conservation!", :kind "defn-", :line 128, :end-line 137, :hash "-1642427299"} {:id "def/surface-contracts", :kind "def", :line 139, :end-line 161, :hash "-546809473"} {:id "defn-/contract-value-matches?", :kind "defn-", :line 163, :end-line 166, :hash "-1071455076"} {:id "defn-/surface-production-valid?", :kind "defn-", :line 168, :end-line 172, :hash "1901151494"} {:id "defn-/real-timing-valid?", :kind "defn-", :line 174, :end-line 179, :hash "974098377"} {:id "def/flow-phase-names", :kind "def", :line 181, :end-line 183, :hash "29062579"} {:id "def/flow-applicable-phases", :kind "def", :line 185, :end-line 186, :hash "1398007349"} {:id "def/installed-phase-names", :kind "def", :line 188, :end-line 190, :hash "-1213941958"} {:id "def/installed-applicable-phases", :kind "def", :line 192, :end-line 193, :hash "2060640483"} {:id "def/plan-conservation-program", :kind "def", :line 195, :end-line 207, :hash "1965817925"} {:id "defn-/plan-conservation-evidence!", :kind "defn-", :line 209, :end-line 213, :hash "-1957999635"} {:id "defn-/verify-production-boundary!", :kind "defn-", :line 215, :end-line 245, :hash "-1622638604"} {:id "form/25/defonce", :kind "defonce", :line 247, :end-line 247, :hash "-1082635773"} {:id "defn-/values", :kind "defn-", :line 249, :end-line 251, :hash "-170718585"} {:id "defn-/ready", :kind "defn-", :line 253, :end-line 254, :hash "-94748577"} {:id "defn-/assert-world", :kind "defn-", :line 256, :end-line 258, :hash "1946856374"} {:id "defn-/evidence", :kind "defn-", :line 260, :end-line 261, :hash "1967727520"} {:id "defn-/deadline-row", :kind "defn-", :line 263, :end-line 265, :hash "-415798835"} {:id "defn-/readiness-row", :kind "defn-", :line 267, :end-line 270, :hash "-1816154814"} {:id "defn-/readiness-handlers", :kind "defn-", :line 272, :end-line 322, :hash "1425005218"} {:id "defn-/surface-handlers", :kind "defn-", :line 324, :end-line 357, :hash "1125102670"} {:id "defn-/timing-handlers", :kind "defn-", :line 359, :end-line 408, :hash "-1315948997"} {:id "defn-/deadline-boundary-handlers", :kind "defn-", :line 410, :end-line 434, :hash "-228980995"} {:id "defn-/deadline-diagnostic-handlers", :kind "defn-", :line 436, :end-line 457, :hash "-1654390828"} {:id "defn-/program-handlers", :kind "defn-", :line 459, :end-line 493, :hash "-1582657338"} {:id "defn-/conservation-handlers", :kind "defn-", :line 495, :end-line 508, :hash "-664374968"} {:id "defn/handlers", :kind "defn", :line 510, :end-line 517, :hash "1380409147"}]}
;; clj-mutate-manifest-end
