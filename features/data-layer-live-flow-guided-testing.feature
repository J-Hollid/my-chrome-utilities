Feature: Data layer Live Flow guided testing

  Background:
    Given Retail website is the active project
    And Live is capturing observed data-layer events in the event feed
    And Checkout journey contains connected Page frames and Event occurrences

  # Data layer Live Flow guided testing 001
  Scenario: Data layer Live Flow guided testing 001
    When the operator selects Checkout journey as the Flow test context from the Live event feed
    Then Checkout journey is identified as the selected Flow above the existing event feed
    And the feed retains its rows, filters, ordering, selection, and event-detail actions
    And no separate guided-test workspace, graph-step picker, or candidate-event feed opens
    And no Flow is inferred from repository order, an Assignment, an observed event, or a prior session
    When Retail website is closed
    Then the Flow test context is cleared
    And the feed offers Open project and Create project without inventing project context

  # Data layer Live Flow guided testing 002
  Scenario: Data layer Live Flow guided testing 002
    Given Checkout journey is the selected Flow test context
    And its Page frames in graph order are root Cart, non-root Payment, non-root Confirmation A, and non-root Confirmation B
    And the observed event is unlinked
    When the operator opens the observed event from the event feed
    Then its event details show the Flow step selector in order Cart, Payment, Confirmation A, and Confirmation B
    And Cart is identified as a root Page frame
    And the repeated Confirmation Page frames remain distinct choices
    And no Event occurrence is offered before the first Page frame is linked
    When Returns loop becomes the selected Flow test context
    And each Returns loop Page frame has an incoming relationship
    Then the same event details offer every Returns loop Page frame in graph order
    And guidance explains that the Flow has no root Page frame

  # Data layer Live Flow guided testing 003
  Scenario: Data layer Live Flow guided testing 003
    Given Checkout journey is the selected Flow test context
    And observed event live-101 is open with no Flow-step link
    When the operator selects Cart Page frame from its event details
    Then the Live session records Checkout journey, stable Cart frame, and live-101 as one link
    And its ordinary event validation uses Cart Flow Page-instance effective schema
    And event details highlight the same property issues and actions as automatic schema assignment
    And the usual defect report builder is available from those issues
    And the result records manual Flow selection, effective schema revision, issues, and provenance
    And no project Assignment, contributor, Flow, or observed-event payload is created or changed

  # Data layer Live Flow guided testing 004
  Scenario Outline: Data layer Live Flow guided testing 004
    Given Cart Page frame is the current Flow step
    And Cart has an outgoing <relationship_kind> relationship to <next_step> with <label_state>
    And the observed event is unlinked
    When the operator opens the observed event from the event feed
    Then the Flow step selector offers the valid outgoing steps from Cart
    And <next_step> is identified with <relationship_kind> and <display_name>
    And graph steps without an outgoing relationship from Cart are unavailable
    When the operator selects <next_step>
    Then live-102 is linked to that stable Flow step
    And <next_step> becomes the current Flow step for the next unlinked event

    Examples:
      | relationship_kind | next_step                    | label_state        | display_name                 |
      | expected_next     | Payment Page frame           | no label           | Cart to Payment              |
      | alternative       | Cart PayPal Event occurrence | label PayPal route | PayPal route                 |
      | merge             | Confirmation Page frame      | no label           | Cart to Confirmation         |

  # Data layer Live Flow guided testing 005
  Scenario Outline: Data layer Live Flow guided testing 005
    Given Checkout journey is the selected Flow test context
    And the next selectable graph target is <flow_step>
    When the operator links live-102 to <flow_step>
    Then ordinary event validation uses <effective_schema>
    And the validation result identifies <flow_step> rather than only its reusable definition
    And it records selection mode Manual Flow test without invoking the automatic assignment resolver

    Examples:
      | flow_step                         | effective_schema                                                                  |
      | Payment Page frame                | its Shared Profiles, ordered Page Groups, Page, and Flow Page-instance contribution |
      | Payment add_payment_info occurrence | its Page-instance branch, Event branch, and Event-occurrence contribution          |

  # Data layer Live Flow guided testing 006
  Scenario Outline: Data layer Live Flow guided testing 006
    Given Cart Page frame is the current Flow step
    And the observed event is unlinked
    And it was captured <capture_order> the event linked to Cart
    When the operator opens the observed event from the event feed
    Then the Flow step selector offers the valid outgoing steps from Cart
    And the operator may link the observed event without a chronological restriction
    And no feed row is disabled, hidden, reordered, or selected automatically for Flow testing

    Examples:
      | capture_order |
      | before        |
      | after         |

  # Data layer Live Flow guided testing 007
  Scenario: Data layer Live Flow guided testing 007
    Given event details for live-101 record Cart Page frame
    And traversal continued from live-102 through Payment Page frame
    And live-101 is under review
    When the operator opens the observed event from the event feed
    Then the recorded link identifies the stable Cart frame
    And its ordinary validation issues, provenance, and defect actions remain visible
    And the session traversal cursor remains Payment Page frame
    When the operator switches review to another event without a recorded Flow step
    Then its available Flow step identities equal Payment outgoing relationship targets rather than Cart targets

  # Data layer Live Flow guided testing 008
  Scenario Outline: Data layer Live Flow guided testing 008
    Given observed pageview event live-102 is linked to Payment Page frame by <link_evidence>
    And its observed /oForm/formStepName is "review" while the effective Flow-step expectation is "payment"
    When the operator reviews live-102 event details
    Then its ordinary validation presentation contains the Flow-step issue and linked Flow context
    And event details contain one ordinary Create defect report action for that validation
    And no separate Flow validation result or Flow-only defect action is added
    When the operator uses the ordinary Create defect report action
    Then the heading is "Defect report: Checkout journey · Payment · pageview"
    And the issue presents observed "review" separately from expected "payment" with rule EXPECTED_VALUE
    And expected-result assistance reads "Use Payment Flow-step expectation" and identifies its effective schema revision
    And no issue or assistance label describes the Flow-step expectation as generic or manually selected
    When the operator selects Use Payment Flow-step expectation
    Then the expected payload replaces /oForm/formStepName with typed string "payment"
    And its expected difference is one green replacement rather than an unchanged generic constraint
    And the green replacement retains the selected assistance as response provenance
    And the usual builder retains its observed payload, issue selection, report sections, and actions
    And report evidence contains stable Checkout journey, Payment, and live-102 identities, their event-to-step link, <displayed_link_evidence>, effective target, revision, and contributor provenance
    And saved and copied representations retain that correction and Flow evidence as a snapshot
    And the report describes pageview failing the linked Payment expectation without calling the Flow definition defective or claiming that Checkout journey failed or executed
    And saving or copying the report behaves the same as for automatic schema validation
    And the failed validation neither changes the linked path nor blocks valid outgoing Flow-step choices

    Examples:
      | link_evidence                | displayed_link_evidence |
      | relationship Cart to Payment | path Cart to Payment     |
      | initial selection at Payment | Started at Payment       |

  # Data layer Live Flow guided testing 009
  Scenario: Data layer Live Flow guided testing 009
    Given the operator linked Cart, page_view, Payment, and add_payment_info observed events along one valid relationship path
    When the Live session is saved and reopened
    Then the selected Checkout journey, current Flow step, event-to-step links, schema revisions, validation results, and defect references are restored
    And the existing event feed and event details remain the primary review surfaces
    And unchosen alternatives are identified as not tested
    And no result claims that Checkout journey passed or executed
    And project Assignments, canonical contributors, and Checkout journey remain byte-identical
