# Utility navigation icons R01

Status: user-approved on 2026-09-10 for implementation and focused QA integration.
Stable task: `utility-navigation-icons`. Base: current QA `9753b3db533a`.

Replace the large top-level text buttons with compact vector icons for Data Layer,
Tealium, and Hotkeys. Use a stylized DL, an original T mark for Tealium, and HK
inside a key outline. The T mark is a proposed utility symbol, not an official
Tealium logo. Review `utility-navigation-icons-preview.html` for the artwork and
selected states. The preview is a design example, not the installed extension.

Use 24-pixel artwork in equal 44-by-44 CSS pixel controls with an 8-pixel gap.
The current three utilities must fit on one row at 320 CSS pixels. Keep the
current utility order. Remove full text from the resting controls; show the full
utility name on hover and keyboard focus. Keep the full accessible tab name,
selected state, panel association, visible focus outline, and existing keyboard
navigation. Selected state must have a visible shape or border as well as color.
Use local scalable artwork that follows the existing theme. No external image
request is needed. Future utilities without custom artwork retain a readable
short label and their full accessible name.

This change concerns top-level presentation. Preserve selected-tab restoration,
retained utility sessions, capture, target binding, and the utility content views.
It does not add a utility, change navigation order, or change command behavior.

## Development focus and verification

Use the installed utility host as the presentation boundary. Likely shared paths
are `side-panel.html`, `src/utility-host/workspace.ts`, and the workspace tab
controller if needed. Put new presentation helpers under `src/utility-host/`;
their proposed parent is Shell, slice `utility_workspace_host`. Declare any new
stylesheet and asset ownership through the normal route before preflight.

The existing host query selects 31 tasks across its exact consumer slices:
project management, durable repository, command palette, Hotkeys, capture, event
library, event transport, schemas, defects, replay, live Flow, Shell, and
verification process. These are declared host consumers, not full feature packs.
The workspace presentation controller alone selects six Shell tasks. These are
read-only path forecasts; neither is an exact plan for this new feature.

The broad `side-panel-brand/shell.css` query selects 840 tasks across 16 packs.
Do not claim this change has a 31-task bound if that file is changed. Prefer a
small, clearly owned utility navigation presentation module. The coder must run
read-only intent classification before product coding and exact preflight after
the first coherent candidate. Keep all required base and candidate consumers;
do not alter ownership merely to reduce a count. A bounded ownership judgment
must compare the actual cost with this small product change.

Development checks: icon identity and accessible names, tab keyboard behavior,
and installed geometry at 320 and 800 CSS pixels. Inspect actual appearance with
each utility selected and in forced colors. Check hover/focus names and verify
that switching retains the same active utility sessions. Use the existing host
and tab tests with small imported cases. The acceptance contracts are
`features/utility-navigation-icons.feature` and
`features/utility-navigation-icons-runtime.feature`.

Planning allowance: 30 active coder minutes, with a progress report at 15 minutes.
This excludes review and exact verification time. Report actual selection and
cost before claiming a cheap result. Continue bounded work under the current
feature-mode rules. QA integration follows coder, refactorer, and architect
review; master promotion remains separate.

## Specification checks

Both feature files passed the repository Gherkin parser and IR-DRY checker on
2026-09-10. There are three product scenarios and three runtime scenarios. The
checker reported one possible synonym between a named icon's hover/focus label
and the added-utility fallback name. Retain both: one checks the explicit icon
mapping; the other checks a utility with no custom artwork. No runtime extension
proof or implementation completion is claimed by these specification checks.

## Bounded conservation maintenance authority, 2026-09-10

The specifier authorizes this derived-record correction under the existing
outcome-bounded grant. Continue `utility-navigation-icons` on its original active
handoff. Preserve product checkpoint `511bb177`, repair `c46ee7b1`, report
`d27c86b9`, and failed receipt
`tmp/verification-receipts/1327482-132aa57b-f256-4007-85c7-4ab0575ea6aa.json`.
This authority changes no approved icon behavior and is not QA acceptance.

Bounded discovery is complete for the compact projection and required source
records. The supported refresh stops on one inherited output mismatch in
`test/verification-contracts/execution-runner-integration-contract-test.mjs`.
The file is unchanged between accepted specification base `b26de510fb` and the
candidate. Compared with compact authority snapshot `23118e1baf`, accepted
ancestry added assertion `expression:mutationIncidents[0].failure.lineage`
and fixture `checkpoint-fixture`. No normalized assertion, fixture, or evidence
entry was removed. The specifier independently reproduced these exact outputs.

Authorize only this owner's semantic output transition:

- From `b3e04e6195a8e4383b86c272e2b44f9060d581ba2deaf3aba034168008402424`.
- To `b9cc13f5a2c00ff25576644d54e7688cf6e16b8749f2bfedd4cd5746fb0181a4`.

Use the existing authenticated compact authority chain to record this exact
accepted-ancestry correction. Retain every prior authority entry, legacy
baseline, compatibility record, and existing test. Derived aggregate counts,
digests, and exact source/generator identities may follow this correction.
Refresh the source records for the two already authorized contracts:
`evidence-promotion-blocked-aggregate-contract-test.mjs` and
`reliability-blocked-aggregate-contract-test.mjs`. Their normalized outputs
remain `222f27e2ff50b235109eabde65eca936250f68546f8e149a0c85d21ff1cf1e48`
and `130d4f6a6d513f3b8e60c1f32d6db00345daf233ec27f0e696cdb71799bd55b8`.

The fixed repair boundary is this compact fixture, its existing authority
registry and accepted-head bindings, and the directly affected conservation
and modularization checks. No product or runner-test source change is required.
Do not add a new migration system, general override, bypass, or auto-accept rule.
Do not accept any other changed semantic output. Keep tests that reject forged
authority, an arbitrary candidate parent, deleted checks, and unexplained drift.

Run the supported refresh and check after the exact authorized transition is
represented. Use the selected direct failed checks and the existing reliability
route to preserve the failed receipt and incident dispositions. Then obtain
fresh complete focused review and package evidence before normal downstream
review. No all-pack gate or master promotion is authorized.

Reporting allowance for this maintenance is 15 active coder minutes, with a
progress report halfway through. Record this cost separately from icon coding.
Continue findings in this same family and boundary in one pass. Escalate a
material scope/cost change or an unexplained repeated failure through the
existing routing rules; do not start another preparation program.
