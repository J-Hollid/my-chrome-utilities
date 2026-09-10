(ns acceptance.steps.utility-tab-expansion
  (:require [acceptance.steps.support :as support]))

(def feature-files ["features/utility-tab-expansion-boundary.feature"
                    "features/utility-tab-expansion-runtime.feature"
                    "features/utility-navigation-icons.feature"
                    "features/utility-navigation-icons-runtime.feature"])
(def entry-modes {"the utility expansion base has Data Layer and Hotkeys workspaces" :model
                  "the installed production host registers a controlled Probe utility contribution" :runtime
                  "the utility host has Data Layer, Hotkeys, and Tealium tabs" :model
                  "the production extension is installed with Data Layer, Hotkeys, and Tealium" :runtime})
(def authoritative-examples (support/authoritative-feature-examples feature-files))
(defonce planning-verified? (atom false))
(defonce protocol-verified? (atom false))
(defonce host-verified? (atom false))
(defonce browser-observation (atom nil))

(defn verify-model! []
  (doseq [[cache file] [[planning-verified? "planning-test.mjs"]
                       [protocol-verified? "protocol-test.mjs"]
                       [host-verified? "host-message-test.mjs"]]]
    (support/cached-command-verification! cache "Utility boundary check failed. "
      "node" (str "test/utility-tab-expansion/" file))))

(defn assert-runtime! [evidence]
  (verify-model!)
  (let [icons (:utilityIcons evidence) rows (:appearance icons)]
    (support/assert!
      (and (= 12 (count rows))
           (= #{[320 false] [320 true] [800 false] [800 true]}
              (set (map (juxt :width :forced) rows)))
           (every? #(every? true? (map % [:geometry :tooltip :focus :selected])) rows)
           (every? true? (map (:continuity icons) [:sameCapture :sameLive :sameTarget :selection :eachOnce :reopened])))
      "Installed utility icons must preserve geometry, names, keyboard focus, and sessions." icons))
  (doseq [[width events] [[360 4] [800 8]]]
    (let [observed (get-in evidence [:utilityRetainedPage (keyword (str width))])]
      (support/assert!
        (and (= width (:width observed)) (= events (:captureEvents observed))
             (every? true? (map observed [:lazy :retained :isolated :jobOwner :launcher :reset :targetClosure]))
             (every? true? (map (:common observed) [:editor :scroll :persistence :job :identity])))
        "The installed retained-page contract must pass at each required width." observed)))
  (support/assert!
    (and (every? true? (map (:utilityReopen evidence) [:draft :workspace :projectBytes :listeners]))
         (every? true? (map (:utilityException evidence) [:contained :capture :hotkeys :commands]))
         (true? (get-in evidence [:utilityStartup :waiting :independent]))
         (true? (get-in evidence [:utilityStartup :failed :independent])))
    "Reopening, capture, and startup isolation must pass in the installed host." evidence))

(defn observe-browser! []
  (support/cached-command-observation! browser-observation
    {:command ["node" "test/utility-tab-expansion-browser-test.mjs"]
     :observation-key :utilityTabExpansion
     :runtime-error "Installed utility expansion failed."
     :missing-error "Installed utility expansion evidence is missing."}))

(defn validate-example! [_mode example]
  (support/validate-authoritative-example! authoritative-examples example
    "Utility expansion example is outside the approved contract."))

(def handlers
  (support/verified-feature-mode-handlers feature-files entry-modes :utility-tab-expansion-mode
    verify-model! validate-example! observe-browser! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-10T14:06:28.708976618+02:00", :module-hash "421222860", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "1323121041"} {:id "def/feature-files", :kind "def", :line 4, :end-line 7, :hash "-1673826178"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 11, :hash "1637674458"} {:id "def/authoritative-examples", :kind "def", :line 12, :end-line 12, :hash "1598887325"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1321731309"} {:id "form/5/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1606115149"} {:id "form/6/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1542134205"} {:id "form/7/defonce", :kind "defonce", :line 16, :end-line 16, :hash "-1618529344"} {:id "defn/verify-model!", :kind "defn", :line 18, :end-line 23, :hash "-1805941782"} {:id "defn/assert-runtime!", :kind "defn", :line 25, :end-line 47, :hash "402854998"} {:id "defn/observe-browser!", :kind "defn", :line 49, :end-line 54, :hash "-190175558"} {:id "defn/validate-example!", :kind "defn", :line 56, :end-line 58, :hash "34540539"} {:id "def/handlers", :kind "def", :line 60, :end-line 62, :hash "-1252804076"}]}
;; clj-mutate-manifest-end
