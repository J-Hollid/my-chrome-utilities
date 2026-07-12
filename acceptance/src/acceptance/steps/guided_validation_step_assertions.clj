(ns acceptance.steps.guided-validation-step-assertions)

(defn step-assertions [& groups]
  (apply merge
         (map (fn [[step-texts assertion]]
                (zipmap step-texts (repeat assertion)))
              (partition 2 groups))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-12T23:02:53.165154496+02:00", :module-hash "-711664411", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1411424026"} {:id "defn/step-assertions", :kind "defn", :line 3, :end-line nil, :hash "-1395443787"}]}
;; clj-mutate-manifest-end
