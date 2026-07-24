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
(def example-values
  {"overview" #{"Shared Profiles" "Page Groups" "Pages" "Events"
                "Applicability" "Flows" "Fixtures" "Assignments"}
   "entity" #{"Sitewide" "Checkout" "Cart" "Purchase" "Retail checkout"
              "Checkout journey" "Valid purchase" "Retail Purchase"}
   "add action" #{"Add Shared Profile" "Add Page Group" "Add Page" "Add Event"
                  "Add Applicability Set" "Add Flow" "Add Fixture" "Add Assignment"}
   "creation page" #{"Create Shared Profile" "Create Page Group" "Create Page"
                     "Create Event" "Create Applicability Set" "Create Flow"
                     "Create Fixture" "Create Assignment"}
   "singular" #{"Shared Profile" "Page Group" "Page" "Event"
                "Applicability Set" "Flow" "Fixture" "Assignment"}
   "purpose" #{"reusable schema rules and documentation"
               "shared Page context and inherited requirements"
               "observable Page context and specific requirements"
               "reusable interaction schema and documentation"
               "named observation matching and assignment eligibility"
               "documentary journey topology"
               "saved per-Event validation evidence"
               "production schema selection for matching observations"}
   "ordered Pages" #{"Alpha, Landing, Cart" "Alpha, Landing" "Landing"}
   "removed Page" #{"Landing"}
   "focus target" #{"Cart" "Alpha" "Add Page"}})
(defn validate-example! [_mode example]
  (support/validate-example-domain!
   example-values example
   (filter #(support/example-value example %) (keys example-values))
   "Project-management example was outside the specified contract."))
(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :project-management-mode
                                          verify-model! validate-example!
                                          observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-24T09:54:18.905984451+02:00", :module-hash "121092361", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-408196865"} {:id "def/feature-files", :kind "def", :line 7, :end-line 10, :hash "-441913606"} {:id "def/model-entries", :kind "def", :line 11, :end-line 34, :hash "682593259"} {:id "def/runtime-entries", :kind "def", :line 35, :end-line 58, :hash "-93359660"} {:id "def/entry-modes", :kind "def", :line 59, :end-line 60, :hash "270029399"} {:id "form/5/defonce", :kind "defonce", :line 61, :end-line 61, :hash "344781070"} {:id "form/6/defonce", :kind "defonce", :line 62, :end-line 62, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 63, :end-line 66, :hash "-148274062"} {:id "defn-/verify-model!", :kind "defn-", :line 67, :end-line 70, :hash "-1682535837"} {:id "defn-/observe-browser!", :kind "defn-", :line 71, :end-line 79, :hash "-464242976"} {:id "def/runtime-paths", :kind "def", :line 80, :end-line 83, :hash "112840918"} {:id "defn/complete-browser-evidence?", :kind "defn", :line 84, :end-line 87, :hash "-1866555812"} {:id "defn-/assert-runtime!", :kind "defn-", :line 88, :end-line 91, :hash "1764318754"} {:id "def/example-values", :kind "def", :line 92, :end-line 114, :hash "-1518530902"} {:id "defn/validate-example!", :kind "defn", :line 115, :end-line 119, :hash "1924079840"} {:id "def/handlers", :kind "def", :line 120, :end-line 123, :hash "-1692449013"}]}
;; clj-mutate-manifest-end
