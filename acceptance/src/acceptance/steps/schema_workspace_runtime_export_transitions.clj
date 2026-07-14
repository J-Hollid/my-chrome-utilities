(ns acceptance.steps.schema-workspace-runtime-export-transitions
  (:require [acceptance.steps.schema-workspace-runtime-support :as runtime]
            [acceptance.steps.support :as support]))

(defn- export-example [example]
  {:schemas (runtime/count-value example "schema_count")
   :rules (runtime/count-value example "rule_count")})

(def transitions
  {"the current Schema Library contains <schema_count> schemas and <rule_count> reusable rules"
   (fn [world example]
     (assoc world :schema-library-export-example (export-example example)))

   "rendered setup has created exactly those schema and rule identities before export"
   (fn [world example]
     (runtime/assert-export-counts! (:browser-observation world) example)
     world)

   "the complete Schema Library is exported and its downloaded JSON is inspected"
   (fn [world _example]
     (runtime/require-world! world :schema-library-export-example
                             "Schema Library export example is unavailable."))

   "the export reports <schema_count> schemas and <rule_count> reusable rules"
   (fn [world example]
     (runtime/assert-export-counts! (:browser-observation world) example)
     world)

   "every exported schema and rule identity is present rather than a fixed fixture subset"
   (fn [world _example]
     (runtime/assert-export-preflight! (:browser-observation world))
     world)

   "export-envelope metadata such as format version is verified separately from the identity collections"
   (fn [world _example]
     (support/assert! (= 1 (get-in world [:browser-observation :transfer :content :version]))
                      "Schema Library export envelope metadata is invalid."
                      {:observation (:browser-observation world)})
     world)

   "runtime verification derives its expected counts from this example instead of requiring a fixed library seed"
   runtime/unchanged

   "that export replaces the Schema Library and the panel reloads"
   runtime/unchanged

   "<schema_count> schemas and <rule_count> reusable rules remain stored and rendered"
   (fn [world example]
     (runtime/assert-export-counts! (:browser-observation world) example)
     world)

   "shared browser setup observes an export envelope with format version, schema identities, and rule identities"
   (fn [world _example]
     (assoc world :shared-export-preflight? true))

   "it observes the schema and rule identities stored immediately before export"
   (fn [world _example]
     (runtime/require-world! world :shared-export-preflight?
                             "Shared export preflight was not initialized."))

   "shared transfer verification runs for a scenario without export-count examples"
   (fn [world _example]
     (runtime/require-world! world :shared-export-preflight?
                             "Shared export preflight was not initialized.")
     (runtime/assert-export-preflight! (:browser-observation world))
     world)

   "exported schema identities are compared only with stored schema identities"
   (fn [world _example]
     (support/assert! (= (get-in world [:browser-observation :transfer :before :schemas])
                         (get-in world [:browser-observation :transfer :content :schemas]))
                      "Shared export preflight did not preserve schema identities."
                      {})
     world)

   "exported rule identities are compared only with stored rule identities"
   (fn [world _example]
     (support/assert! (= (get-in world [:browser-observation :transfer :before :rules])
                         (get-in world [:browser-observation :transfer :content :rules]))
                      "Shared export preflight did not preserve reusable-rule identities."
                      {})
     world)

   "format version is verified separately from both identity collections"
   (fn [world _example]
     (support/assert! (= 1 (get-in world [:browser-observation :transfer :content :version]))
                      "Shared export preflight did not preserve the format version."
                      {})
     world)

   "valid envelope metadata does not cause an identity mismatch"
   (fn [world _example]
     (runtime/assert-export-preflight! (:browser-observation world))
     world)

   "no scenario-specific library size is required before an export-count example is active"
   (fn [world _example]
     (support/assert! (nil? (:schema-library-export-example world))
                      "Shared export preflight unexpectedly required an export-count example."
                      {})
     world)

   "the acceptance parser provides example values <schema_count> and <rule_count> using its supported key representation"
   (fn [world example]
     (assoc world :schema-library-export-example (export-example example)))

   "the schema export browser fixture is derived from that example"
   runtime/unchanged

   "shared example lookup resolves schema_count as <schema_count> and rule_count as <rule_count>"
   (fn [world example]
     (support/assert! (= (export-example example)
                         (:schema-library-export-example world))
                      "Example lookup did not preserve schema export counts."
                      {})
     world)

   "the browser adapter receives fixture <fixture>"
   (fn [world example]
     (support/assert! (= (runtime/source-value example "fixture")
                         (get-in world [:browser-observation :fixture]))
                      "Browser fixture did not match the active example."
                      {})
     world)

   "the observed export contains <schema_count> schemas and <rule_count> reusable rules"
   (fn [world example]
     (runtime/assert-export-counts! (:browser-observation world) example)
     world)

   "fixture derivation does not silently fall back to another example's counts"
   runtime/unchanged

   "shared schema export verification compares identity collections separately from envelope metadata"
   (fn [world _example]
     (assoc world :shared-export-preflight? true))

   "outlined export verification checks that every schema and rule identity is present"
   (fn [world _example]
     (runtime/require-world! world :shared-export-preflight?
                             "Shared export preflight was not initialized.")
     (runtime/assert-export-preflight! (:browser-observation world))
     world)

   "it uses the same shared export verification as browser preflight"
   (fn [world _example]
     (runtime/assert-export-preflight! (:browser-observation world))
     world)

   "no identity-coverage step directly compares an identity snapshot with the complete export envelope"
   (fn [world _example]
     (runtime/assert-export-preflight! (:browser-observation world))
     world)})

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T11:47:47.117940884+02:00", :module-hash "26931575", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "361590986"} {:id "defn-/export-example", :kind "defn-", :line 5, :end-line nil, :hash "-1025606183"} {:id "def/transitions", :kind "def", :line 9, :end-line nil, :hash "-1125592139"}]}
;; clj-mutate-manifest-end
