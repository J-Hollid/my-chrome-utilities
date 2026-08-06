(ns acceptance.verification-support.modular-architecture-project-management
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn vtd004-world [world {:keys [verify-throughput! performance-calibration]}]
  (let [inspected (verify-throughput! world)
        pack (first (filter #(= "project_management" (:id %))
                            (:modular/registry inspected)))]
    (assoc inspected :vtd004/pack pack :vtd004/calibration (performance-calibration))))

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
                          (= ["project_management"] (:ownerPlan handler)))
                     "APS project handler still has a cross-pack consumer."
                     {:features (:features pack) :handler handler})
    (assoc prepared :vtd004/handler-isolated? true)))

(defn- history-plan-key [change historical-registry]
  (cond
    (not= historical-registry "readable and compatible") :unreadable
    (str/includes? change "to src/data-layer-project-library.ts") :renamePersistence
    (str/includes? change " to ") :renamePresentation
    :else :delete))

(defn- history-scope [selected]
  (cond
    (= 1 (count selected)) (first selected)
    (= 20 (count selected)) "every runnable pack"
    :else "the ten-pack dependant closure"))

(defn history-world [world change historical-registry dependencies]
  (let [prepared (vtd004-world world dependencies)
        selected (get-in prepared [:vtd004/evidence :historyPlans
                                   (history-plan-key change historical-registry)])]
    (support/assert! (seq selected) "Production historical planner returned no scope."
                     {:change change :historical-registry historical-registry})
    (assoc prepared :vtd004/historical-scope (history-scope selected))))

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
