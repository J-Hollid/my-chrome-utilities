(ns acceptance.steps.schema-workspace-runtime-browser-assertions
  (:require [acceptance.steps.schema-workspace-runtime-support :as runtime]
            [acceptance.steps.support :as support]))

(def source-steps
  #{"<source_kind> <source_name> contains nested payload properties page_type, page_name, and commerce.order.id"
    "the operator activates Create schema from this <source_kind>"
    "the schema editor renders expandable property rows for the observed payload hierarchy"
    "each row offers Add validation rule and View attached rules for its complete property path"
    "the operator does not have to type a property path into a free-form field"
    "no observed value becomes an active rule before the operator accepts it"})

(def property-rule-steps
  #{"the schema draft contains string property page_type and nested property commerce.order.id"
    "the operator adds, edits, disables, re-enables, and removes property rules through the rendered rule menus"
    "the affected property rows immediately show their active-rule counts and states"
    "View attached rules identifies each rule's parameters, severity, origin, and version"
    "keyboard focus returns to the originating property row when a rule menu closes"
    "saving and reopening the schema preserves the rendered rule attachments"})

(def inheritance-steps
  #{"Generic page view version 4 is the parent of an Order confirmation schema draft"
    "inherited and general rules are displayed in the editor"
    "every inherited rule offers Inherit, Enabled in this schema, and Disabled in this schema"
    "the editor separately renders active inherited, disabled inherited, explicitly re-enabled, and local rules"
    "the operator can configure Only declared properties through General rules"
    "the effective-rule preview identifies the originating schema and version for every rule"})

(def transfer-steps
  #{"the Schema Library contains schemas, reusable rules, assignments, revisions, inheritance exceptions, and examples"
    "the operator activates Export Schema Library"
    "the browser downloads 1 versioned JSON file containing the complete Schema Library"
    "the operator selects that file through Import Schema Library"
    "a rendered review offers Replace Schema Library and Append to Schema Library"
    "no import occurs through a text prompt or before the operator confirms a choice"
    "importing and reloading preserves the exported names, versions, rules, assignments, and exceptions"})

(def revision-steps
  #{"reusable rule Approved page types version 1 is saved"
    "the operator edits it to include confirmation"
    "a rendered Save revision review identifies the changed parameters and examples"
    "confirming creates version 2 while existing schema attachments remain pinned to version 1"
    "a schema attachment changes to version 2 only through its rendered update action"
    "Rule Library rows provide separate Edit, Duplicate, Export, and Delete actions"})

(def assignment-steps
  #{"generic and order-confirmation page_view assignments are saved with priorities 10 and 100"
    "page_view is captured from https://shop.example/order-confirmation"
    "the rendered event validation identifies the selected Order confirmation schema and exact version"
    "it identifies the matching source, event name, domain, pathname, and priority assignment"
    "the operator can select a different schema from the Live inspector for an explicit manual validation"
    "the Event Library editor provides the same explicit schema attachment control for its template"})

(def export-preflight-steps
  #{"shared browser setup observes an export envelope with format version, schema identities, and rule identities"
    "it observes the schema and rule identities stored immediately before export"
    "shared transfer verification runs for a scenario without export-count examples"
    "exported schema identities are compared only with stored schema identities"
    "exported rule identities are compared only with stored rule identities"
    "format version is verified separately from both identity collections"
    "valid envelope metadata does not cause an identity mismatch"
    "no scenario-specific library size is required before an export-count example is active"})

(defn- assert-source-paths! [observation]
  (support/assert! (= ["page_type" "page_name" "commerce" "commerce.order" "commerce.order.id"]
                      (get-in observation [:sourceCreation :paths]))
                   "Source schema browser controls did not render observed paths."
                   {:observation observation}))

(defn- assert-property-rules! [observation]
  (support/assert! (every? true? (map #(get-in observation [:rules %])
                                      [:menuOpen :returnFocus :stateReturnFocus]))
                   "Property rule browser controls were not observed."
                   {:observation observation}))

(defn- assert-inheritance! [observation]
  (support/assert! (= "active-inherited" (get-in observation [:inheritance :groups 0 :state]))
                   "Inherited browser rule state group is missing."
                   {:observation observation}))

(defn- assert-transfer! [observation]
  (support/assert! (= (:stored (:reload observation)) (:rendered (:reload observation)))
                   "Schema Library browser reload evidence is missing."
                   {:observation observation}))

(defn- assert-revision! [observation]
  (support/assert! (true? (get-in observation [:rules :revisionReview :open]))
                   "Rule revision browser evidence is missing."
                   {:observation observation}))

(defn- assert-assignment! [observation]
  (support/assert! (= 120 (get-in observation [:assignment :priority]))
                   "Assignment browser evidence is missing."
                   {:observation observation}))

(defn- assert-validation! [observation]
  (support/assert! (re-find #"Not checked|Valid|warnings|issues"
                            (str (get-in observation [:validation :validation])))
                   "Live validation browser evidence is missing."
                   {:observation observation}))

(def assertion-groups
  [[source-steps assert-source-paths!]
   [property-rule-steps assert-property-rules!]
   [inheritance-steps assert-inheritance!]
   [transfer-steps assert-transfer!]
   [revision-steps assert-revision!]
   [assignment-steps assert-assignment!]
   [export-preflight-steps runtime/assert-export-preflight!]])

(def assertions-by-step
  (into {}
        (mapcat (fn [[steps assertion]]
                  (map #(vector % assertion) steps))
                assertion-groups)))

(defn assert-browser-step! [text observation]
  (support/assert! observation "Schema workspace browser adapter was not executed." {})
  ((get assertions-by-step text assert-validation!) observation))
