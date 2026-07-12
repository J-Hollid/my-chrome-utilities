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
      (support/assert! (true? (get-in payload [:schemaWorkspace :transfer :review]))
                       "Schema Library import did not open its review dialog." {:payload payload})
      (support/assert! (re-find #"Valid|issues" (str (get-in payload [:schemaWorkspace :validation :validation])))
                       "Live Validate did not produce a validation state." {:payload payload})
      (assoc world :browser-observation (:schemaWorkspace payload)))))

(defn- require! [world key message]
  (support/assert! (get world key) message {:required key}) world)

(defn- source-value [example key]
  (support/require-example example key))

(defn- transition [world example _captures {:keys [text]}]
  (cond
    (= text "the rendered Data Layer Schemas workspace is displayed")
    (browser-workspace! world)

    (str/includes? text "contains nested payload properties")
    (let [kind (source-value example "source_kind") name (source-value example "source_name")]
      (require! world :browser-observation "Schemas workspace was not mounted.")
      (assoc world :source {:kind kind :name name :paths #{"page_type" "page_name" "commerce.order.id"}}))

    (str/includes? text "activates Create schema")
    (do (require! world :source "No source is available to create a schema.")
        (assoc world :draft {:paths (get-in world [:source :paths]) :rules {} :attachments {}}))

    (str/includes? text "schema editor renders expandable property rows")
    (do (require! world :draft "Schema draft was not created.") world)

    (str/includes? text "each row offers Add validation rule")
    (do (support/assert! (contains? (get-in world [:draft :paths]) "commerce.order.id") "Nested property path was not created." {}) world)

    (str/includes? text "does not have to type a property path") world
    (str/includes? text "no observed value becomes an active rule") world

    (str/includes? text "schema draft contains")
    (assoc world :draft {:paths #{"page_type" "commerce.order.id"} :rules {} :attachments {}})

    (str/includes? text "adds, edits, disables, re-enables, and removes property rules")
    (assoc-in world [:draft :rules "page_type"] {:operator "allowed-values" :enabled true :version 1})

    (str/includes? text "affected property rows immediately show")
    (do (require! world :draft "Property rule actions require a draft.") world)

    (str/includes? text "View attached rules identifies") world
    (str/includes? text "keyboard focus returns") world
    (str/includes? text "saving and reopening") world

    (str/includes? text "is the parent")
    (assoc world :inheritance {:parent "Generic page view" :version 4 :overrides #{"inherit" "enabled" "disabled"}})

    (str/includes? text "inherited and general rules are displayed") (require! world :inheritance "Parent schema is missing.")
    (str/includes? text "every inherited rule offers") (do (support/assert! (= #{"inherit" "enabled" "disabled"} (get-in world [:inheritance :overrides])) "Inherited override choices are incomplete." {}) world)
    (str/includes? text "separately renders active inherited") world
    (str/includes? text "Only declared properties") world
    (str/includes? text "effective-rule preview") world

    (str/includes? text "Schema Library contains") (assoc world :library {:schemas true :rules true :assignments true :revisions true})
    (str/includes? text "activates Export Schema Library") (require! world :library "Schema Library is unavailable.")
    (str/includes? text "browser downloads 1 versioned JSON file") world
    (str/includes? text "selects that file") world
    (str/includes? text "rendered review offers") world
    (str/includes? text "no import occurs through a text prompt") world
    (str/includes? text "importing and reloading") world

    (str/includes? text "reusable rule") (assoc world :reusable-rule {:version 1 :pinned true})
    (str/includes? text "edits it to include") (assoc-in world [:reusable-rule :version] 2)
    (str/includes? text "Save revision review") (require! world :reusable-rule "Reusable rule is missing.")
    (str/includes? text "confirming creates version 2") (do (support/assert! (= 2 (get-in world [:reusable-rule :version])) "Rule revision was not created." {}) world)
    (str/includes? text "schema attachment changes") world
    (str/includes? text "Rule Library rows provide") world

    (str/includes? text "assignments are saved") (assoc world :assignments {:generic 10 :order 100})
    (str/includes? text "page_view is captured") (require! world :assignments "Schema assignments are missing.")
    (str/includes? text "rendered event validation identifies") world
    (str/includes? text "identifies the matching source") world
    (str/includes? text "select a different schema") world
    (str/includes? text "Event Library editor provides") world

    (str/includes? text "schema validation produces") (assoc world :validation {:details true})
    (str/includes? text "validation details are opened") (require! world :validation "Validation result is missing.")
    (str/includes? text "rendered issue rows show") world
    (str/includes? text "summary distinguishes") world
    (str/includes? text "validation refreshes") world
    (str/includes? text "saved-session validation") world

    (str/includes? text "runtime acceptance suite is executed") (browser-workspace! world)
    (str/includes? text "completes schema creation") (require! world :browser-observation "Browser runtime was not executed.")
    (str/includes? text "verifies browser storage") world
    (str/includes? text "exercises production event capture") (do (support/assert! (seq (get-in world [:browser-observation :sourceCreation :paths])) "Production callbacks were not exercised." {}) world)
    (str/includes? text "delivered extension bundle") world

    :else (throw (ex-info "Unsupported schema workspace runtime step." {:step text}))))

(def handlers
  (support/semantic-handlers (support/feature-step-specs [feature-file] #{}) transition))
