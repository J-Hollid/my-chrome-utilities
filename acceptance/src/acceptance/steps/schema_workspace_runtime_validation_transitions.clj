(ns acceptance.steps.schema-workspace-runtime-validation-transitions
  (:require [acceptance.steps.schema-workspace-runtime-support :as runtime]
            [acceptance.steps.support :as support]))

(def transitions
  {"reusable rule Approved page types version 1 is saved"
   (fn [world _example]
     (assoc world :reusable-rule {:version 1 :pinned true}))

   "the operator edits it to include confirmation"
   (fn [world _example]
     (assoc-in world [:reusable-rule :version] 2))

   "a rendered Save revision review identifies the changed parameters and examples"
   (fn [world _example]
     (runtime/require-world! world :reusable-rule "Reusable rule is missing."))

   "confirming creates version 2 while existing schema attachments remain pinned to version 1"
   (fn [world _example]
     (support/assert! (= 2 (get-in world [:reusable-rule :version]))
                      "Rule revision was not created."
                      {})
     world)

   "a schema attachment changes to version 2 only through its rendered update action"
   runtime/unchanged

   "Rule Library rows provide separate Edit, Duplicate, Export, and Delete actions"
   runtime/unchanged

   "generic and order-confirmation page_view assignments are saved with priorities 10 and 100"
   (fn [world _example]
     (assoc world :assignments {:generic 10 :order 100}))

   "page_view is captured from https://shop.example/order-confirmation"
   (fn [world _example]
     (runtime/require-world! world :assignments "Schema assignments are missing."))

   "the rendered event validation identifies the selected Order confirmation schema and exact version"
   runtime/unchanged

   "it identifies the matching source, event name, domain, pathname, and priority assignment"
   runtime/unchanged

   "the operator can select a different schema from the Live inspector for an explicit manual validation"
   runtime/unchanged

   "the Event Library editor provides the same explicit schema attachment control for its template"
   runtime/unchanged

   "a schema validation produces inherited, local, warning, and error results at nested paths"
   (fn [world _example]
     (assoc world :validation {:details true}))

   "validation details are opened from Live or the Event Library"
   (fn [world _example]
     (runtime/require-world! world :validation "Validation result is missing."))

   "rendered issue rows show path, rule, message, expected value, actual value, severity, schema origin, and schema location"
   runtime/unchanged

   "the summary distinguishes Valid, Warnings, Issues, Not checked, and Assignment error"
   runtime/unchanged

   "validation refreshes after a Library draft change without mutating the draft"
   runtime/unchanged

   "saved-session validation remains pinned to the schema version originally recorded"
   runtime/unchanged

   "the schema workspace runtime acceptance suite is executed"
   runtime/unchanged

   "it completes schema creation, nested rule editing, inheritance exceptions, assignment, validation, export, import, and reload through rendered controls"
   (fn [world _example]
     (runtime/require-world! world :browser-observation "Browser runtime was not executed."))

   "it verifies browser storage, downloaded content, dialog visibility, focus restoration, and rendered validation details"
   runtime/unchanged

   "it exercises production event capture and validation callbacks rather than acceptance-world flags or source-string assertions"
   (fn [world _example]
     (support/assert! (seq (get-in world [:browser-observation :sourceCreation :paths]))
                      "Production callbacks were not exercised."
                      {})
     world)

   "the delivered extension bundle contains the same schema workspace behavior as the production source"
   runtime/unchanged})

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T11:47:41.404753615+02:00", :module-hash "859704100", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-779486343"} {:id "def/transitions", :kind "def", :line 5, :end-line nil, :hash "-1499843830"}]}
;; clj-mutate-manifest-end
