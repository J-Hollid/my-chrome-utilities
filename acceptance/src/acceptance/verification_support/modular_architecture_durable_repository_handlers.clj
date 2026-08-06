(ns acceptance.verification-support.modular-architecture-durable-repository-handlers
  (:require [acceptance.verification-support.modular-architecture-project-management :as project]
            [acceptance.steps.support :as support]))

(defn- durable-world [world dependencies]
  (project/vtd004-world (assoc world :vtd004/owner "durable_project_repository") dependencies))

(defn- assert-presentation! [world message]
  (support/assert! (get-in world [:vtd004/evidence :presentationBoundary]) message {})
  world)

(defn handlers [{:keys [example-values] :as dependencies}]
  [{:pattern #"^durable_project_repository owns source path (.+)$"
    :handler (fn [world example captures]
               (project/boundary-world (assoc world :vtd004/owner "durable_project_repository")
                                       (first (example-values example captures)) dependencies))}
   {:pattern #"^src/data-layer-durable-project-repository-ui.ts coordinates repository access and storage-changing recovery effects$"
    :handler (fn [world _ _] (assert-presentation! (durable-world world dependencies)
                                                   "Durable controller/presentation extraction is absent."))}
   {:pattern #"^its display-only recovery and diagnostics rendering is extracted$"
    :handler (fn [world _ _] (assert-presentation! world "Durable display extraction was not verified."))}
   {:pattern #"^src/data-layer-durable-project-repository-presentation-ui.ts accepts only supplied display values, DOM hosts, and owner callbacks$"
    :handler (fn [world _ _] (assert-presentation! world "Presentation input boundary was not verified."))}
   {:pattern #"^it cannot access IndexedDB, Web Storage, navigator.storage, repository methods, recovery serialization, retry, reject, or backup deletion semantics$"
    :handler (fn [world _ _] (assert-presentation! world "Presentation isolation was not verified."))}
   {:pattern #"^the controller remains the sole owner of repository access and storage-changing effects$"
    :handler (fn [world _ _] (assert-presentation! world "Controller effect ownership was not verified."))}
   {:pattern #"^existing DOM identities, accessible names, visible text, control states, dialog focus, return focus, callbacks, and 360-pixel behavior are unchanged$"
    :handler (fn [world _ _] (assert-presentation! world "Installed durable UI conservation was not verified."))}
   {:pattern #"^changed durable-repository path is (.+)$"
    :handler (fn [world example captures]
               (project/change-world (assoc world :vtd004/owner "durable_project_repository")
                                     (first (example-values example captures)) dependencies))}
   {:pattern #"^acceptance/src/acceptance/steps/durable_project_repository.clj owns two durable-repository feature files$"
    :handler (fn [world _ _]
               (project/handler-world (assoc world :vtd004/owner "durable_project_repository") dependencies))}
   {:pattern #"^every served feature and step consumer belongs to durable_project_repository$"
    :handler (fn [world _ _]
               (support/assert! (:vtd004/handler-isolated? world)
                                "Durable handler consumer audit failed." {})
               world)}
   {:pattern #"^a handler-only change selects the complete durable_project_repository evidence without dependant packs$"
    :handler (fn [world _ _]
               (support/assert! (= ["durable_project_repository"]
                                   (get-in world [:vtd004/evidence :handler :ownerPlan]))
                                "Durable handler-only planning escaped its owner." {})
               world)}
   {:pattern #"^durable-repository change is (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd004/owner "durable_project_repository"
                      :vtd004/change (first (example-values example captures))))}
   {:pattern #"^every durable-repository boundary maps to the complete owner evidence profile$"
    :handler (fn [world _ _]
               (let [prepared (durable-world world dependencies)
                     counts (get-in prepared [:vtd004/evidence :conservation :exactTaskCounts])]
                 (support/assert! (= {:unit 5 :property 3 :features 2 :handlers 1
                                     :adapters 2 :targets 4 :leaves 111} counts)
                                  "Durable exact evidence profile is not conserved." {})
                 (assoc prepared :vtd004/conserved? true)))}
   {:pattern #"^exact durable_project_repository verification and terminal-full planning are compared before and after VTD-004$"
    :handler (fn [world _ _]
               (support/assert! (:vtd004/conserved? world)
                                "Durable exact/terminal comparison did not complete." {})
               world)}
   {:pattern #"^all five unit files, three property files, two features, one handler, two installed browser adapters, four browser targets, and 111 browser assertion leaves execute once in the exact owner plan$"
    :handler (fn [world _ _]
               (support/assert! (:vtd004/conserved? world)
                                "Durable exact evidence was not conserved." {})
               world)}
   {:pattern #"^browser batching, task order, worker limits, terminal shards, product behavior, durable bytes, migration, publication, Undo, recovery choices, accessibility, and focus are unchanged$"
    :handler (fn [world _ _]
               (support/assert! (get-in world [:vtd004/evidence :conservation
                                               :terminalTaskIdentitiesConserved])
                                "Durable terminal/product topology changed." {})
               world)}
   {:pattern #"^the calibrated representative path src/data-layer-durable-project-repository-ui.ts previously selected six packs with critical-path baseline 328.8 seconds and limit 395 seconds$"
    :handler (fn [world _ _]
               (let [prepared (durable-world world dependencies)
                     current (get-in prepared [:vtd004/evidence :calibration :current])]
                 (support/assert! current "Durable calibration evidence is missing." {})
                 (assoc prepared :vtd004/calibration-pack current)))}
   {:pattern #"^src/data-layer-durable-project-repository-presentation-ui.ts becomes the calibrated non-propagating representative from the accepted VTD-003 receipt scope$"
    :handler (fn [world _ _]
               (support/assert! (get-in world [:vtd004/evidence :calibration :provenanceConserved])
                                "Durable calibration provenance changed." {})
               world)}
   {:pattern #"^it selects only durable_project_repository with dependant fan-out 0$"
    :handler (fn [world _ _]
               (let [pack (:vtd004/calibration-pack world)]
                 (support/assert! (and (= ["durable_project_repository"] (:selectedPacks pack))
                                       (= 0 (get-in pack [:changedPathFanOut :limit])))
                                  "Durable representative retained dependant fan-out." {}))
               world)}
   {:pattern #"^its critical-path baseline is 90.2 seconds with tolerance 1.2 and limit 109 seconds$"
    :handler (fn [world _ _]
               (support/assert! (= [90.2 1.2 109]
                                   ((juxt :baseline :tolerance :limit)
                                    (get-in world [:vtd004/calibration-pack :changedPathDuration])))
                                "Durable representative calibration is not exact." {})
               world)}
   {:pattern #"^the other 19 pack calibrations, the durable exact-pack calibration, and all 81 browser-target budgets are unchanged$"
    :handler (fn [world _ _]
               (let [evidence (get-in world [:vtd004/evidence :calibration])]
                 (support/assert! (and (:otherPackRowsConserved evidence)
                                       (:browserTargetRowsConserved evidence)
                                       (:provenanceConserved evidence)
                                       (= 19 (:otherPackCount evidence))
                                       (= 81 (:browserTargetCount evidence)))
                                  "Durable calibration changed conserved rows." {}))
               world)}])
