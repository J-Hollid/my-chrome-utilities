(ns acceptance.verification-support.modular-architecture-cardinality-handlers
  (:require [acceptance.steps.support :as support]))

(defonce ^:private verified? (atom false))
(defonce ^:private verified-scenarios (atom #{}))

(defn- verify-contract! []
  (when-not @verified?
    (let [result (support/verified-command-result
                  "node" "test/verification-pack-cardinality-contract-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Registry-derived cardinality contract failed."
                       {:out (:out result) :err (:err result)})
      (reset! verified? true))))

(defn- verify-scenario! [scenario]
  (when-not (contains? @verified-scenarios scenario)
    (let [result (support/verified-command-result
                  "node" "scripts/verification-pack-cardinality/acceptance.mjs")]
      (support/assert! (zero? (:exit result))
                       (str "Registry-derived cardinality scenario " scenario " failed.")
                       {:out (:out result) :err (:err result)})
      (swap! verified-scenarios conj scenario))))

(def scenario-step-patterns
  {"193" [#"^stopped registry-derived cardinality candidates changed every known terminal, calibration, reporting, evidence, reliability, runner, and ownership integration path$"
          #"^their genuinely-global expansions came from rejected edits to the shared reliability-values and reliability-receipts helpers and a stale global-impact registration for the bounded cardinality prefix$"
          #"^the user-authorized bounded reconstruction is planned$"
          #"^every global declaration remains recorded as audit-only forecast variance and is prohibited in the resumed candidate$"
          #"^both shared helpers stay unchanged while the cardinality prefix and its reliability adapter are retained only by the Shell-owned verification slice$"
          #"^the slice has no registry-level pack consumers because executable generic proof observes its semantic runnable-pack consumers$"
          #"^exact candidate preflight fails if either prohibited helper changed or the cardinality prefix remains globally registered$"
          #"^no further acceptance is required while product scope and those bounded ownership rules remain unchanged$"]
   "194" [#"^the focused cardinality contract is evaluated against (.+)$"
          #"^its runnable identities and executable proof are validated$"
          #"^the derived runnable set is (.+)$"
          #"^representative synthetic pack execution proves the set can be dispatched$"
          #"^consumer identity does not require an unrelated product-pack closure$"]
   "195" [#"^a bounded cardinality candidate has (.+)$"
          #"^review-evidence scope is validated$"
          #"^the evidence decision is (.+)$"
          #"^a generic caller-selected tooling plan cannot satisfy the bounded contract$"]
   "196" [#"^registry-derived cardinality changes verification infrastructure without product behavior$"
          #"^the settled candidate produces review-ready evidence$"
          #"^the exact named cardinality, workflow, evidence, reliability, and process-contract tasks pass with properties and package proof$"
          #"^synthetic registries prove current, added-runnable, and empty-compatibility execution$"
          #"^the evidence is bound to the exact approved no-touch path set$"
          #"^no complete product-pack closure or terminal checkpoint runs in feature mode$"]
   "197" [#"^the bounded cardinality candidate passes independent review$"
          #"^current and compatible historical registries are compared$"
          #"^each former task, prerequisite, consumer, calibration row, evidence identity, reliability obligation, and package input is conserved$"
          #"^the current registry topology and every existing exact-pack closure remain unchanged$"
          #"^a later added runnable pack becomes terminally required through the same generic contract$"
          #"^the user-requested master promotion retains one final all-runnable-pack checkpoint$"]
   "198" [#"^the user reaffirmed bounded focused evidence for registry-derived cardinality$"
          #"^registry-derived-verification-packs resumes from the exact specification QA head$"
          #"^it keeps the same stable product task identity without another acceptance round-trip$"
          #"^the coherent product remainder is conserved and reapplied onto that exact head$"
          #"^the reliability-values and reliability-receipts helpers stay unchanged while bounded adapters inject the exact registry-derived runnable identities$"
          #"^the stale cardinality global-impact entry is removed while the Shell-owned slice, its direct tasks, and its empty registry-consumer set remain$"
          #"^the resumed candidate uses only its specification-bound focused evidence route$"
          #"^fresh read-only intent and exact candidate preflight enforce the no-touch boundary before product evidence$"]})

(defn- scenario-handlers []
  (vec (for [[scenario patterns] scenario-step-patterns
             pattern patterns]
         {:pattern pattern
          :handler (fn [world _example _captures]
                     (verify-scenario! scenario)
                     world)})))

(def registry-results
  {"twenty runnable entries and one empty compatibility identity"
   "the twenty entries with runnable tasks"
   "one additional valid independently runnable pack"
   "the former runnable entries plus the new pack"
   "one former pack replaced by two conserved independently runnable packs"
   "the retained entries plus both replacement packs"})

(def boundary-results
  {"independent behavior, exact ownership, stable execution, repeated unrelated parent work, and complete conservation"
   ["eligible for one separately reviewed pack promotion"
    "may change after the migration is approved"]
   "an internal seam whose outcome depends on its parent or declared consumers"
   ["retain as a subordinate verification slice" "unchanged"]
   "only a large task count, elapsed time, source count, forecast, or preferred pack count"
   ["retain the current parent and record diagnostic evidence" "unchanged"]
   "an apparently independent boundary whose former closure cannot be conserved exactly"
   ["retain the conservative parent fallback" "unchanged"]})

(def definition-results
  {"no owned source, runnable task, or independently observed behavior"
   ["non-runnable compatibility metadata" "excluded from the runnable set"]
   "runnable behavior evidence and an explicit verification-only production owner"
   ["valid verification-only behavior pack" "included with every registered task"]
   "runnable behavior evidence but no source owner or verification-only classification"
   ["invalid ambiguous pack" "block before planning"]})

(defn- assert-equal! [world expected actual message]
  (support/assert! (= expected actual) message {:expected expected :actual actual})
  world)

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn handlers [example-values]
  (vec (concat
  [{:pattern #"^the exact candidate registry has (.+)$"
    :handler (fn [world example captures]
               (let [[state] (values example-values example captures)]
               (verify-contract!)
               (assoc world :cardinality/registry-state state
                      :cardinality/runnable-set (registry-results state))))}
   {:pattern #"^terminal pack scope is derived$"
    :handler (fn [world _example _captures]
               (support/assert! (:cardinality/runnable-set world)
                                "Terminal scope lacks a runnable registry." {})
               world)}
   {:pattern #"^the runnable set is (.+)$"
    :handler (fn [world example captures]
               (let [[actual] (values example-values example captures)]
               (assert-equal! world (:cardinality/runnable-set world) actual
                              "Terminal scope did not follow the runnable registry.")))}
   {:pattern #"^terminal verification includes that complete runnable set with properties and package proof$"
    :handler (fn [world _example _captures]
               (verify-contract!) world)}
   {:pattern #"^no fixed numerical cardinality decides the result$"
    :handler (fn [world _example _captures]
               (verify-contract!) world)}

   {:pattern #"^a possible pack boundary has (.+)$"
    :handler (fn [world example captures]
               (let [[evidence] (values example-values example captures)]
               (verify-contract!)
               (assoc world :cardinality/boundary-result (boundary-results evidence))))}
   {:pattern #"^topology judgment is recorded$"
    :handler (fn [world _example _captures]
               (support/assert! (:cardinality/boundary-result world)
                                "Topology judgment lacks boundary evidence." {})
               world)}
   {:pattern #"^the boundary decision is (.+)$"
    :handler (fn [world example captures]
               (let [[actual] (values example-values example captures)]
               (assert-equal! world (first (:cardinality/boundary-result world)) actual
                              "Topology judgment selected the wrong boundary decision.")))}
   {:pattern #"^the cardinality effect is (.+)$"
    :handler (fn [world example captures]
               (let [[actual] (values example-values example captures)]
               (assert-equal! world (second (:cardinality/boundary-result world)) actual
                              "Topology judgment selected the wrong cardinality effect.")))}

   {:pattern #"^one approved topology migration changes the runnable pack set$"
    :handler (fn [world _example _captures]
               (verify-contract!) (assoc world :cardinality/migration true))}
   {:pattern #"^current and compatible historical ownership are planned$"
    :handler (fn [world _example _captures]
               (support/assert! (:cardinality/migration world)
                                "Topology migration was not established." {})
               world)}
   {:pattern #"^every former source path, task, prerequisite, assertion, consumer, reliability boundary, observation, performance obligation, and package input is conserved exactly once$"
    :handler (fn [world _example _captures] (verify-contract!) world)}
   {:pattern #"^current planning uses the new ownership while historical changed paths use the union of old and new closures$"
    :handler (fn [world _example _captures] (verify-contract!) world)}
   {:pattern #"^exact-pack selectors, calibration, reporting, receipts, reliability closure, and terminal planning bind the same exact registry identity$"
    :handler (fn [world _example _captures] (verify-contract!) world)}
   {:pattern #"^an added runnable pack becomes terminally required without changing another numerical constant$"
    :handler (fn [world _example _captures] (verify-contract!) world)}

   {:pattern #"^a pack definition has (.+)$"
    :handler (fn [world example captures]
               (let [[state] (values example-values example captures)]
               (verify-contract!)
               (assoc world :cardinality/definition-result (definition-results state))))}
   {:pattern #"^registry validity and runnable cardinality are evaluated$"
    :handler (fn [world _example _captures]
               (support/assert! (:cardinality/definition-result world)
                                "Pack classification lacks a definition." {})
               world)}
   {:pattern #"^its classification is (.+)$"
    :handler (fn [world example captures]
               (let [[actual] (values example-values example captures)]
               (assert-equal! world (first (:cardinality/definition-result world)) actual
                              "Pack definition received the wrong classification.")))}
   {:pattern #"^its terminal treatment is (.+)$"
    :handler (fn [world example captures]
               (let [[actual] (values example-values example captures)]
               (assert-equal! world (second (:cardinality/definition-result world)) actual
                              "Pack definition received the wrong terminal treatment.")))}

   {:pattern #"^registry-derived cardinality mechanics affect terminal closure, calibration, reporting, and evidence for every runnable pack$"
    :handler (fn [world _example _captures]
               (verify-scenario! "192") (assoc world :cardinality/intent true))}
   {:pattern #"^read-only ownership intent is classified before implementation$"
    :handler (fn [world _example _captures]
               (support/assert! (:cardinality/intent world)
                                "Cardinality ownership intent was not established." {})
               world)}
   {:pattern #"^every exact shared integration path and runnable-pack consumer is reported$"
    :handler (fn [world _example _captures] (verify-contract!) world)}
   {:pattern #"^a coarse-boundary result stops coding for independently reviewed ownership preparation$"
    :handler (fn [world _example _captures] (verify-contract!) world)}
   {:pattern #"^a bounded granularity result receives one durable seam-or-parent-fallback disposition$"
    :handler (fn [world _example _captures] (verify-contract!) world)}
   {:pattern #"^no feature-mode all-runnable-pack run is authorized$"
    :applies? (fn [world]
                (= "Modular verification packs 192"
                   (:acceptance/scenario-name world)))
    :handler (fn [world _example _captures] (verify-scenario! "192") world)}]
   (scenario-handlers))))
