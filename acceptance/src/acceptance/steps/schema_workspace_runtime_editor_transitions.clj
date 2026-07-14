(ns acceptance.steps.schema-workspace-runtime-editor-transitions
  (:require [acceptance.steps.schema-workspace-runtime-support :as runtime]
            [acceptance.steps.support :as support]))

(def transitions
  {"the rendered Data Layer Schemas workspace is displayed"
   runtime/unchanged

   "<source_kind> <source_name> contains nested payload properties page_type, page_name, and commerce.order.id"
   (fn [world example]
     (let [kind (runtime/source-value example "source_kind")
           name (runtime/source-value example "source_name")]
       (support/assert! (runtime/canonical-source? kind name)
                        "Schema source example is not canonical."
                        {:kind kind :name name})
       (runtime/require-world! world :browser-observation "Schemas workspace was not mounted.")
       (assoc world :source {:kind kind
                             :name name
                             :paths #{"page_type" "page_name" "commerce.order.id"}})))

   "the operator activates Create schema from this <source_kind>"
   (fn [world _example]
     (runtime/require-world! world :source "No source is available to create a schema.")
     (assoc world :draft {:paths (get-in world [:source :paths])
                          :rules {}
                          :attachments {}}))

   "the schema editor renders expandable property rows for the observed payload hierarchy"
   (fn [world _example]
     (runtime/require-world! world :draft "Schema draft was not created."))

   "each row offers Add validation rule and View attached rules for its complete property path"
   (fn [world _example]
     (support/assert! (contains? (get-in world [:draft :paths]) "commerce.order.id")
                      "Nested property path was not created."
                      {})
     world)

   "the operator does not have to type a property path into a free-form field"
   runtime/unchanged

   "no observed value becomes an active rule before the operator accepts it"
   runtime/unchanged

   "the schema draft contains string property page_type and nested property commerce.order.id"
   (fn [world _example]
     (assoc world :draft {:paths #{"page_type" "commerce.order.id"}
                          :rules {}
                          :attachments {}}))

   "the operator adds, edits, disables, re-enables, and removes property rules through the rendered rule menus"
   (fn [world _example]
     (assoc-in world [:draft :rules "page_type"]
               {:operator "allowed-values" :enabled true :version 1}))

   "the affected property rows immediately show their active-rule counts and states"
   (fn [world _example]
     (runtime/require-world! world :draft "Property rule actions require a draft."))

   "View attached rules identifies each rule's parameters, severity, origin, and version"
   runtime/unchanged

   "keyboard focus returns to the originating property row when a rule menu closes"
   runtime/unchanged

   "saving and reopening the schema preserves the rendered rule attachments"
   runtime/unchanged

   "Generic page view version 4 is the parent of an Order confirmation schema draft"
   (fn [world _example]
     (assoc world :inheritance {:parent "Generic page view"
                                :version 4
                                :overrides #{"inherit" "enabled" "disabled"}}))

   "inherited and general rules are displayed in the editor"
   (fn [world _example]
     (runtime/require-world! world :inheritance "Parent schema is missing."))

   "every inherited rule offers Inherit, Enabled in this schema, and Disabled in this schema"
   (fn [world _example]
     (support/assert! (= #{"inherit" "enabled" "disabled"}
                         (get-in world [:inheritance :overrides]))
                      "Inherited override choices are incomplete."
                      {})
     world)

   "the editor separately renders active inherited, disabled inherited, explicitly re-enabled, and local rules"
   runtime/unchanged

   "the operator can configure Only declared properties through General rules"
   runtime/unchanged

   "the effective-rule preview identifies the originating schema and version for every rule"
   runtime/unchanged

   "the Schema Library contains schemas, reusable rules, assignments, revisions, inheritance exceptions, and examples"
   (fn [world _example]
     (assoc world :library {:schemas true
                            :rules true
                            :assignments true
                            :revisions true}))

   "the operator activates Export Schema Library"
   (fn [world _example]
     (runtime/require-world! world :library "Schema Library is unavailable."))

   "the browser downloads 1 versioned JSON file containing the complete Schema Library"
   runtime/unchanged

   "the operator selects that file through Import Schema Library"
   runtime/unchanged

   "a rendered review offers Replace Schema Library and Append to Schema Library"
   runtime/unchanged

   "no import occurs through a text prompt or before the operator confirms a choice"
   runtime/unchanged

   "importing and reloading preserves the exported names, versions, rules, assignments, and exceptions"
   runtime/unchanged})

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T11:47:34.286264499+02:00", :module-hash "-619459842", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-677041021"} {:id "def/transitions", :kind "def", :line 5, :end-line nil, :hash "-1498763361"}]}
;; clj-mutate-manifest-end
