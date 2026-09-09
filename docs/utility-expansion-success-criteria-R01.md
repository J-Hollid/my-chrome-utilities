# Low-cost utility expansion: success criteria R01

Status: success expectations set on 2026-09-09 in response to the user's request.
These operational criteria explain the existing utility-isolation goal. They
do not reopen Tealium requirements or create another preparation task.

## Scope of cost

Measure the extra work caused by placing a utility inside the existing shell.
Utility-specific feature implementation and its necessary tests are separate.
Existing Data Layer tests remain available for changes that actually affect
Data Layer behavior. Their existence must not burden an isolated new utility.

## Functional and process acceptance

| Case | Success |
|---|---|
| Add an ordinary utility | Use its own modules and the existing contribution/host interface; no Data Layer implementation edits, new ownership-preparation cycle, or extra user approval |
| Verify initial integration | Select utility tests plus exact host, package, and genuinely shared observations; no unrelated Data Layer feature families or complete Shell fallback |
| Edit private utility code | Select the affected utility tests and actual private consumers; no automatic Data Layer or complete host-suite execution |
| Add a platform capability such as DevTools | Add only demonstrated platform/bridge checks; explain their causal relationship and retain the ordinary utility route |
| Change shared behavior or permissions | Keep the real affected consumers and conservative safety fallback; do not claim that this broader change is a private utility edit |
| Complete delivery | Reach ordinary coder/refactorer/architect/QA review without new manual routing, repeated specification approval, or another prerequisite loop caused by shell registration |

The current canonical registration baseline at `3d91abb4f7` is 32 checks across
13 pack identities. It is a comparison baseline, not a fixed lifetime task cap.
Every extra integration check must observe a changed shared contract. Whole
unrelated Data Layer families cannot be justified by a pack label alone.

## Initial time targets

These are engineering targets to validate, not measured results or guarantees:

- For an already working simple utility fixture, shell registration and wiring
  should need at most 30 active developer minutes. Exclude the fixture's own
  feature implementation and waiting for independent reviewers. Include any
  shell-specific repair or ownership work in the measured total.
- Extra host verification should add at most two minutes of elapsed time to the
  comparable standalone fixture plan on the same machine and configured runner.
  Compare equal utility tests, properties, build/package requirements, cache
  state, and concurrency. Report common costs separately and count them once.
- Routine private edits should add no host-only verification cost unless they
  change a shared contract. The utility's own tests still run as required.

A missed target is a visible cost finding. Report the measured delta, cause,
and smallest correction. Do not silently move the target or claim success from
pack count. A timing miss alone is not a new permission gate or authority to
weaken coverage. Use existing receipts when comparable; do not launch repeated
full evidence runs solely to produce a timing score.

## Completion evidence

Use the existing Probe fixture for the ordinary registration and private-edit
cases; do not create another demonstration framework. Show canonical selected
task identities, the specific host additions, retained broad-change fallback,
and measured shell work/verification overhead. Keep planning results distinct
from executed proof.

Use the approved Tealium implementation as the platform-capability case. Report
its own tests separately from host and DevTools overhead. Account for any
independent registration/activation sequence needed by canonical ownership.

The utility-isolation goal is achieved only when the ordinary and Tealium cases
have a proved delivery route without unrelated Data Layer workloads. Pending
runtime or cost measurements must remain visible. Stage completion, a passing
broad suite, or fewer than all packs does not establish this outcome.

Current scorecard: ordinary registration selection has a 32-check canonical
baseline; the exact Tealium route and the time targets still require proof.
Retain useful accepted work and continue the current task without restarting
discovery or introducing another preparation label.
