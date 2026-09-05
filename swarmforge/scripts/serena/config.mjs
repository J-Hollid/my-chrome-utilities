import path from "node:path";
export const tools=Object.freeze(["get_symbols_overview","find_symbol","find_referencing_symbols",
  "find_declaration","get_current_config"]);
export const excludedPaths=Object.freeze([".worktrees/**","**/node_modules/**","vendor/**","build/**","dist/**",
  "coverage/**","target/**","tmp/**",".swarmforge/**",".serena/**",".git/**",".cpcache/**"]);
export function projectConfig({clojureProvisioned=false}={}) {
  return {project_name:"SwarmForge worktree",language_servers:["typescript",...(clojureProvisioned?["clojure"]:[])],
    encoding:"utf-8",read_only:true,ignore_all_files_in_gitignore:true,ignored_paths:[...excludedPaths],
    fixed_tools:[...tools],default_modes:[],added_modes:[],initial_prompt:"",activation_command:null,
    ls_workspace_folders:["."],ls_specific_settings:{typescript:{typescript_version:"5.9.3",typescript_language_server_version:"5.1.3"}}};
}
export function globalConfig(root) {
  return {gui_log_window:false,web_dashboard:false,web_dashboard_open_on_launch:false,
    fixed_tools:[...tools],base_modes:[],default_modes:[],projects:[root],
    trusted_project_path_patterns:[root],default_max_tool_answer_chars:16000,tool_timeout:120,
    ignored_memory_patterns:[".*"],log_level:30};
}
export function symbolRoute(file,{clojureProvisioned=false}={}) {
  if(/\.(?:ts|tsx|mts|cts|mjs|cjs|js|jsx)$/u.test(file))return "typescript";
  if(clojureProvisioned&&/\.(?:clj|cljs|cljc)$/u.test(file))return "clojure";
  return "ordinary";
}
export function codexSettings(root) {
  const values={command:process.execPath,args:[path.join(root,"swarmforge/scripts/serena/server.mjs"),"--worktree",root],
    cwd:root,required:false,enabled:true,enabled_tools:[...tools],startup_timeout_sec:30,tool_timeout_sec:120};
  return Object.entries(values).flatMap(([key,value])=>["-c",`mcp_servers.serena.${key}=${JSON.stringify(value)}`]);
}
