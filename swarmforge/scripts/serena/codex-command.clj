(ns serena.codex-command)
(defn command [root scripts extra prompt-file sq]
  (let [sandbox (str "--strict-config --sandbox workspace-write --ask-for-approval on-request "
             "-c approvals_reviewer=auto_review "
             "-c sandbox_workspace_write.network_access=true "
             "-c features.network_proxy.enabled=true "
             "-c " (sq "features.network_proxy.domains={ \"127.0.0.1\" = \"allow\", \"localhost\" = \"allow\" }") " "
             "-c features.network_proxy.allow_local_binding=false ")]
    (str "node " (sq (str scripts "/serena/launch-role.mjs"))
         " --worktree " (sq (str root)) " -- codex -C " (sq (str root))
         " " extra sandbox "\"$(cat " (sq (str prompt-file)) ")\"")))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-05T23:19:40.418295922+02:00", :module-hash "311316721", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 1, :hash "-1642568863"} {:id "defn/command", :kind "defn", :line 2, :end-line 11, :hash "-252045577"}]}
;; clj-mutate-manifest-end
