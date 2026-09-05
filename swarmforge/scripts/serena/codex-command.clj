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
