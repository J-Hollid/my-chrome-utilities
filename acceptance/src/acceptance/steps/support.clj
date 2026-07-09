(ns acceptance.steps.support
  (:require [aps.json :as aps-json]
            [babashka.fs :as fs]
            [babashka.process :as process]
            [clojure.string :as str]))

(def build-shell-options {:out :string :err :string :continue true})

(defn example-value [example key]
  (or (get example key)
      (get example (keyword key))))

(defn require-example-value! [key value]
  (when (str/blank? value)
    (throw (ex-info (format "Missing example value: %s" key) {:key key}))))

(defn require-example [example key]
  (let [value (example-value example key)]
    (require-example-value! key value)
    value))

(defn read-json [path]
  (when-not (fs/exists? path)
    (throw (ex-info (format "Missing file: %s" path) {:path path})))
  (aps-json/read-json-file (str path)))

(defn source-file [root path]
  (slurp (str (fs/path root path))))

(defn source-file-map [root paths]
  (into {}
        (map (fn [path]
               [path (source-file root path)])
             paths)))

(defn source-files [root]
  (->> (file-seq (fs/file (fs/path root "src")))
       (filter fs/regular-file?)
       (map (fn [file]
              [(str (fs/relativize root file)) (slurp (str file))]))
       (into (sorted-map))))

(defn pattern-findings [patterns files]
  (vec
   (for [{:keys [kind pattern]} patterns
         path (sort (keys files))
         :when (re-find pattern (get files path))]
     {:kind kind :path path})))

(defn repository-root []
  (fs/cwd))

(defn assert! [condition message data]
  (when-not condition
    (throw (ex-info message data))))

(defn ensure-build-passed! [world]
  (let [result (:build-result world)]
    (assert! result "Build command has not been run." {})
    (assert! (zero? (:exit result))
             "Build command failed."
             {:exit (:exit result)
              :out (:out result)
              :err (:err result)})))

(defn run-build-command [world]
  (let [result (process/shell build-shell-options "npm run build")]
    (assoc world :build-result result)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-09T16:35:49.717372527+02:00", :module-hash "562166196", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-316380013"} {:id "def/build-shell-options", :kind "def", :line 7, :end-line nil, :hash "-930688589"} {:id "defn/example-value", :kind "defn", :line 9, :end-line nil, :hash "-599943701"} {:id "defn/require-example-value!", :kind "defn", :line 13, :end-line nil, :hash "749498583"} {:id "defn/require-example", :kind "defn", :line 17, :end-line nil, :hash "-773092781"} {:id "defn/read-json", :kind "defn", :line 22, :end-line nil, :hash "1794933363"} {:id "defn/source-file", :kind "defn", :line 27, :end-line nil, :hash "-1939833971"} {:id "defn/source-file-map", :kind "defn", :line 30, :end-line nil, :hash "-254262717"} {:id "defn/source-files", :kind "defn", :line 36, :end-line nil, :hash "-888013632"} {:id "defn/pattern-findings", :kind "defn", :line 43, :end-line nil, :hash "1233155688"} {:id "defn/repository-root", :kind "defn", :line 50, :end-line nil, :hash "-1494942566"} {:id "defn/assert!", :kind "defn", :line 53, :end-line nil, :hash "866058476"} {:id "defn/ensure-build-passed!", :kind "defn", :line 57, :end-line nil, :hash "934213542"} {:id "defn/run-build-command", :kind "defn", :line 66, :end-line nil, :hash "378996986"}]}
;; clj-mutate-manifest-end
