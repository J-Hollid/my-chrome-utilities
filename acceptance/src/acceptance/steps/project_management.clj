(ns acceptance.steps.project-management
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-project-library-and-active-context.feature"
                    "features/data-layer-project-library-and-active-context-runtime.feature"
                    "features/data-layer-project-portability-and-upgrade.feature"
                    "features/data-layer-project-portability-and-upgrade-runtime.feature"
                    "features/specification-studio-assignment-owned-routing.feature"
                    "features/specification-studio-assignment-owned-routing-runtime.feature"])
(def model-entries
  ["the project library contains"
   "Cart is a reusable Page schema context"
   "Page View and Purchase are observable Events"
   "Assignments apply effective contributor schemas to matching observations"
   "Cart Page View applies Cart for source browser and pathname /checkout/cart"
   "Cart Page View and Cart Page View alternative both match one observation at priority 10"
   "Cart has no Assignment"
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
   "Checkout journey owns a Flow graph containing Payment Page frames and nested interaction Event instances"
   "Checkout Page Group retains obsolete Environment and Membership matcher values"
   "Cart Page retains obsolete Page-view event name, URL path, Environment, Host matcher, Query matcher, Hash matcher, SPA route, Expected interaction Events, and Applicability Set values"
   "Cart can inherit Sitewide and belongs to ordered Page Groups"])
(def runtime-entries
  ["the built extension is running with the production project repository, side panel, and Specification Studio"
   "the built extension is running with production Specification Studio and durable project storage"
   "production Cart is a reusable Page schema context"
   "production Page View and Purchase are observable Events"
   "production Cart Page View targets Cart for source browser with pathname /checkout/cart"
   "production Cart Page View and Cart Page View alternative both match at priority 10"
   "production Cart has no Assignment record"
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
   "production Checkout journey owns Payment Page frames and nested interaction Event instances"
   "production Checkout Page Group bytes contain obsolete environment and matcher properties"
   "production Cart bytes contain obsolete eventName, pathname, environment, host, query, hash, spa, expectedEventIds, and applicabilitySetId properties"
   "production Cart can inherit Sitewide and has ordered Page Group memberships"])
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
    (doseq [test-file ["test/data-layer-project-library-test.mjs"
                       "test/data-layer-project-entity-lifecycle-test.mjs"
                       "test/data-layer-assignment-routing-test.mjs"]]
      (checked! "node" test-file))
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
               (map #(keyword (str "context" (format "%03d" %))) (concat (range 1 21) (range 22 28)))
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
                "Applicability" "Flows" "Test cases" "Assignments"}
   "entity" #{"Sitewide" "Checkout" "Cart" "Purchase" "Retail checkout"
              "Checkout journey" "Valid purchase" "Retail Purchase"}
   "add action" #{"Add Shared Profile" "Add Page Group" "Add Page" "Add Event"
                  "Add Applicability Set" "Add Flow" "Add Test case" "Add Assignment"}
   "creation page" #{"Create Shared Profile" "Create Page Group" "Create Page"
                     "Create Event" "Create Applicability Set" "Create Flow"
                     "Create Test case" "Create Assignment"}
   "singular" #{"Shared Profile" "Page Group" "Page" "Event"
                "Applicability Set" "Flow" "Test case" "Assignment"}
   "purpose" #{"reusable schema rules and documentation"
               "shared Page context and inherited requirements"
               "observable Page context and specific requirements"
               "reusable interaction schema and documentation"
               "named observation matching and assignment eligibility"
               "documentary journey topology"
               "saved input plus reviewed expectations rerunnable against the current Draft"
               "production schema selection for matching observations"}
   "ordered Pages" #{"Alpha, Landing, Cart" "Alpha, Landing" "Landing"}
   "removed Page" #{"Landing"}
   "focus target" #{"Cart" "Alpha" "Add Page"}
   "condition_kind" #{"Environment" "Host" "Pathname" "Query" "Hash" "Context data"}
   "guided_input" #{"one configured project environment"
                    "host comparison and host value"
                    "exact, starts-with, or pattern comparison and path"
                    "parameter name, comparison, and typed value"
                    "hash comparison and value"
                    "schema property, compatible comparison, and typed value"
                    "configured-environment selector"
                    "host-comparison selector and host value"
                    "exact, starts-with, or pattern selector and path"
                    "schema-property, compatible-comparison, and typed-value controls"}
   "observation" #{"browser Page View at /checkout/cart"
                   "browser Page View at /checkout/shipping"
                   "server Page View at /checkout/cart"
                   "browser Purchase at /checkout/cart"}
   "result" #{"Cart Page View is the sole winner"
              "Cart Page View is rejected by pathname"
              "Cart Page View is rejected by source"
              "Cart Page View is rejected by Event"}})
(def assignment-routing-examples
  [{:keys ["condition_kind" "guided_input"]
    :rows #{["Environment" "one configured project environment"] ["Host" "host comparison and host value"] ["Pathname" "exact, starts-with, or pattern comparison and path"] ["Query" "parameter name, comparison, and typed value"] ["Hash" "hash comparison and value"] ["Context data" "schema property, compatible comparison, and typed value"]
            ["Environment" "configured-environment selector"] ["Host" "host-comparison selector and host value"] ["Pathname" "exact, starts-with, or pattern selector and path"] ["Context data" "schema-property, compatible-comparison, and typed-value controls"]}}
   {:keys ["observation" "result"]
    :rows #{["browser Page View at /checkout/cart" "Cart Page View is the sole winner"] ["browser Page View at /checkout/shipping" "Cart Page View is rejected by pathname"] ["server Page View at /checkout/cart" "Cart Page View is rejected by source"] ["browser Purchase at /checkout/cart" "Cart Page View is rejected by Event"]}}])
(defn validate-example! [_mode example]
  (let [validated (support/validate-example-domain!
                   example-values example
                   (filter #(support/example-value example %) (keys example-values))
                   "Project-management example was outside the specified contract.")]
    (support/validate-example-relations!
     assignment-routing-examples validated
     "Project-management Assignment routing example was outside the specified contract.")))
(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :project-management-mode
                                          verify-model! validate-example!
                                          observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-01T01:53:54.597437721+02:00", :module-hash "-1486274999", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-408196865"} {:id "def/feature-files", :kind "def", :line 7, :end-line 12, :hash "-1613232606"} {:id "def/model-entries", :kind "def", :line 13, :end-line 45, :hash "39226355"} {:id "def/runtime-entries", :kind "def", :line 46, :end-line 78, :hash "1010246396"} {:id "def/entry-modes", :kind "def", :line 79, :end-line 80, :hash "270029399"} {:id "form/5/defonce", :kind "defonce", :line 81, :end-line 81, :hash "344781070"} {:id "form/6/defonce", :kind "defonce", :line 82, :end-line 82, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 83, :end-line 86, :hash "-148274062"} {:id "defn-/verify-model!", :kind "defn-", :line 87, :end-line 93, :hash "577920822"} {:id "defn-/observe-browser!", :kind "defn-", :line 94, :end-line 102, :hash "-464242976"} {:id "def/runtime-paths", :kind "def", :line 103, :end-line 106, :hash "165839163"} {:id "defn/complete-browser-evidence?", :kind "defn", :line 107, :end-line 110, :hash "-1866555812"} {:id "defn-/assert-runtime!", :kind "defn-", :line 111, :end-line 114, :hash "1764318754"} {:id "def/example-values", :kind "def", :line 115, :end-line 156, :hash "1687542411"} {:id "def/assignment-routing-examples", :kind "def", :line 157, :end-line 162, :hash "877625919"} {:id "defn/validate-example!", :kind "defn", :line 163, :end-line 170, :hash "987774597"} {:id "def/handlers", :kind "def", :line 171, :end-line 174, :hash "-1692449013"}]}
;; clj-mutate-manifest-end
