# Observation source review correction R01

Task: `project-multiple-observation-sources`.
Review input: `0030725425`, based on specification `fa4cbfd952`.

The review found three related gaps: receipt order during a periodic refresh,
an acceptance dispatcher with excessive branching, and missing source-specific
property coverage. This correction addresses that complete list.

Each source reports unconfirmed receipts to a small shared receipt queue.
Confirmed arrays continue delivery during periodic snapshots. A message from an
unconfirmed array holds later receipts until its source snapshot arrives; the
queue then delivers them by their extension receipt sequence. Repeated snapshot recovery
follows live delivery and retains entry de-duplication. Removing a source or
stopping observation releases its hold and rejects its late callbacks.

The review reproduction now receives and captures `M1, A1` in the same order.
Controlled tests cover both first-source choices, overlapping refreshes,
activation, source removal, and repeated snapshot recovery. Sixty generated
schedules check receipt order, capture sequence, and unique entry identity.
Fifty generated project cases check stable settings identity, transactional
validation, normalized paths, import/export, and explicit empty source lists.
Both property programs are registered under their source owners.

The acceptance dispatcher now selects small product and runtime resolvers.
Pure Clojure checks cover all 25 scenarios and mismatched evidence with 33
assertions. The focused namespace is
`acceptance.project-observation-source-resolvers-test`; it has no external
browser command. The refactorer still owns fresh coverage and quality analysis.

The direct installed browser check passed all 14 groups. A separate development
acceptance call hit the existing Chrome evaluation timeout before it obtained
browser evidence. Its failed log is retained. The exact committed review run
provides the final focused claim; earlier logs do not replace that proof.

What worked: the controlled scheduler reproduced the order error without sleeps.
Process failure: the initial feature had no source-specific property program,
and its example tests missed the refresh overlap. Refinement: keep receipt-order
properties at the subscription/coordinator boundary and use the pure resolver
namespace for focused Clojure coverage.

The first complete review run found a Clojure lane-discovery gap. The pure test
namespace now has a registered root Node wrapper in the existing pack-local
lane. A controlled fixture executes the production discovery assertions and
proves that the old nested wrapper fails while the registered wrapper passes.
The original failed run and its diagnostic are retained under the reliability
procedure; a fresh complete run is required after the repair.

A further controlled schedule found that holding all periodic refreshes could
pause delivery indefinitely when the refreshes continuously overlap. The final
subscription holds only messages for an array that is not yet confirmed. The
registered regression and all 60 generated schedules now check continuous
polling progress as well as order. They also check replacement-array receipts
and cancellation of an unconfirmed source. The prior 1,033-task passing run is
retained but is not the review claim for this additional correction.
