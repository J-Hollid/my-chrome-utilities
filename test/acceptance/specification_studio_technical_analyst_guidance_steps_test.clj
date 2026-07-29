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
             :focus "workspace-pane"
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
    :routeHide {:hidden true}
    :retained {:id "project-overview-search"}
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
   :interaction
   {:layout {:region [0 0 100 100]}
    :hover {:scale 1.05 :region [0 0 100 100]}
    :focus {:scale 1.05 :region [0 0 100 100]}
    :rest {:scale 1.0}
    :activations [{:id "tip-1" :before "search" :after "search"}
                  {:id "tip-2" :before "analyst" :after "analyst"}
                  {:id "tip-3" :before "analyst" :after "analyst"}]
    :tail {:visible true :headSide true :travels true :joins true :inside true}
    :routeHidden true
    :routeBeforeRequest true
    :retainedRequest {:id "tip-4"}
    :pools (into {}
                 (map (fn [index]
                        [(keyword (str "part-" index))
                         {:count 5
                          :distinct 5
                          :texts (repeat 5 "Complete production-specific analyst guidance text")}])
                      (range 10)))
    :dwell {:pointerBefore true
            :pointerFirst {:hidden false :id "control-search"}
            :pointerStayed {:hidden true :id nil}
            :focusFirst {:hidden false :id "control-preflight"}
            :focusStayed {:hidden true :id nil}}
    :typewriter {:initial {:text ""}
                 :partial "Cr"
                 :firstId "tip-1"
                 :replacement {:id "tip-2"}
                 :hideCancellation {:hidden true :stable true}
                 :routeChange {:hidden true :stable true}
                 :initialAnnouncementCount 1
                 :replacementAnnouncementCount 1
                 :reduced {:complete "Complete tip"
                           :visual "Complete tip"
                           :announcement "Complete tip"}}}
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
