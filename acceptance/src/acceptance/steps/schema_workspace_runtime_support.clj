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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T11:47:22.031260615+02:00", :module-hash "-23667992", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "644650029"} {:id "def/canonical-source-names", :kind "def", :line 4, :end-line nil, :hash "1084522028"} {:id "defn/canonical-source?", :kind "defn", :line 8, :end-line nil, :hash "408483762"} {:id "defn/export-fixture", :kind "defn", :line 11, :end-line nil, :hash "44424441"} {:id "defn/require-world!", :kind "defn", :line 16, :end-line nil, :hash "1787982356"} {:id "defn/source-value", :kind "defn", :line 20, :end-line nil, :hash "-87210748"} {:id "defn/count-value", :kind "defn", :line 23, :end-line nil, :hash "-1990655214"} {:id "defn/assert-export-preflight!", :kind "defn", :line 26, :end-line nil, :hash "1381746461"} {:id "defn/assert-export-counts!", :kind "defn", :line 41, :end-line nil, :hash "195110211"} {:id "defn/unchanged", :kind "defn", :line 56, :end-line nil, :hash "-2112596417"}]}
;; clj-mutate-manifest-end
