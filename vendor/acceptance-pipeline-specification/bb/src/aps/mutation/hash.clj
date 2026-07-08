(ns aps.mutation.hash
  (:import [java.nio.charset StandardCharsets]
           [java.security MessageDigest]))

(defn utf8-bytes [s]
  (.getBytes (str s) StandardCharsets/UTF_8))

(defn sha256 [s]
  (let [digest (.digest (MessageDigest/getInstance "SHA-256") (utf8-bytes s))]
    (apply str (map #(format "%02x" (bit-and % 0xff)) digest))))
