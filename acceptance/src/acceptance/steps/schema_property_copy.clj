(ns acceptance.steps.schema-property-copy
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-schema-property-copy.feature" "features/data-layer-schema-property-copy-runtime.feature"])
(def entry-modes
  {"Generic pageview revision 7 contains documented properties with local, reusable, and conditional validation rules" :model
   "the built extension side panel is running with the production Schema Library, property editor, rule editor, conditional validation, documentation, working drafts, and persistence" :runtime})
(defonce model-verified? (atom false))(defonce browser-observation (atom nil))
(defn- verify-model! [](support/cached-command-verification! model-verified? "Schema-property-copy model verification failed. " "node" "test/data-layer-schema-property-copy-test.mjs"))
(defn- runtime-observation! [](support/cached-browser-observation! browser-observation {:adapter-env "SCHEMA_PROPERTY_COPY_BROWSER_ADAPTER" :observation-key :schemaPropertyCopy :runtime-error "Schema-property-copy browser runtime failed." :missing-error "Schema-property-copy browser evidence is missing."}))
(defn- assert-runtime! [{:keys [review applied undo persisted reloaded layout runtimeErrors] :as observed}]
  (support/assert! (and (:open review) (:unchanged review) (str/includes? (:source review) "Generic pageview revision 7")
                        (not-any? #(str/includes? % "Generic pageview") (:destinations review))
                        (every? #(str/includes? (:text review) %) ["/error_message" "/error_action" "/error_type" "local copy" "reusable attachment" "Property documentation"]))
                   "Production copy review lost identity, dependency, ownership, or no-mutation evidence." review)
  (support/assert! (and (:publishedUnchanged applied) (:sourceUnchanged applied)
                        (= ["error_message" "error_action" "error_type"] (:paths applied))
                        (= "in_page" (:assignment applied))
                        (= 1 (count (filter #(= "reusable:error-type" (:id %)) (:rules applied))))
                        (some #(= "local:message" (:copySourceRuleId %)) (:rules applied))
                        (= #{"/error_action" "/error_message" "/error_type"} (set (:documentation applied)))
                        (str/includes? (last (:pending applied)) "revision 7 property /error_message")
                        (= "Copy /error_message to another schema" (:focus applied))
                        (= {:editor 51 :tree 37} (:scroll applied)))
                   "Atomic copy, rule identity, documentation, or presentation restoration diverged." applied)
  (support/assert! (and (:equivalent undo) (str/includes? (:feedback undo) "pre-copy working draft")
                        (= {:pending 1 :path "string"} persisted)
                        (= "string" (:path reloaded)) (= 1 (:pending reloaded))
                        (str/includes? (:status reloaded) "1 pending change") (= "Publish revision" (:publish reloaded))
                        (<= (:body layout) (:width layout)) (<= (:width review) (:width layout)) (<= (:scrollWidth review) (:width layout))
                        (empty? runtimeErrors))
                   "Undo, persistence, ordinary draft workflow, layout, or runtime safety regressed." observed)
  observed)

(def model-example-values
  {"selected_path" #{"/products" "/products/*/id" "/a~1b/tilde~0name"}
   "source_ownership" #{"source-owned local rule" "reusable rule attachment" "inherited rule not otherwise shared" "inherited reusable rule already effective in destination"}
   "destination_ownership" #{"independent local copy with new identity and source provenance" "attachment to the same reusable rule identity" "local snapshot identifying inherited origin" "existing effective attachment without a local duplicate"}
   "later_edit_effect" #{"no automatic destination change" "reusable revisions follow attachment policy" "one effective shared rule remains"}
   "existing_state" #{"no selected path" "identical property and rule" "compatible parent with missing child" "same path with different property type" "ancestor with incompatible non-container type" "same local rule semantics with different id" "same rule identity with different configuration" "different documentation at the same path"}
   "review_outcome" #{"clean addition" "reuse with no duplicate" "merge missing child" "property conflict" "blocked structural conflict" "semantic duplicate reused" "rule conflict" "documentation conflict"}
   "confirmation_behavior" #{"enabled" "choose keep destination, replace from source, or cancel" "disabled until destination structure changes" "choose one configuration or cancel" "choose destination text, source text, or cancel"}
   "source_view" #{"current published revision 7" "visible working draft based on 7" "historical revision 5"}
   "copied_snapshot" #{"immutable revision 7" "current visible working draft" "immutable revision 5"}
   "source_label" #{"Generic pageview revision 7" "Generic pageview working draft based on 7" "Generic pageview revision 5"}})

(def runtime-example-values
  {"selected_path" #{"/commerce" "/context/user/id" "/products/*/id" "/a~1b/tilde~0name"}
   "destination_state" #{"no commerce property" "no context property" "products array without id" "no escaped-name property"}
   "stored_paths" #{"complete commerce subtree" "context, context/user, and context/user/id" "existing products path and products wildcard id" "exact canonical escaped path and ancestors"}
   "sibling_outcome" #{"source root siblings absent" "user siblings absent" "array item siblings unchanged" "decoded names not flattened"}
   "rule_kind" #{"source local conditional rule" "reusable rule attachment" "inherited local rule" "reusable rule already inherited by destination"}
   "stored_outcome" #{"independent local identity with copied configuration" "same reusable identity attached once" "destination local snapshot with origin metadata" "no additional local attachment"}
   "collision" #{"identical property and rule" "compatible parent missing selected child" "selected property has incompatible type" "parent is incompatible scalar" "rule identity has different configuration" "documentation differs"}
   "operator_choice" #{"confirm" "merge" "keep destination" "replace from source" "no choice" "cancel" "use source text"}
   "result" #{"existing configuration reused once" "missing child added" "source property excluded with dependent review" "source subtree replaces reviewed destination items" "confirmation blocked" "destination unchanged" "source property documentation stored"}
   "source_surface" #{"current published revision 7" "visible working draft based on 7" "historical revision 5"}
   "expected_snapshot" #{"revision 7" "current working draft" "revision 5"}})
(defn- validate-example! [mode example](support/validate-mode-example-domain! mode runtime-example-values model-example-values example "Schema-property-copy example value was outside the specified contract."))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :schema-property-copy-mode verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T11:52:47.917486798+02:00", :module-hash "-56992823", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "178722627"} {:id "def/feature-files", :kind "def", :line 5, :end-line 5, :hash "-412747383"} {:id "def/entry-modes", :kind "def", :line 6, :end-line 8, :hash "-1160011680"} {:id "form/3/defonce", :kind "defonce", :line 9, :end-line 9, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 9, :end-line 9, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 10, :end-line 10, :hash "1207300717"} {:id "defn-/runtime-observation!", :kind "defn-", :line 11, :end-line 11, :hash "2065176737"} {:id "defn-/assert-runtime!", :kind "defn-", :line 12, :end-line 34, :hash "-2106312305"} {:id "def/model-example-values", :kind "def", :line 36, :end-line 46, :hash "1842986626"} {:id "def/runtime-example-values", :kind "def", :line 48, :end-line 59, :hash "2110793021"} {:id "defn-/validate-example!", :kind "defn-", :line 60, :end-line 60, :hash "700526207"} {:id "def/handlers", :kind "def", :line 61, :end-line 61, :hash "-1383116955"}]}
;; clj-mutate-manifest-end
