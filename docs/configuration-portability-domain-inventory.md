# Configuration portability domain inventory

This inventory applies to the version 2 complete configuration ZIP. The
exporter rejects a new application storage key until it has an include or
exclude rule. The installed port checks local storage keys and the Data Layer
and Hotkeys storage envelopes before export.

| Saved data | Rule |
| --- | --- |
| Durable project Drafts, publication history, Flows, fixtures, transport settings, images, Excel template bodies | Split each project ZIP into named entries in the complete ZIP. Store equal entry bytes once by digest. Rebuild the project ZIP for import. Include project identity and active project in the configuration manifest. Standalone project ZIPs do not change. |
| Saved schemas | Include each schema once. Use the durable schema store when it has records; use the local projection for older data. |
| Reusable rules and Event Library templates | Include each item with its stable identity. |
| Saved session library and saved defect reports | Include each item. Exclude a pending defect deletion prompt. |
| Documentation templates | Include project template metadata and its body as a shared complete-ZIP entry. The separate section supports conflict review. |
| Saved event feed filters and manual schema choices | Include as named portable preference keys. |
| Hotkey map | Include as one portable preference record. |
| Browser permissions, tabs, live sessions, debugger, replay, capture counters | Exclude as device or running state. |
| Selected utility tab, working filter, saved session view position, guided continuation, project start path | Exclude as working interface state. |
| Recent schema validation records | Exclude as live diagnostic history. Saved defects remain included. |
| Legacy Flow/project projections, raw migration copies, cache, Undo and Redo | Exclude. The durable project archive is the portable source. |
| Pending configuration setup journal and commit marker | Exclude. These are local recovery controls, not portable configuration. The journal is in durable storage so it does not consume local storage quota. |

The complete ZIP is for transfer. Repository recovery JSON is a separate legacy
file. The importer can restore its projects and saved schemas only when all
required bodies are present. It blocks a file that needs image or Excel bodies
that the JSON does not contain. A recipient must not treat that JSON as a
complete configuration archive.

Archive writing has a 512 MiB output limit by default. It builds a Blob from
64 KiB ZIP chunks and does not join those chunks into a second large byte array.
Version 1 complete ZIP files remain readable.

During setup, open side panels and Studio windows show a loading state and
pause edits. A Web Lock holds each active window until it pauses. The setup
panel waits for all windows to pause before it writes data. A failed setup
resumes the windows. A successful setup reloads them. Startup recovery runs
before a new side panel shows saved data.
This is an application-level visibility rule; it is not one database transaction
across IndexedDB and local storage.

The Studio Standard JSON Schema export is only for external use. It is not a
configuration backup. Its separate manifest names custom, reusable, and
warning-severity rules that standard JSON Schema cannot preserve.
