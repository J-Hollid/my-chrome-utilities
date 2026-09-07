# QA-to-master integration after schema export

Status: authorized by the user on 2026-09-08; schema export entered QA at
2026-09-07T22:54:35Z. Release intake is complete; the exact recording head is
ready for the architect's release-candidate handoff.
Release task: `qa-master-after-schema-export`.
Required feature task: `schema-context-json-schema-export`.

## User authority and trigger

The user requested autonomous setup of QA-to-master integration after the
current schema export feature is complete and merged into QA. This instruction
authorizes the specifier to start the existing master integration process at
that boundary without another routine approval request.

First accept the exact architect `qa-ready` handoff for the schema export task,
validate its bound `review-ready` evidence, and fast-forward QA. The feature
retains its focused verification route until that integration is complete.
An approved specification alone does not satisfy this trigger. The architect's
candidate `8cad26dabe2df2f710a198b15676cb30d9105f73` satisfied it: bound
review-ready evidence passed for 1,121 tasks, and QA advanced by fast-forward.

At initial authorization, QA was
`646b8472135f0740f39b978252f0922c7687d61b`, and master was
`fd8575e994dc453c50e79193bd9648988248120b`. Master was an ancestor of QA.
The later schema export integration satisfies the requested trigger.

## Authorized sequence

1. After schema export enters QA, read the current master integration rules in
   `docs/qa-branch-release-pilot-R01.md`. Record the then-current
   master base, QA head, included tasks, and available delivery timestamps.
2. Review the complete durable granularity-observation portfolio. Give every
   applicable item a selected, combined, carried, or retired disposition.
   Complete required selected hardening through focused review and QA
   integration before freeze. Apply existing scope and safety limits.
3. Freeze the resulting exact QA head. Send it directly to the architect as
   task `qa-master-after-schema-export`, with `readiness: release-candidate`,
   `verified: qa-candidate`, and current master as `base:`. Use the official
   handoff helper. Keep unrelated product work out of the pending candidate.
4. The architect reviews the cumulative change and owns one fresh complete
   verification gate with properties and package proof. Preserve deferred
   incidents for that assessment. Follow the existing repair procedure if the
   gate fails; a changed candidate needs fresh complete verification.
5. Accept only exact `final-ready` evidence. Under the existing master-mode
   procedure, fast-forward QA and master to the tested commit. Report the
   delivery scorecard, failures, repairs, verification time, and limits.

Follow official queue and progress-lease rules. A `NO_TASK` result ends waiting;
it does not cancel this authorization. Continue from the exact architect
release handoff when it returns.

## Release intake and limits

Read `docs/qa-master-after-schema-export-intake-R01.md` for the complete task
inventory, queue ages, portfolio result, evidence limits, and release duties.
The portfolio helper reported no observations and passed the freeze check.
The release handoff binds the exact QA head after this documentation record,
with `fd8575e994dc453c50e79193bd9648988248120b` as the current master base.
Terminal verification and master integration remain pending.

This record changes no feature contract or verification requirement. Existing
unrelated local edits remain outside the release commit.
