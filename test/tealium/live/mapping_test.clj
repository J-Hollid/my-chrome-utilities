
(ns tealium.live.mapping-test (:require [acceptance.steps.tealium-live :as live] [clojure.test :refer [deftest is]]))
(deftest current-row-evidence
(let [paths [[:activeTab] [:tealiumAccessRecovery :observingRecovered]
             [:tealiumAccessRecovery :declined] [:tealiumLifecycle :targetClosure]
             [:tealiumAccessRecovery :observingRevoked] [:tealiumAccessRecovery :pausedNavigation]]
      expected ["Start observation enabled" "same-target readiness restored"
                "Permission required" "Target closed" "Permission required" "Permission required"]]
  (doseq [index (range 6) value [true false nil]]
    (let [observed (assoc-in {} (nth paths index) value)
          results (mapv :result (filter #(or (:fixture %) (:prior_state %)) (live/rows! observed)))]
      (is (= (assoc (vec (repeat 6 "missing")) index
                       (if value (nth expected index) "missing")) results))))
  (doseq [[visible layout] [[true "list and inspector panes"] [false "one inspector pane"]]]
    (is (= {:width "360" :layout layout}
               (first (filter :width (live/rows! {:tealiumGeometry {:native [{:width 360 :list {:visible visible}}]}})))))))
)

(deftest runtime-evidence-validation
  (let [flags #(zipmap % (repeat true))
        geometry (mapv (fn [width] {:width width :bodyWidth width :viewport width
                                   :outerScroll false :inspector {:client 120 :width 360}})
                       [360 520 720 900])
        observed (merge
                   (flags [:nativeSidePanel :activeTab :retainedOwner :lateTag :fullWidth
                           :remotePause :stableScroll :stableFocus :backFocus :noEmptyInspector])
                   {:metadata (flags [:automatic :fallbackFirst :privateRequest :literalTitles :focus :sourceRetained :filter :lateTags :coalesced :fullWidth :paused :reload :ended])
                    :metadataFallback (flags [:missingGrant :refusal :exactGrant :empty :failedRetry :fallback :source])
                    :tealiumStartup (flags [:dataLayerFailureRetained :keyboardSelection :nativeTargetSetup :observedTag])
                    :tealiumLifecycle (flags [:pauseRace :sameDocument :reloadIdentity :pausedReload :endSnapshot :newStart :targetClosure])
                    :tealiumFrameLifecycle (flags [:sameUrlReplacement :pendingReadInvalidated :noStalePublication])
                    :tealiumClosure (flags [:expandedContinues :resetClearsSnapshot :ownerEnded :survivingSurfaceDisabled])
                    :tealiumAccessRecovery (flags [:pinnedNavigation :declined :observingRecovered :pausedRecovered :realChromeGrant])
                    :tealiumDataLayerContinuity {:events 4 :trackingCalls 0 :eachOnce true :realChromeTransport true}
                    :tealiumGeometry {:native geometry :fullWidth geometry}})]
    (is (nil? (live/assert-runtime! observed)))
    (doseq [group [:metadata :metadataFallback] flag (keys (get observed group))]
      (is (thrown? Exception (live/assert-runtime! (assoc-in observed [group flag] false)))))
    (doseq [invalid [(assoc observed :activeTab false)
                     (assoc-in observed [:tealiumDataLayerContinuity :events] 3)
                     (assoc-in observed [:tealiumGeometry :native] [])
                     (assoc-in observed [:tealiumGeometry :fullWidth 0 :outerScroll] true)]]
      (is (thrown? Exception (live/assert-runtime! invalid))))))

(deftest metadata-row-evidence
  (let [flags [:exactGrant :refusal :empty :failedRetry]
        expected ["exact-host grant followed by lookup" "no lookup or repeated prompt"
                  "Names unavailable with optional retry" "one new request resolves current names"]]
    (doseq [index (range 4) value [true false nil]]
      (let [rows (filter :condition (live/rows! {:metadataFallback {(nth flags index) value}}))]
        (is (= (assoc (vec (repeat 4 "missing")) index (if value (nth expected index) "missing"))
               (mapv :result rows)))))
    (is (= [{:surface "native side panel"} {:surface "full-width"}]
           (filter :surface (live/rows! {:metadata {:automatic true :fullWidth true}})))))
)
