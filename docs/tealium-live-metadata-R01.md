# Tealium Live automatic metadata R01

Status: user-approved on 2026-09-10. Stable task: `tealium-live-metadata`.
Mode: feature integration into QA. Base: the specification commit descended
from connection-recovery QA report `4322eaf783`.

## Required task inputs

- `docs/tealium-live-R01.md`: preserve existing detection, Live, and source behavior.
- `docs/tealium-live-metadata-investigation-R01.md`: endpoint evidence and limits.
- `features/tealium-detection.feature`: add scenario 009.
- `features/tealium-detection-runtime.feature`: add scenario 008.
- `features/tealium-live.feature`: add scenarios 009 through 014.
- `features/tealium-live-runtime.feature`: add scenarios 010 through 012.
- `docs/tealium-live-metadata-verification-R01.md`: development and review duties.

This approved follow-up permits read-only public profile metadata retrieval
without Tealium login. It supersedes the earlier exclusion of Tealium-account
access only for this unauthenticated lookup. Login, account writes, remote
script execution, tracking calls, and vendor-resource retrieval remain excluded.
Connection recovery accepted at `ba51f3a225` remains part of the base.

## Visible behavior

Render locally observed rows immediately. When the active Live session first
observes a valid runtime `cfg.utid`, automatically try its exact profile/version
lookup. No separate Load tag names action is required. Metadata must not delay
observation, selection, filtering, or source inspection.

For each runtime, read account, profile, and publish identifier from `cfg.utid`.
These are display fields; keep the existing runtime key and row identity.
For these identity fields a valid `utid` takes precedence over conflicting
display hints. Without it, retain supported local values and show missing
fields as unavailable; do not guess a remote lookup identity from the hostname.
Read the environment from explicit data on that runtime, then a validated
runtime publishing path when unambiguous. Do not apply the root runtime's
environment to another profile. Preserve first-party hosts and custom paths.

For a valid response, use the nonempty `manage[UID].title` for matching observed
rows. Keep the UID visible and mark the name as Tealium profile metadata.
Absent or empty remote titles retain the local title or `Tag <UID>`. Do not add
unobserved tags merely because the API lists them. Treat titles as text.

The inspector shows account, profile, environment, publish identifier, published
version title, and library version as distinct values. Do not call the existing
combined `cfg.v` value a published version title or invent a library version
when it cannot be read reliably. Preserve source identity and evidence states.

Show compact Loading names, Names loaded, or Names unavailable status. Failure
keeps the local title/UID fallback and all existing actions usable. An optional
Retry action retries metadata only. Missing host access shows its reason and
an optional Request access action for `https://my.tealiumiq.com/*`; a successful
grant retries the same current identity. Refusal does not end Live or change
website access. Do not request all-site access or show a permission prompt from
an observation timer. Available grants permit the automatic request.

## Request and lifecycle boundary

Use the fixed HTTPS `getProfile` endpoint identified in the investigation.
Send only the observed `utid` and a cache-buster if needed. Omit credentials,
page URL, referrer, cookies, and data-layer values. Do not follow a response
redirect to another origin. The optional host declaration already exists;
no manifest or common background edit is planned.

Read the response as data. Accept the known callback envelope only, parse its
complete JSON argument, and validate the small set of used fields. Never use
eval, dynamic script insertion, or remote execution. Use a finite timeout and
response-size limit; record the chosen limits with boundary checks. HTTP 200
with missing metadata is Names unavailable, not a successful empty inventory.
Do not substitute the latest version when the exact version is missing.

Coalesce concurrent requests and make one automatic attempt per distinct
`utid` in a session. A failed result does not trigger a request on each poll.
Retry is allowed on explicit retry, a new session, or a newly observed `utid`.
Reuse successful metadata for matching rows within the retained view, including
late tags. Do not persist the response. Both utility surfaces use one owner.

Join by full `utid` and UID while retaining tab, document, frame, and runtime
identity. Equal UIDs from different accounts, profiles, or publish versions
must not share names. Stop, disposal, reload, frame replacement, and target or
session replacement invalidate affected in-flight results. A stale result
cannot change a new inventory or the final stopped snapshot. Pause preserves
the displayed snapshot; resume may reconcile still-current metadata. Hiding
the utility or expanding its surface does not start another lookup.

Metadata arrival must preserve selection and focus. Reapply existing name/UID
filters to the enriched values without changing row keys or numeric UID order.
Do not change registered/configured status, source URLs, or source-opening
authorization because a metadata lookup succeeds or fails.

## Completion and exclusions

Deliver this behavior through coder, refactorer, architect, and focused QA
integration. The public probe is feasibility proof only. Installed proof must
exercise automatic enrichment and fallback with the packaged extension.
No new preparation or verification framework is requested. Extra extension,
data-source, load-rule, and timing interfaces remain outside this slice.

Planning allowance: 60 active coder minutes, with intent, local identity, and
the first automatic lookup/fallback check expected by 30 minutes. Report
variance at these checkpoints and continue bounded work under current rules.
This is a reporting expectation, not an automatic stop or proof of the older
utility-integration cost target. Record review and verification time separately.
