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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-05T23:20:53.669992739+02:00", :module-hash "-1556722244", :forms [{:id "form/0/ns", :kind "ns", :line 2, :end-line 2, :hash "-776603802"} {:id "form/1/load-file", :kind "load-file", :line 3, :end-line 3, :hash "-425147520"} {:id "defn/-main", :kind "defn", :line 5, :end-line 11, :hash "-1349493908"} {:id "form/3/try", :kind "try", :line 13, :end-line 16, :hash "1078717222"}]}
;; clj-mutate-manifest-end
