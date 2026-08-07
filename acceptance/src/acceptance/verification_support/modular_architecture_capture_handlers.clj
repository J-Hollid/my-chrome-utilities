(ns acceptance.verification-support.modular-architecture-capture-handlers
  (:require [acceptance.verification-support.modular-architecture-project-management :as project]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def ^:private ten-pack-closure
  ["capture" "event-library" "project_event_transport" "schemas" "defects" "replay"
   "live_flow_testing" "project_assurance_severity" "guided_test_cases" "shell"])

(defn- capture-world [world dependencies]
  (project/vtd004-world (assoc world :vtd004/owner "capture") dependencies))

(defn- assert-capture! [world predicate message details]
  (support/assert! predicate message details)
  world)

(defn- scope-label [pack-ids]
  (cond
    (= ["capture"] pack-ids) "capture only"
    (= ten-pack-closure pack-ids) "ten-pack dependant closure"
    :else "every runnable pack"))

(defn- handler-path [name]
  (str "acceptance/src/acceptance/steps/" name))

(defn- history-key [change historical-registry]
  (if (= "missing, unreadable, incompatible, or malformed" historical-registry)
    :unreadable
    (cond
      (str/starts-with? change "delete ") :delete
      (str/ends-with? change "data-layer-live-inspector-return-ui.ts") :renamePresentation
      (str/ends-with? change "data-layer-live-observer-ui.ts") :renameSharedPresentation
      (str/ends-with? change "data-layer-live-observer.ts") :renameSemantic
      (str/ends-with? change "data-layer-saved-sessions.ts") :renamePersistence
      (str/ends-with? change "data-layer-workflow-focus-ui.ts") :renameLibraryFocus)))

(defn handlers [{:keys [example-values] :as dependencies}]
  [{:pattern #"^the current Capture dependant closure is capture, event-library, project_event_transport, schemas, defects, replay, live_flow_testing, project_assurance_severity, guided_test_cases, shell$"
    :handler (fn [world _ _]
               (let [prepared (capture-world world dependencies)]
                 (assert-capture! (assoc prepared :vtd004/capture-closure ten-pack-closure)
                                  (= ten-pack-closure
                                     (get-in prepared [:vtd004/evidence :calibration :previous
                                                       :selectedPacks]))
                                  "Capture's prior dependant closure changed." {})))}
   {:pattern #"^Capture changed path (.+) is classified$"
    :handler (fn [world example captures]
               (let [path (first (example-values example captures))
                     prepared (project/boundary-world (assoc world :vtd004/owner "capture")
                                                     path dependencies)
                     plan (get-in prepared [:vtd004/evidence :currentPlans (keyword path)])]
                 (assoc prepared :vtd004/selected-scope (scope-label plan))))}
   {:pattern #"^it belongs to exactly boundary (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-capture! world (= expected (get-in world [:vtd004/boundary :id]))
                                  "Capture path belongs to the wrong boundary."
                                  {:expected expected :actual (:vtd004/boundary world)})))}
   {:pattern #"^the six Capture local-presentation files receive already-computed values or snapshots$"
    :handler (fn [world _ _]
               (let [prepared (capture-world world dependencies)]
                 (assert-capture! prepared
                                  (every? true? (vals (get-in prepared
                                                              [:vtd004/evidence :presentationBoundary])))
                                  "Capture presentation inputs are not isolated." {})))}
   {:pattern #"^their non-propagating boundaries are installed$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (= 6 (count (mapcat :prefixes
                                                   (filter (comp false? :propagateDependants)
                                                           (get-in world [:vtd004/pack
                                                                          :impactBoundaries])))))
                                "Capture local presentation boundaries are incomplete." {}))}
   {:pattern #"^they may render supplied values, inspect their own DOM hosts, restore supplied expansion, scroll, and focus state, manage target-picker focus, and call supplied callbacks$"
    :handler (fn [world _ _]
               (assert-capture! world (get-in world [:vtd004/evidence :presentationBoundary
                                                      :suppliedValues])
                                "Capture presentation capabilities were not verified." {}))}
   {:pattern #"^they cannot observe a page, read or write storage, choose target access, derive query or session state, validate an event, perform a Capture or Library operation, or create a second live-state projection$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (and (get-in world [:vtd004/evidence :presentationBoundary
                                                    :effectIsolated])
                                     (get-in world [:vtd004/evidence :presentationBoundary
                                                    :semanticIsolated]))
                                "Capture presentation crossed an effect or semantic boundary." {}))}
   {:pattern #"^existing unit evidence directly asserts query, session-control, session-summary, and target-picker presentation$"
    :handler (fn [world _ _]
               (assert-capture! world (= 21 (get-in world [:vtd004/evidence :conservation :unitCount]))
                                "Capture unit evidence was not conserved." {}))}
   {:pattern #"^an existing Capture browser observation directly asserts inspector return and newly asserts inspector presentation capture and restore without another browser process or plan task$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (and (get-in world [:vtd004/evidence :conservation
                                                    :directInspectorPresentation])
                                     (= 5 (get-in world [:vtd004/evidence :conservation :targetCount])))
                                "Capture inspector presentation added or lost a browser target." {}))}
   {:pattern #"^labels, counts, statuses, hidden and disabled states, query order, empty-state wording, target-dialog keyboard behavior, accessibility, responsive layout, stored state, and operator results are unchanged$"
    :handler (fn [world _ _]
               (assert-capture! world (get-in world [:vtd004/evidence :presentationBoundary
                                                      :behaviorPreserved])
                                "Capture presentation behavior was not conserved." {}))}
   {:pattern #"^Capture handler (.+) has (.+)$"
    :handler (fn [world example captures]
               (let [[name consumer-evidence] (example-values example captures)
                     prepared (capture-world world dependencies)
                     path (handler-path name)
                     evidence (first (filter #(= path (:path %))
                                             (get-in prepared [:vtd004/evidence :handlers])))
                     isolated? (some? evidence)]
                 (assoc prepared :vtd004/capture-handler path
                        :vtd004/consumer-evidence consumer-evidence
                        :vtd004/isolation-decision (if isolated? "isolated" "dependant propagation")
                        :vtd004/selected-scope (if isolated? "capture only"
                                                  "ten-pack dependant closure"))))}
   {:pattern #"^acceptance-handler isolation is audited from parsed APS steps and namespace consumers$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (get-in world [:vtd004/evidence :isolationAudit :metadataCannotConceal])
                                "Capture handler isolation audit is absent." {}))}
   {:pattern #"^isolation decision is (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-capture! world (= expected (:vtd004/isolation-decision world))
                                  "Capture handler isolation decision is wrong."
                                  {:handler (:vtd004/capture-handler world) :expected expected})))}
   {:pattern #"^a handler-only change selects (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-capture! world (= expected (:vtd004/selected-scope world))
                                  "Capture handler plan has the wrong scope."
                                  {:handler (:vtd004/capture-handler world) :expected expected})))}
   {:pattern #"^an isolated Capture handler gains (.+)$"
    :handler (fn [world example captures]
               (assoc (capture-world world dependencies)
                      :vtd004/isolation-condition (first (example-values example captures))))}
   {:pattern #"^isolation validation scans every session that loads the handler$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (get-in world [:vtd004/evidence :isolationAudit :metadataCannotConceal])
                                "Capture loaded-session audit was not exercised." {}))}
   {:pattern #"^isolation is rejected with (.+)$"
    :applies? #(= "capture" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))
                     condition (:vtd004/isolation-condition world)
                     key (cond
                           (str/starts-with? condition "a pattern") :captureLoadedStepDiagnostic
                           (str/starts-with? condition "a namespace") :captureNamespaceDiagnostic
                           (str/starts-with? condition "missing or foreign") :missingMetadataDiagnostic
                           :else :unreadableAuditDiagnostic)
                     diagnostic (get-in world [:vtd004/evidence :isolationAudit key])]
                 (assert-capture! world (and diagnostic (str/includes? diagnostic expected))
                                  "Capture isolation diagnostic is not exact."
                                  {:condition condition :expected expected :diagnostic diagnostic})))}
   {:pattern #"^the handler-only change retains the ten-pack dependant closure$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (= ten-pack-closure
                                   (get-in world [:vtd004/evidence :isolationAudit
                                                  :rejectedCaptureHandlerPlan]))
                                "Rejected Capture isolation did not restore dependant propagation." {}))}
   {:pattern #"^a self-declared feature list cannot conceal the cross-pack consumer$"
    :applies? #(= "capture" (:vtd004/owner %))
    :handler (fn [world _ _]
               (assert-capture! world
                                (get-in world [:vtd004/evidence :isolationAudit :metadataCannotConceal])
                                "Capture feature metadata concealed a consumer." {}))}
   {:pattern #"^Capture change is (.+)$"
    :handler (fn [world example captures]
               (assoc (capture-world world dependencies)
                      :vtd004/change (first (example-values example captures))))}
   {:pattern #"^historical registry state is (.+)$"
    :applies? #(= "capture" (:vtd004/owner %))
    :handler (fn [world example captures]
               (assoc world :vtd004/historical-registry (first (example-values example captures))))}
   {:pattern #"^impacted verification packs are selected from current and historical ownership$"
    :applies? #(= "capture" (:vtd004/owner %))
    :handler (fn [world _ _]
               (let [key (history-key (:vtd004/change world) (:vtd004/historical-registry world))
                     plan (get-in world [:vtd004/evidence :historyPlans key])]
                 (assert-capture! (assoc world :vtd004/selected-scope (scope-label plan))
                                  (seq plan) "Capture historical plan is missing."
                                  {:change (:vtd004/change world) :history-key key})))}
   {:pattern #"^selected scope is (.+)$"
    :applies? #(= "capture" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-capture! world (= expected (:vtd004/selected-scope world))
                                  "Capture selected scope is wrong."
                                  {:expected expected :actual (:vtd004/selected-scope world)})))}
   {:pattern #"^every Capture boundary maps to the complete owner evidence profile$"
    :handler (fn [world _ _]
               (let [prepared (capture-world world dependencies)
                     evidence (get-in prepared [:vtd004/evidence :conservation])]
                 (assert-capture! (assoc prepared :vtd004/conserved? true)
                                  (= [21 12 66 25 1 5 2 171]
                                     ((juxt :unitCount :propertyCount :featureCount :handlerCount
                                            :adapterCount :targetCount :checkpointCount :exactTaskCount)
                                      evidence))
                                  "Capture owner evidence profile changed." {:evidence evidence})))}
   {:pattern #"^exact capture verification and terminal-full planning are compared before and after VTD-004$"
    :handler (fn [world _ _]
               (assert-capture! world (:vtd004/conserved? world)
                                "Capture exact/terminal comparison did not complete." {}))}
   {:pattern #"^all 21 unit files, 12 property files, 66 feature files, 25 handlers, one shared browser adapter, five registered browser targets, and two runtime checkpoints execute once in the 171-task exact owner plan$"
    :handler (fn [world _ _]
               (assert-capture! world (= 171 (get-in world [:vtd004/evidence :conservation
                                                            :exactTaskCount]))
                                "Capture exact plan is not 171 tasks." {}))}
   {:pattern #"^the existing Capture browser batch gains direct inspector-presentation capture-and-restore proof without another browser process or plan task$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (get-in world [:vtd004/evidence :conservation
                                               :directInspectorPresentation])
                                "Direct inspector presentation proof is absent." {}))}
   {:pattern #"^terminal-full planning executes every conserved assertion leaf, checkpoint, and package check exactly once$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (and (get-in world [:vtd004/evidence :conservation
                                                    :terminalTaskIdentitiesConserved])
                                     (= 2 (get-in world [:vtd004/evidence :conservation
                                                         :checkpointCount]))
                                     (= 1 (get-in world [:vtd004/evidence :conservation
                                                         :packageCheckCount])))
                                "Capture terminal evidence is not conserved." {}))}
   {:pattern #"^browser batching, task order, worker limits, terminal shards, capture behavior, stored bytes, visible output, accessibility, and operator results are unchanged$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (get-in world [:vtd004/evidence :conservation
                                               :terminalTaskIdentitiesConserved])
                                "Capture topology or product behavior changed." {}))}
   {:pattern #"^src/data-layer-live-inspector-presentation-ui.ts currently selects ten packs with dependant fan-out 9, critical-path baseline 195.5 seconds, and limit 235 seconds$"
    :handler (fn [world _ _]
               (let [prepared (capture-world world dependencies)
                     previous (get-in prepared [:vtd004/evidence :calibration :previous])]
                 (assert-capture! (assoc prepared :vtd004/calibration-pack
                                         (get-in prepared [:vtd004/evidence :calibration :current]))
                                  (= [ten-pack-closure 9 195.5 235]
                                     [(:selectedPacks previous)
                                      (get-in previous [:changedPathFanOut :limit])
                                      (get-in previous [:changedPathDuration :baseline])
                                      (get-in previous [:changedPathDuration :limit])])
                                  "Capture's prior calibration is not exact." {:previous previous})))}
   {:pattern #"^its proven local-presentation boundary becomes the Capture representative from the accepted VTD-003 receipt scope$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (get-in world [:vtd004/evidence :calibration :provenanceConserved])
                                "Capture calibration provenance changed." {}))}
   {:pattern #"^it selects only capture with dependant fan-out 0$"
    :handler (fn [world _ _]
               (let [current (:vtd004/calibration-pack world)]
                 (assert-capture! world
                                  (= [["capture"] 0]
                                     [(:selectedPacks current)
                                      (get-in current [:changedPathFanOut :limit])])
                                  "Capture representative retained dependant fan-out." {})))}
   {:pattern #"^its critical-path baseline is 51.9 seconds with tolerance 1.2 and limit 63 seconds$"
    :handler (fn [world _ _]
               (assert-capture! world
                                (= [51.9 1.2 63]
                                   ((juxt :baseline :tolerance :limit)
                                    (get-in world [:vtd004/calibration-pack :changedPathDuration])))
                                "Capture changed-path duration is not exact." {}))}
   {:pattern #"^the other 19 pack calibrations, the Capture exact-pack calibration, and all 81 browser-target budgets are unchanged$"
    :handler (fn [world _ _]
               (let [evidence (get-in world [:vtd004/evidence :calibration])]
                 (assert-capture! world
                                  (and (:otherPackRowsConserved evidence)
                                       (:browserTargetRowsConserved evidence)
                                       (:exactPackCalibrationConserved evidence)
                                       (:provenanceConserved evidence)
                                       (= 19 (:otherPackCount evidence))
                                       (= 81 (:browserTargetCount evidence)))
                                  "Capture calibration changed conserved rows." {})))}])
