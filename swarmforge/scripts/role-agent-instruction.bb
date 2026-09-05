#!/usr/bin/env bb
(ns role-agent-instruction (:require [babashka.fs :as fs]))
(load-file (str (fs/path (fs/parent *file*) "serena/instructions.clj")))

(defn -main [args]
  (when-not (= 2 (count args))
    (throw (ex-info "Use: role-agent-instruction.bb <role> <output-file>" {})))
  (let [[role output] args
        instruction (serena.instructions/instruction (fs/real-path (fs/cwd)) role)]
    (when-let [parent (fs/parent output)] (fs/create-dirs parent))
    (spit output instruction)))

(try (-main *command-line-args*)
     (catch Exception error
       (binding [*out* *err*] (println (ex-message error)))
       (System/exit 2)))
