# mutation-stamp: sha256=214641fbd6f5a18fc548c77012905a05f53bab435639b808d716e6e7f482fbb7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-23T13:54:25.473238528Z","feature_name":"Data layer Live Flow guided testing","feature_path":"features/data-layer-live-flow-guided-testing.feature","background_hash":"5609233c5b54974dfd9370699b10d9d794cb8ba25a6668d48f61f22b990d761f","implementation_hash":"sha256:fd6e61db293d66b1d08d1116893eb092ecc143dc4154691854ed963940b26c32","scenarios":[{"index":3,"name":"Data layer Live Flow guided testing 004","scenario_hash":"08e09970925aac94bd9d6482e785383e4eb86189038ff2fd1fb09643a8d64ecf","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-23T13:54:25.473238528Z"},{"index":4,"name":"Data layer Live Flow guided testing 005","scenario_hash":"e98683e708cbcfd2c047c4358e129d5b4816faf97f8cf1f456378e38d27e19b4","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-23T13:54:25.473238528Z"},{"index":5,"name":"Data layer Live Flow guided testing 006","scenario_hash":"c303f5b1b7c31f911e31fa2b14c2de18cd6dedf302c87eb213f7342a7f0afce2","mutation_count":2,"result":{"Total":2,"Killed":2,"Survived":0,"Errors":0},"tested_at":"2026-07-23T13:54:25.473238528Z"}]}
# acceptance-mutation-manifest-end

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
  Scenario: Data layer Live Flow guided testing 008
    Given live-102 is linked to Payment add_payment_info occurrence
    And its observed payload fails the occurrence effective schema
    When the operator reviews live-102 event details
    Then the usual validation presentation highlights every property issue
    And the usual defect report builder contains the observed payload, issues, effective target, revision, and provenance
    And Flow-test context adds Checkout journey, Payment add_payment_info, and the linked path
    And saving or copying the report behaves the same as for automatic schema validation
    And the failed validation neither changes the linked path nor blocks valid outgoing Flow-step choices

  # Data layer Live Flow guided testing 009
  Scenario: Data layer Live Flow guided testing 009
    Given the operator linked Cart, page_view, Payment, and add_payment_info observed events along one valid relationship path
    When the Live session is saved and reopened
    Then the selected Checkout journey, current Flow step, event-to-step links, schema revisions, validation results, and defect references are restored
    And the existing event feed and event details remain the primary review surfaces
    And unchosen alternatives are identified as not tested
    And no result claims that Checkout journey passed or executed
    And project Assignments, canonical contributors, and Checkout journey remain byte-identical
