# Side-panel companion Stage 4 timing correction

Checked on 2026-09-07 after the user identified the overnight approval wait.
All timestamps below are UTC. The accepted candidate remains `c573b9822b`.

## Recorded response waits

| Wait | Request or preceding answer | User response | Duration |
|---|---|---|---|
| Separate browser-result repair approval | Sep 6 22:15:19.121 | Sep 7 04:02:35.698 | 5 h 47 min 16.577 s |
| Baseline page-removal repair question | Sep 7 08:25:26.628 | Sep 7 09:00:55.305 | 35 min 28.677 s |
| Baseline explanation to deferral direction | Sep 7 09:01:05.822 | Sep 7 09:06:11.610 | 5 min 5.788 s |
| Deferral answer to instruction to proceed | Sep 7 09:06:43.667 | Sep 7 09:07:16.496 | 32.829 s |
| Architect Serena answer to instruction to continue | Sep 7 13:06:19.582 | Sep 7 13:07:14.922 | 55.340 s |

The first interval starts with the coder's completed approval request and ends
with the user's `Approved` message. The other intervals also use completed
answers and the next user response. Time spent explaining the baseline and
investigating Serena remains in the technical work intervals. No wait is inferred
only from a gap between commits.

## Reconciled delivery intervals

| Role or measure | Total interval | Recorded waits | Remainder |
|---|---|---|---|
| Coder: resumption handoff to refactorer handoff | 17 h 32 min 1 s | 6 h 28 min 23.871 s | 11 h 3 min 37.129 s |
| Refactorer: received handoff to architect handoff | 5 min 54 s | None identified | 5 min 54 s |
| Architect: received handoff to QA-ready handoff | 55 min 48 s | 55.340 s | 54 min 52.660 s |
| Specifier: received handoff to QA integration | 4 min 11 s | None identified | 4 min 11 s |
| Complete delivery | 18 h 37 min 54 s | 6 h 29 min 19.211 s | 12 h 8 min 34.789 s |

Handoff boundaries are Sep 6 19:16:48, then Sep 7 12:48:49, 12:54:43,
and 13:50:31. QA integrated at 13:54:42. These partition the delivery interval
without double-counting short overlaps when one role finishes after sending.

The initial presentation commit `cf791596` was created at Sep 6 20:02:02,
45 min 14 s after resumption. This is an intermediate milestone, not completion:
later presentation fixes, consumer checks, and review were still required.
The two accepted verification runs alone took 1 h 24 min 30.420 s. That time is
already inside the role intervals; it must not be added again. Earlier failed
runs, direct checks, repairs, and review are also inside those intervals.

The remainder is delivery time after removing known response waits. It includes
tool execution, verification waits, coordination, and the separately approved
repair. It is not a measured total of typing or model execution. The available
records do not establish pure implementation time or comparable effort for the
original product scope alone. Do not describe 18 h 38 min as coding time or
attribute the whole difference from six hours to implementation defects.

## Source records and process correction

The handoff daemon log and QA reflog supply the delivery boundaries. Commit
metadata supplies the first presentation milestone. The local session records
are under `/home/j-holliday/.codex/sessions/2026/09/06/`:

- Coder: `rollout-2026-09-06T08-45-20-01a07576-e1d4-73e1-b32e-7df371d80ae2.jsonl`,
  completed-turn and user-message records at lines 10143–10147 and 13738–13774.
- Refactorer: `rollout-2026-09-06T10-26-10-01a075d3-3167-77a1-a598-564a10f45133.jsonl`.
- Architect: `rollout-2026-09-06T10-26-11-01a075d3-36fb-7873-bce0-b447a5055f49.jsonl`,
  response and continuation records at lines 4258–4262.

What went well: the retained records permit an exact response-wait calculation.
The overnight request covered a separate repair outside the product contract.
Where the process failed: the first scorecard summary omitted that distinction.
The coder also acknowledged that the later baseline repair request was
unnecessary because an existing deferral applied. Recommendation: report total
elapsed time, response waits, and changed repair scope separately. Apply existing
deferral authority before asking for a new decision.
