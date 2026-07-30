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
            ["Documentation" "Splendid! Refresh the preview after changing a Documentation Set."]
            ["Project overview" "Crumbs! Global search finds any collection or entity without changing your saved Draft."]
            ["Shared Profiles" "By gum! Concepts group Profile properties in documentation without changing validation."]
            ["Pages" "Gadzooks! Path conditions decide which observed locations resolve to this Page."]
            ["Assignments" "Cor! Run preflight before testing to catch missing targets or tied Assignment candidates."]
            ["Documentation" "Ker-pow! Generate rich copy or Excel only after refreshing the preview snapshot."]}}
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
    :rows #{["Pages" "Add Page" "Crikey! Add Page creates a Page draft for a real location; use it before placing that Page in a Flow."]
            ["Project overview" "Run preflight" "Gadzooks! Run preflight checks the whole Draft for blocking schema faults and advisory assurance warnings without publishing."]
            ["Project overview" "Coverage matrix" "Cor! Coverage matrix shows which project contexts exercise each canonical property; use it to spot evidence gaps."]
            ["Pages" "Undo" "Whoops-a-daisy! Undo rolls back the latest command on this Studio page while the published revision stays put."]
            ["Project overview" "Publish release" "Blimey! Publish release opens a review before creating an immutable project revision."]}}])

(defn- validate-example! [_mode example]
  (support/validate-example-relations!
   example-relations example
   "Specification Studio technical analyst guidance example columns describe an invalid result."))

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
       (= "Splendid! Refresh the preview after changing a Documentation Set." (:text zoom))
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
       (= ["Gadzooks! Run preflight checks the whole Draft for blocking schema faults and advisory assurance warnings without publishing."
           "Cor! Coverage matrix shows which project contexts exercise each canonical property; use it to spot evidence gaps."
           "Blimey! Publish release opens a review before creating an immutable project revision."
           "Crikey! Add Page creates a Page draft for a real location; use it before placing that Page in a Flow."
           "Whoops-a-daisy! Undo rolls back the latest command on this Studio page while the published revision stays put."]
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
  (support/verified-feature-mode-handlers
   feature-files entry-modes :specification-studio-technical-analyst-guidance-mode
   verify-model! validate-example!
   verify-browser! assert-browser!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-29T22:43:11.507380631+02:00", :module-hash "-395247674", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "-141541989"} {:id "def/feature-files", :kind "def", :line 4, :end-line 6, :hash "-2026693678"} {:id "def/entry-modes", :kind "def", :line 8, :end-line 10, :hash "1522919857"} {:id "form/3/defonce", :kind "defonce", :line 12, :end-line 12, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 13, :end-line 13, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 15, :end-line 19, :hash "-373877270"} {:id "defn-/verify-browser!", :kind "defn-", :line 21, :end-line 27, :hash "-1564117678"} {:id "def/example-relations", :kind "def", :line 29, :end-line 78, :hash "-1623261268"} {:id "defn-/validate-example!", :kind "defn-", :line 80, :end-line 83, :hash "1709490755"} {:id "defn-/assert-browser!", :kind "defn-", :line 85, :end-line 177, :hash "-1526500408"} {:id "def/handlers", :kind "def", :line 179, :end-line 183, :hash "628619708"}]}
;; clj-mutate-manifest-end
