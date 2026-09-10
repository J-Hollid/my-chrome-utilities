(ns acceptance.steps.tealium-detection
  (:require [acceptance.steps.tealium-support :as tealium]
            [acceptance.steps.support :as support]))
(def model! (tealium/observation "detection" "model-test" :tealiumDetectionModel))
(def runtime! (tealium/observations ["detection/browser-test.mjs" "detection/real-runtime-test.mjs" "detection/states-browser-test.mjs" "detection/frame-access-test.mjs" "live/data-layer-continuity-test.mjs"]))
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
  (tealium/build-handlers ["features/tealium-detection.feature" "features/tealium-detection-runtime.feature"]
    {"Tealium Live has access to the selected website target" :model
     "the built extension runs Tealium Live against controlled website fixtures" :runtime}
    :tealium-detection model! runtime! rows! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-10T02:44:17.925275023+02:00", :module-hash "-1839515228", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "2059325865"} {:id "def/model!", :kind "def", :line 4, :end-line 4, :hash "857128554"} {:id "def/runtime!", :kind "def", :line 5, :end-line 5, :hash "2092497977"} {:id "defn/rows!", :kind "defn", :line 6, :end-line 12, :hash "2041213674"} {:id "defn/assert-runtime!", :kind "defn", :line 13, :end-line 22, :hash "-910768344"} {:id "def/handlers", :kind "def", :line 23, :end-line 27, :hash "-490242381"}]}
;; clj-mutate-manifest-end
