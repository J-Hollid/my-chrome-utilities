# Side-Panel Visual Walkthrough Report: <Round ID>

## Round Context

| Field | Value |
| --- | --- |
| Round ID | <R02> |
| Date | <YYYY-MM-DD> |
| Extension commit | <commit or branch> |
| Accepted recommendations under test | <IDs> |
| Chrome side-panel widths reviewed | 360px, 520px, 720px |
| Local demo flow completed | Yes / No |
| Tuple and object event capture verified | Yes / No |

## Walkthrough Results

| Step | Expected outcome | Result | Evidence |
| --- | --- | --- | --- |
| Choose target | Target is clear and ready. |  |  |
| Start testing | Capturing and Connected; one initial pageview. |  |  |
| Commerce flow | Expected page and interaction events captured. |  |  |
| Inspect event | Event detail opens and has a visible return path. |  |  |
| Save to Library | Template is saved and feedback is local. |  |  |
| Edit payload | Draft, version, and result are clear. |  |  |
| Push draft | Confirmation is shown and one local event is pushed. |  |  |
| Keyboard pass | Focus and status announcements behave as specified. |  |  |

## Width Matrix

| State | 360px | 520px | 720px |
| --- | --- | --- | --- |
| Live feed |  |  |  |
| Event inspector |  |  |  |
| Library |  |  |  |
| Payload editor |  |  |  |
| Keyboard focus state |  |  |  |

## Verification of Accepted Recommendations

| Recommendation ID | Acceptance criteria result | Evidence | Status |
| --- | --- | --- | --- |
| <ID> |  |  | Passed verification / Failed verification |

## New Recommendations

### <ID>: <Outcome-oriented title>

**Priority:** P0, P1, or P2

**Evidence:** Name the walkthrough state, width, and observed behaviour.

**Observed issue:** Explain what prevents understanding, efficiency, safety, or accessibility.

**Recommended change:** State the product behaviour to build.

**Acceptance criteria:**

- <Observable requirement>
- <Width-specific or keyboard requirement when applicable>

**Product value:** Explain the benefit in plain language.

**Likely implementation areas:** <Modules or surfaces>

## Regressions

| Regression | Previous expected behaviour | Current behaviour | Severity | Evidence |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Round Outcome

State whether the accepted recommendations passed verification, which items require follow-up, and whether a new round is needed.
