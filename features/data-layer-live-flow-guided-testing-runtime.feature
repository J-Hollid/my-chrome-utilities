Feature: Data layer Live Flow guided testing runtime

  Background:
    Given the installed extension has active project Retail website
    And production Live capture renders observed data-layer events in the event feed
    And persisted Checkout journey contains related context-setting Page events with nested interaction Event occurrences

  # Data layer Live Flow guided testing runtime 001
  Scenario: Data layer Live Flow guided testing runtime 001
    When actual feed controls select Checkout journey as the Flow test context
    Then the installed Live feed header renders Checkout journey as selected
    And production feed rows, filters, order, selection, and event-detail actions remain mounted
    And no separate guided-test workspace, preselected graph step, or duplicate candidate feed renders
    And repository order, Assignment results, observed payloads, and prior session state infer no Flow
    When actual controls close the active project
    Then production Flow-test context is absent
    And the installed feed offers Open project and Create project without a project-bound query

  # Data layer Live Flow guided testing runtime 002
  Scenario: Data layer Live Flow guided testing runtime 002
    Given production Checkout journey is selected for Flow testing
    And its graph-ordered Page frames are root Cart, non-root Payment, non-root Confirmation A, and non-root Confirmation B
    And the production observed event is unlinked
    When actual controls open the observed event from the event feed
    Then installed event details render context-setting Page choices Cart pageview, Payment pageview, Confirmation A pageview, and Confirmation B pageview in that order
    And Cart renders root status
    And Confirmation A and Confirmation B have distinct stable control values
    And the initial control contains no interaction Event-occurrence value
    When actual controls select Returns loop whose Page frames all have incoming relationships
    Then the same production control renders every Returns loop Page frame in graph order
    And the installed guidance states that the selected Flow has no root Page frame

  # Data layer Live Flow guided testing runtime 003
  Scenario: Data layer Live Flow guided testing runtime 003
    Given production Checkout journey is selected for Flow testing
    And installed pageview event details contain no recorded Flow step
    When the operator links the open event to Cart Page frame
    Then saved Live-session evidence links live-101 to Checkout journey and the stable Cart frame ID
    And the production validator receives Cart context-setting Page-event effective schema
    And installed event details render the ordinary property issues and validation actions
    And the production defect report builder is available from those issues
    And result data records Manual Flow test, effective revision, issues, and provenance
    And production Assignment, contributor, Flow, and captured-payload bytes remain unchanged

  # Data layer Live Flow guided testing runtime 004
  Scenario: Data layer Live Flow guided testing runtime 004
    Given the production session Page cursor identifies Cart frame
    And production Cart contains button_click and PayPal interaction occurrences
    And Cart has outgoing Page relationships to Payment and Confirmation
    And the production observed event is unlinked
    When actual controls open the observed event from the event feed
    Then the installed selector renders Cart button_click and PayPal occurrences before related Payment and Confirmation frames
    And it rejects Events outside Cart and Pages absent from Cart outgoing Page relationships
    When the installed control links live-102 to Cart PayPal occurrence
    Then effective compiler input contains Cart Page-instance, PayPal Event, and occurrence contributors
    And current Page state remains Cart
    When another unlinked event is opened
    Then Cart PayPal remains selectable with Cart's other contained Events and related Pages
    When actual controls link that event to Payment frame
    Then selecting Payment changes production session context to that frame

  # Data layer Live Flow guided testing runtime 005
  Scenario Outline: Data layer Live Flow guided testing runtime 005
    Given production Checkout journey is selected for Flow testing
    And the selectable target under Payment context is <flow_step>
    When the installed Flow-step control links live-102 to that target
    Then the production validator receives <effective_schema>
    And persisted validation target is the stable identity of <flow_step>
    And result data contains selection mode Manual Flow test without an automatic assignment winner
    And the persisted Page cursor ID equals the Payment frame ID

    Examples:
      | flow_step                           | effective_schema                                                                  |
      | Payment Page frame                  | its Shared Profiles, ordered Page Groups, Page, and Flow Page-instance contribution |
      | Payment add_payment_info occurrence | its Page-instance branch, Event branch, and Event-occurrence contribution          |

  # Data layer Live Flow guided testing runtime 006
  Scenario Outline: Data layer Live Flow guided testing runtime 006
    Given the production session is positioned at Cart frame
    And the production observed event is unlinked
    And its capture time is <capture_order> the event linked to Cart
    When actual controls open the observed event from the event feed
    Then the installed control renders Cart contained Events and outgoing Page targets
    And production permits linking the observed event without comparing capture order
    And feed row visibility, order, enabled state, and selection equal their pre-Flow-test values

    Examples:
      | capture_order |
      | before        |
      | after         |

  # Data layer Live Flow guided testing runtime 007
  Scenario: Data layer Live Flow guided testing runtime 007
    Given production event details for live-101 record Cart frame
    And production live-102 advanced the session Page context to Payment frame
    And live-101 is under production review
    When actual controls open the observed event from the event feed
    Then the installed selector's recorded value is Cart frame
    And ordinary validation issues, provenance, and defect actions remain rendered
    And the production Page cursor remains Payment frame
    When production review switches to another event without a recorded Flow-step ID
    Then installed choices are Payment contained occurrences plus outgoing Page targets and none belongs to Cart

  # Data layer Live Flow guided testing runtime 008
  Scenario Outline: Data layer Live Flow guided testing runtime 008
    Given production pageview event live-102 is linked to Payment frame by <link_evidence>
    And captured /oForm/formStepName is "review" while Payment effective schema requires "payment"
    When actual controls open live-102 event details
    Then the Flow-step issue and context are stored on the same production event rendered by the ordinary validation presentation
    And event details contain only #live-inspector-action-create-defect-report for that validation
    And event details contain no separate Manual Flow test results issue list or .live-flow-create-defect control
    When actual controls invoke #live-inspector-action-create-defect-report
    Then the installed heading is "Defect report: Checkout journey · Payment · pageview"
    And issue controls render actual "review", expected "payment", and EXPECTED_VALUE as distinct evidence
    And expected-result controls render "Use Payment Flow-step expectation" with the effective schema revision
    And rendered issue and assistance labels contain neither generic constraint nor manually selected Flow step
    When actual controls select Use Payment Flow-step expectation
    Then report state expected payload contains typed string "payment" at /oForm/formStepName
    And its correction contains operation replace, marker +, response "payment", and the Flow-step expectation response source
    And the installed expected-result preview renders "payment" with green replacement treatment
    And the production builder retains ordinary payload, issue-selection, section, and action controls
    And report state contains stable Checkout journey, Payment, and live-102 IDs, their link, <displayed_link_evidence>, effective target, revision, and contributor provenance
    And persisted and clipboard representations contain an immutable snapshot of that correction and Flow evidence
    And generated report meaning is the observed pageview failing Payment rather than a defective or failed Checkout journey
    And production save and clipboard adapters are the same ones used by automatic-validation reports
    And failed validation leaves the linked path and Page-context controls unchanged

    Examples:
      | link_evidence                | displayed_link_evidence |
      | relationship Cart to Payment | path Cart to Payment     |
      | initial selection at Payment | Started at Payment       |

  # Data layer Live Flow guided testing runtime 009
  Scenario: Data layer Live Flow guided testing runtime 009
    Given production evidence links Cart and Payment pageview observations along one Page relationship path
    And repeated button_click and add_payment_info observations link under their containing Pages without advancing the Page cursor
    When actual controls save and reopen the Live session
    Then production restores selected Checkout journey, current Page context, event links, schema revisions, statuses, and defect references
    And the installed feed and event details remain the primary review surfaces
    And unchosen alternatives render Not tested
    And no installed result claims that Checkout journey passed or executed
    And production Assignment, canonical contributor, and Checkout journey hashes equal their pre-session values
