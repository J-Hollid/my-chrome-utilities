(ns acceptance.steps.tealium-live
  (:require [acceptance.steps.tealium-support :as tealium]
            [acceptance.steps.support :as support]))
(def model! (tealium/observation "live" "model-test" :tealiumLiveModel))
(def runtime! (tealium/observations ["live/browser-test.mjs" "live/geometry-test.mjs" "live/lifecycle-test.mjs" "live/frame-lifecycle-test.mjs" "live/startup-test.mjs" "live/data-layer-continuity-test.mjs" "live/access-recovery-test.mjs" "live/closure-test.mjs"]))
(defn geometry-row [row]
  {:width (str (:width row))
   :layout (if (get-in row [:list :visible]) "list and inspector panes" "one inspector pane")})
(def readiness-cases
  [[[:activeTab] {:fixture "successful activeTab probe"} "Start observation enabled"]
   [[:tealiumAccessRecovery :observingRecovered] {:fixture "failed probe followed by grant"} "same-target readiness restored"]
   [[:tealiumAccessRecovery :declined] {:fixture "failed probe followed by decline"} "Permission required"]])
(def lifecycle-cases
  [[[:tealiumLifecycle :targetClosure] {:prior_state "Observing" :event "website tab closes"} "Target closed"]
   [[:tealiumAccessRecovery :observingRevoked] {:prior_state "Observing" :event "required grant revoked"} "Permission required"]
   [[:tealiumAccessRecovery :pausedNavigation] {:prior_state "Paused" :event "navigation loses access"} "Permission required"]])
(defn evidence-row [observed [path labels expected]]
  (assoc labels :result (if (get-in observed path) expected "missing")))
(defn rows! [observed]
  (concat
          (when (get-in observed [:metadata :automatic]) [{:surface "native side panel"}])
          (when (get-in observed [:metadata :fullWidth]) [{:surface "full-width"}])
          (for [[flag condition result] [[:exactGrant "missing grant then consent" "exact-host grant followed by lookup"]
                                        [:refusal "missing grant then refusal" "no lookup or repeated prompt"]
                                        [:empty "empty successful response" "Names unavailable with optional retry"]
                                        [:failedRetry "failed request then retry" "one new request resolves current names"]]]
            {:condition condition :result (if (get-in observed [:metadataFallback flag]) result "missing")})
          (map geometry-row (get-in observed [:tealiumGeometry :native]))
          (map (partial evidence-row observed) readiness-cases)
          (map (partial evidence-row observed) lifecycle-cases)))
(defn assert-runtime! [observed]
  (tealium/flags! (:metadata observed) [:automatic :fallbackFirst :privateRequest :literalTitles :focus :sourceRetained :filter :lateTags :coalesced :fullWidth :paused :reload :ended])
  (tealium/flags! (:metadataFallback observed) [:missingGrant :refusal :exactGrant :empty :failedRetry :fallback :source])
  (tealium/flags! observed [:nativeSidePanel :activeTab :retainedOwner :lateTag :fullWidth :remotePause :stableScroll :stableFocus :backFocus :noEmptyInspector])
  (tealium/flags! (:tealiumStartup observed) [:dataLayerFailureRetained :keyboardSelection :nativeTargetSetup :observedTag])
  (tealium/flags! (:tealiumLifecycle observed) [:pauseRace :sameDocument :reloadIdentity :pausedReload :endSnapshot :newStart :targetClosure])
  (tealium/flags! (:tealiumFrameLifecycle observed) [:sameUrlReplacement :pendingReadInvalidated :noStalePublication])
  (tealium/flags! (:tealiumClosure observed) [:expandedContinues :resetClearsSnapshot :ownerEnded :survivingSurfaceDisabled])
  (tealium/flags! (:tealiumAccessRecovery observed) [:pinnedNavigation :declined :observingRecovered :pausedRecovered :realChromeGrant])
  (let [capture (:tealiumDataLayerContinuity observed)]
    (support/assert! (and (= 4 (:events capture)) (= 0 (:trackingCalls capture)) (:eachOnce capture) (:realChromeTransport capture))
      "Real Data Layer capture must retain each controlled event once." capture))
  (doseq [surface [:native :fullWidth]]
    (support/assert! (= [360 520 720 900] (mapv :width (get-in observed [:tealiumGeometry surface]))) "All layout widths are required." observed)
    (doseq [row (get-in observed [:tealiumGeometry surface])]
      (support/assert! (and (not (:outerScroll row)) (<= (:bodyWidth row) (:viewport row))
        (>= (get-in row [:inspector :client]) 100)
        (or (< (:width row) 720) (>= (get-in row [:inspector :width]) 360))) "Installed geometry failed." row))))
(def handlers
  (tealium/build-handlers ["features/tealium-live.feature" "features/tealium-live-runtime.feature"]
    {"the Tealium utility is installed in the retained utility host" :model
     "the packaged extension runs Tealium in the installed utility host" :runtime}
    :tealium-live model! runtime! rows! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-10T02:43:40.004969409+02:00", :module-hash "-737326976", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1202358864"} {:id "def/model!", :kind "def", :line 4, :end-line 4, :hash "-1704468825"} {:id "def/runtime!", :kind "def", :line 5, :end-line 5, :hash "-2082377834"} {:id "defn/geometry-row", :kind "defn", :line 6, :end-line 8, :hash "322375118"} {:id "def/readiness-cases", :kind "def", :line 9, :end-line 12, :hash "586032520"} {:id "def/lifecycle-cases", :kind "def", :line 13, :end-line 16, :hash "-1517235388"} {:id "defn/evidence-row", :kind "defn", :line 17, :end-line 18, :hash "-946351670"} {:id "defn/rows!", :kind "defn", :line 19, :end-line 22, :hash "-962036630"} {:id "defn/assert-runtime!", :kind "defn", :line 23, :end-line 38, :hash "-55403503"} {:id "def/handlers", :kind "def", :line 39, :end-line 43, :hash "-781212553"}]}
;; clj-mutate-manifest-end
