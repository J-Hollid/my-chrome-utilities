# Tealium Live R01

Status: user-approved on 2026-09-09 for implementation and focused QA integration.
Prepared: 2026-09-09. Task: `tealium-live`.
Mode: focused feature integration into QA.
Inspected QA: `5a39aec9531d8275310394ab1a6a639d9d0f8429`.

The user replied "Approved" after reviewing this specification. This approves
coder handoff, implementation, bounded causal repairs, required ownership
preparation, and focused QA integration. Master promotion remains separate.
Approval was recorded on 2026-09-09 at 14:30:15 UTC; this is the recording time,
not a measured timestamp of the user's message.

Required instruction: docs/tealium-live-verification-R01.md

## Outcome and first-release surface

Add Tealium after Data Layer and Hotkeys in the top-level utility tab list.
Its first secondary view is Live. Use the existing retained utility-page host.
Tealium opens without a Data Layer project or successful Data Layer startup.
Preserve the other utilities, their capture, stored data, keyboard navigation,
command access, and current selection semantics.

Live follows the Data Layer interaction pattern: target setup, a session header,
search and filters, a tag list, and a selected-tag inspector. Reuse that pattern
without making Tealium depend on private Data Layer controllers or storage.
Do not add empty secondary views for possible future features.

The first release supplies a current inventory of detectable Tealium tags and
source inspection. It does not claim a complete tag-firing history, successful
vendor delivery, or knowledge of server-side tags. Do not call every detected
tag "running" or infer a send from a loaded script or registered function.

## Detection and coverage

Read supported Tealium runtime structure, available tag configuration, registered
senders, and observed resources. A Tealium domain, standard directory layout, or
`utag.js` filename is not required. Support first-party/CNAME hosts, custom
publishing paths, separate tag scripts, bundled tags, and custom script sources.
Use the actual URL, including its query string; do not substitute a CDN URL.

The initial runtime boundary is the standard page `utag` object and its profile
instances. Arbitrary renamed globals and obfuscated runtime interfaces are not
promised. The version and supported structural evidence must be reported in
the implementation's compatibility record. A recognized but unreadable shape
is Unsupported runtime, not evidence of an empty inventory.

Show detection independently from session state: Not detected, Initializing,
Detected, or Unsupported runtime. An early tracking queue is Initializing.
The existence of a similarly named global or script is insufficient detection.
Where available, show runtime initialization and loading-suppression evidence;
do not infer that consent caused suppression without explicit evidence.

Inventory configured tags and registered sender code in every accessible frame
of the selected tab. Identify a row by tab, document, frame, runtime/profile,
and UID. Equal UIDs in separate profiles or frames remain separate rows.
Avoid duplicating a runtime referenced from more than one known profile entry.
Use the available tag name, otherwise `Tag <UID>`. Show Code registered when a
sender is present and Configured when only configuration is available.

Keep script-request evidence separate from code-registration evidence. A DOM
script element or resource-timing entry can describe a failed request. It cannot
establish successful loading, execution, a send, or vendor receipt.

State the coverage of the current snapshot. Inaccessible or restricted frames
produce Partial coverage with the known frame and reason. Continue observing
accessible frames. Do not label partial coverage as "all tags on the page".
Permit an explicit exact-origin access request for an eligible inaccessible
frame; a grant expands coverage without changing the selected website target.

## Target access and observation session

Use the existing eligible-target and access pattern. A valid user-invoked
activeTab grant needs no additional prompt. If an exact page probe fails for
lack of access, retain the selected target and expose Request access in setup.
Request only that origin from the user action. Declining access leaves setup
intact and does not start observation or choose another tab. Restricted pages
show an explanation. Optional Browse all tabs follows the existing permission
rule; it is not required to use the invoking tab.

Start observation is available after access is confirmed. It can start before
Tealium appears; the session then waits for detection. Controls are Start
observation, Pause observation, Resume observation, and End observation.
The session pins the website tab. Selecting another browser tab, utility, or
extension page does not change that target.

While Observing, each completed observation reconciles the current accessible
inventory, including late tags and removed frames. It is a snapshot, not a log
of every transient change between observations. Use one owner and no overlapping
observation jobs. Page reads must not call tracking, tag-loading, consent,
configuration-write, or tag-send functions. Do not force a tag to load or fire.

Pause prevents subsequent inventory updates but retains results and selection.
Resume reconciles current state without replaying missed sends. Lifecycle and
access invalidation still apply while paused. End stops owned work and retains
a read-only final snapshot until the next Start or explicit reset. A new Start
creates a new observation session. No durable saved-session library is added.

Bind snapshots and source actions to document identity, not URL alone. A reload
at the same URL, frame replacement, or full navigation invalidates the affected
rows and source requests. Discard late results from an old document/session.
Same-document URL changes refresh page context without replacing document
identity. Recheck access on navigation; if access is lost, suspend page reads
and expose recovery for the pinned target. A grant restores Observing only if
the session was observing before access was lost; a paused session stays paused.
Target closure ends owned work and
never causes automatic attachment elsewhere.

Switching utilities retains the page, observation session, filters, selection,
and scroll position. The full-width page shares that session and target and
forwards actions to the same owner. Closing the full-width page leaves its
owner active. Closing the owner host ends its work; surviving surfaces show
that the session ended. No capture-after-host-close promise is introduced.

## List and inspector

Show target context once in the visible Live surface. Put session state, tag
count, coverage, and primary actions before the list. Keep utility launch and
reset controls subordinate. Contextual settings do not replace the session.

Search matches name or UID. Provide code-state and frame/profile filters, a
visible filtered/total count, and Clear filters. Sort by frame/profile then
numeric UID so repeated snapshots do not reorder unchanged rows. A new result
does not steal focus, change selection, or jump the user's scroll position.

The inspector shows UID, available name, runtime/profile, frame, available
account/environment/version, code evidence, and source status. Missing metadata
is shown as unavailable, not guessed from a nonstandard URL. Raw details are
collapsed. Show in Sources and Copy source URL give visible success or failure.

At Live content widths 360 and 520 CSS px, show the list or selected inspector,
with Back to tags restoring list focus and scroll. At 720 CSS px and above,
show both when selected, with at least 360 CSS px for the inspector. With no
selection, the list uses the available width. The active narrow pane is the
only Live working-region scroll container; wide panes scroll independently.
Avoid outer wrapper scrollbars and horizontal document overflow. Long URLs wrap.

## Source inspection

Use a small DevTools bridge bound to the exact inspected tab. A complete Tealium
DevTools panel is not required. If DevTools is closed or belongs to another tab,
retain selection and explain that the user must open it for the bound website.
Enable Show in Sources when the matching connection becomes available. Opening
a closed DevTools window programmatically is not part of this release.

For a separate/custom tag, open its uniquely verified loaded resource. For a
bundled tag, open the containing loaded source and its unique tag location when
resolved. Chrome formatting can change display lines; the selected tag code
must remain correct. A known containing source with no unique tag location may
open at its start, with the missing location explained. An unresolved or
ambiguous resource disables the action and states the reason. Do not choose
the first possible file, manufacture a URL, or select a different profile/frame.

Revalidate tab, session, document, frame, and tag immediately before the source
action. Reject stale or mismatched bridge messages. A DevTools disconnect or
failed source load gives feedback without clearing the inspector. Copy source
URL uses only a resolved actual URL and reports clipboard success or failure.
Observation remains usable without DevTools. No debugger permission, mandatory
all-site access, remote code execution, or Tealium-account access is added.

## Delivery decision

The experiment passed 30 diagnostic behavior checks; it did not implement this
contract. Native side-panel integration, frame coverage, access recovery,
same-URL reloads, and representative observation cost require fresh proof.

Keep one stable product task through detection, source action,
and installed Live checkpoints. Resolve the manifest/background ownership
boundary before broad feature verification. The first implementation checkpoint
reports intent classification and the first working detection case. Use a
four-hour progress checkpoint and an eight-hour planning allowance through
QA-ready review; report variance and continue bounded causal work under the
shared engineering rules. These times do not waive checks or authorize a new
verification framework.

The user approval covers this complete specification and its verification
forecast. Proceed through the required ownership and review steps without
another routine behavior-approval request. Promotion to master remains separate.
