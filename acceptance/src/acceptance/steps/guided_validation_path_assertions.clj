(ns acceptance.steps.guided-validation-path-assertions
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- example-value [example key]
  (support/require-example example key))

(def ^:private path-case-indices
  {["Exact path" "/products" "/products"] 0
   ["Exact path" "/products" "/products/field-notebook"] 1
   ["Path pattern" "/products/*" "/products/field-notebook"] 2
   ["Regular expression" "^/products/[a-z-]+$" "/products/field-notebook"] 3
   ["Regular expression" "^/products/[a-z-]+$" "/shop/products/field-notebook"] 4})

(def ^:private captured-urls
  #{"https://127.0.0.1/products?sort=price#details"
    "https://127.0.0.1/products/field-notebook?x=1"})

(defn- path-case-index [example]
  (get path-case-indices
       [(example-value example "match_type")
        (example-value example "expression")
        (example-value example "pathname")]))

(defn- path-scope [_example observation]
  (support/assert! (= [["This domain on all paths" "Only the current path" "Selected paths or patterns" "Every domain and path"]
                       "This domain on all paths"]
                      [(get-in observation [:scope :choices])
                       (get-in observation [:scope :selected])])
                   "Guided path scope choices or inferred default are incomplete." {:observation observation}))

(defn- path-builder [_example observation]
  (support/assert! (= {:explanation "This assignment matches when any condition matches."
                       :conditionLabel "Path condition 1"
                       :matchType "Exact path"
                       :expression "/"
                       :result "/ is a match"
                       :remove "Remove condition"
                       :testButton "Test another path"}
                      (:pathBuilder observation))
                   "Rendered path builder did not expose its condition controls and match result." {:observation observation}))

(defn- path-condition [example observation]
  (let [condition-result (example-value example "condition_result")
        result (get-in observation [:production :paths (path-case-index example)])]
    (support/assert! (contains? #{"match" "no match"} condition-result)
                     "Path condition result must use the supported result vocabulary."
                     {:example example})
    (support/assert! (= (= "match" condition-result) (:matches result))
                     "Production path condition result did not match the outline example."
                     {:example example :result result})))

(defn- path-combined [_example observation]
  (support/assert! (= {:matchType "Path pattern" :expression "/products/*"}
                      (get-in observation [:production :combined :matchingCondition]))
                   "Combined production condition did not identify the matching path pattern."
                   {:production (:production observation)}))

(defn- path-malformed [_example observation]
  (support/assert! (= [false true "/products/field-notebook is a match"]
                      [(get-in observation [:production :malformed :valid])
                       (boolean (seq (get-in observation [:production :malformed :error])))
                       (:anotherPath observation)])
                   "Malformed production regular expression was not blocked with an error."
                   {:production (:production observation)}))

(defn- path-captured-url [example observation]
  (let [captured-url (example-value example "captured_url")
        condition-result (example-value example "condition_result")
        matched-pathname (example-value example "matched_pathname")
        field-notebook? (str/includes? captured-url "field-notebook")
        index (get {false 5 true 6} field-notebook?)
        result (get-in observation [:production :paths index])]
    (support/assert! (contains? captured-urls captured-url)
                     "Captured URL is outside the specified evaluation examples."
                     {:example example})
    (support/assert! (= matched-pathname (.getPath (java.net.URI. captured-url)))
                     "Captured URL did not resolve to the specified pathname."
                     {:example example})
    (support/assert! (contains? #{"match" "no match"} condition-result)
                     "Captured URL result must use the supported result vocabulary."
                     {:example example})
    (support/assert! (= (= "match" condition-result) (:matches result))
                     "Captured URL was not reduced to its pathname before production matching."
                     {:example example :result result})))

(defn default-assertion [text observation]
  (support/assert! (:scope observation)
                   "Guided path browser boundary was not exercised." {:step text}))

(def assertions
  (merge
   (zipmap #{"event scope is displayed"
             "the operator can choose This domain on all paths, Only the current path, Selected paths or patterns, or Every domain and path"
             "This domain on all paths is selected by default"
             "domain 127.0.0.1, event pageview, captured source, and payload target are prefilled"
             "the operator is not asked to type any"}
           (repeat path-scope))
   (zipmap #{"Selected paths or patterns is chosen"
             "the path condition builder opens"
             "the current pathname / is offered as an Exact path condition"
             "each condition has a match type, expression, match result, and Remove condition action"
             "Add another path condition adds one separately labelled condition"
             "the scope states that the assignment matches when any condition matches"}
           (repeat path-builder))
   (zipmap #{"one <match_type> condition has expression <expression>"
             "pathname <pathname> is tested"
             "pathname <pathname> is a <condition_result> for that condition"}
           (repeat path-condition))
   (zipmap #{"path conditions are Exact path / and Path pattern /products/*"
             "pathname /products/field-notebook is tested"
             "the combined condition result is match"
             "the matching Path pattern condition is identified"
             "the Exact path condition is not required to match"}
           (repeat path-combined))
   (zipmap #{"a Regular expression condition is being edited"
             "its expression is malformed"
             "the condition identifies the syntax error and cannot be saved"
             "a valid expression is tested against the current pathname without leaving the form"
             "Test another path accepts a pathname and reports whether the entire pathname matches"}
           (repeat path-malformed))
   (zipmap #{"Exact path condition /products is saved"
             "captured URL <captured_url> is evaluated"
             "pathname used for matching is <matched_pathname>"
             "the saved condition returns <condition_result>"}
           (repeat path-captured-url))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-12T22:14:24.111079837+02:00", :module-hash "789729881", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "235019027"} {:id "defn-/example-value", :kind "defn-", :line 5, :end-line nil, :hash "-1416813660"} {:id "def/path-case-indices", :kind "def", :line 8, :end-line nil, :hash "197664624"} {:id "def/captured-urls", :kind "def", :line 15, :end-line nil, :hash "780048114"} {:id "defn-/path-case-index", :kind "defn-", :line 19, :end-line nil, :hash "-1183331331"} {:id "defn-/path-scope", :kind "defn-", :line 25, :end-line nil, :hash "-673759658"} {:id "defn-/path-builder", :kind "defn-", :line 32, :end-line nil, :hash "-389167190"} {:id "defn-/path-condition", :kind "defn-", :line 43, :end-line nil, :hash "-32136503"} {:id "defn-/path-combined", :kind "defn-", :line 53, :end-line nil, :hash "1667236749"} {:id "defn-/path-malformed", :kind "defn-", :line 59, :end-line nil, :hash "1489120023"} {:id "defn-/path-captured-url", :kind "defn-", :line 67, :end-line nil, :hash "-1080377720"} {:id "defn/default-assertion", :kind "defn", :line 87, :end-line nil, :hash "-1045830028"} {:id "def/assertions", :kind "def", :line 91, :end-line nil, :hash "1550019426"}]}
;; clj-mutate-manifest-end
