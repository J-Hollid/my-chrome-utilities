# Side-Panel Walkthrough Decision Register

Update this register when the team reviews recommendations and again after each verification round. Preserve previous decisions; add a new row when a recommendation changes scope or receives a follow-up.

## R01 Baseline Recommendations

| Recommendation ID | Decision | Reason | Delivery target | Verification round | Result |
| --- | --- | --- | --- | --- | --- |
| WU-01 | Failed verification | Hidden setup content and stale Start testing guidance remain visible during capture. | Follow-up | R02 | Failed |
| WU-02 | Failed verification | Transitions work, but origin context and hidden transition-state behavior are incomplete. | Follow-up | R02 | Failed |
| IH-01 | Passed verification | Status, target, count, and secondary Details form a stable hierarchy. | Delivered | R02 | Passed |
| IH-02 | Passed verification | Inspector and editor provide named, persistent headers and return actions. | Delivered | R02 | Passed |
| VC-01 | Passed verification | Library templates use structured metadata and separate actions. | Delivered | R02 | Passed |
| VC-02 | Passed verification | Editor fields use their pane and JSON/execution details are disclosed. | Delivered | R02 | Passed |
| SP-01 | Passed verification | Primary, secondary, and destructive actions are visibly distinct. | Delivered | R02 | Passed |
| SP-02 | Failed verification | Hidden empty states remain visible and wide Live layouts contain unexplained blank space. | Follow-up | R02 | Failed |
| DR-01 | Failed verification | Grouping, order, and summaries work; headers omit latest time and event count. | Follow-up | R02 | Failed |
| DR-02 | Rejected | The detail view should retain the complete payload. Reconsider only when property-level schema validation is designed and requires a different payload-navigation model. | No current delivery | R01 | Rejected |
| SC-01 | Failed verification | Hidden setup content contradicts the canonical Capturing and Connected state. | Follow-up | R02 | Failed |
| SC-02 | Failed verification | Local save feedback improved; push timing and stale global feedback remain incomplete. | Follow-up | R02 | Failed |
| AS-01 | Failed verification | Confirmation works and pushes once, but omits target title and changed properties. | Follow-up | R02 | Failed |
| AS-02 | Failed verification | Consequence styling improved; Validate and repeated Save remain insufficiently state-aware. | Follow-up | R02 | Failed |
| RB-01 | Passed verification | Library uses an explicit 720px master-detail layout and stacks below 700px. | Delivered | R02 | Passed |
| RB-02 | Failed verification | Live components underuse 720px and the runtime layout test is not Windows-portable. | Follow-up | R02 | Failed |
| PD-01 | Passed verification | Visible Back and Escape restore the originating event and focus. | Delivered | R02 | Passed |
| PD-02 | Failed verification | Disclosures and Close work, but the hidden dirty-close guard remains visibly laid out. | Follow-up | R02 | Failed |
| AK-01 | Failed verification | Core focus transitions pass; target trapping and portable automated coverage remain incomplete. | Follow-up | R02 | Failed |
| AK-02 | Failed verification | Event accessible names improved; hidden/stale state content prevents authoritative announcements. | Follow-up | R02 | Failed |

## R02 Follow-Up Recommendations

| Recommendation ID | Decision | Reason | Delivery target | Verification round | Result |
| --- | --- | --- | --- | --- | --- |
| R02-SC-01 | Pending review | Make the HTML hidden state authoritative across all components. |  | R03 | Pending |
| R02-RB-01 | Pending review | Give Live a purposeful wide master-detail layout and reduce nested scrolling. |  | R03 | Pending |
| R02-DR-01 | Pending review | Add latest time and event count to pathname visit headers. |  | R03 | Pending |
| R02-AS-01 | Pending review | Show structured target and changed-property data in Push review. |  | R03 | Pending |

## Specification Project Correction

| Recommendation ID | Decision | Reason | Delivery target | Verification round | Result |
| --- | --- | --- | --- | --- | --- |
| DLSP-01–DLSP-12 | Implemented | Production corrections and scenario-specific automated gates are implemented; the separately prepared paired-Windows actual-extension walkthrough remains unavailable and the R04 capture matrix is therefore incomplete. | R02 terminal correction | R04 | External verification pending |

## Decision Values

Use one of these values in the Decision column:

- `Accepted`
- `Rejected`
- `Deferred`
- `Superseded`
- `Implemented`
- `Passed verification`
- `Failed verification`
