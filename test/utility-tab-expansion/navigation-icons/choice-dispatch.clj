(require '[acceptance.runtime :as runtime]
         '[acceptance.pack-runtime :as packs]
         '[acceptance.steps.support :as support]
         '[acceptance.steps.tealium-devtools :as tealium]
         '[acceptance.steps.sequence-replay :as replay]
         '[acceptance.steps.observation-targets :as targets]
         '[cheshire.core :as json])
(def registered (packs/handlers-for-feature "features/tealium-source-navigation.feature"))
;; Keep the three authorized handler populations in their real registered order.
(def boundary (concat tealium/handlers replay/handlers targets/priority-handlers targets/handlers))
(def handlers (filterv (fn [entry] (some #(= (:handler entry) (:handler %)) boundary)) registered))
(def old-step {:keyword "When" :text "the user chooses <action>"})
(def new-step {:keyword "When" :text "the user chooses Tealium source action <action>"})
(def world {:acceptance/feature-name "Tealium source navigation" :tealium-devtools :model})
(def old-error (try (runtime/execute-step! world {"action" "Go to u.send"} old-step handlers)
                    nil (catch Throwable error (ex-message error))))
(assert (= "Missing example value: run_action" old-error))
(def seen (atom []))
(doseq [action ["Go to u.send" "Go to u.extend"] active? [false true]]
  (let [example {"action" action}
        selected (some #(when (and (or (nil? (:applies? %)) ((:applies? %) world))
                                   (re-matches (:pattern %) (:text new-step))) %) handlers)]
    (assert (some #(identical? (:handler selected) (:handler %)) tealium/handlers))
    ;; A dispatch fixture supplies model evidence; the full acceptance session
    ;; independently executes the production model and browser observations.
    (with-redefs [support/cached-command-observation!
                  (fn [_ _] (swap! seen conj action) {:examples [{:action action}]})]
      (assert (= :model (:tealium-devtools
        (runtime/execute-step! (assoc world :observation-target-contract active?)
                               example new-step handlers)))))))
(def replay-results
  (vec (for [action ["Run step" "Run all"] active? [false true]]
    (let [result (runtime/execute-step!
      {:sequence {:steps [{:id "one"} {:id "two"}]} :observation-target-contract active?}
      {"run_action" action} {:keyword "When" :text "the user chooses <run_action>"} handlers)
      expected (if (= action "Run step") 1 2)]
      (assert (= expected (count (:executed result))))
      {:action action :steps expected :observationTargetActive active?}))))
(assert (= #{"Go to u.send" "Go to u.extend"} (set @seen)))
(println (json/generate-string {:tealiumChoiceDispatch
  {:before {:accepted false :error old-error}
   :after {:accepted true :actions (vec (sort (set @seen))) :replay replay-results}}}))
