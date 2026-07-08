(ns acceptance.steps.project-skeleton
  (:require [babashka.fs :as fs]
            [babashka.process :as process]
            [clojure.string :as str]
            [aps.json :as aps-json]))

(defn- example-value [example key]
  (or (get example key)
      (get example (keyword key))))

(defn- require-example-value! [key value]
  (when (str/blank? value)
    (throw (ex-info (format "Missing example value: %s" key) {:key key}))))

(defn- require-example [example key]
  (let [value (example-value example key)]
    (require-example-value! key value)
    value))

(defn- read-json [path]
  (when-not (fs/exists? path)
    (throw (ex-info (format "Missing file: %s" path) {:path path})))
  (aps-json/read-json-file (str path)))

(defn- repository-root []
  (fs/cwd))

(defn- inspect-project [world]
  (let [root (repository-root)]
    (assoc world
           :root root
           :package (read-json (fs/path root "package.json"))
           :manifest (read-json (fs/path root "manifest.json"))
           :tsconfig (read-json (fs/path root "tsconfig.json"))
           :gitignore (slurp (str (fs/path root ".gitignore"))))))

(defn- assert! [condition message data]
  (when-not condition
    (throw (ex-info message data))))

(defn- project-files [root dir suffix]
  (->> (file-seq (fs/file (fs/path root dir)))
       (filter fs/regular-file?)
       (map str)
       (filter #(str/ends-with? % suffix))
       vec))

(defn- run-build-command [world]
  (let [result (process/shell {:out :string :err :string :continue true}
                              "npm run build")]
    (assoc world :build-result result)))

(def handlers
  [{:pattern #"^a repository for project <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [project-key]]
               (assoc world
                      :root (repository-root)
                      :project-name (require-example example project-key)))}

   {:pattern #"^the project skeleton is inspected$"
    :handler (fn [world _example _captures]
               (inspect-project world))}

   {:pattern #"^package metadata identifies the project as <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [project-key]]
               (let [expected (require-example example project-key)]
                 (assert! (= expected (get-in world [:package :name]))
                          "Package name does not match project name."
                          {:expected expected
                           :actual (get-in world [:package :name])})
                 world))}

   {:pattern #"^the skeleton includes TypeScript source$"
    :handler (fn [world _example _captures]
               (let [root (:root world)
                     source-files (project-files root "src" ".ts")]
                 (assert! (seq source-files)
                          "No TypeScript source files found."
                          {:root (str root)})
                 (assert! (some #(str/ends-with? % "src/background.ts") source-files)
                          "Browser background TypeScript entry source is missing."
                          {:source-files source-files})
                 (assert! (= ["src/**/*.ts"] (get-in world [:tsconfig :include]))
                          "tsconfig does not include TypeScript source."
                          {:include (get-in world [:tsconfig :include])})
                 world))}

   {:pattern #"^the skeleton includes a browser app entry point$"
    :handler (fn [world _example _captures]
               (let [service-worker (get-in world [:manifest :background :service_worker])
                     source-entry (fs/path (:root world)
                                           "src"
                                           (str/replace service-worker #"\.js$" ".ts"))]
                 (assert! (= 3 (:manifest_version (:manifest world)))
                          "Manifest is not a Chrome MV3 manifest."
                          {:manifest-version (:manifest_version (:manifest world))})
                 (assert! (= "background.js" service-worker)
                          "Manifest does not point at the browser background entry point."
                          {:service-worker service-worker})
                 (assert! (fs/exists? source-entry)
                          "TypeScript source for browser entry point is missing."
                          {:source-entry (str source-entry)})
                 world))}

   {:pattern #"^generated dependency and build outputs are ignored$"
    :handler (fn [world _example _captures]
               (doseq [ignored ["node_modules/" "dist/" "build/" "coverage/"]]
                 (assert! (str/includes? (:gitignore world) ignored)
                          "Expected generated output to be ignored."
                          {:missing ignored}))
               world)}

   {:pattern #"^the project build command is run$"
    :handler (fn [world _example _captures]
               (run-build-command world))}

   {:pattern #"^TypeScript checking succeeds$"
    :handler (fn [world _example _captures]
               (let [result (:build-result world)]
                 (assert! result
                          "Build command has not been run."
                          {})
                 (assert! (zero? (:exit result))
                          "Build command failed."
                          {:exit (:exit result)
                           :out (:out result)
                           :err (:err result)})
                 world))}

   {:pattern #"^a production build for <([A-Za-z0-9_]+)> completes$"
    :handler (fn [world example [project-key]]
               (let [expected (require-example example project-key)
                     dist-manifest (fs/path (:root world) "dist" "manifest.json")
                     dist-background (fs/path (:root world) "dist" "background.js")
                     package (or (:package world)
                                 (read-json (fs/path (:root world) "package.json")))]
                 (assert! (zero? (:exit (:build-result world)))
                          "Build command failed before production output was checked."
                          {:exit (:exit (:build-result world))})
                 (assert! (fs/exists? dist-manifest)
                          "Production manifest was not written."
                          {:path (str dist-manifest)})
                 (assert! (fs/exists? dist-background)
                          "Compiled browser entry point was not written."
                          {:path (str dist-background)})
                 (assert! (= expected (:name package))
                          "Production build does not belong to the expected project."
                          {:expected expected
                           :actual (:name package)})
                 world))}])
