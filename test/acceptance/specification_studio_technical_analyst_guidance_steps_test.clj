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
          :text "Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today."}
   :narrow {:visibleBefore true
            :hiddenWithNavigation true
            :overflow true}
   :interaction
   {:footerLayout
    {:short {:scrollable false
             :treeAboveFooter true
             :bubbleRightOfAnalyst true
             :controlsClear true
             :region {:left 0 :bottom 100}}
     :long {:beforeScroll {:scrollable true
                           :region {:left 0 :bottom 100}}
            :afterScroll {:scrollTop 20
                          :treeAboveFooter true
                          :controlsClear true
                          :region {:left 0 :bottom 100}}}
     :restored {:region {:left 0 :bottom 100}}}
    :layout {:region [0 0 100 100]
             :shadow "none"
             :border "0px"
             :outlineOpacity "0"}
    :hover {:scale 1.05
            :region [0 0 100 100]
            :shadow "none"
            :outlineOpacity "1"}
    :focus {:scale 1.05
            :region [0 0 100 100]
            :shadow "none"
            :outlineOpacity "1"}
    :rest {:scale 1.0
           :shadow "none"
           :border "0px"
           :outlineOpacity "0"}
    :activations [{:id "tip-1" :before "search" :after "search"}
                  {:id "tip-2" :before "analyst" :after "analyst"}
                  {:id "tip-3" :before "analyst" :after "analyst"}]
    :tail {:visible true :headSide true :travels true :joins true :inside true}
    :routeHidden true
    :routeBeforeRequest true
    :retainedRequest {:id "tip-4"}
    :pools {:pools
            (into {}
                  (map (fn [index]
                         [(keyword (str "part-" index))
                          {:count 5
                           :distinct 5
                           :comic true
                           :texts (repeat 5 "Complete production-specific analyst guidance text")}])
                       (range 10)))
            :semantics {:canvas true
                        :frames true
                        :containment true
                        :pageRelationships true
                        :occurrencesAreNotEndpoints true
                        :documentation true
                        :required true}}
    :dwell {:preflight {:before true
                        :first {:hidden false
                                :text "Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing."}
                        :stayed {:hidden true :id nil}}
            :coverage {:before true
                       :first {:hidden false
                               :text "The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific."}
                       :stayed {:hidden true :id nil}}
            :publish {:before true
                      :first {:hidden false
                              :text "Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute."}
                      :stayed {:hidden true :id nil}}
            :addPage {:before true
                      :first {:hidden false
                              :text "Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow."}
                      :stayed {:hidden true :id nil}}
            :undo {:before true
                   :first {:hidden false
                           :text "Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass."}
                   :stayed {:hidden true :id nil}}
            :unsupported {:first {:hidden true :id nil :text nil}}}
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
