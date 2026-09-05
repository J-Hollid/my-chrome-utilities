# Calibration handler output repair

Task: `verification-slice-serena-development-pilot`.
Returned candidate: `90043872ba`. Specification base: `f338e51109`.
Repair family: `historical-calibration-dependency`.
Boundary: `calibration-contracts-and-receipt-consumer`.

The refactorer found that the consumer test wrote two JSON lines. The shared
acceptance reader selects the last JSON line. It could not read the first
consumer observation. The repair emits both observations in one JSON object.
The shared reader and handler assertions stay unchanged.

Direct execution also found that a general process handler preceded the
calibration handler. Generated acceptance could pass without invoking the
calibration checks. The process manifest now puts the feature-scoped calibration
handler first. Its scope prevents it from matching other features. The registry
was regenerated, and the ordered registration assertion was updated.

Both defects have regression checks in the existing calibration source test.
Each check failed before its repair. The output check requires both complete
observations. The registration check requires the runtime to select the actual
calibration handler. It does not execute that handler recursively.

Direct Babashka execution of `verify!` now returns both observations. The APS
parser and generator produced the executable calibration test. All 16 examples
passed through the registered handler; the same process checked the resulting
consumer, pending-review, and active-incident observations. The strict runtime,
pack cardinality, and compact conservation checks passed.

The earlier 179-task proof did not detect the handler selection defect. Do not
use that proof for this correction. The new commit requires fresh focused review
evidence. The refactorer must repeat handler coverage and CRAP after this repair;
coder does not own those tools. No CRAP pass is claimed here.

The optional-tool preparation and historical calibration values are preserved.
The Serena implementation remains paused pending preparation review and QA.

## Serena selection correction

The refactorer returned `abc1f8b579` because Serena had the same handler-order
defect in the Shell manifest. The earlier correction checked only calibration.
The complete handler-selection defect list now includes both features, in
addition to the repaired calibration JSON output.

The Shell manifest puts the feature-scoped Serena handler first. The registry
was regenerated. The existing development-toolchain ownership test now checks
that runtime selection returns the actual Serena handler. It failed before the
order change and passed after it. Shared runtime and other handlers are unchanged.

Both feature checks ran together before the new focused evidence run. The APS
generated Serena test passed all 22 examples and loaded actual pin, runtime,
ownership, and resumption evidence. The generated calibration test passed all
16 examples and loaded both consumer observations. Both registered-selection
regressions passed. Compact conservation remains unchanged.

Process refinement: check registered handler selection for every new feature in
the active preparation before recording review evidence. Direct invocation alone
can miss a general handler that takes precedence in the registered runtime.
