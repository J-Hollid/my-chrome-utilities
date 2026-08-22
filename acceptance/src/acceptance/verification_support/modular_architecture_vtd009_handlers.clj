(ns acceptance.verification-support.modular-architecture-vtd009-handlers
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn- ready [world verify-throughput!]
  (assoc (verify-throughput! world) :vtd009/active true))

(defn- assert! [world predicate message details]
  (support/assert! predicate message details)
  world)

(defn- evidence [world & path]
  (get-in world (into [:vtd009/evidence] path)))

(def ^:private scopes
  {"every runnable pack" 20
   "every runnable pack except branding_polish" 19
   "shell only" ["shell"]
   "layered_schema only" ["layered_schema"]
   "layered_schema and flow_graph" ["flow_graph" "layered_schema"]
   "command-palette, hotkeys, and shell" ["command-palette" "hotkeys" "shell"]
   "capture dependant closure and shell, 10 packs" 10
   "event-library and schemas dependant closures and shell, 9 packs" 9})

(defn- scope [description]
  (or (scopes description)
      (->> (str/split description #",\s*(?:and\s+)?|\s+and\s+")
           (remove str/blank?) vec)))

(defn- helper-handlers [example-values verify-throughput!]
  [{:pattern #"^tracked verification helper (.+) is active on current master$"
    :handler (fn [world example captures]
               (let [helper (first (values example-values example captures))
                     prepared (assoc (ready world verify-throughput!) :vtd009/helper helper)]
                 (assert! prepared (some? (evidence prepared :helpers (keyword helper)))
                          "Tracked helper lacks production registry evidence." {:helper helper}))) }
   {:pattern #"^VTD-009 validates its statically resolvable transitive import graph$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (evidence world :validation)))
                        "Helper graph validation is incomplete." {}))}
   {:pattern #"^its exact consumers are (.+)$"
    :handler (fn [world example captures]
               (let [expected (scope (first (values example-values example captures)))
                     actual (evidence world :helpers (keyword (:vtd009/helper world)) :consumers)]
                 (assert! world (if (number? expected) (= expected (count actual)) (= (set expected) (set actual)))
                          "Helper consumers differ from the discovered graph." {:expected expected :actual actual}))) }
   {:pattern #"^changing the helper selects exactly those consumers once$"
    :handler (fn [world _ _]
               (let [helper (evidence world :helpers (keyword (:vtd009/helper world)))]
                 (assert! world (= (set (:consumers helper)) (set (:selected helper)))
                          "Changed-helper planning does not conserve exact consumers." {:helper helper}))) }
   {:pattern #"^all 22 retained support helpers and shared-harness have one declaration$"
    :handler (fn [world _ _]
               (let [helpers (evidence world :helpers)
                     shared-control (keyword "test/support/browser-observation-control.mjs")
                     retained (into {} (remove (fn [[path]]
                                                 (str/starts-with? (subs (str path) 1)
                                                                   "test/support/side-panel-"))
                                               helpers))]
                 (assert! world (and (= 22 (count (dissoc retained shared-control)))
                                     (some? (get retained shared-control)))
                          "Retained helper declaration inventory is incomplete." {})))}])

(defn- validation-handlers [example-values verify-throughput!]
  [{:pattern #"^verification helper registry defect is (.+)$"
    :handler (fn [world example captures]
               (assoc (ready world verify-throughput!) :vtd009/defect
                      (first (values example-values example captures))))}
   {:pattern #"^tracked support inventory and transitive consumers are validated$"
    :handler (fn [world _ _]
               (let [validation (evidence world :validation)]
                 (assert! world (and (= 6 (count validation))
                                     (every? true? (vals validation)))
                          "Helper registry defects were not validated." {})))}
   {:pattern #"^validation is rejected with (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     defect (:vtd009/defect world)
                     diagnostic (get (evidence world :diagnostics) (keyword defect))]
                 (assert! world (and (seq diagnostic) (str/includes? diagnostic expected))
                          "Registry rejection does not match the scenario diagnostic."
                          {:defect defect :expected expected :actual diagnostic}))) }
   {:pattern #"^the helper cannot silently inherit broad Shell ownership$"
    :handler (fn [world _ _]
               (assert! world (evidence world :validation :trackedDeclared)
                        "Unregistered helper fallback remains possible." {}))}])

(defn- dormant-handlers [example-values verify-throughput!]
  [{:pattern #"^dormant support file (.+) has no importer, registration, executable leaf, browser target, acceptance contract, or checkpoint$"
    :handler (fn [world example captures]
               (let [helper (first (values example-values example captures))
                     prepared (assoc (ready world verify-throughput!) :vtd009/dormant helper)]
                 (assert! prepared (some #{helper} (evidence prepared :dormant :removed))
                          "Dormant helper was not removed." {:helper helper}))) }
   {:pattern #"^VTD-009 removes it$"
    :handler (fn [world _ _]
               (assert! world (some #{(:vtd009/dormant world)} (evidence world :dormant :removed))
                        "Dormant helper remains tracked." {}))}
   {:pattern #"^its intended evidence remains supplied by (.+)$"
    :handler (fn [world _ _]
               (assert! world (evidence world :dormant :assertionLeavesConserved)
                        "Dormant-file removal lost intended evidence." {}))}
   {:pattern #"^no active assertion leaf or task identity is removed$"
    :handler (fn [world _ _]
               (assert! world (and (evidence world :dormant :assertionLeavesConserved)
                                   (evidence world :conservation :exactIdentitiesConserved))
                        "Dormant-file removal changed executable evidence." {}))}
   {:pattern #"^after both removals the 21 tracked support helpers are all declared$"
    :handler (fn [world _ _]
               (let [helpers (evidence world :helpers)
                     shared-control (keyword "test/support/browser-observation-control.mjs")
                     added-side-panel-helpers
                     (count (filter (fn [path]
                                      (str/starts-with? (subs (str path) 1)
                                                        "test/support/side-panel-"))
                                    (keys helpers)))]
                 (assert! world (and (= 21 (- (evidence world :dormant :retainedHelpers)
                                              1 added-side-panel-helpers))
                                     (some? (get helpers shared-control)))
                          "Retained support-helper inventory is not exact." {})))}])

(defn- boundary-handlers [example-values verify-throughput!]
  [{:pattern #"^Shell source (.+) currently falls through the global Shell prefix$"
    :handler (fn [world example captures]
               (let [path (first (values example-values example captures))
                     prepared (assoc (ready world verify-throughput!) :vtd009/path path)]
                 (assert! prepared (some? (evidence prepared :boundaries (keyword path)))
                          "Shell source has no production boundary evidence." {:path path}))) }
   {:pattern #"^VTD-009 classifies its exact production boundary and runtime consumers$"
    :handler (fn [world _ _]
               (assert! world (some? (evidence world :boundaries (keyword (:vtd009/path world)) :boundary))
                        "Shell boundary classification is absent." {}))}
   {:pattern #"^its boundary is (.+)$"
    :applies? :vtd009/active
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))]
                 (assert! world (= expected (evidence world :boundaries
                                                      (keyword (:vtd009/path world)) :boundary))
                          "Shell source has the wrong exact boundary." {:expected expected}))) }
   {:pattern #"^its selected scope is (.+)$"
    :applies? :vtd009/active
    :handler (fn [world example captures]
               (let [expected (scope (first (values example-values example captures)))
                     actual (evidence world :boundaries (keyword (:vtd009/path world)) :packIds)]
                 (assert! world (if (number? expected) (= expected (count actual)) (= (set expected) (set actual)))
                          "Shell boundary selects the wrong runtime consumers." {:expected expected :actual actual}))) }
   {:pattern #"^every one of the 18 Shell-owned TypeScript files matches exactly one boundary$"
    :handler (fn [world _ _]
               (assert! world (= 18 (evidence world :shellSourceCount))
                        "Shell source partition is not exact." {}))}])

(defn- representative-handlers [verify-throughput!]
  [{:pattern #"^src/workspace-tabs-ui.ts currently selects all 20 packs with dependant fan-out 19, critical-path baseline 510.8 seconds, and limit 613 seconds$"
    :handler (fn [world _ _] (ready world verify-throughput!))}
   {:pattern #"^its proven shell_local_presentation boundary becomes the Shell representative$"
    :handler (fn [world _ _]
               (assert! world (= "shell_local_presentation"
                                 (evidence world :boundaries (keyword "src/workspace-tabs-ui.ts") :boundary))
                        "Shell representative is in the wrong boundary." {}))}
   {:pattern #"^it selects only the complete 59-task property-enabled shell plan with dependant fan-out 0$"
    :handler (fn [world _ _]
               (assert! world (= 59 (evidence world :localPlan :tasks))
                        "Shell representative lost complete evidence." {}))}
   {:pattern #"^its accepted critical-path baseline is 37.2 seconds with tolerance 1.2 and limit 45 seconds$"
    :handler (fn [world _ _]
               (let [row (evidence world :calibration :current :changedPathDuration)]
                 (assert! world (= [37.2 1.2 45] [(:baseline row) (:tolerance row) (:limit row)])
                          "Shell representative calibration is incorrect." {:row row}))) }
   {:pattern #"^the shell exact-pack calibration, the other 19 pack calibrations, and every browser-target budget are unchanged$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (select-keys (evidence world :calibration)
                                                               [:otherPackRowsConserved :browserTargetsConserved
                                                                :exactPackConserved])))
                        "VTD-009 changed conserved calibration rows." {}))}
   {:pattern #"^exact-pack and terminal-full planning retain every task identity, assertion leaf, browser batch, checkpoint, package check, worker limit, and shard exactly once$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (evidence world :conservation)))
                        "VTD-009 verification topology is not conserved." {}))}])

(def ^:private history-prefixes
  [["delete test/support/layered-schema-usability" :deleteHelper]
   ["rename test/support/layered-schema-usability" :renameHelper]
   ["delete src/workspace-tabs-ui" :deleteLocal]
   ["rename src/workspace-tabs-ui" :renameToPlatform]
   ["delete test/support/branding-workflow-targets" :deleteDormant]])

(defn- history-key [change]
  (or (some (fn [[prefix key]]
              (when (str/starts-with? change prefix) key))
            history-prefixes)
      :unavailable))

(defn- history-handlers [example-values verify-throughput!]
  [{:pattern #"^VTD-009 historical change is (.+)$"
    :handler (fn [world example captures]
               (assoc (ready world verify-throughput!) :vtd009/change
                      (first (values example-values example captures))))}
   {:pattern #"^current and base helper declarations and Shell boundaries are compared$"
    :handler (fn [world _ _]
               (assert! world (seq (evidence world :history (history-key (:vtd009/change world))))
                        "Historical ownership comparison has no plan." {}))}
   {:pattern #"^selected scope is (.+)$"
    :applies? :vtd009/active
    :handler (fn [world example captures]
               (let [expected (scope (first (values example-values example captures)))
                     actual (evidence world :history (history-key (:vtd009/change world)))]
                 (assert! world (if (number? expected) (= expected (count actual)) (= (set expected) (set actual)))
                          "Historical helper or Shell ownership selected the wrong scope."
                          {:expected expected :actual actual}))) }
   {:pattern #"^unavailable, malformed, or incompatible history cannot omit prior consumers$"
    :handler (fn [world _ _]
               (assert! world (= 20 (count (evidence world :history :unavailable)))
                        "Unavailable history did not fail closed." {}))}])

(defn- snapshot-handlers [verify-throughput!]
  [{:pattern #"^the committed VTD-005 calibration snapshot contains seven eligible receipt digests from one environment class and an immutable cutoff$"
    :handler (fn [world _ _]
               (let [prepared (ready world verify-throughput!)]
                 (assert! prepared
                          (and (= 7 (count (evidence prepared :snapshot :receiptDigests)))
                               (some? (evidence prepared :snapshot :cutoff)))
                          "The committed calibration snapshot is incomplete." {})))}
   {:pattern #"^another eligible same-class receipt completes after that cutoff$"
    :handler (fn [world _ _]
               (assert! world (seq (evidence world :snapshot :postCutoffReceiptDigests))
                        "The post-cutoff receipt is not classified separately." {}))}
   {:pattern #"^VTD-009 validates the calibration and records its delivery checkpoint$"
    :handler (fn [world _ _]
               (assert! world (evidence world :snapshot :budgetsUnchanged)
                        "Snapshot validation changed committed calibration data." {}))}
   {:pattern #"^the later receipt remains discoverable in the canonical timing ledger$"
    :handler (fn [world _ _]
               (let [later (set (evidence world :snapshot :postCutoffReceiptDigests))
                     live (set (evidence world :snapshot :liveReceiptDigests))]
                 (assert! world (and (seq later) (every? live later))
                          "The canonical ledger concealed a later receipt." {})))}
   {:pattern #"^the VTD-005 snapshot continues to resolve exactly its seven raw digests without changing its budgets$"
    :handler (fn [world _ _]
               (assert! world (and (= 7 (count (evidence world :snapshot :receiptDigests)))
                                   (evidence world :snapshot :budgetsUnchanged))
                        "The VTD-005 snapshot or its budgets changed." {}))}
   {:pattern #"^the VTD-009 Shell representative retains its accepted 37\.2 second baseline and 45 second limit$"
    :handler (fn [world _ _]
               (let [duration (evidence world :calibration :current :changedPathDuration)]
                 (assert! world (= [37.2 45] [(:baseline duration) (:limit duration)])
                          "The accepted Shell calibration changed." {:duration duration})))}
   {:pattern #"^validation does not require an immutable calibration snapshot to equal its mutable live receipt sources$"
    :handler (fn [world _ _]
               (let [snapshot-count (count (evidence world :snapshot :receiptDigests))
                     live-count (count (evidence world :snapshot :liveReceiptDigests))]
                 (assert! world (and (= 7 snapshot-count) (< snapshot-count live-count))
                          "Snapshot validation still requires mutable-source equality." {})))}
   {:pattern #"^an explicit future refresh includes every eligible unique same-class receipt completed at or before its new cutoff$"
    :handler (fn [world _ _]
               (assert! world (= (count (evidence world :snapshot :liveReceiptDigests))
                                 (evidence world :snapshot :futureReceiptCount))
                        "A future snapshot omitted eligible pre-cutoff evidence." {}))}
   {:pattern #"^a missing, rejected, cross-class, duplicate digest declaration, or omitted pre-cutoff snapshot receipt is rejected$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (evidence world :snapshot :defectsRejected)))
                        "Snapshot validation does not reject every integrity defect." {}))}
   {:pattern #"^a post-cutoff verification receipt cannot retroactively invalidate the calibration used to verify that commit$"
    :handler (fn [world _ _]
               (assert! world (evidence world :snapshot :postCutoffSafe)
                        "A post-cutoff receipt invalidated the immutable snapshot." {}))}])

(defn handlers [{:keys [example-values verify-throughput!]}]
  (vec (concat (helper-handlers example-values verify-throughput!)
               (validation-handlers example-values verify-throughput!)
               (dormant-handlers example-values verify-throughput!)
               (boundary-handlers example-values verify-throughput!)
               (representative-handlers verify-throughput!)
               (history-handlers example-values verify-throughput!)
               (snapshot-handlers verify-throughput!))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-09T02:39:40.413470955+02:00", :module-hash "79549429", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1195833157"} {:id "defn-/values", :kind "defn-", :line 5, :end-line 7, :hash "-170718585"} {:id "defn-/ready", :kind "defn-", :line 9, :end-line 10, :hash "475939197"} {:id "defn-/assert!", :kind "defn-", :line 12, :end-line 14, :hash "-1557256114"} {:id "defn-/evidence", :kind "defn-", :line 16, :end-line 17, :hash "1303825807"} {:id "def/scopes", :kind "def", :line 19, :end-line 27, :hash "244864918"} {:id "defn-/scope", :kind "defn-", :line 29, :end-line 32, :hash "1976674990"} {:id "defn-/helper-handlers", :kind "defn-", :line 34, :end-line 66, :hash "-194006725"} {:id "defn-/validation-handlers", :kind "defn-", :line 68, :end-line 90, :hash "-1764443311"} {:id "defn-/dormant-handlers", :kind "defn-", :line 92, :end-line 124, :hash "-1824396624"} {:id "defn-/boundary-handlers", :kind "defn-", :line 126, :end-line 154, :hash "-318829380"} {:id "defn-/representative-handlers", :kind "defn-", :line 156, :end-line 182, :hash "-2000121832"} {:id "def/history-prefixes", :kind "def", :line 184, :end-line 189, :hash "-1907895100"} {:id "defn-/history-key", :kind "defn-", :line 191, :end-line 195, :hash "-153313306"} {:id "defn-/history-handlers", :kind "defn-", :line 197, :end-line 217, :hash "1079822317"} {:id "defn-/snapshot-handlers", :kind "defn-", :line 219, :end-line 269, :hash "-554645162"} {:id "defn/handlers", :kind "defn", :line 271, :end-line 278, :hash "1641483224"}]}
;; clj-mutate-manifest-end
