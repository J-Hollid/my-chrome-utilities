(ns acceptance.steps.project-management
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-project-library-and-active-context.feature"
                    "features/data-layer-project-library-and-active-context-runtime.feature"
                    "features/data-layer-project-portability-and-upgrade.feature"
                    "features/data-layer-project-portability-and-upgrade-runtime.feature"])
(def model-entries
  ["the project library contains"
   "the Projects projection marks Retail website Active"
   "all repository writes for project-retail have settled"
   "the metadata form loads canonical project-retail"
   "the context coordinator can safely leave saved project-retail"
   "Retail website revision 14 has an unresolved stale property command"
   "no selection record exists for project context"
   "the Active project card represents project-retail"
   "the last locations are Retail website Page Cart and Trade portal Flow Trade checkout"
   "the global Saved Schema Library contains Purchase revision 4 and no project is active"
   "Retail website is active and the Projects tab is displayed at 360 pixels"
   "active Retail website has a Saved Draft based on Published revision 3 with metadata, canonical contributors, Pages, Page Groups, Events, Flows, occurrences, applicability, assignments, documentation settings, and adopted-schema lineage"
   "Retail website is active and a valid bundle contains another project-retail with linked Sitewide, Cart, Purchase, and Retail checkout records"
   "Retail website is active before project import"
   "the pre-library installation contains one singleton Legacy shop project with stable identity project-legacy, metadata, storage generation 9, project graph, navigation, Undo history, and Purchase payload in schemaDrafts"
   "the operator starts with Retail website active in the project library"
   "Retail website is active and <overview> contains <entity>"
   "Retail website is active and <overview> contains no entities"
   "the Pages overview contains Cart and unreferenced Landing"
   "Purchase Event is referenced by Checkout journey, Retail Purchase assignment, and Valid purchase fixture"
   "the Pages overview at 360 pixels contains <ordered Pages>"
   "Retail website has empty project collections and its Inspector is closed"
   "Checkout journey owns a Flow graph containing Payment Page frames and nested interaction Event instances"])
(def runtime-entries
  ["the built extension is running with the production project repository, side panel, and Specification Studio"
   "the production Projects projection reads selected identity project-retail"
   "the production write queue for project-retail is empty"
   "the metadata editor reads canonical record project-retail"
   "the context coordinator can safely leave persisted project-retail"
   "project-retail revision 14 has a production stale property command awaiting resolution"
   "the production selection record has no project ID"
   "the installed Active project card represents project-retail"
   "persisted navigation stores project-retail Page Cart and project-trade Flow Trade checkout"
   "production Saved Schema Library contains immutable Purchase revision 4 and active-project state is absent"
   "production project-retail is active and the installed Projects tab is 360 pixels wide"
   "production project-retail is active with a Saved Draft based on Published revision 3 and contains metadata, canonical contributors, Pages, Page Groups, Events, Flows, occurrences, applicability, assignments, documentation settings, and adopted-schema lineage"
   "production project-retail is active and a valid bundle also uses project-retail for linked Sitewide, Cart, Purchase, and Retail checkout records"
   "production project-retail is active before import"
   "production storage has only singleton Legacy shop project project-legacy with metadata, storage generation 9, project graph, navigation, Undo history, and Purchase payload in schemaDrafts"
   "the actual extension starts with production Retail website active in its project library"
   "production project-retail is active and the installed Inspector is closed"
   "production project-retail is active and <overview> has zero records"
   "production Pages contain Cart and unreferenced Landing"
   "production Purchase Event is referenced by Checkout journey, Retail Purchase assignment, and Valid purchase fixture"
   "the production Pages overview at 360 CSS pixels contains <ordered Pages>"
   "canonical project-retail collections are all empty"
   "production Checkout journey owns Payment Page frames and nested interaction Event instances"])
(def entry-modes (merge (zipmap model-entries (repeat :model))
                        (zipmap runtime-entries (repeat :runtime))))
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- checked! [& command]
  (let [result (apply process/shell {:out :string :err :string} command)]
    (support/assert! (zero? (:exit result)) (:err result) {:out (:out result)})
    result))
(defn- verify-model! []
  (when-not @model-verified?
    (checked! "node" "test/data-layer-project-library-test.mjs")
    (reset! model-verified? true)))
(defn- observe-browser! []
  (or @browser-observation
      (let [management-result (checked! "node" "test/browser-packs/project-management.mjs")
            management-line (last (filter #(str/starts-with? % "{") (str/split-lines (:out management-result))))
            lifecycle-result (checked! "node" "test/browser-packs/project-entity-lifecycle.mjs")
            lifecycle-line (last (filter #(str/starts-with? % "{") (str/split-lines (:out lifecycle-result))))
            observed (merge (:projectManagement (json/parse-string management-line true))
                            (:projectEntityLifecycle (json/parse-string lifecycle-line true)))]
        (reset! browser-observation observed))))
(def runtime-paths
  (set (concat [:installedBoundary]
               (map #(keyword (str "context" (format "%03d" %))) (range 1 19))
               (map #(keyword (str "portability" (format "%03d" %))) (range 1 6)))))
(defn complete-browser-evidence? [evidence]
  (boolean (and (map? evidence)
                (= runtime-paths (set (keys evidence)))
                (every? true? (vals evidence)))))
(defn- assert-runtime! [evidence]
  (support/assert! (complete-browser-evidence? evidence)
                   "Installed project-management evidence is incomplete."
                   evidence))
(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :project-management-mode
                                          verify-model! (fn [_mode _example] true)
                                          observe-browser! assert-runtime!))
