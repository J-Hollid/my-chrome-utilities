(ns serena.instructions
  (:require [babashka.fs :as fs] [clojure.string :as str]))

(defn required-path [root file]
  (let [target (fs/path root file)]
    (when-not (fs/regular-file? target)
      (throw (ex-info (str "Required instruction is missing: " file) {:path file})))
    (fs/real-path target)))

(defn required-files [root role]
  (when-not (re-matches #"[a-z][a-z0-9-]*" role)
    (throw (ex-info "Role instruction requires a valid role name" {:role role})))
  (let [articles (sort (map str (filter fs/regular-file? (fs/list-dir (fs/path root "swarmforge/constitution/articles")))))
        seeds (concat ["swarmforge/constitution.prompt"]
                      (map #(str (fs/relativize root %)) articles)
                      [(str "swarmforge/roles/" role ".prompt")
                       "swarmforge/scripts/shared-articles/handoffs.prompt"
                       "swarmforge/scripts/shared-articles/tool-use.prompt"])]
    (when (empty? articles)
      (throw (ex-info "Required constitution articles are missing" {})))
    (loop [pending (seq seeds) seen #{} result []]
      (if-let [file (first pending)]
        (let [resolved (required-path root file)]
          (if (contains? seen resolved)
            (recur (next pending) seen result)
            (let [includes (keep #(second (re-matches #"Required instruction: ([^\s]+)" %))
                                 (str/split-lines (slurp (str resolved))))]
              (recur (concat (next pending) includes) (conj seen resolved)
                     (conj result (str (fs/relativize root resolved)))))))
        result))))

(defn instruction [root role]
  (str (str/join "\n" (map #(str "Read " % "; obey its instructions.") (required-files root role)))
       "\nFollow swarmforge/scripts/shared-articles/handoffs.prompt queue and progress-lease instructions.\n"
       "Read current scope and applicable mode rules when selecting a task, then the selected task contracts, program, and verification rules.\n"
       "Follow explicit Required instruction includes once per resolved path. A source path, command example, citation, or history link alone does not require reading. Preserve conditional role duties.\n"))
