(ns acceptance.steps.specification-studio-technical-analyst-guidance
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/specification-studio-technical-analyst-guidance.feature"
   "features/specification-studio-technical-analyst-guidance-runtime.feature"])

(def entry-modes
  {"an operator is actively using a populated Specification Studio" :model
   "the built extension is running with a populated production Specification Studio" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Specification Studio technical analyst guidance model verification failed. "
   "node" "test/specification-studio-technical-analyst-guidance-test.mjs"))

(defn- verify-browser! []
  (support/cached-command-observation!
   browser-observation
   {:command ["node" "test/twatility-workflow-polish-browser-test.mjs"]
    :observation-key :studioAnalystGuidance
    :runtime-error "Specification Studio technical analyst guidance browser verification failed."
    :missing-error "Specification Studio technical analyst guidance browser evidence is missing."}))

(def example-relations
  [{:keys ["horizontal_edge" "displayed_width" "previous_width" "unchanged_surface"]
    :rows #{["left" "6.5rem" "5.2rem" "no-project start-card"]}}
   {:keys ["elapsed_time" "result"]
    :rows #{["less than 10 seconds after Studio is ready" "not shown"]
            ["10 seconds after Studio is ready" "shown once"]
            ["less than 120 seconds after the prior hint" "not shown"]
            ["120 seconds after the prior hint" "shown once when available"]
            ["less than 10 seconds after Studio is ready" "not rendered"]
            ["10 seconds after Studio is ready" "rendered once"]
            ["less than 120 seconds after the prior hint" "not rendered"]
            ["120 seconds after the prior hint" "rendered once when available"]}}
   {:keys ["route" "hint"]
    :rows #{["Project overview" "Crikey! Pick a collection on the left to start shaping your specification."]
            ["Shared Profiles" "Smashing! Put reusable fields here so Pages and Events can inherit them."]
            ["Pages" "Jolly good! Give each Page its observed page event before refining its schema."]
            ["Flows" "Cor! Add Pages to the canvas first, then place interaction Events inside them."]
            ["Documentation" "Splendid! Refresh the preview after changing a Documentation Set."]}}
   {:keys ["event" "result"]
    :rows #{["10 seconds elapse" "disappears automatically"]
            ["the Studio document becomes hidden" "disappears and pauses the hint interval"]
            ["10 seconds elapse" "is removed"]
            ["the Studio document becomes hidden" "is removed and its interval timer pauses"]}}
   {:keys ["presentation" "visibility"]
    :rows #{["1280 by 900 CSS pixel Studio" "visible"]
            ["200 percent browser zoom" "visible"]
            ["narrow Studio with navigation hidden" "hidden"]}}])

(defn- validate-example! [_mode example]
  (support/validate-example-relations!
   example-relations example
   "Specification Studio technical analyst guidance example columns describe an invalid result."))

(defn- assert-browser! [{:keys [before preFirstHidden visible scheduleBoundary
                                blockingPredicate documentHidden zoom narrow after]
                         :as evidence}]
  (support/assert!
   (and (:bubbleHidden before)
        preFirstHidden
        (false? (:hidden visible))
        (= "project-overview" (:hintId visible))
        (= (:expectedWidth visible) (:width visible))
        (:leftAnchored visible)
        (:inside visible)
        (zero? (:under visible))
        (zero? (:overflow visible))
        (= "project-search" (:focus visible))
        (= "polite" (:live visible))
        (= "status" (:role visible))
        (= "none" (:animation visible))
        (:hidden (:preFirst scheduleBoundary))
        (= "project-overview" (:id (:first scheduleBoundary)))
        (:hidden (:afterLifetime scheduleBoundary))
        (:hidden (:cooldownBefore scheduleBoundary))
        (= ["project-overview" "shared-profiles" "pages" "flows" "documentation"]
           (mapv :id (:rotation scheduleBoundary)))
        (= "project-overview" (:id (:reset scheduleBoundary)))
        (= [true true "pages" true]
           (mapv #(get-in scheduleBoundary %)
                 [[:documentPause :before :hidden]
                  [:documentPause :inactive :hidden]
                  [:documentPause :resumed :id]
                  [:documentPause :removed :hidden]]))
        (= [true true "pages" true]
           (mapv #(get-in scheduleBoundary %)
                 [[:blockingPause :before :hidden]
                  [:blockingPause :inactive :hidden]
                  [:blockingPause :resumed :id]
                  [:blockingPause :removed :hidden]]))
        (every? true? (vals blockingPredicate))
        (:hidden documentHidden)
        (false? (:active documentHidden))
        (:visible zoom)
        (:inside zoom)
        (zero? (:overflow zoom))
        (= "Splendid! Refresh the preview after changing a Documentation Set." (:text zoom))
        (:visibleBefore narrow)
        (:hiddenWithNavigation narrow)
        (:overflow narrow)
        (= (:project before) (:project after))
        (= (:undo before) (:undo after)))
   "Installed Specification Studio technical analyst guidance evidence is incomplete."
   evidence))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :specification-studio-technical-analyst-guidance-mode
   verify-model! validate-example!
   verify-browser! assert-browser!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-29T20:34:30.644285695+02:00", :module-hash "1113398590", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-141541989"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-2026693678"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "1522919857"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 19, :hash "-373877270"} {:id "defn-/verify-browser!", :kind "defn-", :line 21, :end-line 27, :hash "-1564117678"} {:id "def/example-relations", :kind "def", :line 29, :end-line 55, :hash "1255750730"} {:id "defn-/validate-example!", :kind "defn-", :line 57, :end-line 60, :hash "1709490755"} {:id "defn-/assert-browser!", :kind "defn-", :line 62, :end-line 111, :hash "-980986341"} {:id "def/handlers", :kind "def", :line 113, :end-line 117, :hash "628619708"}]}
;; clj-mutate-manifest-end
