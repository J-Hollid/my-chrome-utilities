(ns acceptance.verification-support.modular-architecture-schemas-handlers
  (:require [acceptance.verification-support.modular-architecture-project-management :as project]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def ^:private six-pack-closure
  ["schemas" "defects" "live_flow_testing" "project_assurance_severity"
   "guided_test_cases" "shell"])

(def ^:private presentation-targets
  {"src/data-layer-allowed-value-expansion-ui.ts" "ALLOWED_VALUE_EXPANSION_BROWSER_ADAPTER"
   "src/data-layer-guided-schema-picker-ui.ts" "GUIDED_VALIDATION_BROWSER_ADAPTER"
   "src/data-layer-live-schema-property-declaration-ui.ts" "LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER"
   "src/data-layer-local-rule-promotion-ui.ts" "LOCAL_RULE_PROMOTION_BROWSER_ADAPTER"
   "src/data-layer-schema-assignment-data-conditions-ui.ts" "SCHEMA_ASSIGNMENT_DATA_CONDITIONS_BROWSER_ADAPTER"
   "src/data-layer-schema-property-copy-ui.ts" "SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER"
   "src/data-layer-schema-property-type-editing-ui.ts" "SCHEMA_PROPERTY_TYPE_EDITING_BROWSER_ADAPTER"
   "src/data-layer-schema-specification-builder-ui.ts" "SCHEMA_SPECIFICATION_BUILDER_BROWSER_ADAPTER"})

(defn- schemas-world [world dependencies]
  (project/vtd004-world (assoc world :vtd004/owner "schemas") dependencies))

(defn- assert-schemas! [world predicate message details]
  (support/assert! predicate message details)
  world)

(defn- scope-label [pack-ids]
  (cond
    (= ["schemas"] pack-ids) "schemas only"
    (= six-pack-closure pack-ids) "six-pack dependant closure"
    :else "every runnable pack"))

(defn- handler-path [name]
  (str "acceptance/src/acceptance/steps/" name))

(defn- boundary-handlers [example-values dependencies]
  [{:pattern #"^the current Schemas dependant closure is schemas, defects, live_flow_testing, project_assurance_severity, guided_test_cases, shell$"
    :handler (fn [world _ _]
               (let [prepared (schemas-world world dependencies)]
                 (assert-schemas! (assoc prepared :vtd004/schemas-closure six-pack-closure)
                                  (= six-pack-closure
                                     (get-in prepared [:vtd004/evidence :calibration :previous
                                                       :selectedPacks]))
                                  "Schemas' prior dependant closure changed." {})))}
   {:pattern #"^Schemas changed path (.+) is classified$"
    :handler (fn [world example captures]
               (let [path (first (example-values example captures))
                     prepared (project/boundary-world (assoc world :vtd004/owner "schemas")
                                                      path dependencies)
                     plan (get-in prepared [:vtd004/evidence :currentPlans (keyword path)])]
                 (assoc prepared :vtd004/selected-scope (scope-label plan))))}
   {:pattern #"^its exact boundary is (.+)$"
    :applies? #(= "schemas" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-schemas! world (= expected (get-in world [:vtd004/boundary :id]))
                                  "Schemas path belongs to the wrong boundary."
                                  {:expected expected :actual (:vtd004/boundary world)})))}
   {:pattern #"^its source class is (.+)$"
    :applies? #(= "schemas" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-schemas! world (= expected (get-in world [:vtd004/boundary :sourceClass]))
                                  "Schemas path has the wrong source class."
                                  {:expected expected :actual (:vtd004/boundary world)})))}
   {:pattern #"^its selected scope is (.+)$"
    :applies? #(= "schemas" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-schemas! world (= expected (:vtd004/selected-scope world))
                                  "Schemas path selected the wrong scope."
                                  {:expected expected :actual (:vtd004/selected-scope world)})))}
   {:pattern #"^every one of the 90 Schemas-owned source files matches exactly one boundary$"
    :handler (fn [world _ _]
               (let [paths (mapcat :prefixes (get-in world [:vtd004/pack :impactBoundaries]))]
                 (assert-schemas! world (and (= 90 (count paths)) (= 90 (count (set paths))))
                                  "Schemas impact boundaries do not partition 90 files." {})))}])

(defn- presentation-handlers [example-values dependencies]
  [{:pattern #"^Schemas local presentation (.+) draws supplied values and returns choices through supplied callbacks$"
    :handler (fn [world example captures]
               (let [path (first (example-values example captures))
                     prepared (schemas-world world dependencies)]
                 (assert-schemas! (assoc prepared :vtd004/presentation-path path)
                                  (= ["schemas"]
                                     (get-in prepared [:vtd004/evidence :currentPlans (keyword path)]))
                                  "Schemas presentation path is not owner-only." {:path path})))}
   {:pattern #"^its owner-only route is installed$"
    :applies? #(= "schemas" (:vtd004/owner %))
    :handler (fn [world _ _]
               (let [local (filter #(= "schemas_local_browser_presentation" (:id %))
                                   (get-in world [:vtd004/pack :impactBoundaries]))]
                 (assert-schemas! world (= (set (keys presentation-targets))
                                           (set (mapcat :prefixes local)))
                                  "Schemas owner-only presentation boundary is incomplete." {})))}
   {:pattern #"^it cannot read or write storage, publish or validate schemas, mutate projects, derive a second schema model, choose page access, or perform Capture or Defects operations$"
    :handler (fn [world _ _]
               (let [evidence (get-in world [:vtd004/evidence :presentationBoundary])]
                 (assert-schemas! world (every? true? (vals evidence))
                                  "Schemas presentation crossed a semantic or effect boundary." {})))}
   {:pattern #"^existing browser target (.+) directly proves (.+)$"
    :handler (fn [world example captures]
               (let [[target _proof] (example-values example captures)
                     path (:vtd004/presentation-path world)]
                 (assert-schemas! world (= target (get presentation-targets path))
                                  "Schemas presentation uses the wrong installed target."
                                  {:path path :expected target :actual (get presentation-targets path)})))}
   {:pattern #"^the assertion remains in the existing 46-target Schemas batch without another browser process or plan task$"
    :handler (fn [world _ _]
               (assert-schemas! world
                                (= [1 46 288]
                                   ((juxt :adapterCount :targetCount :exactTaskCount)
                                    (get-in world [:vtd004/evidence :conservation])))
                                "Schemas browser batching or plan count changed." {}))}])

(defn- handler-evidence-world [world name dependencies]
  (let [prepared (schemas-world world dependencies)
        path (handler-path name)
        evidence (first (filter #(= path (:path %))
                                (get-in prepared [:vtd004/evidence :handlers])))
        isolated? (some? evidence)]
    (assoc prepared :vtd004/schemas-handler path
           :vtd004/isolation-decision (if isolated? "isolated" "retain propagation")
           :vtd004/selected-scope (if isolated? "schemas only" "six-pack dependant closure"))))

(defn- diagnostic-key [condition]
  (cond
    (str/starts-with? condition "a pattern") :schemasLoadedStepDiagnostic
    (str/starts-with? condition "a namespace") :schemasNamespaceDiagnostic
    (str/starts-with? condition "missing or foreign") :missingMetadataDiagnostic
    :else :unreadableAuditDiagnostic))

(defn- isolation-handlers [example-values dependencies]
  [{:pattern #"^Schemas handler (.+) has (.+)$"
    :handler (fn [world example captures]
               (let [[name _consumer-evidence] (example-values example captures)]
                 (handler-evidence-world world name dependencies)))}
   {:pattern #"^handler isolation is validated from served-feature metadata, parsed loaded steps, and namespace consumers$"
    :handler (fn [world _ _]
               (assert-schemas! world
                                (get-in world [:vtd004/evidence :isolationAudit :metadataCannotConceal])
                                "Schemas handler isolation audit is absent." {}))}
   {:pattern #"^its isolation decision is (.+)$"
    :applies? #(= "schemas" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-schemas! world (= expected (:vtd004/isolation-decision world))
                                  "Schemas handler isolation decision is wrong."
                                  {:handler (:vtd004/schemas-handler world) :expected expected})))}
   {:pattern #"^its changed-path scope is (.+)$"
    :applies? #(= "schemas" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-schemas! world (= expected (:vtd004/selected-scope world))
                                  "Schemas handler plan has the wrong scope."
                                  {:handler (:vtd004/schemas-handler world) :expected expected})))}
   {:pattern #"^an isolated Schemas handler gains (.+)$"
    :handler (fn [world example captures]
               (assoc (schemas-world world dependencies)
                      :vtd004/isolation-condition (first (example-values example captures))))}
   {:pattern #"^the generic isolation audit includes Schemas and inspects real loaded sessions$"
    :handler (fn [world _ _]
               (assert-schemas! world
                                (get-in world [:vtd004/evidence :isolationAudit :metadataCannotConceal])
                                "Schemas loaded-session isolation audit was not exercised." {}))}
   {:pattern #"^isolation is rejected with an actionable diagnostic$"
    :applies? #(= "schemas" (:vtd004/owner %))
    :handler (fn [world _ _]
               (let [diagnostic (get-in world [:vtd004/evidence :isolationAudit
                                               (diagnostic-key (:vtd004/isolation-condition world))])]
                 (assert-schemas! world (and (string? diagnostic) (not (str/blank? diagnostic)))
                                  "Schemas isolation rejection is not actionable."
                                  {:condition (:vtd004/isolation-condition world)})))}
   {:pattern #"^the handler retains the six-pack dependant closure$"
    :handler (fn [world _ _]
               (assert-schemas! world
                                (= six-pack-closure
                                   (get-in world [:vtd004/evidence :isolationAudit
                                                  :rejectedSchemasHandlerPlan]))
                                "Rejected Schemas isolation did not restore propagation." {}))}])

(def ^:private historical-plan-routes
  [[#(str/starts-with? % "delete src/data-layer-guided-schema-picker-ui.ts")
    [:vtd004/evidence :historyPlans :delete]]
   [#(str/includes? % "to src/data-layer-schema-property-copy-ui.ts")
    [:vtd004/evidence :historyPlans :renamePresentation]]
   [#(str/includes? % "to src/data-layer-guided-validation-ui.ts")
    [:vtd004/evidence :historyPlans :renameSharedWorkflow]]
   [#(str/starts-with? % "delete src/utilities/data-layer/schemas.ts")
    [:vtd004/evidence :currentPlans (keyword "src/utilities/data-layer/schemas.ts")]]])

(defn- historical-plan [prepared change]
  (when-let [[_ path] (first (filter #((first %) change) historical-plan-routes))]
    (get-in prepared path)))

(defn- change-plan [prepared change]
  (if (str/starts-with? change "modify ")
    (get-in prepared [:vtd004/evidence :currentPlans
                      (keyword (subs change (count "modify ")))])
    (or (historical-plan prepared change)
        (get-in prepared [:vtd004/evidence :historyPlans :unreadable]))))

(defn- history-handlers [example-values dependencies]
  [{:pattern #"^Schemas change is (.+)$"
    :handler (fn [world example captures]
               (assoc (schemas-world world dependencies)
                      :vtd004/change (first (example-values example captures))))}
   {:pattern #"^current and historical impact boundaries are compared$"
    :handler (fn [world _ _]
               (let [plan (change-plan world (:vtd004/change world))]
                 (assert-schemas! (assoc world :vtd004/selected-scope (scope-label plan))
                                  (seq plan) "Schemas historical plan is missing."
                                  {:change (:vtd004/change world)})))}
   {:pattern #"^planning selects (.+)$"
    :applies? #(= "schemas" (:vtd004/owner %))
    :handler (fn [world example captures]
               (let [expected (first (example-values example captures))]
                 (assert-schemas! world (= expected (:vtd004/selected-scope world))
                                  "Schemas historical planning selected the wrong scope."
                                  {:expected expected :actual (:vtd004/selected-scope world)})))}
   {:pattern #"^the changed path cannot disappear because its current file is absent$"
    :handler (fn [world _ _]
               (assert-schemas! world (some? (:vtd004/selected-scope world))
                                "Schemas deletion or rename disappeared from planning." {}))}])

(defn- conservation-handlers [dependencies]
  [{:pattern #"^every Schemas boundary maps to the complete owner evidence profile$"
    :handler (fn [world _ _]
               (let [prepared (schemas-world world dependencies)
                     evidence (get-in prepared [:vtd004/evidence :conservation])]
                 (assert-schemas! (assoc prepared :vtd004/conserved? true)
                                  (and (= [49 29 103 60 1 46 288]
                                          ((juxt :unitCount :propertyCount :featureCount :handlerCount
                                                 :adapterCount :targetCount :exactTaskCount) evidence))
                                       (= {:unit 52 :property 29 :checkpoints 1 :exact 292}
                                          (:executionTaskCounts evidence)))
                                  "Schemas owner evidence profile changed." {:evidence evidence})))}
   {:pattern #"^exact schemas verification and terminal-full planning are compared before and after VTD-004$"
    :handler (fn [world _ _]
               (assert-schemas! world (:vtd004/conserved? world)
                                "Schemas exact/terminal comparison did not complete." {}))}
   {:pattern #"^all 49 unit files, 29 property files, 103 feature files, 60 handlers, one shared browser adapter, and 46 registered browser targets execute once in the 288-task exact owner plan$"
    :handler (fn [world _ _]
               (assert-schemas! world (= 288 (get-in world [:vtd004/evidence :conservation
                                                            :exactTaskCount]))
                                "Schemas exact plan is not 288 tasks." {}))}
   {:pattern #"^the eight local presentation files retain direct installed-browser proof without another browser process or plan task$"
    :handler (fn [world _ _]
               (assert-schemas! world
                                (= (set (keys presentation-targets))
                                   (set (get-in world [:vtd004/evidence :conservation
                                                       :directPresentationPaths])))
                                "Schemas direct presentation proof is incomplete." {}))}
   {:pattern #"^terminal-full planning executes every conserved assertion leaf and package check exactly once$"
    :handler (fn [world _ _]
               (let [evidence (get-in world [:vtd004/evidence :conservation])]
                 (assert-schemas! world
                                  (and (:terminalTaskIdentitiesConserved evidence)
                                       (= 1 (:packageCheckCount evidence)))
                                  "Schemas terminal evidence is not conserved." {})))}
   {:pattern #"^browser batching, task order, worker limits, terminal shards, schema meaning, saved bytes, visible output, accessibility, and operator results are unchanged$"
    :handler (fn [world _ _]
               (assert-schemas! world
                                (get-in world [:vtd004/evidence :conservation
                                               :terminalTaskIdentitiesConserved])
                                "Schemas topology or behavior changed." {}))}])

(defn- calibration-handlers [dependencies]
  [{:pattern #"^src/data-layer-allowed-value-expansion-ui.ts currently selects six packs with dependant fan-out 5, critical-path baseline 185.4 seconds, and limit 223 seconds$"
    :handler (fn [world _ _]
               (let [prepared (schemas-world world dependencies)
                     previous (get-in prepared [:vtd004/evidence :calibration :previous])]
                 (assert-schemas! (assoc prepared :vtd004/calibration-pack
                                         (get-in prepared [:vtd004/evidence :calibration :current]))
                                  (= [six-pack-closure 5 185.4 223]
                                     [(:selectedPacks previous)
                                      (get-in previous [:changedPathFanOut :limit])
                                      (get-in previous [:changedPathDuration :baseline])
                                      (get-in previous [:changedPathDuration :limit])])
                                  "Schemas' prior calibration is not exact." {:previous previous})))}
   {:pattern #"^its proven local-presentation boundary remains the Schemas representative from the accepted VTD-003 receipt scope$"
    :handler (fn [world _ _]
               (assert-schemas! world
                                (get-in world [:vtd004/evidence :calibration :provenanceConserved])
                                "Schemas calibration provenance changed." {}))}
   {:pattern #"^it selects only schemas with dependant fan-out 0$"
    :handler (fn [world _ _]
               (let [current (:vtd004/calibration-pack world)]
                 (assert-schemas! world (= [["schemas"] 0]
                                           [(:selectedPacks current)
                                            (get-in current [:changedPathFanOut :limit])])
                                  "Schemas representative retained dependant fan-out." {})))}
   {:pattern #"^its critical-path baseline is 149.6 seconds with tolerance 1.2 and limit 180 seconds$"
    :handler (fn [world _ _]
               (assert-schemas! world
                                (= [149.6 1.2 180]
                                   ((juxt :baseline :tolerance :limit)
                                    (get-in world [:vtd004/calibration-pack :changedPathDuration])))
                                "Schemas changed-path duration is not exact." {}))}
   {:pattern #"^the other 19 pack calibrations, the Schemas exact-pack calibration, and all 81 browser-target budgets are unchanged$"
    :handler (fn [world _ _]
               (let [evidence (get-in world [:vtd004/evidence :calibration])]
                 (assert-schemas! world
                                  (and (:otherPackRowsConserved evidence)
                                       (:browserTargetRowsConserved evidence)
                                       (:exactPackCalibrationConserved evidence)
                                       (:provenanceConserved evidence)
                                       (= 19 (:otherPackCount evidence))
                                       (= 81 (:browserTargetCount evidence)))
                                  "Schemas calibration changed conserved rows." {})))}])

(defn handlers [{:keys [example-values] :as dependencies}]
  (vec (concat (boundary-handlers example-values dependencies)
               (presentation-handlers example-values dependencies)
               (isolation-handlers example-values dependencies)
               (history-handlers example-values dependencies)
               (conservation-handlers dependencies)
               (calibration-handlers dependencies))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-27T18:19:57.559162532+02:00", :module-hash "2058497829", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "1270663413"} {:id "def/six-pack-closure", :kind "def", :line 6, :end-line 8, :hash "577726950"} {:id "def/presentation-targets", :kind "def", :line 10, :end-line 18, :hash "1571923441"} {:id "defn-/schemas-world", :kind "defn-", :line 20, :end-line 21, :hash "-74787263"} {:id "defn-/assert-schemas!", :kind "defn-", :line 23, :end-line 25, :hash "-1911083200"} {:id "defn-/scope-label", :kind "defn-", :line 27, :end-line 31, :hash "449196068"} {:id "defn-/handler-path", :kind "defn-", :line 33, :end-line 34, :hash "-993126326"} {:id "defn-/boundary-handlers", :kind "defn-", :line 36, :end-line 77, :hash "-603569438"} {:id "defn-/presentation-handlers", :kind "defn-", :line 79, :end-line 114, :hash "-536950814"} {:id "defn-/handler-evidence-world", :kind "defn-", :line 116, :end-line 124, :hash "238440575"} {:id "defn-/diagnostic-key", :kind "defn-", :line 126, :end-line 131, :hash "-580455142"} {:id "defn-/isolation-handlers", :kind "defn-", :line 133, :end-line 180, :hash "459146745"} {:id "def/historical-plan-routes", :kind "def", :line 182, :end-line 190, :hash "-2124123582"} {:id "defn-/historical-plan", :kind "defn-", :line 192, :end-line 194, :hash "2100746281"} {:id "defn-/change-plan", :kind "defn-", :line 196, :end-line 201, :hash "630854990"} {:id "defn-/history-handlers", :kind "defn-", :line 203, :end-line 224, :hash "-455752583"} {:id "defn-/conservation-handlers", :kind "defn-", :line 226, :end-line 266, :hash "-246150219"} {:id "defn-/calibration-handlers", :kind "defn-", :line 268, :end-line 310, :hash "1688395313"} {:id "defn/handlers", :kind "defn", :line 312, :end-line 318, :hash "-1944765285"}]}
;; clj-mutate-manifest-end
