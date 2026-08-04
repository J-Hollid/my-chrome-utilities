(ns acceptance.steps.live-flow-guided-testing
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-live-flow-guided-testing.feature"
   "features/data-layer-live-flow-guided-testing-runtime.feature"])
(def entry-modes
  {"Retail website is the active project" :model
   "the installed extension has active project Retail website" :runtime})
(defonce model-observation (atom nil))
(defonce browser-observation (atom nil))

(defn- checked! [message & command]
  (let [result (apply support/verified-command-result command)]
    (support/assert! (zero? (:exit result)) (str message " " (:err result)) {:out (:out result)})
    result))

(defn- observed-command! [message path observation-key]
  (let [result (checked! message "node" path)
        line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
        observation (get (when line (json/parse-string line true)) observation-key)]
    (support/assert! observation (str message " Fixture evidence is missing.") {:out (:out result)})
    observation))

(defn- verify-model! []
  (or @model-observation
      (do
        (checked! "Live Flow testing model verification failed."
                  "node" "test/data-layer-live-flow-testing-test.mjs")
        (reset! model-observation
                (observed-command!
                 "Live Flow outline model observation failed."
                 "test/data-layer-live-flow-testing-outline-observation.mjs"
                 :liveFlowTesting)))))

(defn- observe-browser! []
  (or @browser-observation
      (reset! browser-observation
              (observed-command!
               "Live Flow testing browser adapter failed."
               "test/browser-packs/live-flow-testing.mjs"
               :liveFlowTesting))))

(defn- normalized-row [row]
  (into {} (map (fn [[key value]] [(name key) value]) row)))

(def legacy-page-group-effective-schema
  "its Shared Profiles, ordered Page Groups, Page, and Flow Page-instance contribution")

(def current-property-set-effective-schema
  "its Shared Profiles, ordered Property Sets, Page, and Flow Page-instance contribution")

(defn- canonical-expected-row [row]
  (if (= legacy-page-group-effective-schema (get row "effective_schema"))
    (assoc row "effective_schema" current-property-set-effective-schema)
    row))

(defn validate-observed-example! [example observation]
  (if (seq example)
    (let [normalized (normalized-row example)
          expected (canonical-expected-row normalized)
          observed-rows (set (map normalized-row (:outlineRows observation)))]
      (support/assert! (contains? observed-rows expected)
                       "Live Flow Scenario Outline row was not demonstrated by its fixture."
                       {:example normalized :canonical-expected expected :observed observed-rows})
      normalized)
    example))

(defn validate-example! [mode example]
  (validate-observed-example!
   example
   (if (= mode :runtime) (observe-browser!) (verify-model!))))

(defn- assert-runtime! [observation]
  (support/assert! (and (true? (:installedBoundary observation))
                        (= 8 (count (:outlineRows observation))))
                   "Installed Live Flow testing evidence is incomplete."
                   observation))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :live-flow-guided-testing-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-04T11:33:29.491630665+02:00", :module-hash "-1542441428", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-295245234"} {:id "def/feature-files", :kind "def", :line 7, :end-line nil, :hash "1623245481"} {:id "def/entry-modes", :kind "def", :line 10, :end-line nil, :hash "993004909"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line nil, :hash "1408641943"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line nil, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 16, :end-line nil, :hash "-440955631"} {:id "defn-/observed-command!", :kind "defn-", :line 21, :end-line nil, :hash "608468984"} {:id "defn-/verify-model!", :kind "defn-", :line 28, :end-line nil, :hash "-1611389672"} {:id "defn-/observe-browser!", :kind "defn-", :line 39, :end-line nil, :hash "-1970191268"} {:id "defn-/normalized-row", :kind "defn-", :line 47, :end-line nil, :hash "-125484924"} {:id "defn/validate-observed-example!", :kind "defn", :line 50, :end-line nil, :hash "-493072593"} {:id "defn/validate-example!", :kind "defn", :line 60, :end-line nil, :hash "213039096"} {:id "defn-/assert-runtime!", :kind "defn-", :line 65, :end-line nil, :hash "1385562049"} {:id "def/handlers", :kind "def", :line 71, :end-line nil, :hash "-1569885548"}]}
;; clj-mutate-manifest-end
