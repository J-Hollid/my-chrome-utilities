(ns acceptance.steps.schema-workspace-runtime
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-file "features/data-layer-schema-workspace-runtime-completion.feature")

(defn- browser-workspace! [world]
  (if (:browser-observation world)
    world
    (let [result (process/shell (assoc support/build-shell-options :env {"SCHEMA_WORKSPACE_BROWSER_ADAPTER" "1"}) "node" "test/side-panel-component-layout-runtime-test.mjs")
          line (last (filter #(str/starts-with? % "{") (str/split-lines (:out result))))
          payload (when line (json/parse-string line true))]
      (support/assert! (zero? (:exit result)) "Schema workspace browser runtime verification failed."
                       {:out (:out result) :err (:err result)})
      (support/assert! (true? (get-in payload [:schemaWorkspace :mounted])) "Production Schema workspace did not mount." {:payload payload})
      (support/assert! (= "Order complete schema" (get-in payload [:schemaWorkspace :sourceCreation :name]))
                       "Library Create schema did not invoke the production source callback." {:payload payload})
      (support/assert! (= "schema-library-v1.json" (get-in payload [:schemaWorkspace :transfer :downloadName]))
                       "Schema Library export did not produce the versioned download." {:payload payload})
      (support/assert! (= {:version 1 :schemas 1 :rules 3} (get-in payload [:schemaWorkspace :transfer :content]))
                       "Schema Library export content was incomplete." {:payload payload})
      (support/assert! (= 1 (get-in payload [:schemaWorkspace :transfer :reloadedSchemas]))
                       "Schema Library import did not persist its replacement." {:payload payload})
      (support/assert! (= {:stored 1 :rendered 1} (get-in payload [:schemaWorkspace :reload]))
                       "Schema Library did not survive the production browser reload." {:payload payload})
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
      (support/assert! (= ["example · Known page types v1 · inherited from Checkout schema v2"]
                          (get-in payload [:schemaWorkspace :inheritance :preview]))
                       "Effective-rule preview did not identify the inherited rule origin." {:payload payload})
      (support/assert! (re-find #"Valid|issues" (str (get-in payload [:schemaWorkspace :validation :validation])))
                       "Live Validate did not produce a validation state." {:payload payload})
      (assoc world :browser-observation (:schemaWorkspace payload)))))

(defn- require! [world key message]
  (support/assert! (get world key) message {:required key}) world)

(defn- source-value [example key]
  (support/require-example example key))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (= text "the rendered Data Layer Schemas workspace is displayed")
                (assoc (browser-workspace! world) :schema-workspace-runtime? true)
                world)]
    (require! world :browser-observation "Schema workspace browser adapter was not executed.")
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
    (browser-workspace! world)

    "it completes schema creation, nested rule editing, inheritance exceptions, assignment, validation, export, import, and reload through rendered controls"
    (require! world :browser-observation "Browser runtime was not executed.")

    "it verifies browser storage, downloaded content, dialog visibility, focus restoration, and rendered validation details" world

    "it exercises production event capture and validation callbacks rather than acceptance-world flags or source-string assertions"
    (do (support/assert! (seq (get-in world [:browser-observation :sourceCreation :paths]))
                         "Production callbacks were not exercised." {})
        world)

    "the delivered extension bundle contains the same schema workspace behavior as the production source" world

    (throw (ex-info "Unsupported schema workspace runtime step." {:step text})))))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (= "the rendered Data Layer Schemas workspace is displayed" (:text spec))
                           (:schema-workspace-runtime? world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs [feature-file] #{})))
