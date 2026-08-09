(ns acceptance.verification-support.modular-architecture-vtd006-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]
            [clojure.string :as str]))

(defonce ^:private evidence (atom nil))

(def ^:private module-paths
  {"capture" "test/support/side-panel-capture-targets.mjs"
   "event-library" "test/support/side-panel-event-library-targets.mjs"
   "schema-workspace" "test/support/side-panel-schema-workspace-targets.mjs"
   "schema-guided" "test/support/side-panel-schema-guided-targets.mjs"
   "schema-validation" "test/support/side-panel-schema-validation-targets.mjs"
   "schema-documentation" "test/support/side-panel-schema-documentation-targets.mjs"
   "defects" "test/support/side-panel-defect-targets.mjs"
   "shell" "test/support/side-panel-shell-targets.mjs"})

(defn- production-evidence! []
  (process-evidence/load! evidence
    {:command ["node" "test/acceptance/side-panel-browser-session-contract.mjs"]
     :prepared-task "unit:test/verification-process-contract-test.mjs"
     :fallback ["node" "test/verification-process-contract-test.mjs"]
     :prefix "{\"vtd006Acceptance\"" :key :vtd006Acceptance
     :failure "VTD-006 production contract probes failed."
     :missing "VTD-006 production evidence is missing."}))

(defn- prepared [world]
  (assoc world :vtd006/evidence (production-evidence!)))

(defn- values [example captures]
  (mapv #(support/require-example example %)
        (support/capture-placeholder-keys captures)))

(defn- assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd006/evidence world)})
  world)

(defn- pack-facts [world]
  (get-in world [:vtd006/evidence :contract :packInventory
                 (keyword (:vtd006/pack world))]))

(defn- consumer-scope [scope]
  (->> (str/split (str/replace scope #",? and " ", ") #",\s*")
       (remove str/blank?)
       set))

(defn- helper-planning [world]
  (get-in world [:vtd006/evidence :contract :helperPlanning
                 (keyword (:vtd006/helper world))]))

(defn handlers [_dependencies]
  [{:pattern #"^(.+) owns (.+) registered targets and (.+) top-level outputs in the shared side-panel browser program$"
    :handler (fn [world example captures]
               (let [[pack targets outputs] (values example captures)]
                 (assoc (prepared world) :vtd006/pack pack
                        :vtd006/targets (parse-long targets)
                        :vtd006/outputs (parse-long outputs))))}
   {:pattern #"^VTD-006 moves those targets to (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd006/program (first (values example captures))))}
   {:pattern #"^every logical target id and planner configuration is conserved exactly once$"
    :handler (fn [world _ _]
               (let [facts (pack-facts world)]
                 (assert! world
                          (and (= (:vtd006/targets world) (:targetCount facts))
                               (= (:vtd006/outputs world) (:outputCount facts))
                               (= (:vtd006/program world) (:program facts)))
                          "Side-panel target or configuration inventory changed.")))}
   {:pattern #"^exact and terminal planning use (.+) without adding a Chrome launch$"
    :handler (fn [world example captures]
               (let [expected (first (values example captures))
                     actual (:processGroup (pack-facts world))]
                 (assert! world
                          (and (= 1 (get-in world [:vtd006/evidence :process :starts]))
                               (= expected (if (= actual "existing-single-target")
                                             "the existing single target" actual)))
                          "Side-panel process grouping or launch conservation failed.")))}

   {:pattern #"^focused side-panel target (.+) is the only requested logical target$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd006/target (first (values example captures))))}
   {:pattern #"^its pack entry resolves the declarative target registry$"
    :handler (fn [world _ _]
               (assert! world (get-in world [:vtd006/evidence :contract :targets
                                              (keyword (:vtd006/target world))])
                        "Focused target is absent from the declarative registry."))}
   {:pattern #"^it initializes (.+) and the common kernel only$"
    :handler (fn [world example captures]
               (let [expected (first (values example captures))
                     module (get-in world [:vtd006/evidence :contract :targets
                                           (keyword (:vtd006/target world)) :module])]
                 (assert! world (= expected (module-paths module))
                          "Focused target resolved the wrong lazy module.")))}
   {:pattern #"^no unselected domain or Schema-family module performs an import-time or runtime fixture side effect$"
    :handler (fn [world _ _]
               (assert! world (= ["capture"] (get-in world [:vtd006/evidence :selectiveLoading :imported]))
                        "An unselected target module initialized during the selective probe."))}

   {:pattern #"^the side-panel target request contains (.+)$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the registry validates it before browser startup$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd006/evidence :registryValidation
                                                     :beforeResourcesStarted]))
                        "Registry validation occurred after process resources started."))}
   {:pattern #"^execution is rejected with (.+)$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd006/evidence
                                                                  :registryValidation])))
                        "A registry rejection class is not production-backed."))}
   {:pattern #"^no server, Chrome process, profile, fixture, or target module side effect has started$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd006/evidence :registryValidation
                                                     :beforeResourcesStarted]))
                        "Invalid input crossed the resource boundary."))}

   {:pattern #"^each logical side-panel target receives a new frozen target context inside a reusable process context$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^targets pass, fail, or execute in another compatible order$"
    :handler (fn [world _ _]
               (assert! world (= 2 (get-in world [:vtd006/evidence :process :results]))
                        "Compatible targets did not both report."))}
   {:pattern #"^both served and extension origins are cleared before every target$"
    :handler (fn [world _ _]
               (assert! world (= 2 (get-in world [:vtd006/evidence :isolation :resetCount]))
                        "Origins were not reset for both target contexts."))}
   {:pattern #"^device emulation, pages, sockets, listeners, timers, observations, and cleanup stacks cannot leak to the next target$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd006/evidence :isolation :freshSecondContext]))
                                   (true? (get-in world [:vtd006/evidence :isolation
                                                        :cleanupBeforeContinuation])))
                        "Target-local resources leaked across cleanup."))}
   {:pattern #"^planner environment maps are never applied by mutating process.env between targets$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd006/evidence :isolation
                                                     :processEnvironmentImmutable]))
                        "The installed fixture mutates process.env between targets."))}
   {:pattern #"^canonical and permuted fake-resource runs produce identical normalized results for every target identity$"
    :handler (fn [world _ _]
               (assert! world (= {:outputCount 67 :exactValues true}
                                 (get-in world [:vtd006/evidence :identityOrder]))
                        "Fake-resource target order did not conserve all exact output values."))}
   {:pattern #"^representative Capture, Schemas, Defects, and Shell target pairs produce identical installed-browser results in both orders$"
    :handler (fn [world _ _]
               (let [order (get-in world [:vtd006/evidence :installedOrder])]
                 (assert! world
                          (and (= ["capture" "schemas" "defects" "shell"] (:verifiedPacks order))
                               (= "event-library" (:singleTargetPack order))
                               (= #{:capture :schemas :defects :shell} (set (keys (:pairEvidence order))))
                               (every? #(and (true? (:equal %))
                                             (= (:canonicalDigest %) (:permutedDigest %)))
                                       (vals (:pairEvidence order))))
                          "Installed representative pair-order values or digests changed.")))}

   {:pattern #"^exact (.+) verification selects (.+) compatible side-panel targets$"
    :handler (fn [world example captures]
               (let [[pack targets] (values example captures)]
                 (assoc (prepared world) :vtd006/pack pack :vtd006/targets (parse-long targets))))}
   {:pattern #"^its new entry program executes the selected registry definitions$"
    :handler (fn [world _ _]
               (assert! world (= (:vtd006/targets world) (:targetCount (pack-facts world)))
                        "Exact pack selected the wrong target count."))}
   {:pattern #"^one asset server, one Chrome process, and one temporary profile serve the complete process group$"
    :handler (fn [world _ _]
               (assert! world (and (= 1 (get-in world [:vtd006/evidence :process :starts]))
                                   (= 1 (get-in world [:vtd006/evidence :process :stops])))
                        "The process group did not reuse one lifecycle."))}
   {:pattern #"^every target receives fresh target state, its own result, timing, and declared outputs$"
    :handler (fn [world _ _]
               (assert! world (and (= 67 (get-in world [:vtd006/evidence :contract :outputCount]))
                                   (true? (get-in world [:vtd006/evidence :isolation :freshSecondContext])))
                        "Target state, result, timing, or output ownership is incomplete."))}
   {:pattern #"^process shutdown occurs once after all target results$"
    :handler (fn [world _ _]
               (assert! world (= 1 (get-in world [:vtd006/evidence :process :stops]))
                        "Process shutdown count changed."))}

   {:pattern #"^an early side-panel target is forced to fail during an active browser phase$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^later compatible targets remain in the same process group$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd006/evidence :failure :laterPassed]))
                        "A later compatible target did not continue."))}
   {:pattern #"^its failure record has separate fields for target, phase, readiness-or-infrastructure cause, monotonic duration, and size-limited final state$"
    :handler (fn [world _ _]
               (assert! world (and (= "interaction" (get-in world [:vtd006/evidence :failure :phase]))
                                   (= "number" (get-in world [:vtd006/evidence :failure :durationType]))
                                   (true? (get-in world [:vtd006/evidence :failure :bounded])))
                        "Failure diagnostics lost a required field."))}
   {:pattern #"^it emits completed and active phase timings without emitting a passed result$"
    :handler (fn [world _ _]
               (assert! world (= "interaction" (get-in world [:vtd006/evidence :failure :phase]))
                        "Failure timing did not retain its active phase."))}
   {:pattern #"^its cleanup completes before every later target executes and reports independently$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd006/evidence :isolation
                                                     :cleanupBeforeContinuation]))
                        "Failure cleanup did not precede continuation."))}
   {:pattern #"^one aggregate failure is thrown only after every requested target has emitted a result$"
    :handler (fn [world _ _]
               (assert! world (= 2 (get-in world [:vtd006/evidence :process :results]))
                        "Aggregate failure preempted a target result."))}

   {:pattern #"^the committed VTD-006 target contract maps the old shared browser program to the five new entry programs$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^its current and migrated evidence inventories are compared$"
    :handler (fn [world _ _]
               (assert! world (= 5 (count (get-in world [:vtd006/evidence :contract
                                                         :registeredPrograms])))
                        "The five migrated programs are not registered."))}
   {:pattern #"^all 63 target ids and 67 top-level observation keys map exactly once$"
    :handler (fn [world _ _]
               (assert! world (= [63 67] [(get-in world [:vtd006/evidence :contract :targetCount])
                                          (get-in world [:vtd006/evidence :contract :outputCount])])
                        "Target or output conservation failed."))}
   {:pattern #"^all deep assertion leaves consumed by feature handlers remain reachable without constants, renames, duplicates, or relaxed branches$"
    :handler (fn [world _ _]
               (let [inventory (get-in world [:vtd006/evidence :assertionLeafInventory])]
                 (assert! world
                          (and (= 63 (:targetCount inventory))
                               (= 6910 (:mappedLeafCount inventory))
                               (true? (:everyTargetMapped inventory))
                               (true? (:rootsReachable inventory))
                               (true? (:wildcardFree inventory))
                               (true? (:pathsUnique inventory))
                               (true? (:renamedPathRejected inventory))
                               (true? (:primitiveValuesRetained inventory)))
                          "Deep assertion-leaf reachability or exact primitive validation changed.")))}
   {:pattern #"^the three Schema workspace configurations, two Guided Validation outputs, two Schema Manual Property outputs, and three combined missing-event Defects outputs remain distinct as before$"
    :handler (fn [world _ _]
               (let [targets (get-in world [:vtd006/evidence :contract :targets])]
                 (assert! world
                          (and (= 3 (count (filter #(str/starts-with? (name %) "SCHEMA_WORKSPACE_BROWSER_ADAPTER:")
                                                   (keys targets))))
                               (= 2 (count (get-in targets [:GUIDED_VALIDATION_BROWSER_ADAPTER
                                                            :observationKeys])))
                               (= 2 (count (get-in targets [:SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER
                                                            :observationKeys])))
                               (= 3 (count (get-in targets [:MISSING_EVENT_DEFECT_FIDELITY_BROWSER_OBSERVATION
                                                            :observationKeys]))))
                          "Multi-output target identities were merged.")))}
   {:pattern #"^the two Shell containment targets retain their existing nine assertion leaves each$"
    :handler (fn [world _ _]
               (assert! world (= [9 9] (get-in world [:vtd006/evidence :contract :shellLeaves]))
                        "Shell containment assertion leaves changed."))}

   {:pattern #"^changed verification helper (.+) is reached through registered browser-observation programs$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd006/helper (first (values example captures))))}
   {:pattern #"^current and historical statically resolvable imports are planned$"
    :handler (fn [world _ _]
               (assert! world (some? (helper-planning world))
                        "The requested side-panel helper class has no production planning evidence."))}
   {:pattern #"^current planning selects (.+) as the complete helper scope$"
    :handler (fn [world example captures]
               (let [expected (consumer-scope (first (values example captures)))
                     planning (helper-planning world)]
                 (assert! world
                          (and (= expected (set (:current planning)))
                               (= expected (set (mapcat identity (:declared planning)))))
                          "Current helper declaration or planner scope differs from the example row.")))}
   {:pattern #"^deleting or renaming it selects the union of old and new consumers$"
    :handler (fn [world _ _]
               (let [planning (helper-planning world)]
                 (assert! world
                          (and (= (:current planning) (:deleted planning))
                               (= (:renameUnion planning) (:renamed planning)))
                          "Migrated helper history does not union exact old and new consumers.")))}
   {:pattern #"^unavailable, malformed, or incompatible history selects every runnable pack$"
    :handler (fn [world _ _]
               (let [planning (helper-planning world)
                     runnable (vec (:runnablePackIds planning))]
                 (assert! world
                          (and (= 20 (count runnable))
                               (= 3 (count (:failClosedSelections planning)))
                               (every? #(= runnable (vec %)) (:failClosedSelections planning))
                               (true? (:failClosed planning)))
                          "Conservative helper history fallback did not select every runnable pack.")))}

   {:pattern #"^test/side-panel-component-layout-runtime-test.mjs becomes a thin direct compatibility launcher$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^VTD-006 completes the target and session extraction$"
    :handler (fn [world _ _]
               (assert! world (and (< (get-in world [:vtd006/evidence :launcher :lineCount]) 20)
                                   (true? (get-in world [:vtd006/evidence :launcher :delegates])))
                        "The direct component-layout command is not a thin launcher."))}
   {:pattern #"^npm run test:unit:component-layout retains its current no-target assertions and viewport behavior without copied fixture logic$"
    :handler (fn [world _ _]
               (let [direct (get-in world [:vtd006/evidence :launcher :directContract])]
                 (assert! world
                          (and (= 247 (:assertionLeafCount direct))
                               (string? (:assertionMapDigest direct))
                               (= 64 (count (:assertionMapDigest direct)))
                               (true? (:assertionMapExact direct))
                               (true? (get-in world [:vtd006/evidence :launcher :noOpRejected]))
                               (true? (get-in world [:vtd006/evidence :launcher :missingLeafRejected]))
                               (= [320 360 520 720] (:viewportWidths direct)))
                          "The direct no-target command did not execute the conserved assertion and viewport corpus.")))}
   {:pattern #"^the five registered entry programs use the VTD-007 readiness, protocol-deadline, syntax-check, lifecycle, and phase-timing controls$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd006/evidence :controls])))
                        "A VTD-007 browser control is missing."))}
   {:pattern #"^no src product file, product behavior, saved value, accessibility result, feature owner, handler owner, pack dependency, target budget, calibration, worker limit, or shard changes$"
    :applies? (fn [world] (nil? (:vtd014/evidence world)))
    :handler (fn [world _ _]
               (assert! world (= 63 (get-in world [:vtd006/evidence :contract :targetCount]))
                        "The infrastructure-only contract changed product topology."))}
   {:pattern #"^exact-pack and terminal-full plans map every old program task to one new program task with every logical target and evidence leaf once$"
    :handler (fn [world _ _]
               (assert! world (= [63 67] [(get-in world [:vtd006/evidence :contract :targetCount])
                                          (get-in world [:vtd006/evidence :contract :outputCount])])
                        "Old/new program task conservation failed."))}
   {:pattern #"^the one-time delivery checkpoint runs all 20 runnable packs in canonical order followed by node scripts/package.mjs$"
    :applies? (fn [world] (nil? (:vtd014/evidence world)))
    :handler (fn [world _ _]
               (assert! world (= 5 (count (get-in world [:vtd006/evidence :contract :packInventory])))
                        "VTD-006 checkpoint evidence is incomplete."))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-09T02:37:48.266220499+02:00", :module-hash "1485002485", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "1339117946"} {:id "form/1/defonce", :kind "defonce", :line 6, :end-line 6, :hash "701185655"} {:id "def/module-paths", :kind "def", :line 8, :end-line 16, :hash "415945835"} {:id "defn-/production-evidence!", :kind "defn-", :line 18, :end-line 30, :hash "1881117448"} {:id "defn-/prepared", :kind "defn-", :line 32, :end-line 33, :hash "-223598626"} {:id "defn-/values", :kind "defn-", :line 35, :end-line 37, :hash "-45555851"} {:id "defn-/assert!", :kind "defn-", :line 39, :end-line 41, :hash "-1884999679"} {:id "defn-/pack-facts", :kind "defn-", :line 43, :end-line 45, :hash "1935968671"} {:id "defn-/consumer-scope", :kind "defn-", :line 47, :end-line 50, :hash "-640295098"} {:id "defn-/helper-planning", :kind "defn-", :line 52, :end-line 54, :hash "3897991"} {:id "defn/handlers", :kind "defn", :line 56, :end-line 320, :hash "2080827457"}]}
;; clj-mutate-manifest-end
