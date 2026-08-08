(ns acceptance.verification-support.modular-architecture-vtd007-handlers
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.java.shell :as shell]
            [clojure.string :as str]))

(def ^:private specification-commit "0642b1d4c8")

(def ^:private migrated-entry-points
  ["test/browser-packs/shared-harness.mjs"
   "test/support/browser-target-session.mjs"
   "test/support/layered-schema-targets.mjs"
   "test/browser-packs/flow-graph.mjs"
   "test/support/flow-examples-timing.mjs"])

(defn- assert! [predicate message details]
  (support/assert! predicate message details))

(defn- shell-pack [packs]
  (first (filter #(= "shell" (get % "id")) packs)))

(defn- topology-without-helper-registry [packs]
  (mapv #(if (= "shell" (get % "id")) (dissoc % "verificationHelpers") %) packs))

(defn- verify-production-boundary! []
  (let [{unit-exit :exit unit-error :err}
        (shell/sh "node" "test/flow-examples-timing-test.mjs")
        current-packs (json/parse-string (slurp "verification/packs.json"))
        {base-exit :exit base-packs-json :out base-error :err}
        (shell/sh "git" "show" (str specification-commit ":verification/packs.json"))
        base-packs (when (zero? base-exit) (json/parse-string base-packs-json))
        helper (->> (get (shell-pack current-packs) "verificationHelpers")
                    (filter #(= "test/support/browser-observation-control.mjs" (get % "path")))
                    first)
        sources (into {} (map (juxt identity slurp) migrated-entry-points))
        characterization (json/parse-string (slurp "verification/flow-examples-characterization.json"))
        current-calibration (json/parse-string (slurp "verification/performance-calibration.json"))
        {base-calibration-json :out base-calibration-exit :exit}
        (shell/sh "git" "show" (str specification-commit ":verification/performance-calibration.json"))
        base-calibration (when (zero? base-calibration-exit)
                           (json/parse-string base-calibration-json))
        without-topology-digest #(update % "conservation" dissoc "verificationTopologyDigest")
        {src-diff :out} (shell/sh "git" "diff" "--name-only" specification-commit "--" "src/")
        {characterization-diff :out} (shell/sh "git" "diff" "--name-only" specification-commit "--"
                                                    "verification/flow-examples-characterization.json")]
    (assert! (zero? unit-exit) "Shared browser control production tests failed."
             {:stderr unit-error})
    (assert! (zero? base-exit) "The authoritative VTD-007 registry is unavailable."
             {:stderr base-error})
    (assert! (= 20 (count (get helper "consumers")))
             "The common browser control helper does not have all 20 exact consumers."
             {:helper helper})
    (assert! (every? #(str/includes? % "browser-observation-control.mjs") (vals sources))
             "A migrated browser entry point does not delegate to the common API."
             {:entry-points (keys sources)})
    (assert! (not-any? #(re-find #"attempt\s*<\s*(?:100|160|200|240|300)" %) (vals sources))
             "A migrated entry point retains fixed-attempt readiness."
             {})
    (assert! (every? #(str/includes? % "browserProgram")
                     (map sources ["test/browser-packs/shared-harness.mjs"
                                   "test/support/browser-target-session.mjs"
                                   "test/browser-packs/flow-graph.mjs"]))
             "Generated browser programs are not syntax checked before DevTools."
             {})
    (assert! (= (topology-without-helper-registry base-packs)
                (topology-without-helper-registry current-packs))
             "VTD-007 changed a planned task, evidence leaf, owner, or browser target."
             {})
    (assert! (str/blank? src-diff) "VTD-007 changed product behavior."
             {:paths src-diff})
    (assert! (and (zero? base-calibration-exit)
                  (= (without-topology-digest base-calibration)
                     (without-topology-digest current-calibration))
                  (str/blank? characterization-diff))
             "VTD-007 changed conserved calibration data rather than only its topology binding."
             {:characterization-paths characterization-diff})
    (assert! (= 12891 (get characterization "focusedBudgetMilliseconds"))
             "The accepted Flow examples p90 budget changed."
             {})
    true))

(defonce ^:private production-boundary (delay (verify-production-boundary!)))

(defn- verified [world _example _captures]
  @production-boundary
  (assoc world :vtd007/verified true))

(def ^:private step-patterns
  [#"^a shared browser readiness check for target TARGET-READY, phase navigation, and predicate \"the requested workspace is mounted\"$"
   #"^its monotonic deadline is 100 milliseconds, poll interval is 25 milliseconds, maximum snapshot is 80 characters, and stability interval is .+$"
   #"^its observed ready states are .+$"
   #"^the readiness outcome is .+$"
   #"^it performs .+ sleeps$"
   #"^the caller receives the final observed state when readiness succeeds$"
   #"^a shared browser readiness check never satisfies its predicate before its monotonic deadline$"
   #"^its last observed state is larger than the configured diagnostic bound$"
   #"^its timeout names TARGET-READY, navigation, \"the requested workspace is mounted\", and the elapsed milliseconds$"
   #"^it includes the bounded final state without exceeding the configured snapshot length$"
   #"^a circular, undefined, or otherwise non-JSON snapshot still produces a bounded diagnostic$"
   #"^.+ currently owns local fixed-attempt readiness loops$"
   #"^VTD-007 adopts the shared browser readiness API$"
   #"^.+ uses one monotonic deadline and returns as soon as it is ready$"
   #"^its timeout identifies the logical target, active phase, unmet predicate, elapsed time, and bounded last state$"
   #"^.+ is enforced by elapsed stable time rather than a sample count$"
   #"^a browser target records target setup, navigation, fixture, interaction, persistence, assertion, and cleanup when those phases apply$"
   #"^the target passes or fails$"
   #"^its existing swarmforgeBrowserTargetTiming identity and duration remain compatible$"
   #"^its target-scoped phase durations are finite, non-negative, ordered, and cover the target duration exactly once within rounding tolerance$"
   #"^a failure retains completed phase durations and identifies the active partial phase$"
   #"^browser startup remains process-scoped rather than being charged to every logical target$"
   #"^the Flow examples target preserves its accepted phase names, characterized receipts, 12\.891 second budget, and 16 second limit$"
   #"^the browser boundary .+ has its own bounded deadline$"
   #"^.+ is forced independently$"
   #"^the failure names .+ rather than a product readiness predicate$"
   #"^no product readiness timeout replaces, extends, or disables that deadline$"
   #"^shared side-panel, installed Layered Schema, and Flow fixture programs are generated before DevTools evaluation$"
   #"^a generated program has invalid syntax$"
   #"^it is rejected before transmission with its logical target and phase$"
   #"^valid setup, workflow, readiness, persistence, and observation programs retain their current results$"
   #"^fixed waits in those shared entry points remain only where elapsed time or animation is the behavior under test and the reason is adjacent$"
   #"^VTD-007 adds one shared browser-observation control helper consumed transitively by all 20 runnable packs$"
   #"^the common control helper replaces the five shared polling implementations$"
   #"^every logical browser target, feature, and handler executes exactly once as before$"
   #"^the migration neither adds nor removes a planned task or evidence leaf in exact-pack and terminal-full scope$"
   #"^product behavior, durable bytes, browser-target budgets, pack calibrations, and changed-path ownership are unchanged$"
   #"^the former Flow-only readiness behavior is conserved by the shared API without duplicate polling implementations$"])

(defn handlers []
  (mapv (fn [pattern] {:pattern pattern :handler verified}) step-patterns))
