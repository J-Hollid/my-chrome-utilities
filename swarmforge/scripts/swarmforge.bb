#!/usr/bin/env bb

(ns swarmforge
  (:require [babashka.fs :as fs]
            [babashka.process :as process]
            [clojure.string :as str]))

(def session-prefix "swarmforge")
(def dashboard-session "swarmforge-dashboard")
(def agent-window "swarm")
(def red "\u001b[0;31m")
(def green "\u001b[0;32m")
(def yellow "\u001b[1;33m")
(def cyan "\u001b[0;36m")
(def bold "\u001b[1m")
(def reset "\u001b[0m")
(def usage
  "Usage: swarmforge.sh [PROJECT_ROOT]\n       swarmforge.sh --help\n\nLaunch SwarmForge for PROJECT_ROOT (the current directory by default).")

(defn sh [& args]
  (apply process/sh args))

(defn sh-ok? [& args]
  (zero? (:exit (apply process/sh (concat [{:continue true}] args)))))

(defn sh-out [& args]
  (str/trim (:out (apply process/sh args))))

(defn command-exists? [command]
  (sh-ok? "sh" "-c" (str "command -v " command " >/dev/null 2>&1")))

(defn env-long [name default-value]
  (if-let [value (System/getenv name)]
    (if (re-matches #"[0-9]+" value)
      (Long/parseLong value)
      default-value)
    default-value))

(defn fail! [message]
  (binding [*out* *err*]
    (println message))
  (System/exit 1))

(defn cli-error! [message]
  (binding [*out* *err*]
    (println message)
    (println usage))
  (System/exit 64))

(defn sq [value]
  (str "'" (str/replace (str value) #"'" "'\"'\"'") "'"))

(defn normalize-terminal-backend [backend]
  (case (str/lower-case backend)
    ("iterm" "iterm2" "iterm.app") "iterm2"
    ("terminal" "terminal-app" "terminal.app") "terminal-app"
    ("windows" "windows-terminal" "wt") "windows-terminal"
    ("none" "current" "fallback") "none"
    (str/lower-case backend)))

(defn detect-terminal-backend []
  (if-let [backend (System/getenv "SWARMFORGE_TERMINAL")]
    (normalize-terminal-backend backend)
    (cond
      (command-exists? "osascript") (if (= (System/getenv "TERM_PROGRAM") "iTerm.app")
                                      "iterm2"
                                      "terminal-app")
      (command-exists? "wt.exe") "windows-terminal"
      :else "none")))

(defn display-name-for-role [role]
  (->> (str/split (str/replace role #"[-_]" " ") #"\s+")
       (remove str/blank?)
       (map str/capitalize)
       (str/join " ")))

(defn session-name-for-role [role]
  (str session-prefix "-" role))

(defn worktree-path-for-name [worktrees-dir worktree]
  (fs/path worktrees-dir worktree))

(defn tmux-agent-target [window pane-base-index session]
  (str session ":" window "." pane-base-index))

(defn tmux-option [tmux-socket option scope default-value]
  (let [args (case scope
               :session ["tmux" "-S" tmux-socket "show-options" "-gqv" option]
               :window ["tmux" "-S" tmux-socket "show-options" "-gwqv" option])
        result (apply process/sh (concat [{:continue true}] args))
        value (str/trim (:out result))]
    (if (re-matches #"[0-9]+" value)
      (Long/parseLong value)
      default-value)))

(defn detect-tmux-base-indexes [ctx]
  (fs/create-dirs (:tmux-socket-dir ctx))
  (let [probe-session (when-not (sh-ok? "tmux" "-S" (:tmux-socket ctx) "info")
                        (let [session (str "swarmforge-probe-" (.pid (java.lang.ProcessHandle/current)))]
                          (sh "tmux" "-S" (:tmux-socket ctx) "new-session" "-d" "-s" session "sleep 60")
                          session))
        window-base (tmux-option (:tmux-socket ctx) "base-index" :session 0)
        pane-base (tmux-option (:tmux-socket ctx) "pane-base-index" :window 0)]
    (when probe-session
      (process/sh {:continue true} "tmux" "-S" (:tmux-socket ctx) "kill-session" "-t" probe-session))
    (assoc ctx :tmux-window-base-index window-base :tmux-pane-base-index pane-base)))

(defn ensure-in-file! [file pattern]
  (fs/create-dirs (fs/parent file))
  (when-not (fs/exists? file)
    (spit (str file) ""))
  (let [lines (set (str/split-lines (slurp (str file))))]
    (when-not (contains? lines pattern)
      (spit (str file) (str pattern "\n") :append true))))

(defn ensure-initial-gitignore! [ctx]
  (let [gitignore (fs/path (:working-dir ctx) ".gitignore")]
    (if-not (fs/exists? gitignore)
      (spit (str gitignore) ".swarmforge/\n.worktrees/\n")
      (do
        (ensure-in-file! gitignore ".swarmforge/")
        (ensure-in-file! gitignore ".worktrees/")))))

(defn ensure-runtime-git-excludes! [ctx]
  (let [exclude-file (fs/path (sh-out "git" "-C" (str (:working-dir ctx)) "rev-parse" "--git-path" "info/exclude"))]
    (fs/create-dirs (fs/parent exclude-file))
    (ensure-in-file! exclude-file ".swarmforge/")
    (ensure-in-file! exclude-file ".worktrees/")))

(defn initialize-git-repo! [ctx]
  (when-not (fs/exists? (fs/path (:working-dir ctx) ".git"))
    (sh "git" "init" (str (:working-dir ctx)))
    (sh "git" "-C" (str (:working-dir ctx)) "branch" "-M" "master")
    (ensure-initial-gitignore! ctx)
    (sh "git" "-C" (str (:working-dir ctx)) "add" ".")
    (sh "git" "-C" (str (:working-dir ctx)) "commit" "-m" "Initial swarmforge repository")))

(defn parse-config [ctx]
  (when-not (fs/exists? (:config-file ctx))
    (fail! (str red "Error:" reset " Config not found at " (:config-file ctx))))
  (when-not (fs/exists? (:constitution-file ctx))
    (fail! (str red "Error:" reset " Constitution prompt not found at " (:constitution-file ctx))))
  (let [roles-dir (:roles-dir ctx)
        worktrees-dir (:worktrees-dir ctx)
        working-dir (:working-dir ctx)]
    (loop [lines (map-indexed vector (str/split-lines (slurp (str (:config-file ctx)))))
           rows []
           roles #{}
           worktrees #{}]
      (if-let [[line-index raw-line] (first lines)]
        (let [line-no (inc line-index)
              line (str/trim raw-line)]
          (if (or (str/blank? line) (str/starts-with? line "#"))
            (recur (next lines) rows roles worktrees)
            (let [fields (str/split line #"\s+")]
              (when (< (count fields) 4)
                (fail! (str red "Error:" reset " Invalid config line " line-no ": " line)))
              (let [[keyword role agent worktree & trailing] fields
                    agent (str/lower-case agent)
                    receive-mode (if (#{"task" "batch"} (first trailing))
                                   (first trailing)
                                   "task")
                    extra-arg-tokens (if (#{"task" "batch"} (first trailing))
                                       (rest trailing)
                                       trailing)
                    extra-args (when (seq extra-arg-tokens)
                                 (str/join " " extra-arg-tokens))]
                (when-not (= "window" keyword)
                  (fail! (str red "Error:" reset " Unknown config directive on line " line-no ": " keyword)))
                (when (str/includes? role "_")
                  (fail! (str red "Error:" reset " Invalid role '" role "' on line " line-no ": role names may not contain underscores")))
                (when (contains? roles role)
                  (fail! (str red "Error:" reset " Duplicate role '" role "' in " (:config-file ctx))))
                (when (and (not (#{"none" "master"} worktree)) (contains? worktrees worktree))
                  (fail! (str red "Error:" reset " Duplicate worktree '" worktree "' in " (:config-file ctx))))
                (when (or (str/includes? worktree "/") (#{"." ".."} worktree))
                  (fail! (str red "Error:" reset " Invalid worktree '" worktree "' for role '" role "'")))
                (when-not (#{"claude" "codex" "copilot" "grok"} agent)
                  (fail! (str red "Error:" reset " Unsupported agent '" agent "' for role '" role "'")))
                (when-not (#{"task" "batch"} receive-mode)
                  (fail! (str red "Error:" reset " Invalid receive mode '" receive-mode "' for role '" role "' on line " line-no ": expected task or batch")))
                (when-not (fs/exists? (fs/path roles-dir (str role ".prompt")))
                  (fail! (str red "Error:" reset " Missing role prompt " (fs/path roles-dir (str role ".prompt")))))
                (let [worktree-path (if (#{"none" "master"} worktree)
                                      working-dir
                                      (worktree-path-for-name worktrees-dir worktree))
                      row {:role role
                           :agent agent
                           :session (session-name-for-role role)
                           :display-name (display-name-for-role role)
                           :worktree-name worktree
                           :worktree-path worktree-path
                           :receive-mode receive-mode
                           :extra-arg-tokens (vec extra-arg-tokens)
                           :extra-args extra-args}]
                  (recur (next lines)
                         (conj rows row)
                         (conj roles role)
                         (cond-> worktrees (not (#{"none" "master"} worktree)) (conj worktree))))))))
        (do
          (when (empty? rows)
            (fail! (str red "Error:" reset " No windows defined in " (:config-file ctx))))
          (assoc ctx :roles rows))))))

(defn write-sessions-file! [ctx]
  (spit (str (:sessions-file ctx))
        (apply str
               (map-indexed
                (fn [index row]
                  (format "%d\t%s\t%s\t%s\t%s\n"
                          (inc index) (:role row) (:session row) (:display-name row) (:agent row)))
                (:roles ctx)))))

(defn write-roles-file! [ctx]
  (spit (str (:roles-file ctx))
        (apply str
               (for [row (:roles ctx)]
                 (format "%s\t%s\t%s\t%s\t%s\t%s\t%s\n"
                         (:role row)
                         (:worktree-name row)
                         (:worktree-path row)
                         (:session row)
                         (:display-name row)
                         (:agent row)
                         (:receive-mode row))))))

(def required-helpers
  ["browser-test"
   "handoff_sequence.bb" "handoff_lib.bb" "swarm_handoff.sh" "swarm_handoff.bb"
   "ready_for_next.sh" "ready_for_next.bb"
   "done_with_current.sh" "done_with_current.bb"
   "ready_for_next_task.sh" "ready_for_next_task.bb"
   "done_with_current_task.sh" "done_with_current_task.bb"
   "role-agent-instruction.bb"
   "ready_for_next_batch.sh" "ready_for_next_batch.bb"
   "done_with_current_batch.sh" "done_with_current_batch.bb"
   "handoffd.bb" "stop_handoff_daemon.bb" "stop_handoff_daemon.sh"
   "unblocker-control.mjs" "unblocker_send.sh" "unblocker_claim.sh" "unblocker_complete.sh"
   "swarm-cleanup.sh" "swarm-window-watchdog.sh" "swarm-window-watchdog.bb"
   "swarm-terminal-adapter.sh" "swarmforge.sh" "swarmforge.bb"])

(def terminal-helpers
  ["terminal-app.sh" "iterm2.sh" "ghostty.sh" "windows-terminal.sh" "none.sh"])

(defn check-helper-scripts! [ctx]
  (doseq [helper required-helpers]
    (let [path (fs/path (:script-dir ctx) helper)]
      (when-not (and (fs/exists? path) (fs/executable? path))
        (fail! (str red "Error:" reset " Required helper script not found or not executable: " path)))))
  (doseq [helper terminal-helpers]
    (let [path (fs/path (:script-dir ctx) "terminal-adapters" helper)]
      (when-not (and (fs/exists? path) (fs/executable? path))
        (fail! (str red "Error:" reset " Required terminal adapter not found or not executable: " path))))))

(defn prepare-workspace! [ctx]
  (doseq [dir [(:state-dir ctx) (:notify-dir ctx) (:prompts-dir ctx)
               (:worktrees-dir ctx) (:tmux-socket-dir ctx) (:daemon-dir ctx)]]
    (fs/create-dirs dir))
  (spit (str (:tmux-socket-file ctx)) (str (:tmux-socket ctx) "\n"))
  (write-sessions-file! ctx)
  (write-roles-file! ctx))

(defn prepare-worktrees! [ctx]
  (doseq [row (:roles ctx)
          :let [worktree-name (:worktree-name row)
                worktree-path (:worktree-path row)
                branch-name (str "swarmforge-" worktree-name)]
          :when (not (#{"none" "master"} worktree-name))]
    (let [root-result (process/sh {:continue true}
                                  "git" "-C" (str worktree-path)
                                  "rev-parse" "--show-toplevel")
          resolved-root (str/trim (:out root-result))
          expected-root (str (fs/absolutize worktree-path))]
      (cond
        (= expected-root resolved-root)
        nil

        (fs/exists? worktree-path)
        (fail! (str red "Error:" reset " Invalid existing worktree path for role '"
                    (:role row) "': " worktree-path
                    ". Git resolves its root as "
                    (if (str/blank? resolved-root) "<none>" resolved-root)
                    ". Move the stale directory aside and rerun SwarmForge."))

        :else
        (sh "node" (str (fs/path (:script-dir ctx) "workspace-lifecycle-policy.mjs"))
            "create" (str (:working-dir ctx)) (str worktree-path) branch-name)))))

(defn prepare-handoff-dirs! [ctx]
  (doseq [row (:roles ctx)
          dir ["outbox/tmp" "sent" "failed" "inbox/new" "inbox/in_process" "inbox/completed"]]
    (fs/create-dirs (fs/path (:worktree-path row) ".swarmforge" "handoffs" dir))))

(defn write-tmux-env-file! [ctx]
  (spit (str (:tmux-env-file ctx))
        (str (sh-out "tmux" "-S" (:tmux-socket ctx) "display-message" "-p" "#{socket_path},#{pid},#{pane_id}") "\n")))

(defn sync-worktree-scripts! [ctx]
  (doseq [row (:roles ctx)
          :let [worktree-path (:worktree-path row)]
          :when (not= (str worktree-path) (str (:working-dir ctx)))]
    (let [role-scripts-dir (fs/path worktree-path "swarmforge" "scripts")
          role-state-dir (fs/path worktree-path ".swarmforge")]
      (fs/create-dirs role-scripts-dir)
      (doseq [entry (fs/list-dir (:script-dir ctx))]
        (let [target (fs/path role-scripts-dir (fs/file-name entry))]
          (if (fs/directory? entry)
            (fs/copy-tree entry target {:replace-existing true})
            (fs/copy entry target {:replace-existing true}))))
      (fs/create-dirs (fs/path role-state-dir "notify"))
      (fs/copy (:sessions-file ctx) (fs/path role-state-dir "sessions.tsv") {:replace-existing true})
      (fs/copy (:roles-file ctx) (fs/path role-state-dir "roles.tsv") {:replace-existing true})
      (fs/copy (:tmux-socket-file ctx) (fs/path role-state-dir "tmux-socket") {:replace-existing true})
      (fs/copy (:tmux-env-file ctx) (fs/path role-state-dir "tmux-env") {:replace-existing true}))))

(defn check-dependency! [command]
  (when-not (command-exists? command)
    (fail! (str red "Error:" reset " '" command "' is required but not installed."))))

(def required-host-dependencies ["tmux" "git" "bb" "node" "rg"])

(defn check-host-dependencies! []
  (doseq [command required-host-dependencies]
    (check-dependency! command)))

(defn check-backend-dependencies! [ctx]
  (doseq [agent (map :agent (:roles ctx))]
    (check-dependency! agent)))

(defn create-role-session! [ctx session title]
  (sh "tmux" "-S" (:tmux-socket ctx) "new-session" "-d" "-s" session "-n" agent-window)
  (sh "tmux" "-S" (:tmux-socket ctx) "rename-window" "-t" (str session ":" agent-window) title)
  (sh "tmux" "-S" (:tmux-socket ctx) "set-window-option" "-t" (str session ":" title) "allow-rename" "off"))

(defn dashboard-command [ctx session]
  ;; Each dashboard pane is an independent tmux client for its role session.
  ;; Clearing TMUX permits that client to run inside the dashboard's tmux pane.
  (str "TMUX= tmux -S " (sq (:tmux-socket ctx))
       " attach-session -t " (sq session)))

(defn create-dashboard-session! [ctx]
  (sh "tmux" "-S" (:tmux-socket ctx) "new-session" "-d" "-s" dashboard-session "-n" "Agents")
  (sh "tmux" "-S" (:tmux-socket ctx) "set-option" "-t" dashboard-session "mouse" "on")
  (let [first-pane (sh-out "tmux" "-S" (:tmux-socket ctx) "list-panes" "-t"
                           (str dashboard-session ":Agents") "-F" "#{pane_id}")]
    (doseq [[index row] (map-indexed vector (:roles ctx))]
      (let [pane (if (zero? index)
                   first-pane
                   (sh-out "tmux" "-S" (:tmux-socket ctx) "split-window" "-h" "-P" "-F" "#{pane_id}"
                           "-t" (str dashboard-session ":Agents")))]
        (sh "tmux" "-S" (:tmux-socket ctx) "select-pane" "-t" pane "-T" (:display-name row))
        (sh "tmux" "-S" (:tmux-socket ctx) "send-keys" "-t" pane
            (dashboard-command ctx (:session row)) "Enter")))
    (sh "tmux" "-S" (:tmux-socket ctx) "set-window-option" "-t"
        (str dashboard-session ":Agents") "pane-border-status" "top")
    (sh "tmux" "-S" (:tmux-socket ctx) "set-window-option" "-t"
        (str dashboard-session ":Agents") "pane-border-format" " #{pane_title} ")
    (sh "tmux" "-S" (:tmux-socket ctx) "select-layout" "-t"
        (str dashboard-session ":Agents") "tiled")))

(defn extra-args-prefix [row]
  (let [tokens (or (:extra-arg-tokens row)
                   (when-let [args (:extra-args row)] [args]))]
    (if (seq tokens)
      (str (str/join " " (map sq tokens)) " ")
      "")))

(defn reject-unsafe-codex-args! [row]
  (when-let [args (:extra-args row)]
    (let [args-with-safe-reasoning-removed
          (str/replace args
                       #"(?:^|\s)(?:-c|--config)\s+model_reasoning_effort=(?:low|medium|high|xhigh|max|ultra)(?=\s|$)"
                       " ")]
      (when (re-find #"(?:^|\s)(?:--dangerously-bypass-approvals-and-sandbox(?=\s|$)|--dangerously-bypass-hook-trust(?=\s|$)|--yolo(?=\s|$)|--sandbox(?:=|\s)|-s(?:\S|\s|$)|--ask-for-approval(?:=|\s)|-a(?:\S|\s|$)|--config(?:=|\s)|-c(?:\S|\s|$)|--add-dir(?:=|\s)|--search(?=\s|$)|--cd(?:=|\s)|-C(?:\S|\s|$)|--profile(?:=|\s)|-p(?:\S|\s|$)|--remote(?:=|\s)|--(?=\s|$))" args-with-safe-reasoning-removed)
        (fail! (str red "Error:" reset " Unsafe Codex sandbox override is not allowed for role '" (:role row) "'."))))))

(defn validate-agent-args! [ctx]
  (doseq [row (:roles ctx)]
    (when (= "codex" (:agent row))
      (reject-unsafe-codex-args! row)))
  ctx)

(defn grok-wants-auto-approve? [row]
  (when-let [args (:extra-args row)]
    (or (str/includes? args "--always-approve")
        (str/includes? args "--yolo")
        (re-find #"--permission-mode\s+bypassPermissions" args))))

(defn grok-permission-prefix [row]
  ;; acceptEdits only auto-approves file edits; bypassPermissions is the
  ;; CLI-enforced mode that matches --always-approve / --yolo.
  (if (grok-wants-auto-approve? row)
    "--permission-mode bypassPermissions "
    "--permission-mode acceptEdits "))

(defn launch-command [ctx index row]
  (load-file (str (fs/path (:script-dir ctx) "serena/codex-command.clj")))
  (let [role (:role row)
        agent (:agent row)
        display (:display-name row)
        role-worktree (:worktree-path row)
        role-script-dir (if (= (str role-worktree) (str (:working-dir ctx)))
                          (:script-dir ctx)
                          (fs/path role-worktree "swarmforge" "scripts"))
        prompt-file (fs/path (:prompts-dir ctx) (str role ".md"))
        base (str "export SWARMFORGE_ROLE=" (sq role)
                  " && export PATH=" (sq (str role-script-dir)) ":$PATH"
                  " && cd " (sq (str role-worktree))
                  " && ")]
    (when (= agent "codex")
      (reject-unsafe-codex-args! row))
    (sh {:dir (str role-worktree)} "bb" (str (fs/path (:script-dir ctx) "role-agent-instruction.bb")) role (str prompt-file))
    (cond-> (str base
                (case agent
                  "claude" (str "claude --append-system-prompt-file " (sq (str prompt-file)) " --permission-mode acceptEdits -n " (sq (str "SwarmForge " display)) " " (extra-args-prefix row) "\"$(cat " (sq (str prompt-file)) ")\"")
                  "codex" ((resolve 'serena.codex-command/command) role-worktree role-script-dir (extra-args-prefix row) prompt-file sq)
                  "copilot" (str "copilot -C " (sq (str role-worktree)) " --name " (sq (str "SwarmForge " display)) " " (extra-args-prefix row) "-i \"$(cat " (sq (str prompt-file)) ")\"")
                  "grok" (str "grok --cwd " (sq (str role-worktree)) " " (grok-permission-prefix row) (extra-args-prefix row) "--rules \"$(cat " (sq (str prompt-file)) ")\" --verbatim \"$(cat " (sq (str prompt-file)) ")\"")))
      (= index 0)
      (str "; exit_code=$?; SWARMFORGE_TERMINAL_BACKEND=" (sq (:terminal-backend ctx))
           " nohup " (sq (str (fs/path (:script-dir ctx) "swarm-cleanup.sh")))
           " " (sq (:tmux-socket ctx))
           " " (sq (str (:window-ids-file ctx)))
           (apply str (map #(str " " (sq (:session %))) (:roles ctx)))
           " " (sq dashboard-session)
           " >/dev/null 2>&1 &!; exit $exit_code"))))

(defn launch-role! [ctx index row]
  (let [session (:session row)
        display (:display-name row)
        prompt-file (fs/path (:prompts-dir ctx) (str (:role row) ".md"))
        command (launch-command ctx index row)]
    (sh "tmux" "-S" (:tmux-socket ctx) "send-keys" "-t"
        (tmux-agent-target display (:tmux-pane-base-index ctx) session)
        command "Enter")
    (println (str "  " cyan "[" display "]" reset " started in session " session))))

(defn stop-handoff-daemon! [ctx]
  (process/sh {:continue true}
              "bb" (str (fs/path (:script-dir ctx) "stop_handoff_daemon.bb"))
              (str (:working-dir ctx))))

(defn uname []
  (str/trim (:out (process/sh {:continue true} "uname" "-s"))))

(defn linux-systemd-running? []
  (let [result (process/sh {:continue true} "systemctl" "is-system-running")
        state (str/trim (:out result))]
    (#{"running" "degraded"} state)))

(defn wsl? []
  (boolean (re-find #"(?i)microsoft|wsl"
                    (str (System/getenv "WSL_DISTRO_NAME") " "
                         (sh-out "uname" "-r")))))

(defn systemd-inhibit-usable? []
  ;; systemd can be present in WSL or containers without permitting inhibition.
  (sh-ok? "systemd-inhibit"
          "--what=sleep:idle"
          "--who=SwarmForge"
          "--why=Checking SwarmForge sleep prevention"
          "true"))

(defn sleep-inhibitor-prefix []
  (when-not (= "0" (System/getenv "SWARMFORGE_PREVENT_SLEEP"))
    (case (uname)
      "Darwin" (when (command-exists? "caffeinate")
                 ["caffeinate" "-dims"])
      "Linux" (when (and (not (wsl?))
                         (command-exists? "systemd-inhibit")
                         (command-exists? "systemctl")
                         (linux-systemd-running?)
                         (systemd-inhibit-usable?))
                ["systemd-inhibit"
                 "--what=sleep:idle"
                 "--who=SwarmForge"
                 "--why=SwarmForge swarm is active"])
      nil)))

(defn start-handoff-daemon! [ctx]
  (fs/delete-if-exists (fs/path (:daemon-dir ctx) "stop"))
  (let [command (into (vec (sleep-inhibitor-prefix))
                      [(str (fs/path (:script-dir ctx) "handoffd.bb"))
                       (str (:working-dir ctx))])]
    (process/process command
                     {:out (str (:handoff-daemon-log ctx))
                      :err :out})
    (println (str green "Started handoff daemon"
                  (when (> (count command) 2) " with OS sleep prevention")
                  "."
                  reset))))

(defn adapter-script [ctx command & args]
  (let [script (str "SCRIPT_DIR=" (sq (str (:script-dir ctx))) "\n"
                    "WORKING_DIR=" (sq (str (:working-dir ctx))) "\n"
                    "TMUX_SOCKET=" (sq (:tmux-socket ctx)) "\n"
                    "source " (sq (str (fs/path (:script-dir ctx) "swarm-terminal-adapter.sh")))
                    " && load_terminal_backend " (sq (:terminal-backend ctx))
                    " && " command
                    (apply str (map #(str " " (sq %)) args)))]
    ["zsh" "-c" script]))

(defn terminal-call [ctx command & args]
  (apply process/sh (apply adapter-script ctx command args)))

(defn terminal-call-ok? [ctx command & args]
  (zero? (:exit (apply process/sh (concat [{:continue true}] (apply adapter-script ctx command args))))))

(defn terminal-call-out [ctx command & args]
  (str/trim (:out (apply terminal-call ctx command args))))

(defn open-terminal-surfaces! [ctx]
  (if (terminal-call-ok? ctx "terminal_backend_can_open_sessions")
    (do
      (println (str "Opening separate " (terminal-call-out ctx "terminal_backend_label") " surfaces for each session..."))
      (when (terminal-call-ok? ctx "terminal_backend_tracks_windows")
        (spit (str (:window-ids-file ctx)) "")
        (spit (str (:window-state-file ctx)) ""))
      (loop [rows (:roles ctx)
             index 0
             previous-window-id ""]
        (when-let [row (first rows)]
          (let [window-id (terminal-call-out ctx "terminal_open_session" (:session row) (str "SwarmForge " (:display-name row)) previous-window-id)]
            (if (terminal-call-ok? ctx "terminal_backend_tracks_windows")
              (do
                (spit (str (:window-ids-file ctx)) (str window-id "\n") :append true)
                (spit (str (:window-state-file ctx))
                      (format "%d\t%s\t%s\t%s\n" (inc index) window-id (:session row) (str "SwarmForge " (:display-name row)))
                      :append true)
                (recur (next rows) (inc index) window-id))
              (recur (next rows) (inc index) previous-window-id)))))
      (if (terminal-call-ok? ctx "terminal_backend_tracks_windows")
        (process/process [(str (fs/path (:script-dir ctx) "swarm-window-watchdog.sh"))
                          (str (:window-state-file ctx))
                          (str (:window-ids-file ctx))
                          "1"
                          (:tmux-socket ctx)
                          (str (:working-dir ctx))
                          (:terminal-backend ctx)]
                         {:out (str (:window-watchdog-log ctx))
                          :err :out})
        (println (str yellow (terminal-call-out ctx "terminal_backend_label") " surfaces are not trackable; window watchdog is disabled for this backend." reset))))
    (do
      (println (str yellow "No terminal backend found; attaching current shell to the SwarmForge dashboard. Click a pane to work with that agent." reset))
      (sh "tmux" "-S" (:tmux-socket ctx) "attach-session" "-t" dashboard-session))))

(defn context [working-dir]
  (let [working-dir (fs/absolutize (fs/path working-dir))
        script-dir (fs/parent *file*)
        swarm-forge-dir (fs/path working-dir "swarmforge")
        state-dir (fs/path working-dir ".swarmforge")
        daemon-dir (fs/path state-dir "daemon")
        crc (java.util.zip.CRC32.)
        _ (.update crc (.getBytes (str working-dir) java.nio.charset.StandardCharsets/UTF_8))
        socket-id (str (.getValue crc))
        tmux-socket-dir (fs/path "/tmp" (str "swarmforge-" (or (System/getenv "UID") (System/getProperty "user.name"))))
        tmux-socket (str (fs/path tmux-socket-dir (str socket-id ".sock")))]
    {:working-dir working-dir
     :script-dir script-dir
     :swarm-forge-dir swarm-forge-dir
     :worktrees-dir (fs/path working-dir ".worktrees")
     :config-file (fs/path swarm-forge-dir "swarmforge.conf")
     :roles-dir (fs/path swarm-forge-dir "roles")
     :constitution-file (fs/path swarm-forge-dir "constitution.prompt")
     :state-dir state-dir
     :notify-dir (fs/path state-dir "notify")
     :window-ids-file (fs/path state-dir "window-ids")
     :window-state-file (fs/path state-dir "windows.tsv")
     :window-watchdog-log (fs/path state-dir "window-watchdog.log")
     :sessions-file (fs/path state-dir "sessions.tsv")
     :roles-file (fs/path state-dir "roles.tsv")
     :prompts-dir (fs/path state-dir "prompts")
     :daemon-dir daemon-dir
     :handoff-daemon-log (fs/path daemon-dir "handoffd.log")
     :tmux-socket-dir tmux-socket-dir
     :tmux-socket tmux-socket
     :tmux-socket-file (fs/path state-dir "tmux-socket")
     :tmux-env-file (fs/path state-dir "tmux-env")
     :tmux-window-base-index 0
     :tmux-pane-base-index 0}))

(defn prepare-ctx [ctx]
  (-> ctx
      parse-config
      validate-agent-args!
      (assoc :terminal-backend (detect-terminal-backend))))

(defn test-parse! [root]
  (let [ctx (prepare-ctx (context root))]
    (check-helper-scripts! ctx)
    (prepare-workspace! ctx)
    (doseq [row (:roles ctx)]
      (println (str (:role row) " " (:display-name row) " " (:worktree-path row) " "
                    (:receive-mode row)
                    (when-let [extra (:extra-args row)] (str " " extra)))))
    (print (slurp (str (:roles-file ctx))))
    (print (slurp (str (:sessions-file ctx))))))

(defn toolchain-preflight! [root]
  (let [checker (fs/path root "scripts" "check-swarmforge-toolchain.mjs")]
    (when-not (fs/exists? checker)
      (fail! (str red "Error:" reset " Missing SwarmForge toolchain checker: " checker)))
    (let [result (process/sh {:continue true :dir (str root)}
                             "node" (str checker) "--strict-runtime" "--require" "codex")
          stderr (str/trim (str (:err result)))]
      (when (seq stderr)
        (binding [*out* *err*]
          (println stderr)))
      (when-not (zero? (:exit result))
        (let [stdout (str/trim (str (:out result)))]
          (fail! (str red "Error:" reset " SwarmForge toolchain preflight failed."
                      (when (seq stdout) (str "\n" stdout)))))))))

(defn run-main! [root]
  (check-host-dependencies!)
  (toolchain-preflight! (fs/absolutize (fs/path root)))
  ;; Validate every project-owned input and host dependency before creating a
  ;; tmux probe, Git repository, worktree, or SwarmForge state directory.
  (let [ctx (prepare-ctx (context root))]
    (check-backend-dependencies! ctx)
    (check-helper-scripts! ctx)
    (let [ctx (detect-tmux-base-indexes ctx)]
      (initialize-git-repo! ctx)
      (ensure-runtime-git-excludes! ctx)
      (prepare-workspace! ctx)
      (prepare-worktrees! ctx)
      (prepare-handoff-dirs! ctx)
      (stop-handoff-daemon! ctx)
      (when (sh-ok? "tmux" "-S" (:tmux-socket ctx) "has-session" "-t" dashboard-session)
        (println (str yellow "Existing SwarmForge dashboard found. Killing it..." reset))
        (sh "tmux" "-S" (:tmux-socket ctx) "kill-session" "-t" dashboard-session))
      (doseq [row (:roles ctx)]
        (when (sh-ok? "tmux" "-S" (:tmux-socket ctx) "has-session" "-t" (:session row))
          (println (str yellow "Existing SwarmForge session found: " (:session row) ". Killing it..." reset))
          (sh "tmux" "-S" (:tmux-socket ctx) "kill-session" "-t" (:session row))))
      (println (str cyan bold))
      (println "  SwarmForge v1.0 Starting")
      (println "  Disciplined agents build better software")
      (println reset)
      (println (str green "Launching SwarmForge tmux sessions..." reset))
      (doseq [row (:roles ctx)]
        (create-role-session! ctx (:session row) (:display-name row)))
      (create-dashboard-session! ctx)
      (write-tmux-env-file! ctx)
      (sync-worktree-scripts! ctx)
      (start-handoff-daemon! ctx)
      (println (str green "Starting agents..." reset))
      (let [delay-ms (env-long "SWARMFORGE_AGENT_START_DELAY_MS" 1500)]
        (doseq [[index row] (map-indexed vector (:roles ctx))]
          (when (pos? index)
            (Thread/sleep delay-ms))
          (launch-role! ctx index row)))
      (println)
      (println (str green bold "SwarmForge is ready." reset))
      (println "Working directory:" (str (:working-dir ctx)))
      (println "Sessions:")
      (println (str "  Dashboard: " dashboard-session " (all agents)"))
      (doseq [row (:roles ctx)]
        (println (str "  " (:display-name row) ": " (:session row))))
      (println)
      (println (str green "Tip: Write a handoff draft and run swarm_handoff.sh while the swarm is running." reset))
      (println (str green "Tip: Reattach manually with 'tmux -S " (:tmux-socket ctx) " attach-session -t <session-name>' if needed." reset))
      (println)
      (open-terminal-surfaces! ctx))))

(defn test-terminal-bridge! [root backend]
  (let [local-script-dir (fs/path root "swarmforge" "scripts")
        ctx (cond-> (assoc (context root) :terminal-backend backend)
              (fs/exists? local-script-dir) (assoc :script-dir local-script-dir))]
    (println (terminal-call-out ctx "terminal_open_session" "swarmforge-specifier" "SwarmForge Specifier" ""))))

(defn test-tmux-base-indexes! [tmux-socket]
  (let [ctx (detect-tmux-base-indexes {:tmux-socket tmux-socket
                                        :tmux-socket-dir (str (fs/parent (fs/path tmux-socket)))})]
    (println (:tmux-window-base-index ctx) (:tmux-pane-base-index ctx))))

(defn test-launch-command! [root agent & [extra-args]]
  (let [ctx (assoc (context root) :terminal-backend "none")
        row {:role "coder"
             :agent agent
             :session "swarmforge-coder"
             :display-name "Coder"
             :worktree-name "master"
             :worktree-path (fs/path root)
             :receive-mode "task"
             :extra-arg-tokens (when extra-args [extra-args])
             :extra-args extra-args}]
    (fs/create-dirs (:prompts-dir ctx))
    (println (launch-command ctx 1 row))))

(defn test-sleep-inhibitor-prefix! []
  (println (str/join " " (or (sleep-inhibitor-prefix) []))))

(defn test-host-dependencies! []
  (check-host-dependencies!)
  (println "host dependencies passed"))

(defn parse-main-args [args]
  (cond
    (empty? args) (System/getProperty "user.dir")
    (#{"--help" "-h"} (first args))
    (if (= 1 (count args))
      (do (println usage) nil)
      (cli-error! "--help does not accept arguments"))
    (str/starts-with? (first args) "-")
    (cli-error! (str "Unknown option: " (first args)))
    (> (count args) 1)
    (cli-error! "Only one PROJECT_ROOT argument is accepted")
    :else (first args)))

(defn -main [& args]
  (case (first args)
    "--test-parse" (test-parse! (or (second args) (System/getProperty "user.dir")))
    "--test-terminal-bridge" (test-terminal-bridge! (or (second args) (System/getProperty "user.dir")) (nth args 2))
    "--test-launch-command" (apply test-launch-command!
                                     (or (second args) (System/getProperty "user.dir"))
                                     (drop 2 args))
    "--test-agent-start-delay" (println (env-long "SWARMFORGE_AGENT_START_DELAY_MS" 1500))
    "--test-host-dependencies" (test-host-dependencies!)
    "--test-sleep-inhibitor-prefix" (test-sleep-inhibitor-prefix!)
    "--test-tmux-base-indexes" (test-tmux-base-indexes! (second args))
    (when-let [root (parse-main-args args)]
      (run-main! root))))

(apply -main *command-line-args*)

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-05T23:21:12.661699145+02:00", :module-hash "-1501666558", :forms [{:id "form/0/ns", :kind "ns", :line 3, :end-line 6, :hash "1982376053"} {:id "def/session-prefix", :kind "def", :line 8, :end-line 8, :hash "1177684450"} {:id "def/dashboard-session", :kind "def", :line 9, :end-line 9, :hash "1617671057"} {:id "def/agent-window", :kind "def", :line 10, :end-line 10, :hash "826884339"} {:id "def/red", :kind "def", :line 11, :end-line 11, :hash "-936026397"} {:id "def/green", :kind "def", :line 12, :end-line 12, :hash "535205870"} {:id "def/yellow", :kind "def", :line 13, :end-line 13, :hash "1509004541"} {:id "def/cyan", :kind "def", :line 14, :end-line 14, :hash "-521463774"} {:id "def/bold", :kind "def", :line 15, :end-line 15, :hash "1035049390"} {:id "def/reset", :kind "def", :line 16, :end-line 16, :hash "1989498821"} {:id "def/usage", :kind "def", :line 17, :end-line 18, :hash "-1886620994"} {:id "defn/sh", :kind "defn", :line 20, :end-line 21, :hash "768128389"} {:id "defn/sh-ok?", :kind "defn", :line 23, :end-line 24, :hash "-937989204"} {:id "defn/sh-out", :kind "defn", :line 26, :end-line 27, :hash "-1119548792"} {:id "defn/command-exists?", :kind "defn", :line 29, :end-line 30, :hash "-244285551"} {:id "defn/env-long", :kind "defn", :line 32, :end-line 37, :hash "-1373098309"} {:id "defn/fail!", :kind "defn", :line 39, :end-line 42, :hash "357624607"} {:id "defn/cli-error!", :kind "defn", :line 44, :end-line 48, :hash "1952866326"} {:id "defn/sq", :kind "defn", :line 50, :end-line 51, :hash "732381309"} {:id "defn/normalize-terminal-backend", :kind "defn", :line 53, :end-line 59, :hash "133909815"} {:id "defn/detect-terminal-backend", :kind "defn", :line 61, :end-line 69, :hash "86708233"} {:id "defn/display-name-for-role", :kind "defn", :line 71, :end-line 75, :hash "301641385"} {:id "defn/session-name-for-role", :kind "defn", :line 77, :end-line 78, :hash "-42650890"} {:id "defn/worktree-path-for-name", :kind "defn", :line 80, :end-line 81, :hash "1396786093"} {:id "defn/tmux-agent-target", :kind "defn", :line 83, :end-line 84, :hash "-1594203900"} {:id "defn/tmux-option", :kind "defn", :line 86, :end-line 94, :hash "811862293"} {:id "defn/detect-tmux-base-indexes", :kind "defn", :line 96, :end-line 106, :hash "838288553"} {:id "defn/ensure-in-file!", :kind "defn", :line 108, :end-line 114, :hash "305488608"} {:id "defn/ensure-initial-gitignore!", :kind "defn", :line 116, :end-line 122, :hash "1027630443"} {:id "defn/ensure-runtime-git-excludes!", :kind "defn", :line 124, :end-line 128, :hash "1819187199"} {:id "defn/initialize-git-repo!", :kind "defn", :line 130, :end-line 136, :hash "-1402231432"} {:id "defn/parse-config", :kind "defn", :line 138, :end-line 203, :hash "725173036"} {:id "defn/write-sessions-file!", :kind "defn", :line 205, :end-line 212, :hash "-1321449734"} {:id "defn/write-roles-file!", :kind "defn", :line 214, :end-line 225, :hash "-1891209620"} {:id "def/required-helpers", :kind "def", :line 227, :end-line 240, :hash "-316016141"} {:id "def/terminal-helpers", :kind "def", :line 242, :end-line 243, :hash "-1665982019"} {:id "defn/check-helper-scripts!", :kind "defn", :line 245, :end-line 253, :hash "-1602584632"} {:id "defn/prepare-workspace!", :kind "defn", :line 255, :end-line 261, :hash "-1351857138"} {:id "defn/prepare-worktrees!", :kind "defn", :line 263, :end-line 287, :hash "-467196463"} {:id "defn/prepare-handoff-dirs!", :kind "defn", :line 289, :end-line 292, :hash "1229758344"} {:id "defn/write-tmux-env-file!", :kind "defn", :line 294, :end-line 296, :hash "-1923946903"} {:id "defn/sync-worktree-scripts!", :kind "defn", :line 298, :end-line 314, :hash "1844368326"} {:id "defn/check-dependency!", :kind "defn", :line 316, :end-line 318, :hash "-1709681380"} {:id "def/required-host-dependencies", :kind "def", :line 320, :end-line 320, :hash "-130095531"} {:id "defn/check-host-dependencies!", :kind "defn", :line 322, :end-line 324, :hash "1049304125"} {:id "defn/check-backend-dependencies!", :kind "defn", :line 326, :end-line 328, :hash "1217419167"} {:id "defn/create-role-session!", :kind "defn", :line 330, :end-line 333, :hash "-1245471385"} {:id "defn/dashboard-command", :kind "defn", :line 335, :end-line 339, :hash "-1169304219"} {:id "defn/create-dashboard-session!", :kind "defn", :line 341, :end-line 359, :hash "-1290202348"} {:id "defn/extra-args-prefix", :kind "defn", :line 361, :end-line 366, :hash "749499860"} {:id "defn/reject-unsafe-codex-args!", :kind "defn", :line 368, :end-line 375, :hash "-1775606530"} {:id "defn/validate-agent-args!", :kind "defn", :line 377, :end-line 381, :hash "-1690058583"} {:id "defn/grok-wants-auto-approve?", :kind "defn", :line 383, :end-line 387, :hash "164828998"} {:id "defn/grok-permission-prefix", :kind "defn", :line 389, :end-line 394, :hash "2049913494"} {:id "defn/launch-command", :kind "defn", :line 396, :end-line 426, :hash "1592187153"} {:id "defn/launch-role!", :kind "defn", :line 428, :end-line 436, :hash "1976985436"} {:id "defn/stop-handoff-daemon!", :kind "defn", :line 438, :end-line 441, :hash "1063950244"} {:id "defn/uname", :kind "defn", :line 443, :end-line 444, :hash "-1709199867"} {:id "defn/linux-systemd-running?", :kind "defn", :line 446, :end-line 449, :hash "-1260585109"} {:id "defn/wsl?", :kind "defn", :line 451, :end-line 454, :hash "1724657802"} {:id "defn/systemd-inhibit-usable?", :kind "defn", :line 456, :end-line 462, :hash "1308365805"} {:id "defn/sleep-inhibitor-prefix", :kind "defn", :line 464, :end-line 478, :hash "1741938160"} {:id "defn/start-handoff-daemon!", :kind "defn", :line 480, :end-line 491, :hash "-1353831356"} {:id "defn/adapter-script", :kind "defn", :line 493, :end-line 501, :hash "102290620"} {:id "defn/terminal-call", :kind "defn", :line 503, :end-line 504, :hash "405716460"} {:id "defn/terminal-call-ok?", :kind "defn", :line 506, :end-line 507, :hash "-690091480"} {:id "defn/terminal-call-out", :kind "defn", :line 509, :end-line 510, :hash "1233027316"} {:id "defn/open-terminal-surfaces!", :kind "defn", :line 512, :end-line 545, :hash "-1556818174"} {:id "defn/context", :kind "defn", :line 547, :end-line 580, :hash "-1031445174"} {:id "defn/prepare-ctx", :kind "defn", :line 582, :end-line 586, :hash "500389056"} {:id "defn/test-parse!", :kind "defn", :line 588, :end-line 597, :hash "-276082515"} {:id "defn/toolchain-preflight!", :kind "defn", :line 599, :end-line 612, :hash "-1767688804"} {:id "defn/run-main!", :kind "defn", :line 614, :end-line 664, :hash "-1211609482"} {:id "defn/test-terminal-bridge!", :kind "defn", :line 666, :end-line 670, :hash "810531452"} {:id "defn/test-tmux-base-indexes!", :kind "defn", :line 672, :end-line 675, :hash "647423146"} {:id "defn/test-launch-command!", :kind "defn", :line 677, :end-line 689, :hash "18183711"} {:id "defn/test-sleep-inhibitor-prefix!", :kind "defn", :line 691, :end-line 692, :hash "-1724539462"} {:id "defn/test-host-dependencies!", :kind "defn", :line 694, :end-line 696, :hash "1308333315"} {:id "defn/parse-main-args", :kind "defn", :line 698, :end-line 709, :hash "1811123786"} {:id "defn/-main", :kind "defn", :line 711, :end-line 723, :hash "-1037011656"} {:id "form/80/apply", :kind "apply", :line 725, :end-line 725, :hash "-1632864693"}]}
;; clj-mutate-manifest-end
