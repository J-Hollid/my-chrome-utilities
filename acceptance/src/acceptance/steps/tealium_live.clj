(ns acceptance.steps.tealium-live
  (:require [acceptance.steps.tealium-support :as tealium]
            [acceptance.steps.support :as support]))
(def model! (tealium/observation "live" "model-test" :tealiumLiveModel))
(def runtime! (tealium/observations ["live/browser-test.mjs" "live/geometry-test.mjs" "live/lifecycle-test.mjs" "live/frame-lifecycle-test.mjs" "live/startup-test.mjs" "live/data-layer-continuity-test.mjs" "live/access-recovery-test.mjs" "live/closure-test.mjs"]))
(defn rows! [observed]
  (concat
    (for [row (get-in observed [:tealiumGeometry :native])]
      {:width (str (:width row)) :layout (if (get-in row [:list :visible]) "list and inspector panes" "one inspector pane")})
    [{:fixture "successful activeTab probe" :result (if (:activeTab observed) "Start observation enabled" "missing")}
     {:fixture "failed probe followed by grant" :result (if (get-in observed [:tealiumAccessRecovery :observingRecovered]) "same-target readiness restored" "missing")}
     {:fixture "failed probe followed by decline" :result (if (get-in observed [:tealiumAccessRecovery :declined]) "Permission required" "missing")}
     {:prior_state "Observing" :event "website tab closes" :result (if (get-in observed [:tealiumLifecycle :targetClosure]) "Target closed" "missing")}
     {:prior_state "Observing" :event "required grant revoked" :result (if (get-in observed [:tealiumAccessRecovery :observingRevoked]) "Permission required" "missing")}
     {:prior_state "Paused" :event "navigation loses access" :result (if (get-in observed [:tealiumAccessRecovery :pausedNavigation]) "Permission required" "missing")}]))
(defn assert-runtime! [observed]
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
  (tealium/handlers ["features/tealium-live.feature" "features/tealium-live-runtime.feature"]
    {"the Tealium utility is installed in the retained utility host" :model
     "the packaged extension runs Tealium in the installed utility host" :runtime}
    :tealium-live model! runtime! rows! assert-runtime!))
