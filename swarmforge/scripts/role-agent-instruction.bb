#!/usr/bin/env bb

(ns role-agent-instruction
  (:require [babashka.fs :as fs]))

(defn fail! [message]
  (binding [*out* *err*] (println message))
  (System/exit 2))

(defn instruction [role]
  (when-not (re-matches #"[a-z][a-z0-9-]*" role)
    (fail! "Role instruction requires a valid role name"))
  (str "Read swarmforge/constitution.prompt, then read every file it refers to recursively, and obey all of those instructions.\n"
       "Read swarmforge/roles/" role ".prompt, then read every file it refers to recursively, and follow all of those instructions.\n"
       "Read swarmforge/scripts/shared-articles/handoffs.prompt and follow its queue and progress-lease instructions.\n"))

(defn -main [args]
  (when-not (= 2 (count args))
    (fail! "Use: role-agent-instruction.bb <role> <output-file>"))
  (let [[role output] args]
    (fs/create-dirs (fs/parent output))
    (spit output (instruction role))))

(-main *command-line-args*)
