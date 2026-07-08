(ns acceptance.steps.package-flow
  (:require [aps.json :as aps-json]
            [babashka.fs :as fs]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str])
  (:import [java.nio.file Files]))

(def command-options {:out :string :err :string :continue true})

(defn- example-value [example key]
  (or (get example key)
      (get example (keyword key))))

(defn- require-example [example key]
  (let [value (example-value example key)]
    (when (str/blank? value)
      (throw (ex-info (format "Missing example value: %s" key) {:key key})))
    value))

(defn- assert! [condition message data]
  (when-not condition
    (throw (ex-info message data))))

(defn- repository-root []
  (fs/cwd))

(defn- read-json-string [text]
  (json/parse-string text true))

(defn loadable-extension-build? [files]
  (try
    (let [manifest (read-json-string (get files "manifest.json" ""))]
      (and (= 3 (:manifest_version manifest))
           (contains? files (get-in manifest [:background :service_worker]))
           (contains? files (get-in manifest [:side_panel :default_path]))))
    (catch Exception _
      false)))

(defn- dir-files [root dir]
  (->> (file-seq (fs/file (fs/path root dir)))
       (filter fs/regular-file?)
       (map (fn [file]
              [(str (fs/relativize (fs/path root dir) file))
               (slurp (str file))]))
       (into {})))

(defn- run-command [command]
  (process/shell command-options command))

(defn- ensure-command-succeeded! [result command]
  (assert! (zero? (:exit result))
           "Command failed."
           {:command command
            :exit (:exit result)
            :out (:out result)
            :err (:err result)}))

(defn- package-artifacts [root artifact-type]
  (let [suffix (str "." artifact-type)]
    (->> (fs/glob root "build/package/*")
         (filter fs/regular-file?)
         (filter #(str/ends-with? (fs/file-name %) suffix))
         (map str)
         sort
         vec)))

(defn- unsigned-byte [bytes index]
  (bit-and (aget bytes index) 0xff))

(defn- uint16-le [bytes index]
  (+ (unsigned-byte bytes index)
     (bit-shift-left (unsigned-byte bytes (inc index)) 8)))

(defn- uint32-le [bytes index]
  (+ (uint16-le bytes index)
     (bit-shift-left (uint16-le bytes (+ index 2)) 16)))

(defn zip-entry-names [path]
  (let [bytes (Files/readAllBytes (fs/path path))]
    (loop [offset 0
           names []]
      (if (or (>= (+ offset 30) (count bytes))
              (not= 0x04034b50 (uint32-le bytes offset)))
        names
        (let [compressed-size (uint32-le bytes (+ offset 18))
              name-length (uint16-le bytes (+ offset 26))
              extra-length (uint16-le bytes (+ offset 28))
              name-start (+ offset 30)
              name-end (+ name-start name-length)
              name (String. bytes name-start name-length "UTF-8")
              next-offset (+ name-end extra-length compressed-size)]
          (recur next-offset (conj names name)))))))

(defn readme-documents-artifact-copy? [readme artifact-type]
  (let [readme (str/lower-case readme)]
    (and (str/includes? readme (str/lower-case artifact-type))
         (str/includes? readme "copy")
         (str/includes? readme "another machine"))))

(defn readme-documents-dist-copy? [readme dist-dir]
  (let [readme (str/lower-case readme)]
    (and (str/includes? readme (str/lower-case dist-dir))
         (str/includes? readme "copy")
         (str/includes? readme "another machine"))))

(defn readme-documents-unpacked-load? [readme]
  (and (str/includes? readme "Chrome extensions")
       (str/includes? readme "load unpacked")))

(defn readme-documents-smoke-test? [readme]
  (and (str/includes? readme "Smoke test")
       (str/includes? readme "side panel")
       (str/includes? readme "demo.say-hello")))

(def forbidden-package-patterns
  [{:kind :store-packaging
    :pattern #"(?i)chrome web store|webstore"}
   {:kind :signing
    :pattern #"(?i)signing|private key|certificate"}
   {:kind :auto-update
    :pattern #"(?i)auto[- ]?update|update_url"}])

(defn forbidden-package-scope-findings [files]
  (vec
   (for [{:keys [kind pattern]} forbidden-package-patterns
         path (sort (keys files))
         :when (re-find pattern (get files path))]
     {:kind kind :path path})))

(defn- inspected-files [root]
  (cond-> {"package.json" (slurp (str (fs/path root "package.json")))
           "README.md" (slurp (str (fs/path root "README.md")))
           "scripts/package.mjs" (slurp (str (fs/path root "scripts" "package.mjs")))}
    (fs/exists? (fs/path root "src" "update.ts"))
    (assoc "src/update.ts" (slurp (str (fs/path root "src" "update.ts"))))))

(def handlers
  [{:pattern #"^command <([A-Za-z0-9_]+)> is run$"
    :handler (fn [world example [command-key]]
               (let [command (require-example example command-key)
                     result (run-command command)]
                 (ensure-command-succeeded! result command)
                 (assoc world
                        :root (repository-root)
                        :last-command command
                        :last-result result)))}

   {:pattern #"^output directory <([A-Za-z0-9_]+)> is created$"
    :handler (fn [world example [dist-key]]
               (let [dist-dir (require-example example dist-key)
                     path (fs/path (:root world) dist-dir)]
                 (assert! (fs/directory? path)
                          "Output directory was not created."
                          {:path (str path)})
                 (assoc world :dist-dir dist-dir)))}

   {:pattern #"^<([A-Za-z0-9_]+)> contains a loadable Chrome extension build$"
    :handler (fn [world example [dist-key]]
               (let [dist-dir (require-example example dist-key)
                     files (dir-files (:root world) dist-dir)]
                 (assert! (loadable-extension-build? files)
                          "Output directory does not contain a loadable extension build."
                          {:dist-dir dist-dir :files (sort (keys files))})
                 world))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is run after a production build$"
    :handler (fn [world example [command-key]]
               (let [root (repository-root)
                     build-result (run-command "npm run build")
                     command (require-example example command-key)]
                 (ensure-command-succeeded! build-result "npm run build")
                 (let [result (run-command command)]
                   (ensure-command-succeeded! result command)
                   (assoc world
                          :root root
                          :last-command command
                          :last-result result))))}

   {:pattern #"^a <([A-Za-z0-9_]+)> package artifact is created from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [artifact-key dist-key]]
               (let [artifact-type (require-example example artifact-key)
                     dist-dir (require-example example dist-key)
                     artifacts (package-artifacts (:root world) artifact-type)]
                 (assert! (seq artifacts)
                          "Package artifact was not created."
                          {:artifact-type artifact-type})
                 (assoc world
                        :artifact-type artifact-type
                        :dist-dir dist-dir
                        :artifact-path (last artifacts))))}

   {:pattern #"^the package artifact contains the Chrome extension build from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [dist-key]]
               (let [_dist-dir (require-example example dist-key)
                     entries (set (zip-entry-names (:artifact-path world)))]
                 (assert! (every? entries ["manifest.json" "background.js" "side-panel.html"])
                          "Package artifact does not contain the extension build."
                          {:artifact (:artifact-path world)
                           :entries (sort entries)})
                 world))}

   {:pattern #"^the README is inspected$"
    :handler (fn [world _example _captures]
               (let [root (repository-root)]
                 (assoc world
                        :root root
                        :readme (slurp (str (fs/path root "README.md"))))))}

   {:pattern #"^the README documents copying the <([A-Za-z0-9_]+)> package artifact to another machine$"
    :handler (fn [world example [artifact-key]]
               (let [artifact-type (require-example example artifact-key)]
                 (assert! (readme-documents-artifact-copy? (:readme world) artifact-type)
                          "README does not document copying the package artifact."
                          {:artifact-type artifact-type})
                 world))}

   {:pattern #"^the README documents copying <([A-Za-z0-9_]+)> to another machine$"
    :handler (fn [world example [dist-key]]
               (let [dist-dir (require-example example dist-key)]
                 (assert! (readme-documents-dist-copy? (:readme world) dist-dir)
                          "README does not document copying the dist directory."
                          {:dist-dir dist-dir})
                 world))}

   {:pattern #"^the README documents loading the unpacked extension in Chrome$"
    :handler (fn [world _example _captures]
               (assert! (readme-documents-unpacked-load? (:readme world))
                        "README does not document loading the unpacked extension."
                        {})
               world)}

   {:pattern #"^the README includes smoke test steps for the installed extension$"
    :handler (fn [world _example _captures]
               (assert! (readme-documents-smoke-test? (:readme world))
                        "README does not include installed-extension smoke test steps."
                        {})
               world)}

   {:pattern #"^package flow documentation and scripts are inspected$"
    :handler (fn [world _example _captures]
               (let [root (repository-root)]
                 (assoc world
                        :root root
                        :package-flow-files (inspected-files root))))}

   {:pattern #"^Chrome Web Store packaging is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :store-packaging (:kind %))
                                      (forbidden-package-scope-findings (:package-flow-files world)))]
                 (assert! (empty? findings)
                          "Store packaging was found."
                          {:findings (vec findings)})
                 world))}

   {:pattern #"^signing is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :signing (:kind %))
                                      (forbidden-package-scope-findings (:package-flow-files world)))]
                 (assert! (empty? findings)
                          "Signing behavior was found."
                          {:findings (vec findings)})
                 world))}

   {:pattern #"^auto-update behavior is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :auto-update (:kind %))
                                      (forbidden-package-scope-findings (:package-flow-files world)))]
                 (assert! (empty? findings)
                          "Auto-update behavior was found."
                          {:findings (vec findings)})
                 world))}])
