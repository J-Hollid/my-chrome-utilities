(ns aps.mutation.metadata
  (:require [aps.json :as aps-json]
            [aps.mutation.hash :as mutation-hash]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.string :as str])
  (:import [java.time Instant]))

(defn empty-summary []
  (array-map :Total 0 :Killed 0 :Survived 0 :Errors 0))

(defn increment-summary [summary status]
  (case status
    "killed" (update summary :Killed inc)
    "survived" (update summary :Survived inc)
    "error" (update summary :Errors inc)
    summary))

(defn- strip-mutation-metadata [content]
  (let [state (reduce
               (fn [{:keys [in-manifest lines] :as state} line]
                 (let [trimmed (str/trim line)]
                   (cond
                     (str/starts-with? trimmed "# mutation-stamp:")
                     state

                     (= trimmed "# acceptance-mutation-manifest-begin")
                     (assoc state :in-manifest true)

                     (= trimmed "# acceptance-mutation-manifest-end")
                     (assoc state :in-manifest false)

                     in-manifest
                     state

                     :else
                     (assoc state :lines (conj lines line)))))
               {:in-manifest false :lines []}
               (str/split content #"\n" -1))]
    (str/replace (str/join "\n" (:lines state)) #"^\n+" "")))

(defn- read-mutation-metadata [feature-path]
  (try
    (let [content (slurp feature-path)
          lines (str/split content #"\n")
          parsed (reduce
                  (fn [{:keys [in-manifest manifest-lines] :as state} line]
                    (let [trimmed (str/trim line)]
                      (cond
                        (str/starts-with? trimmed "# mutation-stamp: sha256=")
                        (assoc state :stamp (subs trimmed (count "# mutation-stamp: sha256=")))

                        (= trimmed "# acceptance-mutation-manifest-begin")
                        (assoc state :in-manifest true)

                        (= trimmed "# acceptance-mutation-manifest-end")
                        (assoc state :in-manifest false)

                        in-manifest
                        (assoc state :manifest-lines
                               (conj manifest-lines (str/trim (str/replace trimmed #"^#" ""))))

                        :else state)))
                  {:in-manifest false :manifest-lines [] :stamp ""}
                  lines)]
      (if (seq (:manifest-lines parsed))
        {:stamp (:stamp parsed)
         :manifest (json/parse-string (str/join "" (:manifest-lines parsed)) true)}
        (when (seq (:stamp parsed))
          {:stamp (:stamp parsed) :manifest {}})))
    (catch Exception _ nil)))

(defn- hash-json [value]
  (mutation-hash/sha256 (json/generate-string value)))

(defn- mutation-count-for-scenario [mutations scenario-index]
  (count (filter #(= scenario-index (:scenario %)) mutations)))

(defn- scenario-index-from-path [path]
  (when-let [[_ index] (re-find #"^\$\.scenarios\[(\d+)\]" path)]
    (Long/parseLong index)))

(defn- scenario-summaries [feature report]
  (if (and (empty? (:results report))
           (= 1 (count (:scenarios feature)))
           (pos? (get-in report [:summary :Total] 0)))
    {0 (:summary report)}
    (reduce (fn [summaries result]
              (if-let [scenario-index (scenario-index-from-path (get-in result [:Mutation :Path]))]
                (-> summaries
                    (update scenario-index (fnil update (empty-summary)) :Total inc)
                    (update scenario-index increment-summary (:Status result)))
                summaries))
            {}
            (:results report))))

(defn- new-manifest [feature-path feature report implementation-hash mutations]
  (let [now (str (Instant/now))
        summaries (scenario-summaries feature report)]
    (array-map
     :version 1
     :tested_at now
     :feature_name (:name feature)
     :feature_path feature-path
     :background_hash (hash-json (:background feature))
     :implementation_hash implementation-hash
     :scenarios
     (vec
      (keep-indexed
       (fn [i scenario]
         (let [summary (summaries i)]
           (when (and summary (zero? (:Survived summary 0)) (zero? (:Errors summary 0)))
             (array-map :index i
                        :name (:name scenario)
                        :scenario_hash (hash-json scenario)
                        :mutation_count (mutation-count-for-scenario mutations i)
                        :result summary
                        :tested_at now))))
       (:scenarios feature))))))

(defn- manifest-entry-reusable? [old current entry level feature mutations]
  (and (= 1 (:version old))
       (= (:feature_name old) (:feature_name current))
       (= (:feature_path old) (:feature_path current))
       (= (:background_hash old) (:background_hash current))
       (or (not= level "hard") (= (:implementation_hash old) (:implementation_hash current)))
       (<= 0 (:index entry) (dec (count (:scenarios feature))))
       (let [scenario (get (:scenarios feature) (:index entry))]
         (and (= (:name entry) (:name scenario))
              (= (:scenario_hash entry) (hash-json scenario))))
       (zero? (get-in entry [:result :Survived] 0))
       (zero? (get-in entry [:result :Errors] 0))
       (= (:mutation_count entry) (mutation-count-for-scenario mutations (:index entry)))))

(defn- merge-reusable-previous-scenarios [current previous feature level mutations]
  (let [existing (set (map :index (:scenarios current)))
        reusable (remove #(existing (:index %))
                         (filter #(manifest-entry-reusable? previous current % level feature mutations)
                                 (:scenarios previous)))]
    (update current :scenarios into reusable)))

(defn write-mutation-metadata! [feature-path feature report implementation-hash level write-stamp? mutations]
  (let [content (slurp feature-path)
        previous (read-mutation-metadata feature-path)
        cleaned (strip-mutation-metadata content)
        stamp (mutation-hash/sha256 cleaned)
        manifest (cond-> (new-manifest feature-path feature report implementation-hash mutations)
                   previous (merge-reusable-previous-scenarios (:manifest previous) feature level mutations))
        manifest-json (json/generate-string manifest)
        metadata (str (when write-stamp?
                        (str "# mutation-stamp: sha256=" stamp "\n"))
                      "# acceptance-mutation-manifest-begin\n"
                      "# " manifest-json "\n"
                      "# acceptance-mutation-manifest-end\n\n"
                      (str/replace cleaned #"^\n+" ""))]
    (spit feature-path metadata)))

(defn- feature-stamp-valid? [feature-path]
  (when-let [metadata (read-mutation-metadata feature-path)]
    (and (seq (:stamp metadata))
         (= (:stamp metadata) (mutation-hash/sha256 (strip-mutation-metadata (slurp feature-path)))))))

(defn accepted-skips [cfg mutations]
  (if (or (= (:level cfg) "full") (str/blank? (:feature-path cfg)))
    #{}
    (if-let [metadata (read-mutation-metadata (:feature-path cfg))]
      (if (and (empty? (get-in metadata [:manifest :scenarios]))
               (feature-stamp-valid? (:feature-path cfg)))
        (set (range (count (get-in cfg [:feature :scenarios]))))
        (let [current (new-manifest (:feature-path cfg)
                                    (:feature cfg)
                                    {:summary (empty-summary) :results []}
                                    (:implementation-hash cfg)
                                    mutations)]
          (set (map :index
                    (filter #(manifest-entry-reusable? (:manifest metadata)
                                                       current
                                                       %
                                                       (:level cfg)
                                                       (:feature cfg)
                                                       mutations)
                            (get-in metadata [:manifest :scenarios]))))))
      #{})))

(defn- feature-metadata-slug [feature-path]
  (-> (reduce (fn [{:keys [s hyphen?]} ch]
                (let [c (Character/toLowerCase ^char ch)]
                  (if (or (<= (int \a) (int c) (int \z))
                          (<= (int \0) (int c) (int \9)))
                    {:s (str s c) :hyphen? false}
                    (if (and (not hyphen?) (seq s))
                      {:s (str s "-") :hyphen? true}
                      {:s s :hyphen? hyphen?}))))
              {:s "" :hyphen? false}
              feature-path)
      :s
      (str/replace #"^-+|-+$" "")))

(defn resolve-implementation-hash [generated-dir feature-path override]
  (if (seq override)
    override
    (let [path (str (io/file generated-dir "metadata" (str (feature-metadata-slug feature-path) ".json")))]
      (try
        (let [metadata (aps-json/read-json-file path)]
          (if (= (:feature_path metadata) feature-path)
            (or (:implementation_hash metadata) "unknown")
            "unknown"))
        (catch Exception _ "unknown")))))
