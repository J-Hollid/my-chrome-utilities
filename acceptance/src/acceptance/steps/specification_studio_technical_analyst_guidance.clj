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
    :rows #{["Project overview" "A project with no collection is merely a clipboard with ambitions. Pick one on the left and give the specification somewhere to begin."]
            ["Shared Profiles" "If Pages keep borrowing the same fields, stop issuing duplicates like raffle tickets. Put them in a Shared Profile and let inheritance do the legwork."]
            ["Pages" "Give each Page its observed page event before polishing the schema. Even a splendid room needs a doorbell before anyone can prove they visited."]
            ["Flows" "Pages are the rooms; Events are the custard pies. Add the rooms first, then put each splat where it actually happened."]
            ["Documentation" "Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today."]
            ["Project overview" "Lost an entity in the filing-cabinet jungle? Global search finds it without rearranging a single saved Draft."]
            ["Shared Profiles" "Concepts arrange Profile properties into sensible documentation gangs. Validation remains unmoved; it has its own clipboard."]
            ["Pages" "Path conditions are the Page's doorman: they inspect each observed location and politely—or firmly—decide whether it belongs."]
            ["Assignments" "Run preflight before testing. Missing targets and tied candidates are easier to catch before they put on matching moustaches."]
            ["Documentation" "Generate rich copy or Excel only after refreshing the preview. Exporting stale work merely gives yesterday better stationery."]}}
   {:keys ["event" "result"]
    :rows #{["10 seconds elapse" "disappears automatically"]
            ["the Studio document becomes hidden" "disappears and pauses the hint interval"]
            ["10 seconds elapse" "is removed"]
            ["the Studio document becomes hidden" "is removed and its interval timer pauses"]}}
   {:keys ["presentation" "visibility"]
    :rows #{["1280 by 900 CSS pixel Studio" "visible"]
            ["200 percent browser zoom" "visible"]
            ["narrow Studio with navigation hidden" "hidden"]}}
   {:keys ["pointer_or_focus_state" "scale" "outline_state"]
    :rows #{["resting state" "100 percent" "absent"]
            ["pointer hover begins" "105 percent" "visible"]
            ["keyboard focus arrives" "105 percent" "visible"]
            ["pointer hover or keyboard focus ends" "100 percent" "absent"]}}
   {:keys ["activation"]
    :rows #{["click"] ["Enter"] ["Space"]}}
   {:keys ["current_tip_state"]
    :rows #{["no visible tip"] ["a visible tip"]
            ["no rendered tip"] ["a rendered tip"]}}
   {:keys ["studio_part"]
    :rows #{["Project overview"] ["Shared Profiles"] ["Pages"] ["Page Groups"]
            ["Events"] ["Applicability"] ["Flows"] ["Fixtures"] ["Assignments"]
            ["Documentation"]}}
   {:keys ["dwell_time" "result"]
    :rows #{["less than 3 seconds" "not shown"]
            ["3 seconds of continuous pointer hover" "shown once"]
            ["3 seconds of continuous keyboard focus" "shown once"]
            ["less than 3 seconds" "not rendered"]
            ["3 seconds of continuous pointer hover" "rendered once"]
            ["3 seconds of continuous keyboard focus" "rendered once"]}}
   {:keys ["motion_preference" "output" "character_interval"]
    :rows #{["standard motion" "one complete visible character at a time" "20 milliseconds"]
            ["reduced motion" "the complete tip immediately" "0 milliseconds"]}}
   {:keys ["navigation_inventory"]
    :rows #{["a short list ending well above the footer"]
            ["a long list requiring navigation scrolling"]}}
   {:keys ["route" "control" "tip"]
    :rows #{["Pages" "Add Page" "Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow."]
            ["Project overview" "Run preflight" "Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing."]
            ["Project overview" "Coverage matrix" "The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific."]
            ["Pages" "Undo" "Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass."]
            ["Project overview" "Publish release" "Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute."]}}])

(defn- validate-example! [_mode example]
  (support/validate-example-relations!
   example-relations example
   "Specification Studio technical analyst guidance example columns describe an invalid result."))

(defn- validate-runtime-example! [example observation]
  (let [route (get example "route")
        hint (get example "hint")]
    (when (and route hint)
      (support/assert!
       (contains?
        (set (get-in observation
                     [:interaction :pools :pools (keyword route) :texts]))
        hint)
       "Specification Studio technical analyst guidance example does not match installed guidance."
       {:route route :hint hint}))
    observation))

(defn- base-evidence-valid?
  [{:keys [before preFirstHidden visible blockingPredicate documentHidden zoom narrow]}]
  (and (:bubbleHidden before)
       preFirstHidden
       (false? (:hidden visible))
       (= "project-overview" (:hintId visible))
       (= (:expectedWidth visible) (:width visible))
       (:leftAnchored visible)
       (:inside visible)
       (zero? (:under visible))
       (zero? (:overflow visible))
       (= "workspace-pane" (:focus visible))
       (= "polite" (:live visible))
       (= "status" (:role visible))
       (= "none" (:animation visible))
       (every? true? (vals blockingPredicate))
       (:hidden documentHidden)
       (false? (:active documentHidden))
       (:visible zoom)
       (:inside zoom)
       (zero? (:overflow zoom))
       (= "Refresh the preview after changing a Documentation Set. Yesterday's snapshot is beautifully formatted and completely unaware of today." (:text zoom))
       (:visibleBefore narrow)
       (:hiddenWithNavigation narrow)
       (:overflow narrow)))

(defn- pause-evidence [schedule-boundary pause]
  (mapv (partial get-in schedule-boundary)
        [[pause :before :hidden]
         [pause :inactive :hidden]
         [pause :resumed :id]
         [pause :removed :hidden]]))

(defn- schedule-evidence-valid? [schedule-boundary]
  (and (:hidden (:preFirst schedule-boundary))
       (= "project-overview" (:id (:first schedule-boundary)))
       (:hidden (:afterLifetime schedule-boundary))
       (:hidden (:cooldownBefore schedule-boundary))
       (= ["project-overview" "shared-profiles" "pages" "flows" "documentation"]
          (mapv :id (:rotation schedule-boundary)))
       (:hidden (:routeHide schedule-boundary))
       (= "project-overview-search" (:id (:retained schedule-boundary)))
       (= [true true "pages" true]
          (pause-evidence schedule-boundary :documentPause))
       (= [true true "pages" true]
          (pause-evidence schedule-boundary :blockingPause))))

(defn- footer-evidence-valid? [interaction]
  (and (false? (get-in interaction [:footerLayout :short :scrollable]))
       (get-in interaction [:footerLayout :short :treeAboveFooter])
       (get-in interaction [:footerLayout :short :bubbleRightOfAnalyst])
       (get-in interaction [:footerLayout :short :controlsClear])
       (get-in interaction [:footerLayout :long :beforeScroll :scrollable])
       (pos? (get-in interaction [:footerLayout :long :afterScroll :scrollTop]))
       (= (get-in interaction [:footerLayout :long :beforeScroll :region])
          (get-in interaction [:footerLayout :long :afterScroll :region]))
       (get-in interaction [:footerLayout :long :afterScroll :treeAboveFooter])
       (get-in interaction [:footerLayout :long :afterScroll :controlsClear])
       (= (get-in interaction [:footerLayout :short :region])
          (get-in interaction [:footerLayout :restored :region]))))

(defn- activation-unchanged? [activation]
  (= (:before activation) (:after activation)))

(defn- interaction-evidence-valid? [interaction]
  (and (< (Math/abs (- 1.05 (get-in interaction [:hover :scale]))) 0.001)
       (< (Math/abs (- 1.05 (get-in interaction [:focus :scale]))) 0.001)
       (< (Math/abs (- 1.0 (get-in interaction [:rest :scale]))) 0.001)
       (= ["none" "none" "none" "none"]
          [(get-in interaction [:layout :shadow])
           (get-in interaction [:hover :shadow])
           (get-in interaction [:focus :shadow])
           (get-in interaction [:rest :shadow])])
       (= ["0px" "0px"]
          [(get-in interaction [:layout :border])
           (get-in interaction [:rest :border])])
       (= ["0" "0"]
          [(get-in interaction [:layout :outlineOpacity])
           (get-in interaction [:rest :outlineOpacity])])
       (pos? (Double/parseDouble (get-in interaction [:hover :outlineOpacity])))
       (pos? (Double/parseDouble (get-in interaction [:focus :outlineOpacity])))
       (= (get-in interaction [:layout :region]) (get-in interaction [:hover :region]))
       (= (get-in interaction [:layout :region]) (get-in interaction [:focus :region]))
       (= 3 (count (:activations interaction)))
       (= 3 (count (set (map :id (:activations interaction)))))
       (every? activation-unchanged? (:activations interaction))
       (every? true? (map (get-in interaction [:tail])
                          [:visible :headSide :travels :joins :inside]))
       (:routeHidden interaction)
       (:routeBeforeRequest interaction)
       (not (contains? (set (map :id (:activations interaction)))
                       (get-in interaction [:retainedRequest :id])))))

(defn- substantial-text? [text]
  (> (count text) 20))

(defn- pool-valid? [{tip-count :count :keys [distinct texts comic]}]
  (and (<= 5 tip-count)
       (= tip-count distinct)
       comic
       (every? substantial-text? texts)))

(def dwell-keys [:preflight :coverage :publish :addPage :undo])

(defn- dwell-values [dwell tail]
  (mapv (fn [control] (get-in dwell [control :first tail])) dwell-keys))

(defn- stayed-hidden? [value]
  (= {:hidden true :id nil} value))

(defn- dwell-evidence-valid? [dwell]
  (and (every? true? (mapv (fn [control] (get-in dwell [control :before])) dwell-keys))
       (every? false? (dwell-values dwell :hidden))
       (= ["Run preflight before publishing. It is considerably cheaper than discovering a missing target while the brass band is already playing."
           "The Coverage matrix catches untested properties hiding behind the curtains. Open it when surely something covers that stops sounding scientific."
           "Publish release turns today's Draft into an immutable revision. Give the review one heroic squint first; even boffins check the parachute."
           "Every grand journey needs somewhere for the trouble to begin. Add Page creates a real location before you send it marching onto a Flow."
           "Made a magnificent blunder? Undo rewinds the latest change on this page while the published revision remains safely behind glass."]
          (dwell-values dwell :text))
       (every? stayed-hidden? (mapv (fn [control] (get-in dwell [control :stayed])) dwell-keys))
       (= [true nil nil]
          [(get-in dwell [:unsupported :first :hidden])
           (get-in dwell [:unsupported :first :id])
           (get-in dwell [:unsupported :first :text])])))

(defn- typewriter-evidence-valid? [typewriter]
  (and (= "" (get-in typewriter [:initial :text]))
       (<= 2 (count (:partial typewriter)))
       (string? (:firstId typewriter))
       (not= (:firstId typewriter) (get-in typewriter [:replacement :id]))
       (get-in typewriter [:hideCancellation :hidden])
       (get-in typewriter [:hideCancellation :stable])
       (get-in typewriter [:routeChange :hidden])
       (get-in typewriter [:routeChange :stable])
       (= [1 1] [(:initialAnnouncementCount typewriter)
                 (:replacementAnnouncementCount typewriter)])
       (= (get-in typewriter [:reduced :complete])
          (get-in typewriter [:reduced :visual]))
       (= (get-in typewriter [:reduced :complete])
          (get-in typewriter [:reduced :announcement]))))

(defn- detailed-evidence-valid? [interaction]
  (and (footer-evidence-valid? interaction)
       (interaction-evidence-valid? interaction)
       (= 10 (count (get-in interaction [:pools :pools])))
       (every? pool-valid? (vals (get-in interaction [:pools :pools])))
       (every? true? (vals (get-in interaction [:pools :semantics])))
       (dwell-evidence-valid? (:dwell interaction))
       (typewriter-evidence-valid? (:typewriter interaction))))

(defn- assert-browser! [{:keys [before scheduleBoundary interaction after] :as evidence}]
  (support/assert!
   (and (base-evidence-valid? evidence)
        (schedule-evidence-valid? scheduleBoundary)
        (detailed-evidence-valid? interaction)
        (= (:project before) (:project after))
        (= (:undo before) (:undo after)))
   "Installed Specification Studio technical analyst guidance evidence is incomplete."
   evidence))

(def handlers
  (support/feature-mode-handlers
   feature-files entry-modes :specification-studio-technical-analyst-guidance-mode
   (fn [world example _captures {:keys [text]}]
     (support/mode-transition
      world example text entry-modes
      :specification-studio-technical-analyst-guidance-mode
      verify-model! validate-example!
      #(let [observation (verify-browser!)]
         (validate-runtime-example! example observation)
         (assert-browser! observation))))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-30T20:08:44.8897136+02:00", :module-hash "1676023489", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-141541989"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-2026693678"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "1522919857"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 19, :hash "-373877270"} {:id "defn-/verify-browser!", :kind "defn-", :line 21, :end-line 27, :hash "-1564117678"} {:id "def/example-relations", :kind "def", :line 29, :end-line 93, :hash "352245780"} {:id "defn-/validate-example!", :kind "defn-", :line 95, :end-line 98, :hash "1709490755"} {:id "defn-/validate-runtime-example!", :kind "defn-", :line 100, :end-line 111, :hash "-1761494061"} {:id "defn-/base-evidence-valid?", :kind "defn-", :line 113, :end-line 137, :hash "492931899"} {:id "defn-/pause-evidence", :kind "defn-", :line 139, :end-line 144, :hash "1577238289"} {:id "defn-/schedule-evidence-valid?", :kind "defn-", :line 146, :end-line 158, :hash "-1445817175"} {:id "defn-/footer-evidence-valid?", :kind "defn-", :line 160, :end-line 172, :hash "1839699614"} {:id "defn-/activation-unchanged?", :kind "defn-", :line 174, :end-line 175, :hash "1731646445"} {:id "defn-/interaction-evidence-valid?", :kind "defn-", :line 177, :end-line 204, :hash "669403679"} {:id "defn-/substantial-text?", :kind "defn-", :line 206, :end-line 207, :hash "-2117338587"} {:id "defn-/pool-valid?", :kind "defn-", :line 209, :end-line 213, :hash "11322883"} {:id "def/dwell-keys", :kind "def", :line 215, :end-line 215, :hash "73325018"} {:id "defn-/dwell-values", :kind "defn-", :line 217, :end-line 218, :hash "-974825008"} {:id "defn-/stayed-hidden?", :kind "defn-", :line 220, :end-line 221, :hash "-556440693"} {:id "defn-/dwell-evidence-valid?", :kind "defn-", :line 223, :end-line 236, :hash "-439405961"} {:id "defn-/typewriter-evidence-valid?", :kind "defn-", :line 238, :end-line 252, :hash "-2073143279"} {:id "defn-/detailed-evidence-valid?", :kind "defn-", :line 254, :end-line 261, :hash "1767624212"} {:id "defn-/assert-browser!", :kind "defn-", :line 263, :end-line 271, :hash "-1966366715"} {:id "def/handlers", :kind "def", :line 273, :end-line 283, :hash "-16778699"}]}
;; clj-mutate-manifest-end
