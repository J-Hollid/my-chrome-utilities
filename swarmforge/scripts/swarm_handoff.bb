#!/usr/bin/env bb

(ns swarm-handoff
  (:require [babashka.fs :as fs]
            [clojure.java.shell :refer [sh]]
            [clojure.string :as str]))

(def script-dir (fs/parent *file*))
(load-file (str (fs/path script-dir "handoff_sequence.bb")))
(def allocate-next-sequence!
  (or (resolve 'swarmforge.handoff-sequence/next-sequence!)
      (throw (ex-info "Cannot load the handoff sequence allocator" {:exit 1}))))

(def usage-text
  (str "Usage: swarm_handoff.sh <draft-file>\n\n"
       "Draft formats:\n\n"
       "type: git_handoff\n"
       "to: <role>[,<role>...]\n"
       "priority: NN\n"
       "task: <short-stable-task-name>\n"
       "commit: <10-char-commit-abbrev>\n"
       "base: <10-char-received-commit-abbrev>\n"
       "verified: <pack-id>[,<pack-id>...]|not-required\n\n"
       "type: note\n"
       "to: <role>[,<role>...]\n"
       "priority: NN\n"
       "message: <one-line summary, max 80 chars>\n"
       "\n"
       "<optional consolidated details, max 4000 chars>\n\n"
       "Only note drafts may contain a body."))

(def reserved-fields #{"id" "from" "role" "recipient" "created_at" "enqueued_at" "dequeued_at" "completed_at"})
(def allowed-fields #{"type" "to" "priority" "task" "commit" "base" "verified" "message"})
(def allowed-types #{"git_handoff" "note"})
(def max-note-details-length 4000)

(defn usage []
  (binding [*out* *err*]
    (println usage-text)))

(defn exit! [status message]
  (binding [*out* *err*]
    (when message
      (println message)))
  (System/exit status))

(defn command
  ([dir & args]
   (let [result (apply sh (concat args [:dir (str dir)]))]
     result)))

(defn git-root []
  (let [result (command "." "git" "rev-parse" "--show-toplevel")]
    (when (zero? (:exit result))
      (str/trim (:out result)))))

(defn git-common-dir []
  (let [result (command "." "git" "rev-parse" "--git-common-dir")]
    (when (zero? (:exit result))
      (let [path (str/trim (:out result))]
        (if (fs/absolute? path)
          (str (fs/path path))
          (str (fs/absolutize path)))))))

(defn project-root []
  (if-let [root (git-root)]
    (if (fs/exists? (fs/path root ".swarmforge" "roles.tsv"))
      root
      (if-let [common (git-common-dir)]
        (let [candidate (str (fs/parent common))]
          (if (fs/exists? (fs/path candidate ".swarmforge" "roles.tsv"))
            candidate
            (exit! 1 "Cannot find SwarmForge project root")))
        (exit! 1 "Cannot find SwarmForge project root")))
    (exit! 1 "Cannot find SwarmForge project root")))

(defn roles-file []
  (fs/path (project-root) ".swarmforge" "roles.tsv"))

(defn role-known? [role]
  (some (fn [line]
          (= role (first (str/split line #"\t"))))
        (str/split-lines (slurp (str (roles-file))))))

(defn sender-role []
  (if-let [role (not-empty (System/getenv "SWARMFORGE_ROLE"))]
    role
    (exit! 1 "Set SWARMFORGE_ROLE.")))

(defn state-dir []
  (fs/path (System/getProperty "user.dir") ".swarmforge" "handoffs"))

(defn timestamp []
  (.format java.time.format.DateTimeFormatter/ISO_INSTANT
           (java.time.Instant/now)))

(defn id-timestamp []
  (.format (java.time.format.DateTimeFormatter/ofPattern "yyyyMMdd'T'HHmmss'Z'")
           (.atZone (java.time.Instant/now) java.time.ZoneOffset/UTC)))

(defn valid-priority? [priority]
  (boolean (re-matches #"[0-9][0-9]" priority)))

(defn parse-draft [draft]
  (loop [lines (str/split-lines (slurp (str draft)))
         line-no 0
         body-seen? false
         headers {}
         ordered []
         body-lines []
         errors []]
    (if-let [line (first lines)]
      (let [line-no (inc line-no)]
        (cond
          body-seen?
          (recur (next lines) line-no body-seen? headers ordered (conj body-lines line) errors)

          (str/blank? line)
          (recur (next lines) line-no true headers ordered body-lines errors)

          (not (str/includes? line ": "))
          (recur (next lines) line-no body-seen? headers ordered body-lines
                 (conj errors (format "Line %d: expected 'field: value'." line-no)))

          :else
          (let [[field value] (str/split line #": " 2)]
            (cond
              (or (str/blank? field) (str/blank? value))
              (recur (next lines) line-no body-seen? headers ordered body-lines
                     (conj errors (format "Line %d: field and value must both be non-empty." line-no)))

              (reserved-fields field)
              (recur (next lines) line-no body-seen? headers ordered body-lines
                     (conj errors (format "Line %d: header '%s' is reserved and must not be written by agents." line-no field)))

              (not (allowed-fields field))
              (recur (next lines) line-no body-seen? headers ordered body-lines
                     (conj errors (format "Line %d: unknown header '%s'." line-no field)))

              (contains? headers field)
              (recur (next lines) line-no body-seen? headers ordered body-lines
                     (conj errors (format "Line %d: duplicate header '%s'." line-no field)))

              :else
              (recur (next lines) line-no body-seen? (assoc headers field value) (conj ordered field) body-lines errors)))))
      {:headers headers
       :ordered ordered
       :details (str/trim (str/join "\n" body-lines))
       :errors errors})))

(defn validate-recipients [to]
  (if (str/blank? to)
    [[] []]
    (let [recipients (str/split to #"," -1)]
      [recipients
       (loop [remaining recipients seen #{} errors []]
         (if-let [recipient (first remaining)]
           (let [errors (cond-> errors
                          (str/blank? recipient)
                          (conj "Header 'to' contains an empty recipient.")
                          (str/includes? recipient "_")
                          (conj (format "Recipient role '%s' is invalid; role names may not contain underscores." recipient))
                          (contains? seen recipient)
                          (conj (format "Duplicate recipient '%s'." recipient))
                          (and (not (str/blank? recipient)) (not (role-known? recipient)))
                          (conj (format "Unknown recipient role '%s'." recipient)))]
             (recur (next remaining) (conj seen recipient) errors))
           errors))])))

(defn canonical-commit [commit]
  (let [matches (-> (command "." "git" "rev-parse" (str "--disambiguate=" commit))
                    :out
                    str/split-lines
                    vec)]
    (cond
      (not= 1 (count matches))
      [nil (format "Header 'commit' must resolve to exactly one Git object; '%s' matched %d." commit (count matches))]

      :else
      (let [object (first matches)
            object-type (str/trim (:out (command "." "git" "cat-file" "-t" object)))]
        (if (= "commit" object-type)
          [(str/trim (:out (command "." "git" "rev-parse" "--short=10" object))) nil]
          [nil (format "Header 'commit' must resolve to a commit; '%s' resolves to '%s'." commit object-type)])))))

(defn validate [headers ordered details]
  (let [type (get headers "type")
        to (get headers "to")
        priority (get headers "priority")
        commit (get headers "commit")
        base (get headers "base")
        task-name (get headers "task")
        verified (get headers "verified")
        note-message (get headers "message")
        [recipients recipient-errors] (validate-recipients to)
        field-errors (for [field ordered
                           :let [valid? (case [type field]
                                          ["git_handoff" "type"] true
                                          ["git_handoff" "to"] true
                                          ["git_handoff" "priority"] true
                                          ["git_handoff" "task"] true
                                          ["git_handoff" "commit"] true
                                          ["git_handoff" "base"] true
                                          ["git_handoff" "verified"] true
                                          ["note" "type"] true
                                          ["note" "to"] true
                                          ["note" "priority"] true
                                          ["note" "message"] true
                                          false)]
                           :when (and type (not valid?))]
                       (format "Header '%s' is not allowed for type '%s'." field type))
        base-errors (cond-> []
                      (str/blank? type) (conj "Missing required header 'type'.")
                      (str/blank? to) (conj "Missing required header 'to'.")
                      (str/blank? priority) (conj "Missing required header 'priority'.")
                      (and (not (str/blank? type)) (not (allowed-types type)))
                      (conj (format "Header 'type' must be one of git_handoff or note; got '%s'." type))
                      (and (not (str/blank? priority)) (not (valid-priority? priority)))
                      (conj (format "Header 'priority' must be two digits from 00 to 99; got '%s'." priority)))
        [canonical commit-error]
        (if (= "git_handoff" type)
          (cond
            (str/blank? commit) [nil "Missing required header 'commit' for git_handoff."]
            (not (re-matches #"[0-9a-fA-F]{10}" commit))
            [nil (format "Header 'commit' must be exactly 10 hexadecimal characters; got '%s'." commit)]
            :else (canonical-commit commit))
          [nil nil])
        [canonical-base base-commit-error]
        (if (= "git_handoff" type)
          (cond
            (str/blank? base) [nil "Missing required header 'base' for git_handoff."]
            (not (re-matches #"[0-9a-fA-F]{10}" base))
            [nil (format "Header 'base' must be exactly 10 hexadecimal characters; got '%s'." base)]
            :else (canonical-commit base))
          [nil nil])
        lineage-error (when (and canonical canonical-base)
                        (let [result (command "." "git" "merge-base" "--is-ancestor"
                                              canonical-base canonical)]
                          (when-not (zero? (:exit result))
                            (format "Header 'base' commit '%s' must be an ancestor of candidate '%s'."
                                    canonical-base canonical))))
        git-errors (cond-> []
                     (= "git_handoff" type)
                     (into (cond-> []
                             (str/blank? task-name)
                             (conj "Missing required header 'task' for git_handoff.")
                             (str/blank? verified)
                             (conj "Missing required header 'verified' for git_handoff.")
                             (and (not (str/blank? verified))
                                  (not (re-matches #"(?:[a-z0-9][a-z0-9_-]*(?:,[a-z0-9][a-z0-9_-]*)*|not-required)" verified)))
                             (conj (format "Header 'verified' must be comma-separated pack ids or not-required; got '%s'." verified))
                             (and (not (str/blank? verified))
                                  (not= verified "not-required")
                                  (not= (count (str/split verified #","))
                                        (count (set (str/split verified #",")))))
                             (conj "Header 'verified' must list every pack once.")
                             (and (not (str/blank? task-name))
                                  (not (re-matches #"[A-Za-z0-9][A-Za-z0-9._-]*" task-name)))
                             (conj (format "Header 'task' must be a stable task name; got '%s'." task-name))
                             (> (count (or task-name "")) 80)
                             (conj (format "Header 'task' must be no longer than 80 characters; got %d." (count task-name)))))
                     (and (not= "git_handoff" type) (not (str/blank? commit)))
                     (conj "Header 'commit' is only allowed for git_handoff.")
                     (and (not= "git_handoff" type) (not (str/blank? task-name)))
                     (conj "Header 'task' is only allowed for git_handoff.")
                     commit-error
                     (conj commit-error)
                     base-commit-error
                     (conj base-commit-error)
                     lineage-error
                     (conj lineage-error))
        note-errors (cond-> []
                      (= "note" type)
                      (into (cond-> []
                              (str/blank? note-message)
                              (conj "Missing required header 'message' for note.")
                              (> (count (or note-message "")) 80)
                              (conj (format "Header 'message' must be no longer than 80 characters; got %d." (count note-message)))))
                      (and (not= "note" type) (not (str/blank? note-message)))
                      (conj "Header 'message' is only allowed for note."))
        body-errors (cond-> []
                      (and (not (str/blank? details)) (not= "note" type))
                      (conj "Only note drafts may contain a detail body.")
                      (> (count details) max-note-details-length)
                      (conj (format "Note details must be no longer than %d characters; got %d."
                                    max-note-details-length
                                    (count details))))]
    {:recipients recipients
     :canonical-commit canonical
     :canonical-base canonical-base
     :errors (vec (concat base-errors recipient-errors field-errors git-errors note-errors body-errors))}))

(defn next-sequence []
  (try
    (allocate-next-sequence! (state-dir))
    (catch clojure.lang.ExceptionInfo error
      (exit! (or (:exit (ex-data error)) 1) (ex-message error)))))

(defn body [type sender canonical-commit note-message note-details]
  (case type
    "git_handoff" (str "Re-read your role and constitution.\n\nmerge_and_process " sender " " canonical-commit)
    "note" (str "Re-read your role and constitution.\n\n"
                note-message
                (when-not (str/blank? note-details)
                  (str "\n\nDetails:\n" note-details)))))

(defn write-handoff! [{:keys [headers recipients canonical-commit canonical-base sender details]}]
  (let [timestamp-id (id-timestamp)
        created-at (timestamp)
        sequence (next-sequence)
        id (str timestamp-id "_" sequence "_from_" sender)
        recipient-slug (str/join "_" recipients)
        priority (get headers "priority")
        type (get headers "type")
        filename (str priority "_" timestamp-id "_" sequence "_from_" sender "_to_" recipient-slug ".handoff")
        outbox-dir (fs/path (state-dir) "outbox")
        tmp-dir (fs/path outbox-dir "tmp")
        tmp-file (fs/path tmp-dir (str filename ".tmp"))
        outbox-file (fs/path outbox-dir filename)
        handoff-body (body type sender canonical-commit (get headers "message") details)
        lines (cond-> [(str "id: " id)
                       (str "from: " sender)
                       (str "to: " (str/join "," recipients))
                       (str "priority: " priority)
                       (str "type: " type)]
                (= "git_handoff" type)
                (conj (str "role: " sender)
                     (str "task: " (get headers "task"))
                      (str "commit: " canonical-commit)
                      (str "base: " canonical-base)
                      (str "verified: " (get headers "verified")))
                (= "note" type)
                (conj (str "message: " (get headers "message")))
                true
                (conj (str "created_at: " created-at)
                      ""
                      handoff-body))]
    (doseq [dir [tmp-dir outbox-dir (fs/path (state-dir) "sent") (fs/path (state-dir) "failed")]]
      (fs/create-dirs dir))
    (spit (str tmp-file) (str (str/join "\n" lines) "\n"))
    (fs/move tmp-file outbox-file)
    outbox-file))

(defn error-report [draft errors]
  (binding [*out* *err*]
    (println "HANDOFF INVALID:" (str draft))
    (println)
    (println "Errors:")
    (doseq [error errors]
      (println "-" error))
    (println)
    (println usage-text)))

(defn canonical-change-paths [canonical-base canonical-commit]
  (let [result (command "." "git" "diff" "--name-status" "-z"
                        "--find-renames" "--find-copies"
                        (str canonical-base "..." canonical-commit))]
    (if-not (zero? (:exit result))
      [nil (str "Cannot classify verification exemption change set: "
                (str/trim (str (:err result) " " (:out result))))]
      (loop [fields (vec (remove str/blank? (str/split (:out result) #"\u0000" -1)))
             paths #{}]
        (if (empty? fields)
          [(sort paths) nil]
          (let [status-field (first fields)
                match (re-matches #"([ACDMRTUXB])(\d{1,3})?" status-field)]
            (cond
              (nil? match)
              [nil (str "Cannot classify unsupported Git change status: " status-field)]

              (contains? #{"R" "C"} (second match))
              (if (< (count fields) 3)
                [nil (str "Cannot classify incomplete Git change: " status-field)]
                (recur (subvec fields 3) (conj paths (second fields) (nth fields 2))))

              (< (count fields) 2)
              [nil (str "Cannot classify incomplete Git change: " status-field)]

              :else
              (recur (subvec fields 2) (conj paths (second fields))))))))))

(defn verification-exempt-path? [changed-path]
  (or (= changed-path "README.md")
      (str/starts-with? changed-path "docs/")
      (str/starts-with? changed-path "features/")
      (str/starts-with? changed-path "project-briefs/")
      (str/ends-with? changed-path ".prompt")))

(defn verification-errors [sender headers canonical-commit canonical-base]
  (when (= "git_handoff" (get headers "type"))
    (let [verified (get headers "verified")]
      (cond
        (and (= sender "coder") (= verified "not-required"))
        ["Coder handoffs require durable exact-pack evidence; not-required is not allowed."]

        (or (str/blank? verified) (str/blank? canonical-commit) (str/blank? canonical-base)) []

        (= verified "not-required")
        (let [[changed-paths classification-error]
              (canonical-change-paths canonical-base canonical-commit)
              disallowed (remove verification-exempt-path? changed-paths)]
          (cond
            classification-error [classification-error]
            (seq disallowed)
            [(str "verified: not-required is limited to documentation, specification, and prompt-only changes; "
                  "durable exact-pack evidence is required for: " (str/join ", " disallowed))]
            :else []))

        :else
        (let [result (command "." "node" "scripts/verification-evidence.mjs"
                              "verify" canonical-commit canonical-base (get headers "task") verified)]
          (if (zero? (:exit result))
            []
            [(str "Durable verification evidence is missing or invalid: "
                  (str/trim (str (:err result) " " (:out result))))]))))))

(defn -main [& args]
  (when (not= 1 (count args))
    (usage)
    (System/exit 1))
  (let [draft (fs/path (first args))]
    (when-not (fs/regular-file? draft)
      (exit! 1 (str "Draft file not found: " draft)))
    (let [sender (sender-role)]
      (when-not (role-known? sender)
        (exit! 1 (str "Unknown sender role: " sender)))
      (let [{:keys [headers ordered details errors]} (parse-draft draft)
            validation (validate headers ordered details)
            evidence-errors (verification-errors sender headers (:canonical-commit validation) (:canonical-base validation))
            all-errors (vec (concat errors (:errors validation) evidence-errors))]
        (when (seq all-errors)
          (error-report draft all-errors)
          (System/exit 2))
        (let [outbox-file (write-handoff! {:headers headers
                                           :recipients (:recipients validation)
                                           :canonical-commit (:canonical-commit validation)
                                           :canonical-base (:canonical-base validation)
                                           :sender sender
                                           :details details})]
          (fs/delete draft)
          (println "HANDOFF QUEUED:" (str outbox-file)))))))

(apply -main *command-line-args*)
