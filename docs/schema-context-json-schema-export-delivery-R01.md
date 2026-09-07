# Schema context export: implementation record

Task: `schema-context-json-schema-export`.
Specification base: `646b8472135f0740f39b978252f0922c7687d61b`.
User approval: 2026-09-07T17:10:48Z. Coder activation: about 17:13Z.
First complete direct browser matrix: 2026-09-07, before 18:06Z.
This candidate is for focused review and QA. It does not advance master.

## Delivered behavior

The schema header opens one frozen Draft 2020-12 preview. Copy and Download
use the same indented text and final newline. Draft has no published identity.
The read-only revision viewer uses the selected revision and its existing
resource identity and filename. Its entry is beside the existing revision
controls. The documentation table has no new export control.

The new `src/schema-context-export/` modules own serialization, source checks,
effective context selection, preview state, and browser ports. The installed
Saved Schema adapters are under `src/data-layer-installed/schemas/context-export/`.
Large existing controllers have small integration calls. Studio source
construction is in a separate adapter. Existing editor controls remain present.

Saved Draft export combines its accepted canonical projection with its parent
chain. Project contributor export uses the existing composed schema model.
Required fields, conditions, recursive array items, typed values, closure,
descriptions, examples, and `x-concept` are preserved. Unsupported active rules
need explicit omission approval. Invalid references and conflicting limits
cannot use that approval to bypass an error.

Unconfirmed edits and pending saves block export. Source changes invalidate the
preview and require refresh and a new compatibility approval. Failed operations
keep the preview and permit retry. No export command saves or publishes data.

## Installed host inventory

All rows are exercised by `test/schema-context-export-browser-test.mjs`.
Every row captures clipboard text, the download Blob, and the completed browser
file. It compares repository records and revision tokens before and after export.

| Host | Side panel, 360px | Studio or Flow, 1280px | Source adapter |
|---|---|---|---|
| Saved Schema accepted Draft | Passed | No separate host | installed canonical control |
| Saved Schema revision viewer | Passed | No separate host | revision viewer |
| Shared Profile | Passed | Passed, Studio | canonical / project source |
| Property Set | Passed | Passed, Studio | canonical / composed project source |
| Page | Passed | Passed, Studio | canonical / composed project source |
| Event | Passed | Passed, Studio | canonical / composed project source |
| Flow Page instance | Passed | Passed, Flow workspace | canonical / graph context source |
| Event occurrence | Passed | Passed, Flow workspace | canonical / graph context source |

The reachable collection schema roles have no legacy Page Group schema host.
Page Group and Section remain structural containers. Property details use the
containing schema action. Relationship links use the hosts in this table.

## Direct evidence

- All 14 host and surface cases passed. Both Studio Tree and Table export the
  same complete schema with a property filter set. Long read-only JSON scrolls
  inside the preview at 360px; a real keyboard action opens it and close returns
  focus without changing the route.
- Seven occurrence payloads have matching production and independent Ajv
  outcomes: two pass and five fail. The negative cases cover the local minimum,
  conditional presence, item presence, excluded fields, and object closure.
- Focused editor confirmation persists amount 20 and enables export without a
  reload. A later inherited description change disables both outputs until
  refresh. Clipboard and download rejection both retain retry and the other action.
- Compatibility cancellation causes zero writes and downloads. Confirmed output
  retains the compatible rule, reports one omission, and leaves original rules.
- Direct model checks cover all ten facet examples, seven readiness states,
  four snapshot changes, warning conversion, omission, and published export scope.
- Property tests cover 24 recursive typed-array combinations, six depths, stable
  view identity, source immutability, formatting, and safe filenames.
- The locked APS parser and entrypoint generator ran for both new contracts.
  Both generated tests passed. The settled focused receipt is required before handoff.
- TypeScript build and architecture checks passed during development. Final
  receipt and package proof must refer to the committed candidate.

## Repairs and process findings

The initial tests exposed lost Saved Draft inheritance and source constraints.
The repair preserves the accepted projection and parent chain. Excluding an
inherited field now also removes its inherited presence requirement. Existing
standard export had also dropped some standard schema keywords; its shared
serializer now preserves those keywords. Unsupported conditional rules no
longer become empty standard assertions.
A final nested-object check found that required children also required optional
parents. Presence assertions now apply at the containing object. A regression
checks an absent parent, an empty present parent, and a complete present parent.
Incomplete conditional presence and missing rule values also block export.
Saved Draft serialization retains supported migrated conditional rules and
combines compatibility findings without duplicate omissions. Conditional exact
values use the declared property type. The regression checks matching and
nonmatching numbers and an inactive condition.

Early browser setup failed under restricted local socket access. The registered
browser command passed with approved local Chrome access and a test-owned config
directory. A Copy/Download test race was repaired by waiting for the copy boundary.
Flow setup now uses the installed context-menu keyboard command. Repository
comparison starts after editor initialization settles. The long-schema keyboard
test now activates the target tab before dispatch. An early revision test used
the excluded documentation table; it was replaced with the actual read-only
schema viewer before accepting host evidence.
The first focused run stopped in native permission recovery. A direct check
passed that boundary, then identified a changed revision-action list. The new
viewer entry now sits beside the existing list. The direct compatibility test
then passed all 373 assertions at its four original viewport widths.
The runner retained that initial permission failure as reliability incident
`b9466480-d6df-4d12-ba7a-9b11a635e420`. Its bounded causal regression reproduced
the old readiness timeout while native approval was still pending. The request
probe is now a separate helper. Page readiness awaits the native promise; the
existing host driver still owns the approval deadline. No deadline was increased.
The repair intent remains bounded and adds the proved `capture` and `event-library`
consumers of the shared fixture. Formal repair evidence precedes the fresh plan.

The first Babashka module load omitted the vendored APS classpath. The project
`bb.edn` entry fixed that setup. Bare `gherkin-parser` was not on PATH; the locked
`bb gherkin-parser` command passed. No tool provisioning was needed.

Intent ownership preflight was `bounded-ready`: ten conservative packs and 399
forecast tasks. New prefixes retain parent-pack evidence. The first exact
preflight found four new browser helpers without their required consumer entries.
Their initial registration now names the only importing pack, `layered_schema`.
No existing helper or product ownership is narrowed. Exact preflight is repeated
after that registration repair, before a complete focused run.
Registry validation required the helper entries under their existing `shell`
owner and an added `layered_schema` consumer for the reused Chrome helper.
The exact plan includes the ten product packs and verification registry checks.
Evidence runs use a clean detached worktree of the candidate because an unrelated
untracked handoff helper was present before this task. That file remains intact.
Feature-mode all-pack gates: zero. Mutation, CRAP, and DRY checks are left to
the review roles. Focused evidence time and subsequent review/QA timestamps are
recorded by the task receipt and handoff records.

Recommended refinement: retain the completed-file and settled-state browser
helpers for future export tests. Keep host inventory checks next to the task
contract so that excluded documentation views cannot be mistaken for schema views.

The native permission repair passes the failed browser task and the causal
regression. The repair run then found fixed registry expectations for historical
task identities and source counts. These checks now share the exact new task
identities and check the 15 added source files separately. Existing source and
task conservation checks remain in place. Formal repair and focused evidence
must pass on the final candidate before the review handoff.

The first complete run after repair passed 230 checks, then stopped because two
compact conservation checks also preserve historical assertion identities. The
shared helper now checks the exact added entries and supplies historical count
projections. Original assertion identities remain intact. The generated compact
record was refreshed with the repository command. Both failed checks passed
directly after this repair. The native probe has a direct routing test and a
declared verification-process consumer. No conservation authority was changed.

## Refactorer correction, 2026-09-07

Review of `624d15b5de` returned three blockers. Required arrays from the Saved
projection and canonical schema were concatenated. They now merge as a set at
each object, including nested objects and array items. A regression first failed
Ajv schema validation, then passed for local and inherited/local drafts. Missing
required values remain invalid. The installed Saved Draft fixture now has a
required property; all 14 direct browser cases passed with that stronger fixture.

The eight independent example checks in `schema_context_export.clj` now have
separate functions. Their assertions are unchanged. Both contracts were parsed,
generated, and executed successfully after the split. The coder did not run CRAP,
DRY, or mutation tools; those measurements remain with the review roles.

Download rejection remains open. DOM event acceptance cannot establish browser
download acceptance or completion. Chrome's downloads API exposes completion and
interruption, but requires the `downloads` manifest permission. The complete
repair intent, including `manifest.json`, returned `genuinely-global` in
`tmp/schema-context-review-repair-intent.json`. The manifest is unchanged pending
the permission and verification-scope decision. The proposed repair uses the
browser download result, retains the preview on interruption, and tests real CDP
download denial followed by a successful retry. No fresh review-ready claim,
full focused run, package proof, or downstream handoff is made for this partial
correction while that blocker remains.

The user approved the downloads permission and revised verification scope after
that report. The manifest now declares `downloads`. The export adapter starts a
native Chrome download, listens for its terminal state, and reads status after
listener registration to handle early completion. It reports completion only
after Chrome confirms it. Interruption and rejected starts retain error and retry
behavior. Listeners and Blob URLs are released after settlement.

The direct browser test now uses CDP `Browser.setDownloadBehavior` denial on the
installed Saved Draft and Studio Page hosts. Denial reports `USER_CANCELED`, leaves
the preview text unchanged and Copy enabled, and completes zero files. Retry
completes exactly one file with the preview contents. Positive tests use Chrome's
normal download settings so the requested schema filename is also checked.
All 14 hosts passed. Unit regressions cover completion, early completion,
interruption, rejected initiation, status failure, and listener cleanup.

The revised intent selects 21 canonical packs and 893 forecast tasks because
`manifest.json` is a declared global input. This one expanded review scope follows
the user's explicit approval; ownership declarations are unchanged. The evidence
run uses named packs and review-ready recording. It does not request master
promotion or claim terminal release evidence. Fresh focused evidence and package
proof remain required before returning the corrected candidate to the refactorer.
