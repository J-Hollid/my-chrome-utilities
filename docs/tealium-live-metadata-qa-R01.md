# Tealium Live metadata QA R01

Status: QA-integrated on 2026-09-10 at `0f72e53b93`. Master promotion remains
separate. Architect handoff: `20260910T070610Z_000916_from_architect`.

## Delivered behavior

Live reads available account, profile, and publish identity from each runtime.
It tries exact-version tag metadata automatically when host access is available.
Local names and UID fallback remain visible while the request runs or fails.
Missing access exposes an exact-host permission action. Retry preserves the
observation session. Both surfaces share the metadata owner. Names are joined
by profile version and UID; remote text does not change source evidence.

Requests omit login credentials and referrer, reject redirects, and parse the
callback as data. Limits are eight seconds and 1 MiB. Pause, End, navigation,
and session changes protect the current or final view from late responses.
The missing-profile correction keeps the runtime key in a separate field.

## Scorecard and exact evidence

| Check | Result |
| --- | --- |
| Specification and whole implementation delta | Accepted |
| Final exact Shell plan | 46 of 46 tasks passed, including build and package |
| Forecast | Matched: 45 Tealium/Shell tasks plus package |
| Installed automatic lookup and fallback | Passed in native side-panel and full-width views |
| Identity, literal names, focus, filters, source availability | Passed |
| Retry, missing access, stale response, Pause and End | Passed |
| Separate public endpoint smoke | Coder reported a successful docs-profile read without login |
| All-pack gate or master promotion | Not run |

The product range `c189a71706..d71d0b984c` has bound review-ready and verification
evidence for `tealium-live-metadata`. The architect's final change updates only
the two acceptance-handler mutation manifests. Its exact range is
`d71d0b984c..0f72e53b93`; its evidence also passed. Both ranges were validated
before the QA fast-forward. The final receipt repeats the real installed
metadata and recovery checks; the manifest update alone is not runtime proof.

| Candidate | Receipt | Started / completed UTC | Duration |
| --- | --- | --- | --- |
| `c871c20ef2` | `879632-097f3df0-08e3-4bb0-b73b-c367bc03795a.json` | 06:38:55.785 / 06:41:55.672 | 2m 59.887s |
| `d71d0b984c` | `919854-09d0c8ad-0fd5-42d7-94f8-43f7ed1892c8.json` | 06:51:34.728 / 06:54:37.660 | 3m 02.932s |
| `0f72e53b93` | `955792-6bad42e9-6378-4bfd-be3d-f63b2ca2cae9.json` | 07:01:35.748 / 07:04:36.662 | 3m 00.914s |

Final receipt SHA-256:
`7646ac3f280840007bd69f6ad5b4d767932d1889b5289741e9f617b94158b549`.
Final run: `a153125e-6825-4b09-bfe6-c6aa5b2d053c`.
Final candidate: `0f72e53b93ad971a290a86f1c1014cfc6beee3a5`.
Final tree: `975d2cdd9e6f1f73f12532c3fe18b8a39d4433a3`.

The three successful focused runs total 9m 03.733s. This excludes the earlier
failed review, direct diagnostics, and role work. Specification handoff at
06:14:37 to architect return at 07:06:10 took 51m 33s elapsed. Coder reported
first local/installed proof within 12 minutes of claim and direct lifecycle
proof within 18 minutes. These are not a measured total coding-cost result.

## Process assessment

Small metadata modules, the pinned runtime, and interception of the production
request worked. Scope stayed inside the existing Tealium owners. The first
review exposed a brittle six-row acceptance-mapping assumption. Its bounded
repair preserved the old checks and added the new metadata checks. Refactorer
then found the missing-profile display fault and required an installed
regression before acceptance. Architect refreshed differential handler mutation
evidence and ran fresh exact review evidence.

Preserve incident `2f8b535e-6dcf-44cd-b37b-48ed805e8ddf`, its failed receipt,
and all earlier terminal obligations. QA acceptance does not resolve them.
Keep the mapping conservation and missing-profile regressions. Continue with
the already approved source-target work from this accepted implementation;
no new ownership preparation is needed on the current forecast.
