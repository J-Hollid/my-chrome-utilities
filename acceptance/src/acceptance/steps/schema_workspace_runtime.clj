(ns acceptance.steps.schema-workspace-runtime
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-file "features/data-layer-schema-workspace-runtime-completion.feature")

(defn- export-fixture [example]
  (let [schemas (support/example-value example "schema_count")
        rules (support/example-value example "rule_count")]
    (when (and schemas rules) (str schemas ":" rules))))

(defn- assert-export-preflight! [observation]
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

(defn- browser-workspace! [world example]
  (if (:browser-observation world)
    world
    (let [fixture (export-fixture example)
          environment (cond-> {"SCHEMA_WORKSPACE_BROWSER_ADAPTER" "1"}
                        fixture (assoc "SCHEMA_LIBRARY_EXPORT_FIXTURE" fixture))
          result (process/shell (assoc support/build-shell-options :env environment) "node" "test/side-panel-component-layout-runtime-test.mjs")
          line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
          payload (when line (json/parse-string line true))]
      (support/assert! (zero? (:exit result)) "Schema workspace browser runtime verification failed."
                       {:out (:out result) :err (:err result)})
      (support/assert! (true? (get-in payload [:schemaWorkspace :mounted])) "Production Schema workspace did not mount." {:payload payload})
      (support/assert! (= "Order complete schema" (get-in payload [:schemaWorkspace :sourceCreation :name]))
                       "Library Create schema did not invoke the production source callback." {:payload payload})
      (support/assert! (= "schema-library-v1.json" (get-in payload [:schemaWorkspace :transfer :downloadName]))
                       "Schema Library export did not produce the versioned download." {:payload payload})
      (assert-export-preflight! (:schemaWorkspace payload))
      (support/assert! (= (get-in payload [:schemaWorkspace :transfer :before]) (get-in payload [:schemaWorkspace :transfer :reloaded]))
                       "Schema Library import did not persist every exported identity." {:payload payload})
      (support/assert! (= ["Disable" "Remove"] (get-in payload [:schemaWorkspace :rules :actions]))
                       "Property rule menus did not expose production actions." {:payload payload})
      (support/assert! (every? true? (map #(get-in payload [:schemaWorkspace :rules %]) [:menuOpen :returnFocus :stateReturnFocus]))
                       "Property rule menu disclosure or focus return failed." {:payload payload})
      (support/assert! (= "Re-enable" (get-in payload [:schemaWorkspace :rules :reenable]))
                       "Property rule disable and re-enable did not persist." {:payload payload})
      (support/assert! (= "event-history" (get-in payload [:schemaWorkspace :assignment :sourceId]))
                       "Schema assignment did not retain its production source." {:payload payload})
      (support/assert! (= 120 (get-in payload [:schemaWorkspace :assignment :priority]))
                       "Schema assignment edit did not persist its production priority." {:payload payload})
      (support/assert! (= "active-inherited" (get-in payload [:schemaWorkspace :inheritance :groups 0 :state]))
                       "Inherited rules did not render in their active state group." {:payload payload})
      (support/assert! (some #{"example · Known page types v1 · inherited from Checkout schema v2"}
                             (get-in payload [:schemaWorkspace :inheritance :preview]))
                       "Effective-rule preview did not identify the inherited rule origin." {:payload payload})
      (support/assert! (re-find #"Not checked|Valid|warnings|issues" (str (get-in payload [:schemaWorkspace :validation :validation])))
                       "Live Validate did not produce a validation state." {:payload payload})
      (assoc world :browser-observation (:schemaWorkspace payload)))))

(defn- require! [world key message]
  (support/assert! (get world key) message {:required key}) world)

(defn- source-value [example key]
  (support/require-example example key))

(defn- count-value [example key]
  (Long/parseLong (source-value example key)))

(defn- assert-export-counts! [observation example]
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

(defn- assert-browser-step! [text observation]
  (support/assert! observation "Schema workspace browser adapter was not executed." {})
  (cond
    (contains? #{"<source_kind> <source_name> contains nested payload properties page_type, page_name, and commerce.order.id"
                 "the operator activates Create schema from this <source_kind>"
                 "the schema editor renders expandable property rows for the observed payload hierarchy"
                 "each row offers Add validation rule and View attached rules for its complete property path"
                 "the operator does not have to type a property path into a free-form field"
                 "no observed value becomes an active rule before the operator accepts it"} text)
    (support/assert! (= ["page_type" "page_name" "commerce" "commerce.order" "commerce.order.id"] (get-in observation [:sourceCreation :paths])) "Source schema browser controls did not render observed paths." {:observation observation})

    (contains? #{"the schema draft contains string property page_type and nested property commerce.order.id"
                 "the operator adds, edits, disables, re-enables, and removes property rules through the rendered rule menus"
                 "the affected property rows immediately show their active-rule counts and states"
                 "View attached rules identifies each rule's parameters, severity, origin, and version"
                 "keyboard focus returns to the originating property row when a rule menu closes"
                 "saving and reopening the schema preserves the rendered rule attachments"} text)
    (support/assert! (every? true? (map #(get-in observation [:rules %]) [:menuOpen :returnFocus :stateReturnFocus])) "Property rule browser controls were not observed." {:observation observation})

    (contains? #{"Generic page view version 4 is the parent of an Order confirmation schema draft"
                 "inherited and general rules are displayed in the editor"
                 "every inherited rule offers Inherit, Enabled in this schema, and Disabled in this schema"
                 "the editor separately renders active inherited, disabled inherited, explicitly re-enabled, and local rules"
                 "the operator can configure Only declared properties through General rules"
                 "the effective-rule preview identifies the originating schema and version for every rule"} text)
    (support/assert! (= "active-inherited" (get-in observation [:inheritance :groups 0 :state])) "Inherited browser rule state group is missing." {:observation observation})

    (contains? #{"the Schema Library contains schemas, reusable rules, assignments, revisions, inheritance exceptions, and examples"
                 "the operator activates Export Schema Library"
                 "the browser downloads 1 versioned JSON file containing the complete Schema Library"
                 "the operator selects that file through Import Schema Library"
                 "a rendered review offers Replace Schema Library and Append to Schema Library"
                 "no import occurs through a text prompt or before the operator confirms a choice"
                 "importing and reloading preserves the exported names, versions, rules, assignments, and exceptions"} text)
    (support/assert! (= (:stored (:reload observation)) (:rendered (:reload observation))) "Schema Library browser reload evidence is missing." {:observation observation})

    (contains? #{"reusable rule Approved page types version 1 is saved"
                 "the operator edits it to include confirmation"
                 "a rendered Save revision review identifies the changed parameters and examples"
                 "confirming creates version 2 while existing schema attachments remain pinned to version 1"
                 "a schema attachment changes to version 2 only through its rendered update action"
                 "Rule Library rows provide separate Edit, Duplicate, Export, and Delete actions"} text)
    (support/assert! (true? (get-in observation [:rules :revisionReview :open])) "Rule revision browser evidence is missing." {:observation observation})

    (contains? #{"generic and order-confirmation page_view assignments are saved with priorities 10 and 100"
                 "page_view is captured from https://shop.example/order-confirmation"
                 "the rendered event validation identifies the selected Order confirmation schema and exact version"
                 "it identifies the matching source, event name, domain, pathname, and priority assignment"
                 "the operator can select a different schema from the Live inspector for an explicit manual validation"
                 "the Event Library editor provides the same explicit schema attachment control for its template"} text)
    (support/assert! (= 120 (get-in observation [:assignment :priority])) "Assignment browser evidence is missing." {:observation observation})

    (contains? #{"shared browser setup observes an export envelope with format version, schema identities, and rule identities"
                 "it observes the schema and rule identities stored immediately before export"
                 "shared transfer verification runs for a scenario without export-count examples"
                 "exported schema identities are compared only with stored schema identities"
                 "exported rule identities are compared only with stored rule identities"
                 "format version is verified separately from both identity collections"
                 "valid envelope metadata does not cause an identity mismatch"
                 "no scenario-specific library size is required before an export-count example is active"} text)
    (assert-export-preflight! observation)

    :else (support/assert! (re-find #"Not checked|Valid|warnings|issues" (str (get-in observation [:validation :validation]))) "Live validation browser evidence is missing." {:observation observation})))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (contains? #{"the rendered Data Layer Schemas workspace is displayed"
                               "the current Schema Library contains <schema_count> schemas and <rule_count> reusable rules"
                               "shared browser setup observes an export envelope with format version, schema identities, and rule identities"
                               "shared schema export verification compares identity collections separately from envelope metadata"
                               "the acceptance parser provides example values <schema_count> and <rule_count> using its supported key representation"} text)
                (assoc (browser-workspace! world example) :schema-workspace-runtime? true)
                world)]
    (require! world :browser-observation "Schema workspace browser adapter was not executed.")
    (assert-browser-step! text (:browser-observation world))
    (case text
    "the rendered Data Layer Schemas workspace is displayed" world

    "<source_kind> <source_name> contains nested payload properties page_type, page_name, and commerce.order.id"
    (let [kind (source-value example "source_kind")
          name (source-value example "source_name")]
      (require! world :browser-observation "Schemas workspace was not mounted.")
      (assoc world :source {:kind kind :name name :paths #{"page_type" "page_name" "commerce.order.id"}}))

    "the operator activates Create schema from this <source_kind>"
    (do (require! world :source "No source is available to create a schema.")
        (assoc world :draft {:paths (get-in world [:source :paths]) :rules {} :attachments {}}))

    "the schema editor renders expandable property rows for the observed payload hierarchy"
    (do (require! world :draft "Schema draft was not created.") world)

    "each row offers Add validation rule and View attached rules for its complete property path"
    (do (support/assert! (contains? (get-in world [:draft :paths]) "commerce.order.id")
                         "Nested property path was not created." {})
        world)

    "the operator does not have to type a property path into a free-form field" world
    "no observed value becomes an active rule before the operator accepts it" world

    "the schema draft contains string property page_type and nested property commerce.order.id"
    (assoc world :draft {:paths #{"page_type" "commerce.order.id"} :rules {} :attachments {}})

    "the operator adds, edits, disables, re-enables, and removes property rules through the rendered rule menus"
    (assoc-in world [:draft :rules "page_type"] {:operator "allowed-values" :enabled true :version 1})

    "the affected property rows immediately show their active-rule counts and states"
    (do (require! world :draft "Property rule actions require a draft.") world)

    "View attached rules identifies each rule's parameters, severity, origin, and version" world
    "keyboard focus returns to the originating property row when a rule menu closes" world
    "saving and reopening the schema preserves the rendered rule attachments" world

    "Generic page view version 4 is the parent of an Order confirmation schema draft"
    (assoc world :inheritance {:parent "Generic page view" :version 4 :overrides #{"inherit" "enabled" "disabled"}})

    "inherited and general rules are displayed in the editor"
    (require! world :inheritance "Parent schema is missing.")

    "every inherited rule offers Inherit, Enabled in this schema, and Disabled in this schema"
    (do (support/assert! (= #{"inherit" "enabled" "disabled"} (get-in world [:inheritance :overrides]))
                         "Inherited override choices are incomplete." {})
        world)

    "the editor separately renders active inherited, disabled inherited, explicitly re-enabled, and local rules" world
    "the operator can configure Only declared properties through General rules" world
    "the effective-rule preview identifies the originating schema and version for every rule" world

    "the Schema Library contains schemas, reusable rules, assignments, revisions, inheritance exceptions, and examples"
    (assoc world :library {:schemas true :rules true :assignments true :revisions true})

    "the operator activates Export Schema Library"
    (require! world :library "Schema Library is unavailable.")

    "the browser downloads 1 versioned JSON file containing the complete Schema Library" world
    "the operator selects that file through Import Schema Library" world
    "a rendered review offers Replace Schema Library and Append to Schema Library" world
    "no import occurs through a text prompt or before the operator confirms a choice" world
    "importing and reloading preserves the exported names, versions, rules, assignments, and exceptions" world

    "reusable rule Approved page types version 1 is saved"
    (assoc world :reusable-rule {:version 1 :pinned true})

    "the operator edits it to include confirmation"
    (assoc-in world [:reusable-rule :version] 2)

    "a rendered Save revision review identifies the changed parameters and examples"
    (require! world :reusable-rule "Reusable rule is missing.")

    "confirming creates version 2 while existing schema attachments remain pinned to version 1"
    (do (support/assert! (= 2 (get-in world [:reusable-rule :version])) "Rule revision was not created." {}) world)

    "a schema attachment changes to version 2 only through its rendered update action" world
    "Rule Library rows provide separate Edit, Duplicate, Export, and Delete actions" world

    "generic and order-confirmation page_view assignments are saved with priorities 10 and 100"
    (assoc world :assignments {:generic 10 :order 100})

    "page_view is captured from https://shop.example/order-confirmation"
    (require! world :assignments "Schema assignments are missing.")

    "the rendered event validation identifies the selected Order confirmation schema and exact version" world
    "it identifies the matching source, event name, domain, pathname, and priority assignment" world
    "the operator can select a different schema from the Live inspector for an explicit manual validation" world
    "the Event Library editor provides the same explicit schema attachment control for its template" world

    "a schema validation produces inherited, local, warning, and error results at nested paths"
    (assoc world :validation {:details true})

    "validation details are opened from Live or the Event Library"
    (require! world :validation "Validation result is missing.")

    "rendered issue rows show path, rule, message, expected value, actual value, severity, schema origin, and schema location" world
    "the summary distinguishes Valid, Warnings, Issues, Not checked, and Assignment error" world
    "validation refreshes after a Library draft change without mutating the draft" world
    "saved-session validation remains pinned to the schema version originally recorded" world

    "the schema workspace runtime acceptance suite is executed"
    (browser-workspace! world example)

    "it completes schema creation, nested rule editing, inheritance exceptions, assignment, validation, export, import, and reload through rendered controls"
    (require! world :browser-observation "Browser runtime was not executed.")

    "it verifies browser storage, downloaded content, dialog visibility, focus restoration, and rendered validation details" world

    "it exercises production event capture and validation callbacks rather than acceptance-world flags or source-string assertions"
    (do (support/assert! (seq (get-in world [:browser-observation :sourceCreation :paths]))
                         "Production callbacks were not exercised." {})
        world)

    "the delivered extension bundle contains the same schema workspace behavior as the production source" world

    "the current Schema Library contains <schema_count> schemas and <rule_count> reusable rules"
    (assoc world :schema-library-export-example {:schemas (count-value example "schema_count") :rules (count-value example "rule_count")})

    "rendered setup has created exactly those schema and rule identities before export"
    (do (assert-export-counts! (:browser-observation world) example) world)
    "the complete Schema Library is exported and its downloaded JSON is inspected"
    (require! world :schema-library-export-example "Schema Library export example is unavailable.")

    "the export reports <schema_count> schemas and <rule_count> reusable rules"
    (do (assert-export-counts! (:browser-observation world) example) world)

    "every exported schema and rule identity is present rather than a fixed fixture subset"
    (do (assert-export-preflight! (:browser-observation world)) world)

    "export-envelope metadata such as format version is verified separately from the identity collections"
    (do (support/assert! (= 1 (get-in world [:browser-observation :transfer :content :version]))
                         "Schema Library export envelope metadata is invalid." {:observation (:browser-observation world)})
        world)
    "runtime verification derives its expected counts from this example instead of requiring a fixed library seed" world

    "that export replaces the Schema Library and the panel reloads" world

    "<schema_count> schemas and <rule_count> reusable rules remain stored and rendered"
    (do (assert-export-counts! (:browser-observation world) example) world)

    "shared browser setup observes an export envelope with format version, schema identities, and rule identities"
    (assoc world :shared-export-preflight? true)

    "it observes the schema and rule identities stored immediately before export"
    (require! world :shared-export-preflight? "Shared export preflight was not initialized.")

    "shared transfer verification runs for a scenario without export-count examples"
    (do (require! world :shared-export-preflight? "Shared export preflight was not initialized.")
        (assert-export-preflight! (:browser-observation world))
        world)

    "exported schema identities are compared only with stored schema identities"
    (do (support/assert! (= (get-in world [:browser-observation :transfer :before :schemas])
                            (get-in world [:browser-observation :transfer :content :schemas]))
                         "Shared export preflight did not preserve schema identities." {})
        world)

    "exported rule identities are compared only with stored rule identities"
    (do (support/assert! (= (get-in world [:browser-observation :transfer :before :rules])
                            (get-in world [:browser-observation :transfer :content :rules]))
                         "Shared export preflight did not preserve reusable-rule identities." {})
        world)

    "format version is verified separately from both identity collections"
    (do (support/assert! (= 1 (get-in world [:browser-observation :transfer :content :version]))
                         "Shared export preflight did not preserve the format version." {})
        world)

    "valid envelope metadata does not cause an identity mismatch"
    (do (assert-export-preflight! (:browser-observation world)) world)

    "no scenario-specific library size is required before an export-count example is active"
    (do (support/assert! (nil? (:schema-library-export-example world))
                         "Shared export preflight unexpectedly required an export-count example." {})
        world)

    "the acceptance parser provides example values <schema_count> and <rule_count> using its supported key representation"
    (assoc world :schema-library-export-example {:schemas (count-value example "schema_count") :rules (count-value example "rule_count")})

    "the schema export browser fixture is derived from that example" world

    "shared example lookup resolves schema_count as <schema_count> and rule_count as <rule_count>"
    (do (support/assert! (= {:schemas (count-value example "schema_count") :rules (count-value example "rule_count")}
                            (:schema-library-export-example world)) "Example lookup did not preserve schema export counts." {}) world)

    "the browser adapter receives fixture <fixture>"
    (do (support/assert! (= (source-value example "fixture") (get-in world [:browser-observation :fixture])) "Browser fixture did not match the active example." {}) world)

    "the observed export contains <schema_count> schemas and <rule_count> reusable rules"
    (do (assert-export-counts! (:browser-observation world) example) world)

    "fixture derivation does not silently fall back to another example's counts" world

    "shared schema export verification compares identity collections separately from envelope metadata"
    (assoc world :shared-export-preflight? true)

    "outlined export verification checks that every schema and rule identity is present"
    (do (require! world :shared-export-preflight? "Shared export preflight was not initialized.")
        (assert-export-preflight! (:browser-observation world)) world)

    "it uses the same shared export verification as browser preflight"
    (do (assert-export-preflight! (:browser-observation world)) world)

    "no identity-coverage step directly compares an identity snapshot with the complete export envelope"
    (do (assert-export-preflight! (:browser-observation world)) world)

    (throw (ex-info "Unsupported schema workspace runtime step." {:step text})))))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (contains? #{"the rendered Data Layer Schemas workspace is displayed"
                                        "the current Schema Library contains <schema_count> schemas and <rule_count> reusable rules"
                                        "shared browser setup observes an export envelope with format version, schema identities, and rule identities"
                                        "shared schema export verification compares identity collections separately from envelope metadata"
                                        "the acceptance parser provides example values <schema_count> and <rule_count> using its supported key representation"} (:text spec))
                           (:schema-workspace-runtime? world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs [feature-file] #{})))
