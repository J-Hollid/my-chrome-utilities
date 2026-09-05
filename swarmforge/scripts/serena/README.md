# Serena pilot

Provision once in each assigned worktree:

```sh
node swarmforge/toolchain/cli.mjs provision serena
```

This explicit operation downloads the pinned source archive, installs its frozen
Python dependencies, and runs `npm ci` for the separate language-server lock.
The bootstrap supports Linux x64 and requires Python 3.11–3.14, pip, curl, and tar.
Python downloads are disabled. All installation files and caches stay under
`.serena/local/` in that worktree. The root npm lock and toolchain lock do not change.

The Serena source revision and archive SHA-256 are in
`swarmforge/toolchain/optional-tools.lock.json`. The upstream archive's `uv.lock`
fixes Python dependencies. `bootstrap-requirements.txt` fixes uv 0.8.22 by hash.
`typescript/package-lock.json` fixes TypeScript 5.9.3 and its language server 5.1.3.

`node swarmforge/toolchain/cli.mjs inspect serena` only reads local files.
Normal worker launch uses the installed executable directly. It does not download
or update tools. A missing tool, failed server, or startup timeout leaves ordinary
Codex tools and task receipt available, with a short fallback reason. The strict
core runtime check remains separate and mandatory.

The launcher supplies a local stdio MCP server with the Codex context, an absolute
worktree argument, and a separate `SERENA_HOME`. The server is optional. GUI and
web dashboard startup are disabled. `SERENA_USAGE_REPORTING=false` disables usage
reporting. The effective tool list is:

- `get_symbols_overview`
- `find_symbol`
- `find_referencing_symbols`
- `find_declaration`, where the language server supports it
- `get_current_config`

The project is read-only. Project switching, edits, shell and whole-file tools,
memories, and onboarding are absent. Product TypeScript uses `tsconfig.json`.
Authored `.mjs` files use the separate `jsconfig.json`; this does not change the
extension build. Clojure is not provisioned by this pilot. Use ordinary tools for
Clojure and Babashka `.bb` files. The configuration helper can enable Clojure when
its server is explicitly provisioned.

A new role launch receives these settings. Existing Codex sessions keep the
configuration with which they started. Do not restart a busy role to enable the
pilot. If results after an external edit or checkout are doubtful, open a fresh
connection or inspect the current file with ordinary tools. A discovery answer is
not verification proof.

Required startup includes use a complete line:
`Required instruction: repository/relative/file.prompt`.
The generator reads explicit includes once per resolved path. It always includes
the constitution, all article files, the assigned role, handoff rules, and the
shared tool-use rule. Missing required files fail instruction generation.
