(ns acceptance.steps.schema-workspace-runtime-support
  (:require [acceptance.steps.support :as support]))

(def canonical-source-names
  {"Live event" "captured event event-7"
   "Library template" "template Order complete"})

(defn canonical-source? [kind name]
  (= name (get canonical-source-names kind)))

(defn export-fixture [example]
  (let [schemas (support/example-value example "schema_count")
        rules (support/example-value example "rule_count")]
    (when (and schemas rules) (str schemas ":" rules))))

(defn require-world! [world key message]
  (support/assert! (get world key) message {:required key})
  world)

(defn source-value [example key]
  (support/require-example example key))

(defn count-value [example key]
  (Long/parseLong (source-value example key)))

(defn assert-export-preflight! [observation]
  (let [transfer (:transfer observation)
        stored (:before transfer)
        exported (:content transfer)]
    (support/assert! (= (:schemas stored) (:schemas exported))
                     "Schema Library export schema identities do not match stored identities."
                     {:stored (:schemas stored) :exported (:schemas exported)})
    (support/assert! (= (:rules stored) (:rules exported))
                     "Schema Library export rule identities do not match stored identities."
                     {:stored (:rules stored) :exported (:rules exported)})
    (support/assert! (= 1 (:version exported))
                     "Schema Library export format version is invalid."
                     {:version (:version exported)})
    observation))

(defn assert-export-counts! [observation example]
  (let [expected-schemas (count-value example "schema_count")
        expected-rules (count-value example "rule_count")
        exported (get-in observation [:transfer :content])
        reloaded (:reload observation)]
    (support/assert! (= expected-schemas (count (:schemas exported)))
                     "Schema Library export did not match the example schema count."
                     {:expected expected-schemas :actual (count (:schemas exported)) :observation observation})
    (support/assert! (= expected-rules (count (:rules exported)))
                     "Schema Library export did not match the example reusable-rule count."
                     {:expected expected-rules :actual (count (:rules exported)) :observation observation})
    (support/assert! (= {:stored expected-schemas :rendered expected-schemas :storedRules expected-rules} reloaded)
                     "Schema Library reload did not match the example schema count."
                     {:expected expected-schemas :actual reloaded :observation observation})))

(defn unchanged [world _example]
  world)
