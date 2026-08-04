#!/usr/bin/env bb

(ns swarmforge.handoff-sequence
  (:require [babashka.fs :as fs]
            [clojure.edn :as edn]
            [clojure.string :as str]))

(def default-lock-timeout-ms 5000)
(def maximum-lock-timeout-ms 60000)

(defn- lock-timeout-ms []
  (if-let [raw (System/getenv "SWARMFORGE_SEQUENCE_LOCK_TIMEOUT_MS")]
    (let [value (try
                  (Long/parseLong raw)
                  (catch Exception _ nil))]
      (when-not (and value (pos? value) (<= value maximum-lock-timeout-ms))
        (throw (ex-info
                (format "SWARMFORGE_SEQUENCE_LOCK_TIMEOUT_MS must be an integer from 1 to %d"
                        maximum-lock-timeout-ms)
                {:exit 64})))
      value)
    default-lock-timeout-ms))

(defn- process-start-time [process-handle]
  (try
    (let [start (.startInstant (.info process-handle))]
      (when (.isPresent start)
        (str (.get start))))
    (catch Exception _ nil)))

(defn- owner-record [token]
  (let [current (java.lang.ProcessHandle/current)]
    {:version 1
     :pid (.pid current)
     :start-time (process-start-time current)
     :token token
     :created-at (str (java.time.Instant/now))}))

(defn- valid-owner? [owner]
  (and (map? owner)
       (= 1 (:version owner))
       (integer? (:pid owner))
       (pos? (:pid owner))
       (string? (:token owner))
       (not (str/blank? (:token owner)))
       (or (nil? (:start-time owner)) (string? (:start-time owner)))))

(defn- read-owner [owner-file]
  (when (fs/exists? owner-file)
    (try
      (let [owner (edn/read-string (slurp (str owner-file)))]
        (if (valid-owner? owner) owner {:malformed true}))
      (catch Exception _ {:malformed true}))))

(defn- live-owner? [owner]
  (when (valid-owner? owner)
    (let [candidate (java.lang.ProcessHandle/of (long (:pid owner)))]
      (when (.isPresent candidate)
        (let [actual-start (process-start-time (.get candidate))
              recorded-start (:start-time owner)]
          ;; If either platform cannot expose a start time, PID liveness is the
          ;; conservative boundary. When both are known, reject PID reuse.
          (or (nil? recorded-start)
              (nil? actual-start)
              (= recorded-start actual-start)))))))

(defn- atomic-write! [directory target prefix contents]
  (let [stage (fs/create-temp-file {:dir directory :prefix prefix :suffix ".tmp"})]
    (try
      (spit (str stage) contents)
      (fs/move stage target {:replace-existing true :atomic-move true})
      (finally
        (fs/delete-if-exists stage)))))

(defn- open-lock-channel [lease-file]
  (java.nio.channels.FileChannel/open
   lease-file
   (into-array java.nio.file.OpenOption
               [java.nio.file.StandardOpenOption/CREATE
                java.nio.file.StandardOpenOption/WRITE])))

(defn- try-lock-channel [lease-file]
  (let [channel (open-lock-channel lease-file)]
    (try
      (if (.tryLock channel)
        channel
        (do (.close channel) nil))
      (catch Exception error
        (.close channel)
        (if (= "OverlappingFileLockException" (.getSimpleName (class error)))
          nil
          (throw error))))))

(defn- owner-description [owner]
  (if (valid-owner? owner)
    (str "owner pid " (:pid owner)
         (when-let [start (:start-time owner)] (str " started " start)))
    "owner metadata unavailable"))

(defn- wait-or-timeout! [deadline-ns timeout-ms owner lock-dir]
  (let [remaining-ns (- deadline-ns (System/nanoTime))]
    (when-not (pos? remaining-ns)
      (throw (ex-info
              (format "Timed out after %dms waiting for handoff sequence lock %s (%s)"
                      timeout-ms lock-dir (owner-description owner))
              {:exit 75})))
    (Thread/sleep (long (max 1 (min 25 (Math/ceil (/ remaining-ns 1000000.0))))))))

(defn acquire-sequence-lock! [state-directory]
  (let [directory (fs/path state-directory)
        lock-dir (fs/path directory "sequence.lock")
        lease-file (fs/path lock-dir "lease")
        owner-file (fs/path lock-dir "owner.edn")
        timeout-ms (lock-timeout-ms)
        deadline-ns (+ (System/nanoTime) (* timeout-ms 1000000))]
    (fs/create-dirs lock-dir)
    (loop []
      (if-let [channel (try-lock-channel lease-file)]
        (let [observed-owner (read-owner owner-file)]
          (if (live-owner? observed-owner)
            (do
              ;; A live identity without a matching kernel lease is suspicious.
              ;; Never steal it merely because the metadata and lease disagree.
              (.close channel)
              (wait-or-timeout! deadline-ns timeout-ms observed-owner lock-dir)
              (recur))
            (let [token (str (java.util.UUID/randomUUID))
                  owner (owner-record token)]
              (try
                (atomic-write! lock-dir owner-file ".owner." (str (pr-str owner) "\n"))
                {:channel channel
                 :lock-dir lock-dir
                 :owner-file owner-file
                 :owner owner
                 :recovered-owner observed-owner}
                (catch Exception error
                  (.close channel)
                  (throw error))))))
        (let [observed-owner (read-owner owner-file)]
          (wait-or-timeout! deadline-ns timeout-ms observed-owner lock-dir)
          (recur))))))

(defn release-sequence-lock! [{:keys [channel owner-file owner]}]
  (try
    (let [current-owner (read-owner owner-file)]
      (when-not (= (:token current-owner) (:token owner))
        (throw (ex-info "Handoff sequence lock ownership changed before release; refusing to remove it"
                        {:exit 74})))
      (fs/delete-if-exists owner-file))
    (finally
      ;; Closing the channel releases the operating-system lease even when the
      ;; process is killed and cannot run this cleanup path.
      (.close channel))))

(defn with-sequence-lock! [state-directory operation]
  (let [lock (acquire-sequence-lock! state-directory)]
    (try
      (operation)
      (finally
        (release-sequence-lock! lock)))))

(defn- last-sequence [sequence-file]
  (if-not (fs/exists? sequence-file)
    0
    (let [raw (slurp (str sequence-file))
          digits (second (re-matches #"([0-9]+)\n?" raw))]
      (when-not digits
        (throw (ex-info
                (str "Malformed handoff sequence file; refusing to reset or reuse an id: " sequence-file)
                {:exit 65})))
      (let [value (try
                    (Long/parseLong digits)
                    (catch NumberFormatException _ nil))]
        (when-not (and value (< value Long/MAX_VALUE))
          (throw (ex-info
                  (str "Handoff sequence is out of range; refusing to reuse an id: " sequence-file)
                  {:exit 65})))
        value))))

(defn next-sequence! [state-directory]
  (let [directory (fs/path state-directory)
        sequence-file (fs/path directory "sequence")]
    (fs/create-dirs directory)
    (with-sequence-lock!
      directory
      (fn []
        (let [next-value (inc (last-sequence sequence-file))
              formatted (format "%06d" next-value)]
          (atomic-write! directory sequence-file ".sequence." (str formatted "\n"))
          formatted)))))
