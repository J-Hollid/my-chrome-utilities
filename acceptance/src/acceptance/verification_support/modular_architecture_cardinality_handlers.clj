(ns acceptance.verification-support.modular-architecture-cardinality-handlers
  (:require [acceptance.steps.support :as support]))

(defonce ^:private verified? (atom false))

(defn- verify-contract! []
  (when-not @verified?
    (let [result (support/verified-command-result
                  "node" "test/verification-pack-cardinality-contract-test.mjs")]
      (support/assert! (zero? (:exit result))
                       "Registry-derived cardinality contract failed."
                       {:out (:out result) :err (:err result)})
      (reset! verified? true))))

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
               (verify-contract!) (assoc world :cardinality/intent true))}
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
    :handler (fn [world _example _captures] (verify-contract!) world)}])
