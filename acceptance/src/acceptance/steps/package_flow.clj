(ns acceptance.steps.package-flow
  (:require [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [babashka.process :as process]
            [cheshire.core :as json]
            [clojure.string :as str])
  (:import [java.nio.file Files]))

(defn- read-json-string [text]
  (json/parse-string text true))

(defn- parse-manifest [files]
  (try
    (read-json-string (get files "manifest.json" ""))
    (catch Exception _
      nil)))

(defn- mv3-manifest? [manifest]
  (= 3 (:manifest_version manifest)))

(defn- manifest-icon-paths [manifest]
  (->> [(:icons manifest) (get-in manifest [:action :default_icon])]
       (mapcat vals)
       (filter string?)
       distinct))

(defn- required-extension-paths [manifest]
  (->> (concat [(get-in manifest [:background :service_worker])
                (get-in manifest [:side_panel :default_path])]
               (manifest-icon-paths manifest))
       (filter string?)
       distinct))

(defn- required-extension-files-present? [files manifest]
  (every? #(contains? files %) (required-extension-paths manifest)))

(defn- loadable-manifest-files? [files manifest]
  (and (mv3-manifest? manifest)
       (required-extension-files-present? files manifest)))

(defn loadable-extension-build? [files]
  (boolean
   (when-let [manifest (parse-manifest files)]
     (loadable-manifest-files? files manifest))))

(defn- dir-files [root dir]
  (->> (file-seq (fs/file (fs/path root dir)))
       (filter fs/regular-file?)
       (map (fn [file]
              [(str (fs/relativize (fs/path root dir) file))
               (slurp (str file))]))
        (into {})))

(defn- dir-file-names [root dir]
  (->> (file-seq (fs/file (fs/path root dir)))
       (filter fs/regular-file?)
       (map #(fs/relativize (fs/path root dir) %))
       (map str)
       (map #(str/replace % "\\" "/"))
       set))

(defn package-matches-dist? [dist-entry-names zip-entry-names]
  (= (set dist-entry-names) (set zip-entry-names)))

(defn- run-command [command]
  (process/shell support/build-shell-options command))

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

(defn forbidden-package-scope-findings-of-kind [files kind]
  (filter #(= kind (:kind %)) (forbidden-package-scope-findings files)))

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
               (let [dist-dir (support/require-example example dist-key)
                     dist-entries (dir-file-names (:root world) dist-dir)
                     entries (set (zip-entry-names (:artifact-path world)))]
                 (support/assert! (package-matches-dist? dist-entries entries)
                                  "Package artifact does not exactly contain the extension build."
                                  {:artifact (:artifact-path world)
                                   :dist-entries (sort dist-entries)
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
               (let [findings (forbidden-package-scope-findings-of-kind
                               (:package-flow-files world)
                               :store-packaging)]
                 (support/assert! (empty? findings)
                                  "Store packaging was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^signing is not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-package-scope-findings-of-kind
                               (:package-flow-files world)
                               :signing)]
                 (support/assert! (empty? findings)
                                  "Signing behavior was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^auto-update behavior is not present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-package-scope-findings-of-kind
                               (:package-flow-files world)
                               :auto-update)]
                 (support/assert! (empty? findings)
                                  "Auto-update behavior was found."
                                  {:findings (vec findings)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-02T20:16:48.4040564+02:00", :module-hash "-1935453385", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1593518491"} {:id "defn-/read-json-string", :kind "defn-", :line 9, :end-line nil, :hash "690457943"} {:id "defn-/parse-manifest", :kind "defn-", :line 12, :end-line nil, :hash "994706495"} {:id "defn-/mv3-manifest?", :kind "defn-", :line 18, :end-line nil, :hash "1774518718"} {:id "defn-/manifest-icon-paths", :kind "defn-", :line 21, :end-line nil, :hash "-1571982889"} {:id "defn-/required-extension-paths", :kind "defn-", :line 27, :end-line nil, :hash "-365858826"} {:id "defn-/required-extension-files-present?", :kind "defn-", :line 34, :end-line nil, :hash "-410150834"} {:id "defn-/loadable-manifest-files?", :kind "defn-", :line 37, :end-line nil, :hash "-1009365665"} {:id "defn/loadable-extension-build?", :kind "defn", :line 41, :end-line nil, :hash "1062306633"} {:id "defn-/dir-files", :kind "defn-", :line 46, :end-line nil, :hash "-1460515422"} {:id "defn-/run-command", :kind "defn-", :line 54, :end-line nil, :hash "-1681224082"} {:id "defn-/ensure-command-succeeded!", :kind "defn-", :line 57, :end-line nil, :hash "1259508497"} {:id "defn-/package-artifacts", :kind "defn-", :line 65, :end-line nil, :hash "779442048"} {:id "defn-/unsigned-byte", :kind "defn-", :line 74, :end-line nil, :hash "-997641724"} {:id "defn-/uint16-le", :kind "defn-", :line 77, :end-line nil, :hash "-1600799826"} {:id "defn-/uint32-le", :kind "defn-", :line 81, :end-line nil, :hash "506658415"} {:id "def/local-file-header-signature", :kind "def", :line 85, :end-line nil, :hash "1877106412"} {:id "defn-/zip-local-header-readable?", :kind "defn-", :line 87, :end-line nil, :hash "-130781360"} {:id "defn-/zip-local-header?", :kind "defn-", :line 90, :end-line nil, :hash "-1227548006"} {:id "defn-/zip-entry", :kind "defn-", :line 94, :end-line nil, :hash "-2133922594"} {:id "defn-/next-zip-entry", :kind "defn-", :line 104, :end-line nil, :hash "-1370731326"} {:id "defn-/zip-entries", :kind "defn-", :line 107, :end-line nil, :hash "-1709355234"} {:id "defn/zip-entry-names", :kind "defn", :line 112, :end-line nil, :hash "517448888"} {:id "defn-/readme-documents-copy?", :kind "defn-", :line 115, :end-line nil, :hash "1582992062"} {:id "defn/readme-documents-artifact-copy?", :kind "defn", :line 121, :end-line nil, :hash "1071943901"} {:id "defn/readme-documents-dist-copy?", :kind "defn", :line 124, :end-line nil, :hash "371019833"} {:id "defn/readme-documents-unpacked-load?", :kind "defn", :line 127, :end-line nil, :hash "1299327260"} {:id "defn/readme-documents-smoke-test?", :kind "defn", :line 131, :end-line nil, :hash "1565565512"} {:id "def/forbidden-package-patterns", :kind "def", :line 136, :end-line nil, :hash "-157648807"} {:id "defn/forbidden-package-scope-findings", :kind "defn", :line 144, :end-line nil, :hash "-427700473"} {:id "defn/forbidden-package-scope-findings-of-kind", :kind "defn", :line 147, :end-line nil, :hash "1979717122"} {:id "defn-/inspected-files", :kind "defn-", :line 150, :end-line nil, :hash "677397666"} {:id "def/handlers", :kind "def", :line 157, :end-line nil, :hash "742966289"}]}
;; clj-mutate-manifest-end
