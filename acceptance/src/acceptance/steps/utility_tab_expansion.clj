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
