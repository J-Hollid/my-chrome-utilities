# Data layer project assurance severity program R01

## Outcome

Project assurance is advisory. Fixtures, Assignments, and Coverage help operators
improve confidence, but a project is valid without them. Findings in those three
categories always appear as warnings and never disable validation, developer
export, release confirmation, or publication.

Blocking issues are reserved for validation failures: an invalid canonical schema,
an incompatible effective schema, or submitted data that violates the effective
schema at the validation boundary. A warning policy cannot promote optional
assurance to a blocker.

## Installed correction

The installed preflight currently adds incomplete or failing Fixtures, Assignment
ties, and missing Coverage to `blockers`. The legacy `fixturesRequired` setting can
also add zero-Assignment, zero-Fixture, zero-Coverage, and uncovered-requirement
blockers. Release review disables both publication confirmations whenever that
combined list is non-empty.

The correction uses one finding shape with an explicit severity and category.
Fixture execution results, Assignment availability or ambiguity, and Coverage
state populate `warnings`. Schema compiler and payload validator failures populate
`blockers`. Preflight and release review render separate labelled lists and counts;
only `blockers` control operation availability.

Unusable optional records do not poison otherwise valid output. They remain
visible as warnings and are omitted from evaluator candidates or proving evidence.
Every schema-bearing contributor remains independently authorable, validatable,
exportable, and publishable without a synthesized Assignment.

Legacy `fixturesRequired` and `warningsBlock` values may remain readable for
project compatibility, but cannot change severity or gating. Project portability
preserves project content without reviving their former blocking behavior.

## Scope

This cycle owns only severity classification, warning presentation, and gating at
preflight, release review, validation, developer export, and publication. It does
not require new Fixture authoring, Assignment authoring, Coverage pivots, waivers,
or temporal execution.

## Traceability

| ID | Finding | Feature | Required result |
|---|---|---|---|
| A01 | Absence of optional assurance blocks useful work | Assurance 001 and 006 | No Fixture, Assignment, or Coverage is a warning; validation, export, and publication remain usable |
| A02 | Optional assurance defects enter the blocker list | Assurance 002 | Fixture, Assignment, and Coverage defects remain actionable warnings and unusable optional records are excluded safely |
| A03 | Legacy policy promotes warnings | Assurance 003 | `fixturesRequired` and `warningsBlock` cannot affect severity or gating |
| A04 | Blocker terminology mixes assurance with validation | Assurance 004 | Only canonical, effective-schema, and submitted-data validation failures block their relevant operation |
| A05 | Preflight and release review do not explain severity | Assurance 005 | Separate counts, lists, semantics, repair links, and one reviewed identity remain consistent through publication |

## Terminal acceptance

The program passes when both feature files parse and dry-check with no findings,
the exact `project_assurance_severity` verification pack passes against the built
extension, and `npm run package` consumes that same settled build. Terminal
evidence must show:

- zero Fixtures, Assignments, or Coverage never creates a blocker;
- incomplete or failing Fixtures, ambiguous or unusable Assignments, and missing
  or stale Coverage remain warnings with repair routes;
- legacy policy values cannot promote warnings;
- only actual schema or submitted-data validation issues use blocking severity;
- warning-only preflight leaves publication confirmation enabled; and
- manual contributor validation and export need no Assignment or synthesized
  routing record.
