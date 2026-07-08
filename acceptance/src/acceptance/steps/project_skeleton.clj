(ns acceptance.steps.project-skeleton
  (:require [babashka.fs :as fs]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- inspect-project [world]
  (let [root (support/repository-root)]
    (assoc world
           :root root
           :package (support/read-json (fs/path root "package.json"))
           :manifest (support/read-json (fs/path root "manifest.json"))
           :tsconfig (support/read-json (fs/path root "tsconfig.json"))
           :gitignore (slurp (str (fs/path root ".gitignore"))))))

(defn- project-files [root dir suffix]
  (->> (file-seq (fs/file (fs/path root dir)))
       (filter fs/regular-file?)
       (map str)
       (filter #(str/ends-with? % suffix))
       vec))

(def handlers
  [{:pattern #"^a repository for project <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [project-key]]
               (assoc world
                      :root (support/repository-root)
                      :project-name (support/require-example example project-key)))}

   {:pattern #"^the project skeleton is inspected$"
    :handler (fn [world _example _captures]
               (inspect-project world))}

   {:pattern #"^package metadata identifies the project as <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [project-key]]
               (let [expected (support/require-example example project-key)]
                 (support/assert! (= expected (get-in world [:package :name]))
                                  "Package name does not match project name."
                                  {:expected expected
                                   :actual (get-in world [:package :name])})
                 world))}

   {:pattern #"^the skeleton includes TypeScript source$"
    :handler (fn [world _example _captures]
               (let [root (:root world)
                     source-files (project-files root "src" ".ts")]
                 (support/assert! (seq source-files)
                                  "No TypeScript source files found."
                                  {:root (str root)})
                 (support/assert! (some #(str/ends-with? % "src/background.ts") source-files)
                                  "Browser background TypeScript entry source is missing."
                                  {:source-files source-files})
                 (support/assert! (= ["src/**/*.ts"] (get-in world [:tsconfig :include]))
                                  "tsconfig does not include TypeScript source."
                                  {:include (get-in world [:tsconfig :include])})
                 world))}

   {:pattern #"^the skeleton includes a browser app entry point$"
    :handler (fn [world _example _captures]
               (let [service-worker (get-in world [:manifest :background :service_worker])
                     source-entry (fs/path (:root world)
                                           "src"
                                           (str/replace service-worker #"\.js$" ".ts"))]
                 (support/assert! (= 3 (:manifest_version (:manifest world)))
                                  "Manifest is not a Chrome MV3 manifest."
                                  {:manifest-version (:manifest_version (:manifest world))})
                 (support/assert! (= "background.js" service-worker)
                                  "Manifest does not point at the browser background entry point."
                                  {:service-worker service-worker})
                 (support/assert! (fs/exists? source-entry)
                                  "TypeScript source for browser entry point is missing."
                                  {:source-entry (str source-entry)})
                 world))}

   {:pattern #"^generated dependency and build outputs are ignored$"
    :handler (fn [world _example _captures]
               (doseq [ignored ["node_modules/" "dist/" "build/" "coverage/"]]
                 (support/assert! (str/includes? (:gitignore world) ignored)
                                  "Expected generated output to be ignored."
                                  {:missing ignored}))
               world)}

   {:pattern #"^the project build command is run$"
    :handler (fn [world _example _captures]
               (support/run-build-command world))}

   {:pattern #"^TypeScript checking succeeds$"
    :handler (fn [world _example _captures]
               (let [result (:build-result world)]
                 (support/assert! result
                                  "Build command has not been run."
                                  {})
                 (support/assert! (zero? (:exit result))
                                  "Build command failed."
                                  {:exit (:exit result)
                                   :out (:out result)
                                   :err (:err result)})
                 world))}

   {:pattern #"^a production build for <([A-Za-z0-9_]+)> completes$"
    :handler (fn [world example [project-key]]
               (let [expected (support/require-example example project-key)
                     dist-manifest (fs/path (:root world) "dist" "manifest.json")
                     dist-background (fs/path (:root world) "dist" "background.js")
                     package (or (:package world)
                                 (support/read-json (fs/path (:root world) "package.json")))]
                 (support/assert! (zero? (:exit (:build-result world)))
                                  "Build command failed before production output was checked."
                                  {:exit (:exit (:build-result world))})
                 (support/assert! (fs/exists? dist-manifest)
                                  "Production manifest was not written."
                                  {:path (str dist-manifest)})
                 (support/assert! (fs/exists? dist-background)
                                  "Compiled browser entry point was not written."
                                  {:path (str dist-background)})
                 (support/assert! (= expected (:name package))
                                  "Production build does not belong to the expected project."
                                  {:expected expected
                                   :actual (:name package)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T20:46:56.713535216+02:00", :module-hash "-957047346", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1748883287"} {:id "defn-/inspect-project", :kind "defn-", :line 6, :end-line nil, :hash "-2019852584"} {:id "defn-/project-files", :kind "defn-", :line 15, :end-line nil, :hash "379177836"} {:id "def/handlers", :kind "def", :line 22, :end-line nil, :hash "902508673"}]}
;; clj-mutate-manifest-end
