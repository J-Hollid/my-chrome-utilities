# Serena child-dispatch owner transition R01

Status: approved by the user on 2026-09-06 in the refactorer session.
Classification: specification correction for task `serena-use-assessment`.

## Exact approval

Permit moving eight assertion leaves and one fixture leaf from
`test/verification-contracts/historical-planning-contract-test.mjs` to
`test/verification-contracts/historical-child-dispatch-contract-test.mjs`.
The parent retains all remaining cases. Both files belong to the existing
`historical_planning` slice. Preserve their verification records and module
setup. This approval does not permit any other owner transition.

This correction supersedes the exclusion of this exact transition by Scenario
009 in `features/verification-process-exact-slice-execution.feature`.
Preserve its six existing authorized transitions. Add the exact historical
planning parent and child relationship to the specification authority.

Preserve the production Babashka task bodies, both aggregate-load failures,
both runner-owned passes, both Node controls, and the incident proof. Keep all
assertions and fixture evidence. Do not add unrelated validator machinery.

## Authenticated implementation

The current owner-transition authority in
`scripts/verification-registry/contract-conservation.mjs` is bound to commit
`4aea38cdf4899dc0a606215cc106ab743533c2fa`. A feature row alone cannot change that
binding. The correction must supply an authenticated successor authority for
this exact split. Retain historical provenance and prove that the parent and
child together preserve the complete former assertion and fixture population.
A same-owner digest refresh must not substitute for the owner transition.

## Delivery

The specifier must apply this specification correction on the current approved
QA specification lineage and issue it to the coder. This document was recorded
on the refactorer branch after candidate `80cddb9368`; that candidate remains
blocked. Port only the specification delta. Do not integrate the blocked
implementation ancestry as part of accepting this approval.

Keep the stable task `serena-use-assessment` and the existing ordered companion
prerequisites. The coder retains the bounded extraction draft and its inventory
proof. Use the normal coder, refactorer, architect, and specifier route. Require
fresh focused evidence and package proof for the changed candidate. This
approval does not permit an all-pack feature gate or master promotion.

## Assessment

The review identified the exact transfer and kept its recorded evidence intact.
The previous repair enlarged a test file that already had several duties.
The correction now has explicit approval for the missing owner transition.
Complete the bounded split without adding a wider verification program.
