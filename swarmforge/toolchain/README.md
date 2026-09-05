# Optional development tools

The root `swarmforge/toolchain.lock.json` owns all existing runtime and analysis
pins. `optional-tools.lock.json` is its fixed subordinate authority for new
optional development tools. A name has exactly one authority. The loader rejects
root-name collisions and unknown fragment or pin fields. An empty fragment is valid.
Each pin has a local provider name, a 40-character lowercase Git revision, and
a 64-character lowercase SHA-256 of the provider's documented distribution.
The provider must validate that digest before it installs the pinned distribution.

Use `node swarmforge/toolchain/cli.mjs inspect <tool>` for offline inspection.
Use `node swarmforge/toolchain/cli.mjs provision <tool>` only for an explicit
installation request. Provider code is registered in `providers.mjs`; pin data
cannot select an executable or import path. An inspection provider must use only
local files and installed tools. It must never install or download a tool.

Core startup continues to call
`node scripts/check-swarmforge-toolchain.mjs --strict-runtime`. The optional
entry point does not replace or catch that check. The root lock, checker, core
artifact identity, and global verification ownership remain unchanged. Optional
pins are not core artifact inputs; their own checks belong to the Shell
`development_toolchain` slice and its declared worker-launch consumers.

The approved Serena pilot uses this boundary. See
`swarmforge/scripts/serena/README.md` for explicit provisioning and launch details.
