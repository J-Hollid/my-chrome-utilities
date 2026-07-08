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

(defn repository-root []
  (fs/cwd))

(defn assert! [condition message data]
  (when-not condition
    (throw (ex-info message data))))

(defn run-build-command [world]
  (let [result (process/shell build-shell-options "npm run build")]
    (assoc world :build-result result)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T20:48:23.742050187+02:00", :module-hash "-1136987380", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-316380013"} {:id "def/build-shell-options", :kind "def", :line 7, :end-line nil, :hash "-930688589"} {:id "defn/example-value", :kind "defn", :line 9, :end-line nil, :hash "-599943701"} {:id "defn/require-example-value!", :kind "defn", :line 13, :end-line nil, :hash "749498583"} {:id "defn/require-example", :kind "defn", :line 17, :end-line nil, :hash "-773092781"} {:id "defn/read-json", :kind "defn", :line 22, :end-line nil, :hash "1794933363"} {:id "defn/repository-root", :kind "defn", :line 27, :end-line nil, :hash "-1494942566"} {:id "defn/assert!", :kind "defn", :line 30, :end-line nil, :hash "866058476"} {:id "defn/run-build-command", :kind "defn", :line 34, :end-line nil, :hash "378996986"}]}
;; clj-mutate-manifest-end
