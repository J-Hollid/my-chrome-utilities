(ns acceptance.verification-support.modular-architecture-live-target-permission-handlers
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(defonce ^:private evidence (atom nil))

(defn- preparation-evidence! []
  (when-not @evidence
    (let [result (support/verified-command-result
                  "node" "test/live-target-permission-recovery-preparation-contract-test.mjs")
          line (first (filter #(str/starts-with?
                               % "{\"liveTargetPermissionRecoveryPreparationAcceptance\"")
                              (str/split-lines (:out result))))]
      (support/assert! (zero? (:exit result))
                       "Live target permission preparation contract failed."
                       {:out (:out result) :err (:err result)})
      (support/assert! line
                       "Live target permission preparation evidence is missing."
                       {:out (:out result)})
      (reset! evidence
              (:liveTargetPermissionRecoveryPreparationAcceptance
               (json/parse-string line true)))))
  @evidence)

(defn- verify! [world]
  (let [result (preparation-evidence!)]
    (support/assert! (and (map? result) (every? true? (vals result)))
                     "Live target permission preparation evidence is incomplete."
                     {:evidence result})
    world))

(def scenario-step-patterns
  {"199" [#"^live-target-permission-recovery is paused at exact QA e54f411a0f because its planned side-panel composition path selects all twenty runnable packs and 799 tasks$"
          #"^each planned observation-target, path-status, active-page, or guided-workflow path without that composition path selects fewer than all runnable packs$"
          #"^standing ownership preparation is issued$"
          #"^its stable task is verification-slice-live-target-permission-recovery$"
          #"^it starts from exact QA e54f411a0f without a product candidate or another user decision$"
          #"^product scenario 009 and installed runtime scenario 002 remain unchanged and intentionally unimplemented$"
          #"^the preparation cannot execute or authorize an all-runnable-pack feature plan$"]
   "200" [#"^the Live target permission-recovery preparation needs probe reconciliation, a current-step action, an exact-origin grant, and a same-tab path recheck$"
          #"^its behavior-preserving ownership seam is established$"
          #"^source prefix src/data-layer-live-target-permission-recovery/ belongs to subordinate Capture slice capture_live_target_permission_recovery$"
          #"^Shell is its exact installed side-panel consumer$"
          #"^the slice names direct model, controller, guided-step, and installed-wiring proof without assigning the whole side-panel composition root to a narrow owner$"
          #"^packs outside Capture and Shell remain preparation regressions only when selected by the conservative current and historical plan and are not inferred as seam consumers$"
          #"^src/side-panel.ts receives an integrated-seam disposition only when the resumed product can leave that broad path unchanged$"
          #"^an unproved consumer, whole-file narrowing, parent fallback that leaves the product all-pack, or attempted all-pack feature evidence blocks the seam$"]
   "201" [#"^the Live target permission-recovery preparation has one bounded exact candidate$"
          #"^its conservation and review evidence are produced$"
          #"^current valid active-tab access, target selection, picker permission requests, path readiness, session start, and installed Live setup behavior remain unchanged$"
          #"^no Request access action is newly exposed by the preparation and no permission, probe, path check, observation, session, project, or saved state changes meaning$"
          #"^every former assertion, task, prerequisite, pack consumer, package input, and terminal obligation remains represented by the conservative current and historical union$"
          #"^exact changed-path evidence includes any slice-declared properties, the declared direct seam and consumer proof, and package proof$"
          #"^after architect qa-ready integration the original live-target-permission-recovery task is reissued from that exact QA head without another acceptance round-trip$"]
   "202" [#"^the installed Live target permission-recovery seam is dormant and independently reviewed$"
          #"^whole-file ownership still expands its side-panel and Capture-facade paths to all runnable packs$"
          #"^the user-approved causal focused-verification bootstrap plans preparation evidence$"
          #"^its only affected packs are Capture, Event Library, Schemas, Defects, and Shell$"
          #"^it selects only the declared seam, prerequisite, preparation-contract, installed-browser, directly changed process-contract, and acceptance tasks plus package proof$"
          #"^a property task runs only when the settled slice declares it as a direct or prerequisite observation$"
          #"^candidate-authored generic ownership cannot narrow another change set$"
          #"^no unrelated whole-pack task array or all-runnable-pack checkpoint executes$"]
   "203" [#"^the Live target permission-recovery preparation has the user-approved focused bootstrap$"
          #"^(.+) is found before evidence execution$"
          #"^the focused bootstrap is invalid$"
          #"^execution stops for current scope classification instead of widening the plan$"]})

(defn handlers []
  (vec (for [[_scenario patterns] scenario-step-patterns
             pattern patterns]
         {:pattern pattern
          :handler (fn [world _example _captures] (verify! world))})))
