(ns acceptance.steps.tealium-devtools
  (:require [acceptance.steps.tealium-support :as tealium]
            [acceptance.steps.support :as support]))
(def model! (tealium/observation "devtools" "model-test" :tealiumDevtoolsModel))
(def runtime! (tealium/observations ["devtools/browser-test.mjs" "devtools/limits-test.mjs" "devtools/clipboard-test.mjs" "devtools/protocol-test.mjs" "devtools/lifecycle-test.mjs"]))
(defn rows! [observed]
  (concat
    (for [row (get-in observed [:tealiumSources :results])]
      {:fixture ({"separate" "separate tag 21" "custom" "custom tag 52" "real" "pinned real bundle"} (:fixture row))
       :resource (let [url (java.net.URI. (:url row))] (str (.getPath url) "?" (.getQuery url)))})
    (for [row (get-in observed [:tealiumSourceLifecycle :results]) :when (zero? (:staleOpened row))]
      {:event ({"reload" "same-URL page reload" "child" "same-URL child-frame replacement" "session" "old session ends and a new one starts"} (:event row))})
    (for [row (get-in observed [:tealiumSourceLimits :results])]
      {:fixture ({"configured" "no loaded source for configured tag" "ambiguous" "identical function in two possible files" "wrapped" "known bundle with wrapped sender"} (:fixture row))
       :result (if (:enabled row) "containing-file action with location unavailable"
         (if (= "ambiguous" (:fixture row)) "ambiguous resource with opening disabled" "unresolved resource with opening disabled"))})))
(defn assert-runtime! [observed]
  (support/assert! (= 3 (count (get-in observed [:tealiumSources :results]))) "Three source fixtures are required." observed)
  (doseq [row (get-in observed [:tealiumSources :results])]
    (support/assert! (and (:actualEditor row) (pos? (:length row)) (>= (:head row) 0)) "The actual Sources editor must contain the selected code." row)
    (when (= "real" (:fixture row)) (support/assert! (:formatted row) "The real bundle must reopen in its formatted view." row)))
  (tealium/flags! (:tealiumClipboard observed) [:actualClipboard :controlledFailure :selectionRetained :noScriptRequests])
  (tealium/flags! (:tealiumProtocol observed) [:otherTabDisabled :selectionRetained :correctEditor :otherEditorUnchanged :disconnectObserving :fullWidthAction :sourceFailureRetained :retryResolved])
  (let [rejects (get-in observed [:tealiumProtocol :rejects])]
    (support/assert! (and (:senderRejected rejects) (= 4 (count (:results rejects))) (every? :error (:results rejects))) "Invalid source messages must be rejected." rejects))
  (support/assert! (= 3 (count (get-in observed [:tealiumSourceLifecycle :results]))) "All source lifecycle cases are required." observed)
  (doseq [row (get-in observed [:tealiumSourceLifecycle :results])]
    (support/assert! (and (zero? (:staleOpened row)) (= 1 (:currentOpened row)) (:realLifecycle row)) "A stale source action must not open a replacement resource." row)))
(def handlers
  (tealium/build-handlers ["features/tealium-source-navigation.feature" "features/tealium-source-navigation-runtime.feature"]
    {"a Tealium Live tag is selected in the current observation session" :model
     "Tealium observes Target A while only Target B has DevTools open" :runtime
     "the bridge has a pending request for the selected tag" :runtime
     "executable source fixture <fixture> has been observed through Tealium Live" :runtime
     "the selected tag has an observed custom-origin source URL with a query string" :runtime
     "the retained owner and full-width page share a selected tag" :runtime
     "the packaged extension has its Tealium DevTools bridge installed" :runtime}
    :tealium-devtools model! runtime! rows! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-10T02:44:44.953753173+02:00", :module-hash "1126729100", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1647086316"} {:id "def/model!", :kind "def", :line 4, :end-line 4, :hash "61079227"} {:id "def/runtime!", :kind "def", :line 5, :end-line 5, :hash "1692778681"} {:id "defn/rows!", :kind "defn", :line 6, :end-line 16, :hash "-87410536"} {:id "defn/assert-runtime!", :kind "defn", :line 17, :end-line 28, :hash "1377973178"} {:id "def/handlers", :kind "def", :line 29, :end-line 38, :hash "-1647574989"}]}
;; clj-mutate-manifest-end
