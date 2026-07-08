(ns acceptance.steps.package-flow
  (:require [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str])
  (:import [java.nio.file Files]))

(def command-options support/build-shell-options)

(defn- read-json-string [text]
  (json/parse-string text true))

(defn- parse-manifest [files]
  (try
    (read-json-string (get files "manifest.json" ""))
    (catch Exception _
      nil)))

(defn- mv3-manifest? [manifest]
  (= 3 (:manifest_version manifest)))

(defn- required-extension-paths [manifest]
  [(get-in manifest [:background :service_worker])
   (get-in manifest [:side_panel :default_path])])

(defn- required-extension-files-present? [files manifest]
  (every? #(contains? files %) (required-extension-paths manifest)))

(defn- loadable-manifest-files? [files manifest]
  (and (mv3-manifest? manifest)
       (required-extension-files-present? files manifest)))

(defn loadable-extension-build? [files]
  (if-let [manifest (parse-manifest files)]
    (boolean (loadable-manifest-files? files manifest))
    false))

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
  (support/assert! (zero? (:exit result))
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

(def local-file-header-signature 0x04034b50)

(defn- zip-local-header-readable? [bytes offset]
  (< (+ offset 30) (count bytes)))

(defn- zip-local-header? [bytes offset]
  (and (zip-local-header-readable? bytes offset)
       (= local-file-header-signature (uint32-le bytes offset))))

(defn- zip-entry [bytes offset]
  (when (zip-local-header? bytes offset)
    (let [compressed-size (uint32-le bytes (+ offset 18))
          name-length (uint16-le bytes (+ offset 26))
          extra-length (uint16-le bytes (+ offset 28))
          name-start (+ offset 30)
          name-end (+ name-start name-length)]
      {:name (String. bytes name-start name-length "UTF-8")
       :next-offset (+ name-end extra-length compressed-size)})))

(defn- next-zip-entry [bytes entry]
  (zip-entry bytes (:next-offset entry)))

(defn- zip-entries [bytes]
  (take-while some?
              (iterate #(next-zip-entry bytes %)
                       (zip-entry bytes 0))))

(defn zip-entry-names [path]
  (mapv :name (zip-entries (Files/readAllBytes (fs/path path)))))

(defn- readme-documents-copy? [readme copied-name]
  (let [readme (str/lower-case readme)]
    (and (str/includes? readme (str/lower-case copied-name))
         (str/includes? readme "copy")
         (str/includes? readme "another machine"))))

(defn readme-documents-artifact-copy? [readme artifact-type]
  (readme-documents-copy? readme artifact-type))

(defn readme-documents-dist-copy? [readme dist-dir]
  (readme-documents-copy? readme dist-dir))

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
  (support/pattern-findings forbidden-package-patterns files))

(defn- inspected-files [root]
  (cond-> {"package.json" (support/source-file root "package.json")
           "README.md" (support/source-file root "README.md")
           "scripts/package.mjs" (support/source-file root "scripts/package.mjs")}
    (fs/exists? (fs/path root "src" "update.ts"))
    (assoc "src/update.ts" (support/source-file root "src/update.ts"))))

(def handlers
  [{:pattern #"^command <([A-Za-z0-9_]+)> is run$"
    :handler (fn [world example [command-key]]
               (let [command (support/require-example example command-key)
                     result (run-command command)]
                 (ensure-command-succeeded! result command)
                 (assoc world
                        :root (support/repository-root)
                        :last-command command
                        :last-result result)))}

   {:pattern #"^output directory <([A-Za-z0-9_]+)> is created$"
    :handler (fn [world example [dist-key]]
               (let [dist-dir (support/require-example example dist-key)
                     path (fs/path (:root world) dist-dir)]
                 (support/assert! (fs/directory? path)
                                  "Output directory was not created."
                                  {:path (str path)})
                 (assoc world :dist-dir dist-dir)))}

   {:pattern #"^<([A-Za-z0-9_]+)> contains a loadable Chrome extension build$"
    :handler (fn [world example [dist-key]]
               (let [dist-dir (support/require-example example dist-key)
                     files (dir-files (:root world) dist-dir)]
                 (support/assert! (loadable-extension-build? files)
                                  "Output directory does not contain a loadable extension build."
                                  {:dist-dir dist-dir :files (sort (keys files))})
                 world))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is run after a production build$"
    :handler (fn [world example [command-key]]
               (let [root (support/repository-root)
                     build-result (run-command "npm run build")
                     command (support/require-example example command-key)]
                 (ensure-command-succeeded! build-result "npm run build")
                 (let [result (run-command command)]
                   (ensure-command-succeeded! result command)
                   (assoc world
                          :root root
                          :last-command command
                          :last-result result))))}

   {:pattern #"^a <([A-Za-z0-9_]+)> package artifact is created from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [artifact-key dist-key]]
               (let [artifact-type (support/require-example example artifact-key)
                     dist-dir (support/require-example example dist-key)
                     artifacts (package-artifacts (:root world) artifact-type)]
                 (support/assert! (seq artifacts)
                                  "Package artifact was not created."
                                  {:artifact-type artifact-type})
                 (assoc world
                        :artifact-type artifact-type
                        :dist-dir dist-dir
                        :artifact-path (last artifacts))))}

   {:pattern #"^the package artifact contains the Chrome extension build from <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [dist-key]]
               (let [_dist-dir (support/require-example example dist-key)
                     entries (set (zip-entry-names (:artifact-path world)))]
                 (support/assert! (every? entries ["manifest.json" "background.js" "side-panel.html"])
                                  "Package artifact does not contain the extension build."
                                  {:artifact (:artifact-path world)
                                   :entries (sort entries)})
                 world))}

   {:pattern #"^the README is inspected$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)]
                 (assoc world
                        :root root
                        :readme (support/source-file root "README.md"))))}

   {:pattern #"^the README documents copying the <([A-Za-z0-9_]+)> package artifact to another machine$"
    :handler (fn [world example [artifact-key]]
               (let [artifact-type (support/require-example example artifact-key)]
                 (support/assert! (readme-documents-artifact-copy? (:readme world) artifact-type)
                                  "README does not document copying the package artifact."
                                  {:artifact-type artifact-type})
                 world))}

   {:pattern #"^the README documents copying <([A-Za-z0-9_]+)> to another machine$"
    :handler (fn [world example [dist-key]]
               (let [dist-dir (support/require-example example dist-key)]
                 (support/assert! (readme-documents-dist-copy? (:readme world) dist-dir)
                                  "README does not document copying the dist directory."
                                  {:dist-dir dist-dir})
                 world))}

   {:pattern #"^the README documents loading the unpacked extension in Chrome$"
    :handler (fn [world _example _captures]
               (support/assert! (readme-documents-unpacked-load? (:readme world))
                                "README does not document loading the unpacked extension."
                                {})
               world)}

   {:pattern #"^the README includes smoke test steps for the installed extension$"
    :handler (fn [world _example _captures]
               (support/assert! (readme-documents-smoke-test? (:readme world))
                                "README does not include installed-extension smoke test steps."
                                {})
               world)}

   {:pattern #"^package flow documentation and scripts are inspected$"
    :handler (fn [world _example _captures]
               (let [root (support/repository-root)]
                 (assoc world
                        :root root
                        :package-flow-files (inspected-files root))))}

   {:pattern #"^Chrome Web Store packaging is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :store-packaging (:kind %))
                                      (forbidden-package-scope-findings (:package-flow-files world)))]
                 (support/assert! (empty? findings)
                                  "Store packaging was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^signing is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :signing (:kind %))
                                      (forbidden-package-scope-findings (:package-flow-files world)))]
                 (support/assert! (empty? findings)
                                  "Signing behavior was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^auto-update behavior is not present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :auto-update (:kind %))
                                      (forbidden-package-scope-findings (:package-flow-files world)))]
                 (support/assert! (empty? findings)
                                  "Auto-update behavior was found."
                                  {:findings (vec findings)})
                 world))}])
