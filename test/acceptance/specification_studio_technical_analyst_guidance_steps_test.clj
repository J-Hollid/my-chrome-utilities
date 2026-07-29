(ns acceptance.specification-studio-technical-analyst-guidance-steps-test
  (:require [acceptance.steps.specification-studio-technical-analyst-guidance
             :as guidance]
            [clojure.test :refer [deftest is]]))

(def complete-browser-evidence
  {:before {:bubbleHidden true :project "project" :undo 0}
   :preFirstHidden true
   :visible {:hidden false
             :hintId "project-overview"
             :expectedWidth 91
             :width 91
             :leftAnchored true
             :inside true
             :under 0
             :overflow 0
             :focus "project-search"
             :live "polite"
             :role "status"
             :animation "none"}
   :scheduleBoundary
   {:preFirst {:hidden true}
    :first {:id "project-overview"}
    :afterLifetime {:hidden true}
    :cooldownBefore {:hidden true}
    :rotation [{:id "project-overview"}
               {:id "shared-profiles"}
               {:id "pages"}
               {:id "flows"}
               {:id "documentation"}]
    :reset {:id "project-overview"}
    :documentPause {:before {:hidden true}
                    :inactive {:hidden true}
                    :resumed {:id "pages"}
                    :removed {:hidden true}}
    :blockingPause {:before {:hidden true}
                    :inactive {:hidden true}
                    :resumed {:id "pages"}
                    :removed {:hidden true}}}
   :blockingPredicate {:baseline true
                       :dialogBlocked true
                       :menuBlocked true
                       :layerBlocked true}
   :documentHidden {:hidden true :active false}
   :zoom {:visible true
          :inside true
          :overflow 0
          :text "Splendid! Refresh the preview after changing a Documentation Set."}
   :narrow {:visibleBefore true
            :hiddenWithNavigation true
            :overflow true}
   :after {:project "project" :undo 0}})

(deftest approved-examples-remain-inside-the-guidance-contract
  (is (map? (#'guidance/validate-example!
             :runtime
             {"presentation" "200 percent browser zoom"
              "visibility" "visible"})))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"invalid result"
       (#'guidance/validate-example!
        :runtime
        {"presentation" "200 percent browser zoom"
         "visibility" "hidden"})))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"invalid result"
       (#'guidance/validate-example!
        :model
        {"event" "the STudio document becomes hidden"
         "result" "disappears and pauses the hint interval"}))))

(deftest browser-evidence-requires-every-runtime-boundary
  (is (nil? (#'guidance/assert-browser! complete-browser-evidence)))
  (is (thrown? clojure.lang.ExceptionInfo
               (#'guidance/assert-browser!
                (assoc-in complete-browser-evidence [:zoom :visible] false))))
  (is (thrown? clojure.lang.ExceptionInfo
               (#'guidance/assert-browser!
                (assoc-in complete-browser-evidence
                          [:blockingPredicate :menuBlocked]
                          false)))))
