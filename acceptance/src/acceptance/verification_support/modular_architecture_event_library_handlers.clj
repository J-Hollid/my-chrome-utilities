(ns acceptance.verification-support.modular-architecture-event-library-handlers
  (:require [acceptance.verification-support.modular-architecture-project-management :as project]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def ^:private eight-pack-capture-closure
  ["capture" "event-library" "project_event_transport" "defects" "replay"
   "live_flow_testing" "guided_test_cases" "shell"])

(def ^:private seven-pack-dependant-closure
  ["event-library" "project_event_transport" "defects" "replay"
   "live_flow_testing" "guided_test_cases" "shell"])

(def ^:private handler-consumer-conditions
  {"event_template_library.clj"
   "only Event Library-owned steps in sessions that load the handler"
   "library_direct_template_push.clj"
   "only its two Event Library-owned features in sessions that load the handler"
   "event_library_editor.clj"
   "only Event Library-owned steps despite composing Capture-owned input handlers"})

(def ^:private historical-changes
  #{"delete src/data-layer-push-draft-review-ui.ts"
    "rename src/data-layer-push-draft-review-ui.ts to src/data-layer-template-change-review-ui.ts"
    "rename src/data-layer-push-draft-review-ui.ts to src/data-layer-event-library-editor-ui.ts"
    "rename src/data-layer-push-draft-review-ui.ts to src/data-layer-event-library-editor.ts"
    "rename src/data-layer-push-draft-review-ui.ts to src/data-layer-push-draft-review.ts"})

(def ^:private historical-registry-states
  #{"readable and compatible" "missing, unreadable, incompatible, or malformed"})

(defn- event-world [world dependencies]
  (project/vtd004-world (assoc world :vtd004/owner "event-library") dependencies))

(defn- assert-event! [world predicate message details]
  (support/assert! predicate message details)
  world)

(defn- presentation-world [world dependencies]
  (let [prepared (event-world world dependencies)
        evidence (:vtd004/evidence prepared)]
    (assert-event! prepared
                   (and (every? true? (vals (:presentationBoundary evidence)))
                        (= ["event-library"]
                           (get-in evidence [:currentPlans
                                             :src/data-layer-push-draft-review-ui.ts]))
                        (= ["event-library"]
                           (get-in evidence [:currentPlans
                                             :src/data-layer-template-change-review-ui.ts])))
                   "Event Library review presentation is not owner-only."
                   {:current-plans (:currentPlans evidence)})))

(defn- handler-world [world handler-name dependencies]
  (let [prepared (event-world world dependencies)
        handler (first (filter #(str/ends-with? (:path %) handler-name)
                               (get-in prepared [:vtd004/evidence :handlers])))]
    (assert-event! (assoc prepared :vtd004/handler handler
                         :vtd004/handler-isolated? true)
                   (and handler
                        (empty? (:consumers handler))
                        (= ["event-library"] (:ownerPlan handler))
                        (:negativeMutationRejected handler)
                        (seq (:servedFeatures handler)))
                   "Event Library APS handler isolation is incomplete."
                   {:handler handler-name :evidence handler})))

(defn- conservation-world [world dependencies]
  (let [prepared (event-world world dependencies)
        pack (:vtd004/pack prepared)
        evidence (get-in prepared [:vtd004/evidence :conservation])]
    (assert-event! (assoc prepared :vtd004/conserved? true)
                   (and (= (select-keys pack [:unit :property :features :handlers :browserAdapters])
                           (:evidenceProfile evidence))
                        (= [9 1 8 3 1 1 30]
                           ((juxt :unitCount :propertyCount :featureCount :handlerCount
                                  :adapterCount :targetCount :exactTaskCount) evidence))
                        (:terminalTaskIdentitiesConserved evidence)
                        (:directRevisionRenderer evidence)
                        (= 1 (:packageCheckCount evidence)))
                   "Event Library exact or terminal task identities are not conserved."
                   {:pack pack :conservation evidence})))

(defn- calibration-world [world dependencies]
  (let [prepared (event-world world dependencies)
        evidence (get-in prepared [:vtd004/evidence :calibration])
        current (:current evidence)]
    (assert-event! (assoc prepared :vtd004/calibration-pack current)
                   (and (= "src/data-layer-push-draft-review-ui.ts"
                           (:representativeChangedPath current))
                        (= ["event-library"] (:selectedPacks current))
                        (= 0 (get-in current [:changedPathFanOut :limit]))
                        (= [11.6 1.2 14]
                           ((juxt :baseline :tolerance :limit)
                            (:changedPathDuration current)))
                        (:otherPackRowsConserved evidence)
                        (:browserTargetRowsConserved evidence)
                        (:exactPackCalibrationConserved evidence)
                        (:provenanceConserved evidence)
                        (= 19 (:otherPackCount evidence))
                        (= 81 (:browserTargetCount evidence)))
                   "Event Library presentation calibration is not exact."
                   {:calibration evidence})))

(defn handlers [{:keys [example-values] :as dependencies}]
  [{:pattern #"^event-library owns source path (.+)$"
    :handler (fn [world example captures]
               (project/boundary-world (assoc world :vtd004/owner "event-library")
                                       (first (example-values example captures)) dependencies))}
   {:pattern #"^Capture explicitly consumes src/data-layer-event-library-editor.ts and src/data-layer-event-library-editor-ui.ts$"
    :handler (fn [world _ _]
               (let [prepared (event-world world dependencies)]
                 (assert-event! prepared
                                (= eight-pack-capture-closure
                                   (get-in prepared [:vtd004/evidence :currentPlans
                                                     :src/data-layer-event-library-editor.ts]))
                                "Capture is absent from the editor model closure." {})))}
   {:pattern #"^the two Event Library review renderers receive review values and a DOM root from their caller$"
    :handler (fn [world _ _] (presentation-world world dependencies))}
   {:pattern #"^installed Event Library browser evidence exercises both review renderers directly$"
    :handler (fn [world _ _]
               (assert-event! world
                              (get-in world [:vtd004/evidence :conservation :directRevisionRenderer])
                              "Installed evidence does not directly render both reviews." {}))}
   {:pattern #"^Event Library presentation boundaries are validated$"
    :handler (fn [world _ _] (presentation-world world dependencies))}
   {:pattern #"^the editor model and shared editor presentation retain dependant propagation$"
    :handler (fn [world _ _]
               (assert-event! world
                              (every? true? (map :propagateDependants
                                                (take 2 (get-in world [:vtd004/pack :impactBoundaries]))))
                              "Editor boundaries no longer propagate dependants." {}))}
   {:pattern #"^their selected packs include Capture plus the seven ordinary Event Library packs$"
    :handler (fn [world _ _]
               (assert-event! world
                              (every? #(= eight-pack-capture-closure
                                          (get-in world [:vtd004/evidence :currentPlans (keyword %)]))
                                      ["src/data-layer-event-library-editor.ts"
                                       "src/data-layer-event-library-editor-ui.ts"])
                              "Editor planning does not preserve the Capture closure." {}))}
   {:pattern #"^the review renderers cannot access Library storage, semantic controllers, Capture runtime, or page-push execution$"
    :handler (fn [world _ _]
               (assert-event! world (get-in world [:vtd004/evidence :presentationBoundary
                                                    :effectIsolated])
                              "Review renderer effect isolation failed." {}))}
   {:pattern #"^they cannot derive differences, choose Save or Push, validate destinations, or create a second review state$"
    :handler (fn [world _ _]
               (assert-event! world (get-in world [:vtd004/evidence :presentationBoundary
                                                    :semanticIsolated])
                              "Review renderer semantic isolation failed." {}))}
   {:pattern #"^supplied rows, identity changes, execution changes, payload changes, labels, ordering, empty states, accessibility, dialog behavior, storage, payloads, and operator results are preserved$"
    :handler (fn [world _ _]
               (assert-event! world (get-in world [:vtd004/evidence :presentationBoundary
                                                    :behaviorPreserved])
                              "Review renderer behavior was not preserved." {}))}
   {:pattern #"^changed Event Library path (.+) belongs to (.+)$"
    :handler (fn [world example captures]
               (let [[path expected-boundary] (example-values example captures)
                     prepared (project/change-world (assoc world :vtd004/owner "event-library")
                                                    path dependencies)]
                 (assert-event! prepared
                                (= expected-boundary (get-in prepared [:vtd004/boundary :id]))
                                "Changed Event Library path has the wrong boundary."
                                {:path path :expected expected-boundary})))}
   {:pattern #"^Event Library acceptance handler (.+) has (.+)$"
    :handler (fn [world example captures]
               (let [[handler-name condition] (example-values example captures)]
                 (assert-event! (handler-world world handler-name dependencies)
                                (= condition (handler-consumer-conditions handler-name))
                                "Event Library handler consumer condition is not exact."
                                {:handler handler-name :condition condition})))}
   {:pattern #"^the handler may be isolated$"
    :handler (fn [world _ _]
               (assert-event! world (get-in world [:vtd004/handler :negativeMutationRejected])
                              "Event Library handler was not isolated." {}))}
   {:pattern #"^a handler-only change selects complete Event Library evidence$"
    :handler (fn [world _ _]
               (assert-event! world (= ["event-library"]
                                       (get-in world [:vtd004/handler :ownerPlan]))
                              "Handler-only planning escaped Event Library." {}))}
   {:pattern #"^a loaded cross-pack step consumer or namespace require blocks isolation and retains dependant propagation$"
    :handler (fn [world _ _]
               (assert-event! world (:vtd004/handler-isolated? world)
                              "Handler negative isolation contract was not exercised." {}))}
   {:pattern #"^Capture-consumed editor source files retain their eight-pack selection independently of handler isolation$"
    :handler (fn [world _ _]
               (assert-event! world
                              (= eight-pack-capture-closure
                                 (get-in world [:vtd004/evidence :currentPlans
                                                :src/data-layer-event-library-editor.ts]))
                              "Handler isolation changed Capture editor propagation." {}))}
   {:pattern #"^Event Library change is (.+)$"
    :handler (fn [world example captures]
               (let [change (first (example-values example captures))]
                 (assert-event! (assoc world :vtd004/owner "event-library"
                                       :vtd004/change change)
                                (historical-changes change)
                                "Event Library historical change is not an exact declared case."
                                {:change change})))}
   {:pattern #"^historical registry state is (.+)$"
    :applies? #(= "event-library" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [state (first (example-values example captures))]
                 (assert-event! (project/history-world world (:vtd004/change world)
                                                       state dependencies)
                                (historical-registry-states state)
                                "Event Library historical registry state is not exact."
                                {:state state})))}
   {:pattern #"^every Event Library boundary maps to the complete owner evidence profile$"
    :handler (fn [world _ _] (conservation-world world dependencies))}
   {:pattern #"^exact event-library verification and terminal-full planning are compared before and after VTD-004$"
    :handler (fn [world _ _]
               (assert-event! world (:vtd004/conserved? world)
                              "Event Library plan comparison did not complete." {}))}
   {:pattern #"^all nine unit files, one property file, eight feature files, three handlers, one shared browser adapter, and one installed browser observation execute once in the 30-task exact owner plan$"
    :handler (fn [world _ _]
               (assert-event! world (= 30 (get-in world [:vtd004/evidence :conservation :exactTaskCount]))
                              "Event Library exact plan is not 30 tasks." {}))}
   {:pattern #"^the installed observation directly renders both push-review and revision-review supplied values without adding another browser process or plan task$"
    :handler (fn [world _ _]
               (assert-event! world
                              (and (get-in world [:vtd004/evidence :conservation :directRevisionRenderer])
                                   (= 1 (get-in world [:vtd004/evidence :conservation :targetCount])))
                              "Direct review evidence added or lost an observation target." {}))}
   {:pattern #"^terminal-full planning executes every conserved assertion leaf, the added revision-review renderer assertion, and every package check exactly once$"
    :handler (fn [world _ _]
               (assert-event! world
                              (and (get-in world [:vtd004/evidence :conservation
                                                  :terminalTaskIdentitiesConserved])
                                   (= 1 (get-in world [:vtd004/evidence :conservation :packageCheckCount])))
                              "Terminal planning lost or repeated Event Library evidence." {}))}
   {:pattern #"^browser batching, task order, worker limits, terminal shards, template behavior, stored revisions, payloads, destinations, review rows, accessibility, and operator results are unchanged$"
    :handler (fn [world _ _]
               (assert-event! world
                              (get-in world [:vtd004/evidence :conservation
                                             :terminalTaskIdentitiesConserved])
                              "Event Library topology or behavior changed." {}))}
   {:pattern #"^the calibrated representative path src/data-layer-event-library-deletion.ts previously selected seven packs with critical-path baseline 73.9 seconds and limit 89 seconds$"
    :handler (fn [world _ _]
               (let [prepared (calibration-world world dependencies)
                     previous (get-in prepared [:vtd004/evidence :calibration :previous])]
                 (assert-event! prepared
                                (= ["src/data-layer-event-library-deletion.ts"
                                    seven-pack-dependant-closure 73.9 89]
                                   [(:representativeChangedPath previous)
                                    (:selectedPacks previous)
                                    (get-in previous [:changedPathDuration :baseline])
                                    (get-in previous [:changedPathDuration :limit])])
                                "Previous Event Library calibration is not the accepted baseline."
                                {:previous previous})))}
   {:pattern #"^src/data-layer-push-draft-review-ui.ts becomes the calibrated non-propagating representative from the accepted VTD-003 receipt scope$"
    :handler (fn [world _ _]
               (assert-event! world (get-in world [:vtd004/evidence :calibration :provenanceConserved])
                              "Event Library calibration provenance changed." {}))}
   {:pattern #"^it selects only event-library with dependant fan-out 0$"
    :handler (fn [world _ _]
               (assert-event! world
                              (= [["event-library"] 0]
                                 [(get-in world [:vtd004/calibration-pack :selectedPacks])
                                  (get-in world [:vtd004/calibration-pack :changedPathFanOut :limit])])
                              "Event Library calibration retained dependant fan-out." {}))}
   {:pattern #"^its critical-path baseline is 11.6 seconds with tolerance 1.2 and limit 14 seconds$"
    :handler (fn [world _ _]
               (assert-event! world
                              (= [11.6 1.2 14]
                                 ((juxt :baseline :tolerance :limit)
                                  (get-in world [:vtd004/calibration-pack :changedPathDuration])))
                              "Event Library changed-path duration is not exact." {}))}
   {:pattern #"^the other 19 pack calibrations, the Event Library exact-pack calibration, and all 81 browser-target budgets are unchanged$"
    :handler (fn [world _ _]
               (let [evidence (get-in world [:vtd004/evidence :calibration])]
                 (assert-event! world
                                (and (:otherPackRowsConserved evidence)
                                     (:browserTargetRowsConserved evidence)
                                     (:exactPackCalibrationConserved evidence)
                                     (= 19 (:otherPackCount evidence))
                                     (= 81 (:browserTargetCount evidence)))
                                "Conserved calibration rows changed." {})))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-07T10:01:40.125989765+02:00", :module-hash "1344803156", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-83228735"} {:id "def/eight-pack-capture-closure", :kind "def", :line 6, :end-line 8, :hash "406707630"} {:id "def/seven-pack-dependant-closure", :kind "def", :line 10, :end-line 12, :hash "-1317336705"} {:id "def/handler-consumer-conditions", :kind "def", :line 14, :end-line 20, :hash "1697516706"} {:id "def/historical-changes", :kind "def", :line 22, :end-line 27, :hash "639407252"} {:id "def/historical-registry-states", :kind "def", :line 29, :end-line 30, :hash "-965054600"} {:id "defn-/event-world", :kind "defn-", :line 32, :end-line 33, :hash "-242776053"} {:id "defn-/assert-event!", :kind "defn-", :line 35, :end-line 37, :hash "-1013980911"} {:id "defn-/presentation-world", :kind "defn-", :line 39, :end-line 51, :hash "373451540"} {:id "defn-/handler-world", :kind "defn-", :line 53, :end-line 65, :hash "527272816"} {:id "defn-/conservation-world", :kind "defn-", :line 67, :end-line 81, :hash "-2131605105"} {:id "defn-/calibration-world", :kind "defn-", :line 83, :end-line 102, :hash "-1460220513"} {:id "defn/handlers", :kind "defn", :line 104, :end-line 277, :hash "-1909331037"}]}
;; clj-mutate-manifest-end
