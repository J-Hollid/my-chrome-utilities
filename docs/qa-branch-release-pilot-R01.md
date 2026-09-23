# QA-branch release pilot R01

Status: approved by the user for immediate activation; ownership-readiness and
within-pack granularity refinements approved on 2026-08-17; judgment-based
granularity deferral and pre-promotion portfolio intake approved on 2026-08-18;
first cumulative promotion completed at `70c94a8ce6` and natural-lull promotion
timing confirmed by the user on 2026-08-21

Prepared: 2026-08-12

## Purpose

Reduce development latency by running change-appropriate focused checks while
features accumulate on `qa`, then run the complete end-to-end gate once for an
explicitly requested promotion of the frozen cumulative tree to `master`. The
request is expected at a natural delivery lull chosen from current priorities
and feature momentum, not when an arbitrary task-count or calendar threshold is
reached.

This is a delivery-process pilot, not permission to weaken regression coverage.
`qa` is the frequently integrated development line. `master` remains the exact
release line and advances only to a tree that passed the complete terminal gate.

## Specifier mode selection

At the start of each new request, the specifier determines which of these two
modes the user wants. If the request is ambiguous, ask whether the user wants to
develop or integrate a feature into `qa`, or promote accumulated `qa` work to
`master`.

Use one mode file:

- For a new behavior slice, correction, or other reviewable change, use
  `docs/qa-branch-release-pilot-feature-mode-R01.md`.
- Only for an explicit user request to promote accumulated QA work to
  `master`, use `docs/qa-branch-release-pilot-master-mode-R01.md`.

Do not combine the modes. If the request is ambiguous, ask which mode the user
intends.

## Settled measurements

Settled delivery measurements are in
`docs/qa-branch-release-pilot-scorecards-R01.md`. They are historical evidence.
The active mode, gate, branch, and measurement rules in the routed mode files
remain authoritative.

## VTD-018 disposition

VTD-018 remains a stopped, unintegrated experiment. Candidate `c7ad4698f9` and its
descendants are not part of `qa`, the pilot baseline, or a release candidate.
Resuming that implementation requires a separate explicit user decision.
