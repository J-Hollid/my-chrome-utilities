# Tealium Live metadata investigation R01

Date: 2026-09-10. Role: specifier. Status: investigation complete;
implementation and browser proof pending.

The user approved automatic lookup with fallback, then approved implementation.
`docs/tealium-live-metadata-R01.md` is the resulting task authority. This file
retains the investigation evidence and does not replace that specification.

## Result

Metadata enrichment is feasible. A read-only request without login cookies
returned the tag name for Tealium's public documentation profile. Some missing
identity fields can also be read from the page without a network request.
Keep this proposal separate from the open DevTools connection repair.

## Sources and method

- [Official Web Companion guide](https://docs.tealium.com/iq-tag-management/tealium-tools/web-companion/).
- [Public Web Companion script](https://tags.tiqcdn.com/utui/utui.tagcompanion.js),
  downloaded and inspected as text. It was not executed.
- [Chrome extension network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests).
- Local reader: `src/tealium/detection/page-reader.ts`.
- Existing real-runtime fixture: `test/tealium/detection/fixtures/utag.js.gz`;
  provenance identifies Tealium's public documentation profile.

The script requests:

```text
GET https://my.tealiumiq.com/urest/legacy/tagcompanion/getProfile
    ?utid=<runtime.cfg.utid>&cb=<cache-buster>
```

Web Companion gets account and profile from `cfg.utid`, the environment from
the runtime path and page script, and the published version title from the
response. It joins `manage[UID]` to page observations to get tag titles.
Its request uses a script response and sets `withCredentials`. That setting
alone does not prove that login is required.

## Network proof

Three bounded GET requests used the public `tealium/docs` profile. No login
cookies, credentials, page data, or customer profile were used.

| Check | Observed result |
| --- | --- |
| `utid=tealium/docs/202504230113` | HTTP 200; 31,348 bytes; JavaScript content type |
| Same version with `Origin: https://docs.tealium.com` | HTTP 200; no `Access-Control-Allow-Origin` header |
| `utid=tealium/docs/000000000000` | HTTP 200; callback payload contained only `title: null` |

The valid response was a `window.__tealium_wc_getProfile(...)` callback.
Its complete argument passed strict JSON parsing without script execution.
The payload contained:

- Published version title: `Publishing CookieConsent Translations to PROD - Version 2025.04.23.0112`.
- `manage`: one tag. UID `115`, title `Tealium AudienceStream Integration`,
  template identifier `tag_id: 20064`.
- 23 extension entries, 455 data-source entries, and five load-rule entries.

The response SHA-256 was
`664e3271b805e5d2160779926b3969adfac34fa747c8d200cb9aa66ff7c30547`.
The invalid-version response SHA-256 was
`3292e5f447f20d70a910e413c59b48ab5a00d9867b22825c9aeaa55b42f875f1`.
Both valid probes returned `Cache-Control: no-cache,no-store,must-revalidate`.

This proves unauthenticated access for this profile and version. It does not
prove access for every account, a supported public API contract, or successful
use from the installed extension. An HTTP 200 alone is not proof of metadata.

## Current reader gap

The reader uses `loader.cfg[UID].title`, with `Tag <UID>` as the fallback.
It reads `cfg.account` and `cfg.env`, but does not read `cfg.utid`.
The real fixture has `cfg.utid = tealium/docs/202504230113` and a configured
runtime path. Thus the existing fixture contains identity that the reader
does not use. Current `Version` comes from `cfg.v` or `cfg.template`; it is
not the published version title returned by Web Companion.

## Proposed implementation and interface

1. Read local identity for each runtime. Keep runtime identity separate from
   displayed account and profile. Use `cfg.utid` for account, profile, and
   publish identifier. Read explicit environment data from that runtime where
   available; use a validated runtime path as a fallback. Leave uncertain
   fields unavailable. Preserve CNAME and custom-path detection.
2. Try metadata retrieval automatically when Live observes a valid runtime
   `utid`. No **Load tag names** action is required for the first attempt.
   Render the local names and UID fallback immediately, then update matching
   rows when metadata arrives. Use available host access. If the required
   access is absent, retain the fallback and make the access requirement
   visible beside an optional retry action. Do not block Live observation.
   The current manifest already declares optional HTTPS host access, so a
   new manifest entry appears unnecessary. Any permission request must target
   `https://my.tealiumiq.com/*` only. Host permission is origin-wide;
   application code must restrict requests to the fixed read endpoint.
3. Fetch from an extension context with credentials omitted. Read the response
   as text, accept only the exact known callback envelope, and parse its
   argument as JSON. Apply schema and size limits. Do not run remote script
   or copy Web Companion's login and write functions.
4. Join names by the full runtime `utid` and UID. Retain the row's existing
   tab, document, frame, and runtime identity. Bind in-flight work to the
   current session. Reject late results after navigation, Stop, or rebinding.
   Do not merge equal UIDs from different accounts, profiles, or versions.
5. Show the tag name with the UID retained beside it. In the inspector, show
   account, profile, environment, publish identifier, published version title,
   and library version as distinct fields. Mark remote names as coming from
   Tealium profile metadata. Keep loaded/code/source status based on the page.
6. Show **Loading names**, **Names loaded**, or **Names unavailable**, with an
   optional retry action. A failed lookup must retain the local tag name or
   `Tag <UID>` fallback and leave the live list and source actions usable.
   Make one automatic attempt per distinct `utid` in a Live session. Combine
   concurrent requests for the same identity. Do not retry a failed request
   on every observation poll. Reuse the result within the current view;
   do not persist API responses. Try again on a new session, a newly observed
   `utid`, or explicit retry, in line with the response cache headers.

Request only the observed profile/version identity. Do not send page URLs,
data-layer values, or cookies. Do not replace a missing exact version with
the latest profile. The response does not echo an authoritative version ID;
bind it to the exact request and do not claim a separate version attestation.

The extra extension, data-source, and load-rule fields are useful future
inputs. They are not needed for the first tag-name change.

## Acceptance checks and limits

Local identity checks must cover the real fixture, CNAME/custom paths,
multiple runtimes, and absent or conflicting metadata. Adapter checks must
cover valid data, empty HTTP 200, invalid callback/JSON, response limits,
missing permission, permission refusal, timeout, and stale-session results.
Check automatic retrieval without a separate click, immediate fallback rows,
one request per distinct identity, no repeated requests after a failed lookup,
and recovery on explicit retry or a new session. Check duplicate UIDs across
profile/version boundaries and unchanged runtime/source status.

Installed-extension proof must show automatic retrieval with available host
access, a successful read without Tealium login, and visible names. Missing
access and a failed lookup must preserve fallback names and leave Live and
source inspection usable. Check the optional permission/retry path separately.
Use a controlled response for repeatable checks and one separate public
endpoint smoke check.

Forecast: Tealium detection and Live checks within the existing Shell owner,
plus package verification. Exact selection must be computed from the proposed
diff before implementation. No manifest or registry change is expected;
there is no basis here for adding unrelated DataLayer packs.

The existing feature contract excludes Tealium-account access. A follow-up
specification must explicitly distinguish this optional public metadata read
from authenticated account access. This investigation does not authorize a
login flow or a change to runtime evidence claims.

## Process assessment

The real fixture and the public endpoint gave direct, bounded proof. The
earlier reader and acceptance checks allowed useful page identity to remain
missing and did not test a resolved tag name. Add those checks when the
follow-up is specified. Browser proof and implementation are still pending.
