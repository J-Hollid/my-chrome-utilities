(ns acceptance.verification-support.modular-architecture-project-management-handlers
  (:require [acceptance.verification-support.modular-architecture-project-management :as project]
            [acceptance.steps.support :as support]))

(def human-pack-list project/human-pack-list)

(defn- planned-browser-adapter-count [pack]
  (let [observation-paths (set (keep :path (:browserObservations pack)))
        registration-only-paths
        (set (keep (fn [{:keys [path mode]}]
                     (when (and (= "integration" mode)
                                (observation-paths path))
                       path))
                   (:browserAdapterModes pack)))]
    (count (remove registration-only-paths (:browserAdapters pack)))))

(defn- boundary-handlers [example-values verify-throughput! dependencies]
  [{:pattern #"^project_management owns source path (.+)$"
    :handler (fn [world example captures]
               (project/boundary-world (assoc world :vtd004/owner "project_management")
                                       (first (example-values example captures)) dependencies))}
   {:pattern #"^its impact boundary is inspected$"
    :handler (fn [world _ _]
               (support/assert! (map? (:vtd004/boundary world))
                                "Project impact boundary was not loaded from the registry." {})
               world)}
   {:pattern #"^its boundary is (.+)$"
    :handler (fn [world example captures]
               (support/assert! (= (first (example-values example captures))
                                   (get-in world [:vtd004/boundary :id]))
                                "Project boundary identity differs from the registry." {})
               world)}
   {:pattern #"^its source class is (.+)$"
    :handler (fn [world example captures]
               (support/assert! (= (first (example-values example captures))
                                   (get-in world [:vtd004/boundary :sourceClass]))
                                "Project source class differs from the registry." {})
               world)}
   {:pattern #"^dependant propagation is (.+)$"
    :handler (fn [world example captures]
               (let [declared (first (example-values example captures))
                     expected (= "retained" declared)]
                 (support/assert! (#{"retained" "excluded"} declared)
                                  "Dependant propagation must use the declared retained/excluded vocabulary."
                                  {:declared declared})
                 (support/assert! (= expected (get-in world [:vtd004/boundary :propagateDependants]))
                                  "Project dependant propagation differs from the registry." {}))
               world)}
   {:pattern #"^changed project-management path is (.+)$"
    :handler (fn [world example captures]
               (project/change-world world (first (example-values example captures)) dependencies))}
   {:pattern #"^impacted verification packs are selected$"
    :handler (fn [world _ _] (verify-throughput! world))}])

(defn- owner-evidence-profile [world pack]
  (if (= "project_management" (:id pack))
    (get-in world [:vtd004/evidence :conservation :preDialogExecutionProfile])
    pack))

(defn- expected-owner-counts [pack]
  (get {"durable_project_repository" [7 3 2 1 2]
        "event-library" [11 1 8 3 1]
        "project_management" [8 5 6 1 4]}
       (:id pack) [4 4 6 1 4]))

(defn- owner-evidence-handlers [example-values]
  [
   {:pattern #"^its complete owner unit, property, feature, handler, and installed browser evidence is selected$"
    :handler (fn [world _ _]
               (let [pack (:vtd004/pack world)
                     profile (owner-evidence-profile world pack)]
                 (support/assert! (= (expected-owner-counts pack)
                                     (conj (mapv #(count (% profile))
                                                 [:unit :property :features :handlers])
                                           (planned-browser-adapter-count pack)))
                                  "Owner evidence profile is incomplete." {}))
               world)}])

(defn- isolation-handlers [dependencies]
  [
   {:pattern #"^acceptance/src/acceptance/steps/project_management.clj owns six project-management feature files$"
    :handler (fn [world _ _] (project/handler-world world dependencies))}
   {:pattern #"^acceptance-handler isolation is audited from APS step consumers$"
    :handler (fn [world _ _]
               (support/assert! (:vtd004/handler-isolated? world)
                                "APS handler isolation audit did not complete." {})
               world)}
   {:pattern #"^every served feature and step consumer belongs to project_management$"
    :handler (fn [world _ _]
               (support/assert! (:vtd004/handler-isolated? world)
                                "Project handler consumer audit failed." {})
               world)}
   {:pattern #"^the handler is declared isolated$"
    :handler (fn [world _ _]
               (let [pack (:vtd004/pack world)]
                 (support/assert! (= (:handlers pack) (:isolatedVerificationHandlers pack))
                                  "Owner handler is not declared isolated." {}))
               world)}
   {:pattern #"^a handler-only change selects the complete project_management evidence without dependant packs$"
    :handler (fn [world _ _]
               (support/assert! (= ["project_management"]
                                   (get-in world [:vtd004/evidence :handler :ownerPlan]))
                                "Handler-only production planning escaped the owner pack." {})
               world)}
   {:pattern #"^any cross-pack consumer blocks isolation and retains dependant propagation$"
    :handler (fn [world _ _]
               (support/assert! (get-in world [:vtd004/evidence :handler :negativeMutationRejected])
                                "Cross-pack consumer mutation did not block isolation." {})
               world)}])

(defn- history-handlers [example-values verify-throughput! dependencies]
  [
   {:pattern #"^project-management change is (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd004/change (first (example-values example captures))))}
   {:pattern #"^historical registry state is (.+)$"
    :handler (fn [world example captures]
               (project/history-world world (:vtd004/change world)
                                      (first (example-values example captures)) dependencies))}
   {:pattern #"^impacted verification packs are selected from current and historical ownership$"
    :handler (fn [world _ _] (verify-throughput! world))}
   {:pattern #"^selected scope is (.+)$"
    :handler (fn [world example captures]
               (support/assert! (= (first (example-values example captures))
                                   (:vtd004/historical-scope world))
                                "Historical project boundary selected the wrong scope." {})
               world)}])

(defn- conservation-handlers [dependencies]
  [
   {:pattern #"^every project-management boundary maps to the complete owner evidence profile$"
    :handler (fn [world _ _] (project/conservation-world world dependencies))}
   {:pattern #"^exact project_management verification and terminal-full planning are compared before and after VTD-004$"
    :handler (fn [world _ _]
               (support/assert! (:vtd004/conserved? world)
                                "Exact and terminal plan comparison did not complete." {})
               world)}
   {:pattern #"^all six unit files, five property files, six features, one handler, and four installed browser adapters execute once in the exact owner plan$"
    :handler (fn [world _ _]
               (support/assert! (:vtd004/conserved? world)
                                "Exact project evidence was not conserved." {})
               world)}
   {:pattern #"^terminal-full planning executes every conserved assertion leaf and package check exactly once$"
    :handler (fn [world _ _]
               (let [conservation (get-in world [:vtd004/evidence :conservation])]
                 (support/assert! (and (:terminalTaskIdentitiesConserved conservation)
                                       (= 1 (:packageCheckCount conservation)))
                                  "Terminal plan lost or repeated a conserved leaf." {}))
               world)}
   {:pattern #"^browser batching, task order, worker limits, terminal shards, product behavior, durable bytes, migrations, Undo, and accessibility are unchanged$"
    :handler (fn [world _ _]
               (support/assert! (:terminalTaskIdentitiesConserved
                                 (get-in world [:vtd004/evidence :conservation]))
                                "Terminal product and verification identities changed." {})
               world)}])

(defn- calibration-handlers [dependencies]
  [
   {:pattern #"^the calibrated representative path src/data-layer-assignment-routing-ui.ts previously selected ten packs with critical-path baseline 390 seconds and limit 468 seconds$"
    :handler (fn [world _ _] (project/calibration-world world dependencies))}
   {:pattern #"^its non-propagating boundary is calibrated from the accepted VTD-003 receipt scope$"
    :handler (fn [world _ _]
               (support/assert! (get-in world [:vtd004/evidence :calibration :provenanceConserved])
                                "Calibration receipt scope or provenance changed." {})
               world)}
   {:pattern #"^it selects only project_management with dependant fan-out 0$"
    :handler (fn [world _ _]
               (let [pack (:vtd004/calibration-pack world)]
                 (support/assert! (and (= ["project_management"] (:selectedPacks pack))
                                       (= 0 (get-in pack [:changedPathFanOut :limit])))
                                  "Project calibration retained dependant fan-out." {}))
               world)}
   {:pattern #"^its critical-path baseline is 37.1 seconds with tolerance 1.2 and limit 45 seconds$"
    :handler (fn [world _ _]
               (let [duration (get-in world [:vtd004/calibration-pack :changedPathDuration])]
                 (support/assert! (= [37.1 1.2 45]
                                     ((juxt :baseline :tolerance :limit) duration))
                                  "Project changed-path calibration is not exact." {}))
               world)}
   {:pattern #"^the other 19 pack calibrations and all 81 browser-target budgets are unchanged$"
    :handler (fn [world _ _]
               (support/assert! (and (get-in world [:vtd004/evidence :calibration :otherPackRowsConserved])
                                     (get-in world [:vtd004/evidence :calibration :browserTargetRowsConserved])
                                     (= 19 (get-in world [:vtd004/evidence :calibration :otherPackCount]))
                                     (= 81 (get-in world [:vtd004/evidence :calibration :browserTargetCount])))
                                "VTD-004 changed conserved calibration rows." {})
               world)}])

(defn handlers [{:keys [example-values verify-throughput!] :as dependencies}]
  (vec (concat (boundary-handlers example-values verify-throughput! dependencies)
               (owner-evidence-handlers example-values)
               (isolation-handlers dependencies)
               (history-handlers example-values verify-throughput! dependencies)
               (conservation-handlers dependencies)
               (calibration-handlers dependencies))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-06T20:23:23.352245876+02:00", :module-hash "-875393541", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-907446120"} {:id "def/human-pack-list", :kind "def", :line 5, :end-line 5, :hash "-401636353"} {:id "defn-/planned-browser-adapter-count", :kind "defn-", :line 7, :end-line 15, :hash "629369375"} {:id "defn-/boundary-handlers", :kind "defn-", :line 17, :end-line 53, :hash "-613878712"} {:id "defn-/owner-evidence-profile", :kind "defn-", :line 55, :end-line 58, :hash "-1958231137"} {:id "defn-/expected-owner-counts", :kind "defn-", :line 60, :end-line 64, :hash "-268298323"} {:id "defn-/owner-evidence-handlers", :kind "defn-", :line 66, :end-line 77, :hash "1941122628"} {:id "defn-/isolation-handlers", :kind "defn-", :line 79, :end-line 109, :hash "456607937"} {:id "defn-/history-handlers", :kind "defn-", :line 111, :end-line 127, :hash "-1520439892"} {:id "defn-/conservation-handlers", :kind "defn-", :line 129, :end-line 155, :hash "1548580461"} {:id "defn-/calibration-handlers", :kind "defn-", :line 157, :end-line 187, :hash "1619012991"} {:id "defn/handlers", :kind "defn", :line 189, :end-line 195, :hash "-1970084541"}]}
;; clj-mutate-manifest-end
