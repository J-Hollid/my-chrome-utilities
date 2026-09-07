(ns acceptance.steps.serena-initial-instructions
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def feature-files ["features/swarmforge-serena-initial-instructions.feature"])
(def relations [{:keys ["role"] :rows #{["specifier"] ["coder"] ["refactorer"] ["architect"]}}
                {:keys ["condition"] :rows #{["initial_instructions missing from the server filter"]
                  ["initial_instructions missing from the client filter"] ["an unavailable pinned server"]}}])
(def required-tools #{"initial_instructions" "get_symbols_overview" "find_symbol"
                      "find_referencing_symbols" "find_declaration" "get_current_config"})
(defonce evidence (atom nil))
(defn- verified [file key]
  (let [result (support/verified-command-result "node" file)]
    (support/assert! (zero? (:exit result)) "Serena behavior check failed." {:file file})
    (support/json-observation (:out result) key)))
(defn- prepare []
  (or @evidence
      (reset! evidence
        {:runtime (verified "test/serena-launch-runtime-test.mjs" :serenaLaunchRuntime)
         :sequence (verified "test/serena-server-test.mjs" :serenaInstructionSequence)
         :live (json/parse-string (slurp "docs/serena-initial-instructions-live-proof.json") true)
         :pin (get-in (support/read-json "swarmforge/toolchain/optional-tools.lock.json") [:tools :serena])})))
(defn- verify-role! [data role]
  (let [effective (get-in data [:runtime :roleSettings (keyword role)])
        live (get-in data [:live :roles (keyword role)])
        suffix (if (= role "specifier") "/repo" (str "/repo/.worktrees/" role))
        symbol (first (:symbol live))]
    (support/assert! (and (str/ends-with? (:root effective) suffix)
                         (= true (get-in effective [:project :read_only]))
                         (every? #(= required-tools (set %))
                           [(get-in effective [:project :fixed_tools])
                            (get-in effective [:global :fixed_tools]) (:client effective)])
                         (= true (:usable live)) (= "complete" (:step live))
                         (= (:pin data) (:pin live))
                         (= (:root live) (str (get-in data [:live :roles :specifier :root])
                                              (when-not (= role "specifier") (str "/.worktrees/" role))))
                         (seq (:protocolVersion live)) (= required-tools (set (:tools live)))
                         (str/includes? (:instructions live) (:root live))
                         (= "renderProjectLibraryPresentation" (:name_path symbol))
                         (= "src/data-layer-project-library-presentation-ui.ts" (:relative_path symbol)))
                     "Role lacks effective filters or recorded pinned instruction-to-symbol proof." {:role role})))
(defn- transition [world example captures step]
  (let [data (prepare)]
    (doseq [key (support/capture-placeholder-keys captures)] (support/require-example example key))
    (support/validate-example-relations! relations example "Unsupported Serena setup case.")
    (doseq [role ["specifier" "coder" "refactorer" "architect"]] (verify-role! data role))
    (support/assert! (every? true? (map #(get-in data [:runtime %])
                                     [:refreshIdempotent :unrelatedPreserved :offlineFallback]))
                     "Offline configuration refresh contract failed." {})
    (support/assert! (and (get-in data [:sequence :ordered])
                         (get-in data [:sequence :dependencyRejected])
                         (get-in data [:sequence :scopeChecked])
                         (every? #(false? (get-in data [:sequence :conditions % :usable]))
                           (map keyword ["server filter" "client filter" "unavailable pinned server"])))
                     "Unavailable setup dependency was accepted." {})
    (assoc world :serena-initial-instructions/active true)))
(def handlers
  (support/feature-scoped-stateful-handlers feature-files
    #(= % "the optional read-only Serena setup uses the existing pinned installation")
    :serena-initial-instructions/active transition))
