(ns acceptance.verification-support.modular-architecture-vtd009-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-repository-inspection :as repository-inspection]
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
  {"every runnable pack" :all
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

(defn- scope-matches? [world expected actual]
  (cond
    (= :all expected) (= (repository-inspection/runnable-pack-count (:modular/registry world))
                         (count actual))
    (number? expected) (= expected (count actual))
    :else (= (set expected) (set actual))))

(def ^:private post-vtd009-helpers
  #{"scripts/verification-granularity-dispositions.mjs"
    "test/support/schema-library-fake-dom.mjs"
    "test/support/schema-copy-presentation.mjs"
    "test/support/native-permission-request-probe.mjs"
    "test/support/flow-authoring-readiness.mjs"
    "test/support/flow-page-connection-runtime.mjs"
    "test/support/schema-context-export/browser-probes.mjs"
    "test/support/schema-context-export/compatibility.mjs"
    "test/support/schema-context-export/fixture.mjs"
    "test/support/schema-context-export/interactions.mjs"
    "test/support/documentation-matrix-durability.mjs"
    "test/support/verification-cleanup.mjs"
    "test/support/verification-contract-boundary-helpers.mjs"})

(defn- helper-path [path]
  (subs (str path) 1))

(defn- post-vtd009-helper? [path]
  (contains? post-vtd009-helpers (helper-path path)))

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
                 (assert! world (scope-matches? world expected actual)
                          "Helper consumers differ from the discovered graph." {:expected expected :actual actual}))) }
   {:pattern #"^changing the helper selects exactly those consumers once$"
    :handler (fn [world _ _]
               (let [helper (evidence world :helpers (keyword (:vtd009/helper world)))]
                 (assert! world (= (set (:consumers helper)) (set (:selected helper)))
                          "Changed-helper planning does not conserve exact consumers." {:helper helper}))) }
   {:pattern #"^all 25 retained support helpers and shared-harness have one declaration$"
    :handler (fn [world _ _]
               (let [helpers (evidence world :helpers)
                     shared-control (keyword "test/support/browser-observation-control.mjs")
                     retained (into {} (remove (fn [[path]]
                                                 (or (str/starts-with? (helper-path path)
                                                                       "test/support/side-panel-")
                                                     (post-vtd009-helper? path)))
                                               helpers))]
                 (assert! world (and (= 25 (count (dissoc retained shared-control)))
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

(def ^:private dormant-active-evidence
  {"test/support/branding-workflow-targets.mjs" "the registered branding workflow browser program"
   "test/support/layered-schema-parity-runtime.mjs" "the current Layered Schema browser programs"})

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
    :handler (fn [world example captures]
               (let [expected (get dormant-active-evidence (:vtd009/dormant world))
                     actual (first (values example-values example captures))]
                 (assert! world (and (evidence world :dormant :assertionLeavesConserved)
                                     (= expected actual))
                          "Dormant-file removal lost intended evidence."
                          {:helper (:vtd009/dormant world) :expected expected :actual actual})))}
   {:pattern #"^no active assertion leaf or task identity is removed$"
    :handler (fn [world _ _]
               (assert! world (and (evidence world :dormant :assertionLeavesConserved)
                                   (evidence world :conservation :exactIdentitiesConserved))
                        "Dormant-file removal changed executable evidence." {}))}
   {:pattern #"^after both removals the 24 tracked support helpers are all declared$"
    :handler (fn [world _ _]
               (let [helpers (evidence world :helpers)
                     shared-control (keyword "test/support/browser-observation-control.mjs")
                     added-side-panel-helpers
                     (count (filter (fn [path]
                                      ;; The producer inventories immediate support files only.
                                      (re-matches #"test/support/side-panel-[^/]+\.mjs"
                                                  (helper-path path)))
                                    (keys helpers)))
                     added-process-helpers
                     (count (filter #(re-matches #"test/support/[^/]+\.mjs" (helper-path %))
                                    (filter post-vtd009-helper? (keys helpers))))]
                 (assert! world (and (= 24 (- (evidence world :dormant :retainedHelpers)
                                              1 added-side-panel-helpers
                                              added-process-helpers))
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
                 (assert! world (scope-matches? world expected actual)
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
   {:pattern #"^it selects only the complete 56-task property-enabled shell plan with dependant fan-out 0$"
    :handler (fn [world _ _]
               (assert! world (= 56 (evidence world :localPlan :tasks))
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
               (let [key (history-key (:vtd009/change world))
                     expected (scope (first (values example-values example captures)))
                     actual (evidence world :history key)
                     historical-runnable-count
                     (- (repository-inspection/runnable-pack-count (:modular/registry world))
                        (if (= :deleteDormant key) 1 0))]
                 (assert! world (if (= :all expected)
                                  (= historical-runnable-count (count actual))
                                  (scope-matches? world expected actual))
                          "Historical helper or Shell ownership selected the wrong scope."
                          {:expected expected :actual actual}))) }
   {:pattern #"^unavailable, malformed, or incompatible history cannot omit prior consumers$"
    :handler (fn [world _ _]
               (assert! world (= (repository-inspection/runnable-pack-count (:modular/registry world))
                                 (count (evidence world :history :unavailable)))
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
;; {:version 1, :tested-at "2026-09-07T15:14:35.986617521+02:00", :module-hash "-1584948296", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "1659086496"} {:id "defn-/values", :kind "defn-", :line 6, :end-line 8, :hash "-170718585"} {:id "defn-/ready", :kind "defn-", :line 10, :end-line 11, :hash "475939197"} {:id "defn-/assert!", :kind "defn-", :line 13, :end-line 15, :hash "-1557256114"} {:id "defn-/evidence", :kind "defn-", :line 17, :end-line 18, :hash "1303825807"} {:id "def/scopes", :kind "def", :line 20, :end-line 28, :hash "-1800865673"} {:id "defn-/scope", :kind "defn-", :line 30, :end-line 33, :hash "1976674990"} {:id "defn-/scope-matches?", :kind "defn-", :line 35, :end-line 40, :hash "-1644905289"} {:id "def/post-vtd009-helpers", :kind "def", :line 42, :end-line 48, :hash "-199630960"} {:id "defn-/helper-path", :kind "defn-", :line 50, :end-line 51, :hash "356375160"} {:id "defn-/post-vtd009-helper?", :kind "defn-", :line 53, :end-line 54, :hash "1703529693"} {:id "defn-/helper-handlers", :kind "defn-", :line 56, :end-line 89, :hash "-1101343654"} {:id "defn-/validation-handlers", :kind "defn-", :line 91, :end-line 113, :hash "-1764443311"} {:id "def/dormant-active-evidence", :kind "def", :line 115, :end-line 117, :hash "1823360074"} {:id "defn-/dormant-handlers", :kind "defn-", :line 119, :end-line 160, :hash "1648924955"} {:id "defn-/boundary-handlers", :kind "defn-", :line 162, :end-line 190, :hash "-548441881"} {:id "defn-/representative-handlers", :kind "defn-", :line 192, :end-line 218, :hash "-451621147"} {:id "def/history-prefixes", :kind "def", :line 220, :end-line 225, :hash "-1907895100"} {:id "defn-/history-key", :kind "defn-", :line 227, :end-line 231, :hash "-153313306"} {:id "defn-/history-handlers", :kind "defn-", :line 233, :end-line 260, :hash "-1190898778"} {:id "defn-/snapshot-handlers", :kind "defn-", :line 262, :end-line 312, :hash "-554645162"} {:id "defn/handlers", :kind "defn", :line 314, :end-line 321, :hash "1641483224"}]}
;; clj-mutate-manifest-end
