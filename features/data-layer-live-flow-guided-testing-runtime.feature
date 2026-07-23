# mutation-stamp: sha256=974c07c6677f594e1612262bbdc65cf76c0a524585c982a2a77eb13f22a59c35
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-23T16:40:59.093431937Z","feature_name":"Data layer Live Flow guided testing runtime","feature_path":"features/data-layer-live-flow-guided-testing-runtime.feature","background_hash":"a452240cf847c6e9ac91c2cbbeea27d72aad80605488cd361dcbd72a1893da92","implementation_hash":"sha256:fac4d2ff182b6cf88f9a952973c8be8797287738218e7653ad0dbbbe7cf91c5c","scenarios":[{"index":3,"name":"Data layer Live Flow guided testing runtime 004","scenario_hash":"f85cc6189fd381192924af6ddb7aee0a9ab0968566ac834cd865a03196462071","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-23T16:38:49.708242212Z"},{"index":4,"name":"Data layer Live Flow guided testing runtime 005","scenario_hash":"34adad433225544964928f9f7c37dc52111f51522f94389a88d6931d8c5e8558","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-23T16:38:49.708242212Z"},{"index":5,"name":"Data layer Live Flow guided testing runtime 006","scenario_hash":"2987df31fb141a328c5b563e644031bc980e8a514bd303af5d0ada0bfb8cce1f","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-23T16:38:49.708242212Z"},{"index":7,"name":"Data layer Live Flow guided testing runtime 008","scenario_hash":"0a76f5b330928c98a36a02acfca893f52931b2a2f9b7b9b00065c4cfcf3af2a2","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-23T16:38:49.708242212Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer Live Flow guided testing runtime

  Background:
    Given the installed extension has active project Retail website
    And production Live capture renders observed data-layer events in the event feed
    And persisted Checkout journey contains connected Page-frame and Event-occurrence nodes

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
    Then the installed event details render Flow-step options Cart, Payment, Confirmation A, and Confirmation B in that order
    And Cart renders root status
    And Confirmation A and Confirmation B have distinct stable control values
    And the initial control contains no Event-occurrence value
    When actual controls select Returns loop whose Page frames all have incoming relationships
    Then the same production control renders every Returns loop Page frame in graph order
    And the installed guidance states that the selected Flow has no root Page frame

  # Data layer Live Flow guided testing runtime 003
  Scenario: Data layer Live Flow guided testing runtime 003
    Given production Checkout journey is selected for Flow testing
    And installed event details contain no recorded Flow step
    When the operator links the open event to Cart Page frame
    Then saved Live-session evidence links live-101 to Checkout journey and the stable Cart frame ID
    And the production validator receives Cart Flow Page-instance effective schema
    And installed event details render the ordinary property issues and validation actions
    And the production defect report builder is available from those issues
    And result data records Manual Flow test, effective revision, issues, and provenance
    And production Assignment, contributor, Flow, and captured-payload bytes remain unchanged

  # Data layer Live Flow guided testing runtime 004
  Scenario Outline: Data layer Live Flow guided testing runtime 004
    Given Cart frame is the production current Flow step
    And Cart has an outgoing <relationship_kind> relationship to <next_step> with <label_state>
    And the production observed event is unlinked
    When actual controls open the observed event from the event feed
    Then the installed Flow-step control renders Cart outgoing relationship targets
    And <next_step> renders with <relationship_kind> and <display_name>
    And controls reject a graph step absent from Cart outgoing relationship IDs
    When the installed Flow-step control commits <next_step>
    Then production session storage links live-102 to that stable graph-step ID
    And current traversal state becomes <next_step>

    Examples:
      | relationship_kind | next_step                    | label_state        | display_name                 |
      | expected_next     | Payment Page frame           | no label           | Cart to Payment              |
      | alternative       | Cart PayPal Event occurrence | label PayPal route | PayPal route                 |
      | merge             | Confirmation Page frame      | no label           | Cart to Confirmation         |

  # Data layer Live Flow guided testing runtime 005
  Scenario Outline: Data layer Live Flow guided testing runtime 005
    Given production Checkout journey is selected for Flow testing
    And the next production graph target is <flow_step>
    When the installed Flow-step control links live-102 to that target
    Then the production validator receives <effective_schema>
    And persisted validation target is the stable identity of <flow_step>
    And result data contains selection mode Manual Flow test without an automatic assignment winner

    Examples:
      | flow_step                           | effective_schema                                                                  |
      | Payment Page frame                  | its Shared Profiles, ordered Page Groups, Page, and Flow Page-instance contribution |
      | Payment add_payment_info occurrence | its Page-instance branch, Event branch, and Event-occurrence contribution          |

  # Data layer Live Flow guided testing runtime 006
  Scenario Outline: Data layer Live Flow guided testing runtime 006
    Given Cart frame is the production current Flow step
    And the production observed event is unlinked
    And its capture time is <capture_order> the event linked to Cart
    When actual controls open the observed event from the event feed
    Then the installed Flow-step control renders Cart outgoing relationship targets
    And production permits linking the observed event without comparing capture order
    And feed row visibility, order, enabled state, and selection equal their pre-Flow-test values

    Examples:
      | capture_order |
      | before        |
      | after         |

  # Data layer Live Flow guided testing runtime 007
  Scenario: Data layer Live Flow guided testing runtime 007
    Given production event details for live-101 record Cart frame
    And production traversal continued from live-102 through Payment frame
    And live-101 is under production review
    When actual controls open the observed event from the event feed
    Then the installed selector's recorded value is Cart frame
    And ordinary validation issues, provenance, and defect actions remain rendered
    And the production traversal cursor remains Payment frame
    When production review switches to another event without a recorded Flow-step ID
    Then every installed choice references an outgoing Payment relationship and none references Cart

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
    And the production builder retains ordinary payload, issue-selection, section, and action controls
    And report state contains stable Checkout journey, Payment, and live-102 IDs, their link, <displayed_link_evidence>, effective target, revision, and contributor provenance
    And persisted and clipboard representations contain an immutable snapshot of that Flow evidence
    And generated report meaning is the observed pageview failing Payment rather than a defective or failed Checkout journey
    And production save and clipboard adapters are the same ones used by automatic-validation reports
    And failed validation leaves the linked path and outgoing Flow-step controls unchanged

    Examples:
      | link_evidence                | displayed_link_evidence |
      | relationship Cart to Payment | path Cart to Payment     |
      | initial selection at Payment | Started at Payment       |

  # Data layer Live Flow guided testing runtime 009
  Scenario: Data layer Live Flow guided testing runtime 009
    Given production session evidence links Cart, page_view, Payment, and add_payment_info feed events along persisted relationship IDs
    When actual controls save and reopen the Live session
    Then production restores selected Checkout journey, current step, event links, schema revisions, statuses, and defect references
    And the installed feed and event details remain the primary review surfaces
    And unchosen alternatives render Not tested
    And no installed result claims that Checkout journey passed or executed
    And production Assignment, canonical contributor, and Checkout journey hashes equal their pre-session values
