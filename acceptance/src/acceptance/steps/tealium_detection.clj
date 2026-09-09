(ns acceptance.steps.tealium-detection
  (:require [acceptance.steps.tealium-support :as tealium]
            [acceptance.steps.support :as support]))
(def model! (tealium/observation "detection" "model-test" :tealiumDetectionModel))
(def runtime! (tealium/observation "detection" "observe" :tealiumDetection))
(defn rows! [observed]
  (concat
    (for [row (get-in observed [:tealiumRealRuntime :results])]
      {:fixture (if (= "real-custom" (:fixture row)) "custom publishing path" "first-party renamed file") :path (:path row)})
    [{:fixture "configured-only tag" :state (if (= 1 (:rows (first (filter #(= "configured" (:fixture %)) (get-in observed [:tealiumDetectionStates :results]))))) "Configured" "missing")}
     {:fixture "registered separate tag" :state (get-in observed [:tealiumDetection 0 :tags 0 :codeState])}
     {:fixture "suppressed bundled tag" :state (:codeState (first (get-in observed [:tealiumRealRuntime :results])))}]))
(defn assert-runtime! [observed]
  (doseq [row (get-in observed [:tealiumRealRuntime :results])]
    (support/assert! (and (= "115" (:uid row)) (= "tealium.docs" (:profile row)) (= "Code registered" (:codeState row)))
      "The pinned real runtime must be rendered through Live." row))
  (support/assert! (= 2 (count (get-in observed [:tealiumRealRuntime :results]))) "Both pinned resource paths are required." observed)
  (tealium/flags! (:tealiumDetectionStates observed) [:lateInitialization :safeTitle :readOnly :failedRequestNotCode])
  (tealium/flags! (:tealiumDataLayerContinuity observed) [:eachOnce :realChromeTransport])
  (let [frame (:tealiumFrameAccess observed)]
    (support/assert! (and (= 2 (:before frame)) (= 3 (:after frame))) "The real frame grant must expand coverage." frame)
    (tealium/flags! frame [:declinedRetained :sameTarget :distinctRows :realChromeGrant])))
(def handlers
  (tealium/handlers ["features/tealium-detection.feature" "features/tealium-detection-runtime.feature"]
    {"Tealium Live has access to the selected website target" :model
     "the built extension runs Tealium Live against controlled website fixtures" :runtime}
    :tealium-detection model! runtime! rows! assert-runtime!))
