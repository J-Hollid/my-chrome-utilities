(ns acceptance.verification-support.modular-architecture-project-management
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def ^:private owner-evidence-keys
  {"capture" :vtd004/capture-evidence
   "durable_project_repository" :vtd004/durable-evidence
   "event-library" :vtd004/event-evidence})

(defn- owner-evidence [inspected owner]
  (get inspected (get owner-evidence-keys owner :vtd004/project-evidence)))

(defn vtd004-world [world {:keys [verify-throughput! performance-calibration]}]
  (let [inspected (verify-throughput! world)
        owner (or (:vtd004/owner world) "project_management")
        pack (first (filter #(= owner (:id %)) (:modular/registry inspected)))
        evidence (owner-evidence inspected owner)]
    (assoc inspected :vtd004/owner owner :vtd004/pack pack :vtd004/evidence evidence
           :vtd004/calibration (performance-calibration))))

(defn boundary-world [world source-path dependencies]
  (let [prepared (vtd004-world world dependencies)
        boundary (first (filter #(some #{source-path} (:prefixes %))
                                (get-in prepared [:vtd004/pack :impactBoundaries])))]
    (support/assert! boundary "Project-management path has no exact impact boundary."
                     {:source-path source-path})
    (assoc prepared :vtd004/boundary boundary :vtd004/path source-path)))

(defn change-world [world changed-path dependencies]
  (let [prepared (boundary-world world changed-path dependencies)
        selected (get-in prepared [:vtd004/evidence :currentPlans (keyword changed-path)])]
    (support/assert! (seq selected) "Production planner returned no project impact scope."
                     {:changed-path changed-path})
    (assoc prepared :vtd004/selected-packs selected)))

(defn human-pack-list [packs]
  (if (= 1 (count packs))
    (first packs)
    (str (str/join ", " (butlast packs)) ", and " (last packs))))

(defn handler-world [world dependencies]
  (let [prepared (vtd004-world world dependencies)
        pack (:vtd004/pack prepared)
        handler (get-in prepared [:vtd004/evidence :handler])]
    (support/assert! (and (= (:features pack) (:servedFeatures handler))
                          (= (:isolatedVerificationHandlers pack) [(:path handler)])
                          (empty? (:consumers handler))
                          (:negativeMutationRejected handler)
                          (= [(:id pack)] (:ownerPlan handler)))
                     "APS owner handler still has a cross-pack consumer."
                     {:features (:features pack) :handler handler})
    (assoc prepared :vtd004/handler-isolated? true)))

(defn- project-history-plan-key [change historical-registry]
  (cond
    (not= historical-registry "readable and compatible") :unreadable
    (str/includes? change "to src/data-layer-project-library.ts") :renamePersistence
    (str/includes? change " to ") :renamePresentation
    :else :delete))

(defn- durable-history-plan-key [change historical-registry]
  (cond
    (not= historical-registry "readable and compatible") :unreadable
    (str/includes? change " to ") :renameController
    :else :delete))

(def ^:private event-history-renames
  [["event-library-editor-ui.ts" :renameEditorUi]
   ["event-library-editor.ts" :renameEditorModel]
   ["push-draft-review.ts" :renameSemantic]
   [" to " :renamePresentation]])

(defn- event-history-rename-key [change]
  (some (fn [[fragment plan-key]]
          (when (str/includes? change fragment) plan-key))
        event-history-renames))

(defn- event-history-plan-key [change historical-registry]
  (if (= historical-registry "readable and compatible")
    (or (event-history-rename-key change) :delete)
    :unreadable))

(defn- history-plan-key [owner change historical-registry]
  ((case owner
     "event-library" event-history-plan-key
     "durable_project_repository" durable-history-plan-key
     project-history-plan-key)
   change historical-registry))

(def ^:private event-history-scopes
  {1 "event-library only"
   7 "the seven-pack dependant closure"
   8 "the eight-pack Capture closure"
   20 "every runnable pack"})

(defn- event-history-scope [_owner selected]
  (get event-history-scopes (count selected) "the ten-pack dependant closure"))

(defn- shared-history-scope [owner selected]
  (cond
    (= 1 (count selected)) (first selected)
    (= 20 (count selected)) "every runnable pack"
    (= owner "durable_project_repository") "the six-pack dependant closure"
    :else "the ten-pack dependant closure"))

(defn- history-scope [owner selected]
  ((if (= owner "event-library") event-history-scope shared-history-scope)
   owner selected))

(defn history-world [world change historical-registry dependencies]
  (let [prepared (vtd004-world world dependencies)
        owner (:vtd004/owner prepared)
        selected (get-in prepared [:vtd004/evidence :historyPlans
                                   (history-plan-key owner change historical-registry)])]
    (support/assert! (seq selected) "Production historical planner returned no scope."
                     {:change change :historical-registry historical-registry})
    (assoc prepared :vtd004/historical-scope (history-scope owner selected))))

(defn conservation-world [world dependencies]
  (let [prepared (vtd004-world world dependencies)
        pack (:vtd004/pack prepared)
        conservation (get-in prepared [:vtd004/evidence :conservation])
        profile (:evidenceProfile conservation)]
    (support/assert! (and (= (select-keys pack [:unit :property :features :handlers :browserAdapters])
                              profile)
                          (= (:unit profile) (get-in conservation [:exactTaskTargets :unitTasks]))
                          (= (:property profile) (get-in conservation [:exactTaskTargets :propertyTasks]))
                          (= (set (:features profile))
                             (set (get-in conservation [:exactTaskTargets :parserTasks])))
                          (= (:browserAdapters profile)
                             (get-in conservation [:exactTaskTargets :browserTasks]))
                          (= ["project_management"] (:handlerSessions conservation))
                          (:terminalTaskIdentitiesConserved conservation)
                          (= 1 (:packageCheckCount conservation)))
                     "Project evidence identities or terminal leaves are not conserved."
                     {:pack pack :conservation conservation})
    (assoc prepared :vtd004/conserved? true)))

(defn calibration-world [world dependencies]
  (let [prepared (vtd004-world world dependencies)
        evidence (get-in prepared [:vtd004/evidence :calibration])
        pack (:current evidence)]
    (support/assert! (and (= ["project_management"] (:selectedPacks pack))
                          (= 0 (get-in pack [:changedPathFanOut :limit]))
                          (= 37.1 (get-in pack [:changedPathDuration :baseline]))
                          (= 45 (get-in pack [:changedPathDuration :limit]))
                          (= 1.2 (get-in pack [:changedPathDuration :tolerance]))
                          (:otherPackRowsConserved evidence)
                          (:browserTargetRowsConserved evidence)
                          (:provenanceConserved evidence)
                          (= 19 (:otherPackCount evidence))
                          (= 81 (:browserTargetCount evidence)))
                     "Project presentation calibration is not exact." {:pack pack})
    (assoc prepared :vtd004/calibration-pack pack)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-07T14:01:22.00541141+02:00", :module-hash "889307066", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1433682608"} {:id "def/owner-evidence-keys", :kind "def", :line 5, :end-line 8, :hash "-853298982"} {:id "defn-/owner-evidence", :kind "defn-", :line 10, :end-line 11, :hash "635695774"} {:id "defn/vtd004-world", :kind "defn", :line 13, :end-line 19, :hash "-1527512241"} {:id "defn/boundary-world", :kind "defn", :line 21, :end-line 27, :hash "1341774244"} {:id "defn/change-world", :kind "defn", :line 29, :end-line 34, :hash "-1576629533"} {:id "defn/human-pack-list", :kind "defn", :line 36, :end-line 39, :hash "-918827022"} {:id "defn/handler-world", :kind "defn", :line 41, :end-line 52, :hash "-1854915647"} {:id "defn-/project-history-plan-key", :kind "defn-", :line 54, :end-line 59, :hash "978955326"} {:id "defn-/durable-history-plan-key", :kind "defn-", :line 61, :end-line 65, :hash "1164008891"} {:id "def/event-history-renames", :kind "def", :line 67, :end-line 71, :hash "-2080932088"} {:id "defn-/event-history-rename-key", :kind "defn-", :line 73, :end-line 76, :hash "1066251871"} {:id "defn-/event-history-plan-key", :kind "defn-", :line 78, :end-line 81, :hash "1132938760"} {:id "defn-/history-plan-key", :kind "defn-", :line 83, :end-line 88, :hash "-796105228"} {:id "def/event-history-scopes", :kind "def", :line 90, :end-line 94, :hash "2079201826"} {:id "defn-/event-history-scope", :kind "defn-", :line 96, :end-line 97, :hash "-2082482000"} {:id "defn-/shared-history-scope", :kind "defn-", :line 99, :end-line 104, :hash "1830708106"} {:id "defn-/history-scope", :kind "defn-", :line 106, :end-line 108, :hash "-1554174545"} {:id "defn/history-world", :kind "defn", :line 110, :end-line 117, :hash "-1336914715"} {:id "defn/conservation-world", :kind "defn", :line 119, :end-line 137, :hash "2025288657"} {:id "defn/calibration-world", :kind "defn", :line 139, :end-line 154, :hash "-1870049910"}]}
;; clj-mutate-manifest-end
