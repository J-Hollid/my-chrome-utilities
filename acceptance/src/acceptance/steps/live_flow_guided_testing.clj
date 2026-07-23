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
  (let [result (apply process/shell {:out :string :err :string} command)]
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

(defn validate-observed-example! [example observation]
  (if (seq example)
    (let [normalized (normalized-row example)
          observed-rows (set (map normalized-row (:outlineRows observation)))]
      (support/assert! (contains? observed-rows normalized)
                       "Live Flow Scenario Outline row was not demonstrated by its fixture."
                       {:example normalized :observed observed-rows})
      normalized)
    example))

(defn validate-example! [mode example]
  (validate-observed-example!
   example
   (if (= mode :runtime) (observe-browser!) (verify-model!))))

(defn- assert-runtime! [observation]
  (support/assert! (and (true? (:installedBoundary observation))
                        (= 9 (count (:outlineRows observation))))
                   "Installed Live Flow testing evidence is incomplete."
                   observation))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :live-flow-guided-testing-mode
   verify-model! validate-example!
   observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-23T15:53:00.711849127+02:00", :module-hash "616018952", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "-295245234"} {:id "def/feature-files", :kind "def", :line 7, :end-line 9, :hash "1623245481"} {:id "def/entry-modes", :kind "def", :line 10, :end-line 12, :hash "993004909"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "1408641943"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/checked!", :kind "defn-", :line 16, :end-line 19, :hash "938963528"} {:id "defn-/observed-command!", :kind "defn-", :line 21, :end-line 26, :hash "-52798114"} {:id "defn-/verify-model!", :kind "defn-", :line 28, :end-line 37, :hash "-1611389672"} {:id "defn-/observe-browser!", :kind "defn-", :line 39, :end-line 45, :hash "-1970191268"} {:id "defn-/normalized-row", :kind "defn-", :line 47, :end-line 48, :hash "-125484924"} {:id "defn/validate-observed-example!", :kind "defn", :line 50, :end-line 58, :hash "-493072593"} {:id "defn/validate-example!", :kind "defn", :line 60, :end-line 63, :hash "213039096"} {:id "defn-/assert-runtime!", :kind "defn-", :line 65, :end-line 69, :hash "869671093"} {:id "def/handlers", :kind "def", :line 71, :end-line 75, :hash "-1569885548"}]}
;; clj-mutate-manifest-end
