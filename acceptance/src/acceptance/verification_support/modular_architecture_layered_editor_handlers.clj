(ns acceptance.verification-support.modular-architecture-layered-editor-handlers
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def ^:private target-labels
  {"rule and policy editor targets"
   ["LAYERED_SCHEMA_EDITOR_POLICY_TARGET" "LAYERED_SCHEMA_EDITOR_RULES_TARGET"]
   "all four Layered editor targets"
   ["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET" "LAYERED_SCHEMA_EDITOR_POLICY_TARGET"
    "LAYERED_SCHEMA_EDITOR_RULES_TARGET" "LAYERED_SCHEMA_EDITOR_TARGET"]
   "no Layered editor targets" []
   "every runnable pack" :all})

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn- expected-targets [description]
  (cond
    (contains? target-labels description) (target-labels description)
    (str/includes? description "LAYERED_SCHEMA_EDITOR_")
    (->> (re-seq #"LAYERED_SCHEMA_EDITOR_(?:CANONICAL_|POLICY_|RULES_)?TARGET" description)
         distinct sort vec)
    :else ::unrecognized-target-description))

(defn- assert-vtd005! [world predicate message details]
  (support/assert! predicate message details)
  world)

(defn- prepared [world verify-throughput!]
  (assoc (verify-throughput! world) :vtd005/active true))

(defn- path-plan [world path]
  (get-in world [:vtd005/evidence :plans (keyword path)]))

(defn- change-paths [description]
  (str/split description #" and "))

(defn- seconds [description]
  (some-> (re-find #"[0-9]+(?:\.[0-9]+)?" description) Double/parseDouble))

(defn- merged-plan [world description]
  (let [plans (map #(path-plan world %) (change-paths description))]
    {:targets (->> plans (mapcat :targets) distinct sort vec)
     :sessions (if (seq plans) 1 0)
     :unit (apply min (map :unit plans))
     :property (apply min (map :property plans))
     :features (set (mapcat :features plans))
     :handlers (set (mapcat :handlers plans))}))

(defn- history-key [change]
  (cond
    (str/starts-with? change "delete ") :delete
    (str/includes? change "rule-add.ts to") :renameRules
    (str/includes? change "rules.ts to src/canonical-schema-focused/definition.ts") :renameRulesCanonical
    (str/includes? change "navigator-rows.ts to") :renameGeneralShared
    :else :unavailable))

(defn- boundary-handlers [example-values verify-throughput!]
  [{:pattern #"^(.+) currently belongs to the combined canonical_schema_editor boundary$"
    :handler (fn [world example captures]
               (let [path (first (values example-values example captures))
                     ready (prepared world verify-throughput!)]
                 (assert-vtd005! (assoc ready :vtd005/path path)
                                 (some? (path-plan ready path))
                                 "Layered editor source is absent from production planner evidence."
                                 {:path path})))}
   {:pattern #"^VTD-005 classifies the Layered editor source$"
    :handler (fn [world _ _]
               (assert-vtd005! world (some? (path-plan world (:vtd005/path world)))
                               "VTD-005 production classification is missing." {}))}
   {:pattern #"^its exact boundary is (.+)$"
    :applies? :vtd005/active
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))]
                 (assert-vtd005! world (= expected (:boundary (path-plan world (:vtd005/path world))))
                                 "Layered editor source has the wrong exact boundary." {:expected expected})))}
   {:pattern #"^it selects browser evidence (.+)$"
    :handler (fn [world example captures]
               (let [expected (expected-targets (first (values example-values example captures)))]
                 (assert-vtd005! world (= expected (:targets (path-plan world (:vtd005/path world))))
                                 "Layered editor boundary selects the wrong target evidence."
                                 {:expected expected :actual (:targets (path-plan world (:vtd005/path world)))})))}
   {:pattern #"^every one of the 32 current editor files and 90 Layered Schema files matches exactly one boundary$"
    :handler (fn [world _ _]
               (let [c (get-in world [:vtd005/evidence :conservation])]
                 (assert-vtd005! world (= [32 90] [(:editorFiles c) (:layeredFiles c)])
                                 "Layered editor ownership partition is not exact." {:conservation c})))}])

(defn- multi-change-handlers [example-values verify-throughput!]
  [
   {:pattern #"^Layered editor changes are (.+)$"
    :handler (fn [world example captures]
               (let [description (first (values example-values example captures))
                     ready (prepared world verify-throughput!)]
                 (assoc ready :vtd005/plan (merged-plan ready description))))}
   {:pattern #"^their behavior targets are planned$"
    :handler (fn [world _ _]
               (assert-vtd005! world (seq (get-in world [:vtd005/plan :targets]))
                               "Layered editor behavior plan is empty." {}))}
   {:pattern #"^selected logical targets are (.+)$"
    :handler (fn [world example captures]
               (let [expected (expected-targets (first (values example-values example captures)))]
                 (assert-vtd005! world (= expected (get-in world [:vtd005/plan :targets]))
                                 "Layered editor multi-change target union is wrong." {:expected expected})))}
   {:pattern #"^they execute in (.+) Layered editor browser session$"
    :handler (fn [world example captures]
               (let [expected ({"one" 1} (first (values example-values example captures)))]
                 (assert-vtd005! world (= expected (get-in world [:vtd005/plan :sessions]))
                                 "Layered editor targets do not share one browser session." {})))}
   {:pattern #"^all 21 Layered Schema unit files, 13 property files, and the exact shared-profile feature and handler evidence remain selected$"
    :handler (fn [world _ _]
               (let [plan (:vtd005/plan world)]
                 (assert-vtd005! world (and (= [21 13] [(:unit plan) (:property plan)])
                                            (= #{"features/data-layer-canonical-shared-profile-schema-authoring.feature"}
                                               (:features plan))
                                            (seq (:handlers plan)))
                                 "Focused editor plan lost exact owner evidence." {:plan plan})))}])

(defn- conservation-handlers [verify-throughput!]
  [
   {:pattern #"^the Layered editor partition contains 22 general, 19 rule, 23 canonical, and 16 policy assertion leaves$"
    :handler (fn [world _ _]
               (let [ready (prepared world verify-throughput!)
                     counts (get-in ready [:vtd005/evidence :conservation :leafCounts])]
                 (assert-vtd005! ready (= #{16 19 22 23} (set (vals counts)))
                                 "Layered editor assertion-leaf partition changed." {:counts counts})))}
   {:pattern #"^exact layered_schema verification and terminal-full planning are compared before and after VTD-005$"
    :handler (fn [world _ _]
               (let [c (get-in world [:vtd005/evidence :conservation])]
                 (assert-vtd005! world (and (:exactIdentitiesConserved c)
                                            (:terminalIdentitiesConserved c))
                                 "VTD-005 exact/terminal comparison failed." {})))}
   {:pattern #"^all 80 editor assertion leaves execute exactly once$"
    :handler (fn [world _ _]
               (assert-vtd005! world (= 80 (get-in world [:vtd005/evidence :conservation :editorLeaves]))
                               "Layered editor leaves are not conserved." {}))}
   {:pattern #"^the 54-task exact owner plan retains one build, 21 unit tasks, 13 property tasks, four browser sessions containing all eight logical targets, seven parses, seven generators, and one acceptance session$"
    :handler (fn [world _ _]
               (let [c (get-in world [:vtd005/evidence :conservation])]
                 (assert-vtd005! world (= [54 1 21 13 4 8 7 7 1]
                                           [(:exactTasks c) (:builds c) (:unit c) (:property c)
                                            (:browserSessions c) (count (:targetIds c)) (:parses c)
                                            (:generators c) (:acceptanceSessions c)])
                                 "Layered Schema exact plan changed." {:conservation c})))}
   {:pattern #"^terminal-full planning retains the same eight Layered Schema target identities and four compatible browser sessions$"
    :handler (fn [world _ _]
               (assert-vtd005! world (get-in world [:vtd005/evidence :conservation :terminalIdentitiesConserved])
                               "Terminal Layered Schema identities changed." {}))}
   {:pattern #"^product behavior, saved canonical bytes, feature and handler evidence, task order, worker limits, and terminal shards are unchanged$"
    :handler (fn [world _ _]
               (assert-vtd005! world (get-in world [:vtd005/evidence :conservation :exactIdentitiesConserved])
                               "Layered editor conservation failed." {}))}])

(defn- history-handlers [example-values verify-throughput!]
  [
   {:pattern #"^Layered editor history is (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world verify-throughput!) :vtd005/change
                      (first (values example-values example captures))))}
   {:pattern #"^current and base impact boundaries are compared$"
    :handler (fn [world _ _]
               (assert-vtd005! world
                               (seq (get-in world [:vtd005/evidence :history
                                                  (history-key (:vtd005/change world))]))
                               "Layered editor historical plan is missing." {}))}
   {:pattern #"^browser evidence selection is (.+)$"
    :handler (fn [world example captures]
               (let [actual (get-in world [:vtd005/evidence :history
                                           (history-key (:vtd005/change world))])
                     expected (expected-targets (first (values example-values example captures)))]
                 (assert-vtd005! world (if (= :all expected) (= 20 (count actual)) (= expected actual))
                                 "Layered editor history selected the wrong evidence." {:actual actual :expected expected})))}
   {:pattern #"^unavailable, malformed, or incompatible history cannot omit the old editor evidence$"
    :handler (fn [world _ _]
               (assert-vtd005! world (= 20 (count (get-in world [:vtd005/evidence :history :unavailable])))
                               "Unavailable history did not fail closed." {}))}])

(defn- sample-calibration-handlers [example-values verify-throughput! performance-calibration]
  [
   {:pattern #"^editor boundary (.+) relies on provisional target timing (.+)$"
    :handler (fn [world example captures]
               (let [[boundary _] (values example-values example captures)]
                 (assoc (prepared world verify-throughput!) :vtd005/boundary boundary)))}
   {:pattern #"^at least five independent comparable focused-normal samples are accepted$"
    :handler (fn [world _ _] (assoc world :vtd005/calibration (performance-calibration)))}
   {:pattern #"^every selected target p90 budget is non-provisional and cites every receipt digest accepted into that calibration snapshot$"
    :handler (fn [world _ _]
               (let [targets (get-in world [:vtd005/evidence :classes
                                            (keyword (:vtd005/boundary world)) :targets])
                     budgets (:browserTargets (:vtd005/calibration world))]
                 (assert-vtd005! world
                                 (every? #(let [b (get budgets (keyword %))]
                                            (and (false? (:provisional b)) (>= (:sampleCount b) 5)
                                                 (= (:sampleCount b) (count (:receiptDigests b))))) targets)
                                 "Layered editor target calibration is immature." {:targets targets})))}])

(defn- boundary-budget-handlers [example-values]
  [
   {:pattern #"^its focused changed-path critical-plan baseline is at most (.+)$"
    :handler (fn [world example captures]
               (let [ceiling (seconds (first (values example-values example captures)))
                     baseline (get-in world [:vtd005/evidence :calibration :boundaries
                                             (keyword (:vtd005/boundary world)) :baseline])]
                 (assert-vtd005! world (and (number? baseline) (<= baseline ceiling))
                                 "Layered editor focused baseline exceeds its ceiling."
                                 {:baseline baseline :ceiling ceiling})))}
   {:pattern #"^its tolerance is 1.2 with a guardrail of at most (.+)$"
    :handler (fn [world example captures]
               (let [ceiling (seconds (first (values example-values example captures)))
                     evidence (get-in world [:vtd005/evidence :calibration :boundaries
                                             (keyword (:vtd005/boundary world))])
                     guardrail (Math/ceil (* (:baseline evidence) (:tolerance evidence)))]
                 (assert-vtd005! world (and (= 1.2 (:tolerance evidence))
                                            (<= guardrail ceiling))
                                 "Layered editor tolerance or guardrail is invalid."
                                 {:guardrail guardrail :ceiling ceiling})))}])

(defn- calibration-provenance-handlers []
  [
   {:pattern #"^failed, duplicate, cross-environment, and aggregate-fallback samples are excluded$"
    :handler (fn [world _ _]
               (let [digests (get-in world [:vtd005/evidence :calibration :receiptDigests])
                     rejected (get-in world [:vtd005/evidence :calibration :rejectedByReason])]
                 (assert-vtd005! world (and (>= (count digests) 5)
                                            (= (count digests) (count (set digests)))
                                            (every? #(re-matches #"[a-f0-9]{64}" %) digests)
                                            (pos? (get rejected :incomplete-task-result 0)))
                               "Layered editor calibration lacks canonical digest provenance." {})))}])

(defn- representative-calibration-handlers [verify-throughput!]
  [
   {:pattern #"^src/canonical-schema-focused/navigator-rows.ts currently selects all four editor targets with critical-path baseline 214.8 seconds and limit 258 seconds$"
    :handler (fn [world _ _] (prepared world verify-throughput!))}
   {:pattern #"^it remains the representative inside canonical_editor_general_presentation$"
    :handler (fn [world _ _]
               (assert-vtd005! world (= "canonical_editor_general_presentation"
                                         (get-in world [:vtd005/evidence :plans
                                                        (keyword "src/canonical-schema-focused/navigator-rows.ts")
                                                        :boundary]))
                               "Layered Schema representative is in the wrong boundary." {}))}
   {:pattern #"^it selects only LAYERED_SCHEMA_EDITOR_TARGET in the existing browser session$"
    :handler (fn [world _ _]
               (assert-vtd005! world (= ["LAYERED_SCHEMA_EDITOR_TARGET"]
                                         (get-in world [:vtd005/evidence :plans
                                                        (keyword "src/canonical-schema-focused/navigator-rows.ts")
                                                        :targets]))
                               "Layered Schema representative selects the wrong target." {}))}
   {:pattern #"^its sample-derived critical-path baseline is at most 65 seconds with tolerance 1.2 and limit at most 78 seconds$"
    :handler (fn [world _ _]
               (let [e (get-in world [:vtd005/evidence :calibration :boundaries
                                      :canonical_editor_general_presentation])]
                 (assert-vtd005! world (and (<= (:baseline e) 65) (= 1.2 (:tolerance e))
                                            (<= (Math/ceil (* (:baseline e) (:tolerance e))) 78))
                                 "Layered Schema representative calibration exceeds its guardrail." {})))}
   {:pattern #"^its selected pack remains layered_schema with dependant fan-out 0$"
    :handler (fn [world _ _]
               (assert-vtd005! world (= ["layered_schema"]
                                         (get-in world [:vtd005/evidence :plans
                                                        (keyword "src/canonical-schema-focused/navigator-rows.ts")
                                                        :packIds]))
                               "Layered Schema representative widened pack fan-out." {}))}
   {:pattern #"^the other 19 pack calibrations, the exact layered_schema calibration, and all non-editor browser-target budgets are unchanged$"
    :handler (fn [world _ _]
               (let [c (get-in world [:vtd005/evidence :calibration])]
                 (assert-vtd005! world (and (:otherPackRowsConserved c)
                                            (:exactPackCalibrationConserved c)
                                            (:nonEditorTargetRowsConserved c))
                                 "VTD-005 changed conserved calibration rows." {})))}])

(defn handlers [{:keys [example-values verify-throughput! performance-calibration]}]
  (vec (concat (boundary-handlers example-values verify-throughput!)
               (multi-change-handlers example-values verify-throughput!)
               (conservation-handlers verify-throughput!)
               (history-handlers example-values verify-throughput!)
               (sample-calibration-handlers example-values verify-throughput!
                                            performance-calibration)
               (boundary-budget-handlers example-values)
               (calibration-provenance-handlers)
               (representative-calibration-handlers verify-throughput!))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-23T11:21:16.042396899+02:00", :module-hash "1843250204", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1301353899"} {:id "def/target-labels", :kind "def", :line 5, :end-line 12, :hash "386959994"} {:id "defn-/values", :kind "defn-", :line 14, :end-line 16, :hash "-170718585"} {:id "defn-/expected-targets", :kind "defn-", :line 18, :end-line 24, :hash "-1423602854"} {:id "defn-/assert-vtd005!", :kind "defn-", :line 26, :end-line 28, :hash "128925372"} {:id "defn-/prepared", :kind "defn-", :line 30, :end-line 31, :hash "-1580254601"} {:id "defn-/path-plan", :kind "defn-", :line 33, :end-line 34, :hash "1272694595"} {:id "defn-/change-paths", :kind "defn-", :line 36, :end-line 37, :hash "-1536394027"} {:id "defn-/seconds", :kind "defn-", :line 39, :end-line 40, :hash "1741773050"} {:id "defn-/merged-plan", :kind "defn-", :line 42, :end-line 49, :hash "1754148101"} {:id "defn-/history-key", :kind "defn-", :line 51, :end-line 57, :hash "-256925796"} {:id "defn-/boundary-handlers", :kind "defn-", :line 59, :end-line 88, :hash "2129591880"} {:id "defn-/multi-change-handlers", :kind "defn-", :line 90, :end-line 118, :hash "1975158812"} {:id "defn-/conservation-handlers", :kind "defn-", :line 120, :end-line 153, :hash "2063642604"} {:id "defn-/history-handlers", :kind "defn-", :line 155, :end-line 177, :hash "-945026216"} {:id "defn-/sample-calibration-handlers", :kind "defn-", :line 179, :end-line 196, :hash "-1100059800"} {:id "defn-/boundary-budget-handlers", :kind "defn-", :line 198, :end-line 217, :hash "-785351219"} {:id "defn-/calibration-provenance-handlers", :kind "defn-", :line 219, :end-line 229, :hash "1072003465"} {:id "defn-/representative-calibration-handlers", :kind "defn-", :line 231, :end-line 269, :hash "-600491580"} {:id "defn/handlers", :kind "defn", :line 271, :end-line 280, :hash "-1053192435"}]}
;; clj-mutate-manifest-end
