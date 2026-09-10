# Tealium Live connection recovery QA R01

Status: QA-integrated on 2026-09-10. Master promotion remains separate.

## Result and evidence

QA accepted `ba51f3a225392c23ac924f379c638724262b5e5c` from base
`9df36ddf832bb918bb2784edf252dc2993a2beb8` through architect handoff
`20260910T060455Z_000915_from_architect`. Candidate tree:
`d736720553ca7a65674122277d1e67e993eb2297`.

Both Tealium connection endpoints now recover from a lost worker connection.
They retain the current selection, cancel old operations, and do not repeat an
old source-opening action. Retries have bounded delays and stop on disposal or
an invalid extension context. Lost transport shows connection-loss feedback.

| Check | Result |
| --- | --- |
| Specification and whole source/test delta review | Accepted |
| Exact review and verification records | Validated for task, base, candidate, and Shell scope |
| Focused tasks, including build and package | 46 of 46 passed |
| Review run | 05:57:04.362 to 05:59:55.644 UTC; 2m 51.282s |
| Installed worker-stop recovery | Passed with worker debugger detached |
| DevTools before and after Live starts | Both passed |
| Same selection and old-action cancellation | Passed |
| New explicit action in actual Sources editor | Passed |
| Original user's browser cause | Not confirmed |

Receipt: `781222-274a3784-50e2-4f82-884d-9b439f625a27.json`.
SHA-256: `007641b6c13c3cff749f145e20ad23748781123e11208fef2d5e43b3af81b4ca`.
Run: `87da1cc4-1efb-409d-a43b-b2f0b2d92e44`.
The protocol output records both opening orders, actual worker termination,
retained selection, zero old opens, one new explicit open, and actual editor
content. Its existing protocol cases retain `preview: false`.

The coder reported about 12 minutes for reproduction and endpoint correction,
including diagnostics. Handoff issue to architect return took 18m 37s
(05:46:18 to 06:04:55 UTC). This is elapsed pipeline time, not coding time.
No second full focused run or all-pack gate was run by the specifier.

## Process assessment

The small shared transport module and real worker-stop test worked. Earlier
browser setup kept the worker debugger attached and missed this lifecycle gap.
One new editor assertion used an unavailable Chrome method and was corrected
before committed evidence. Retain detached worker debugging and actual editor
checks for later connection changes. The old low-cost integration target is
still unproved. Preserve all existing unresolved terminal obligations.

The separately approved automatic metadata lookup starts from this accepted QA
base. It does not replace or weaken this recovery behavior.
