Feature: Data layer Live Flow guided testing

  Background:
    Given Retail website is the active project
    And Live is capturing observed data-layer events
    And Checkout journey contains connected Page frames and Event occurrences

  # Data layer Live Flow guided testing 001
  Scenario: Data layer Live Flow guided testing 001
    When the operator opens Flow test in Live
    Then the Flow selector lists only Retail website Flows by human name
    And guidance explains that the operator chooses graph steps and observed events manually without automatic assignment
    And no Flow is selected from another project, storage order, or prior Live session
    When there is no active project
    Then Flow test requires Open project or Create project without inventing project context

  # Data layer Live Flow guided testing 002
  Scenario: Data layer Live Flow guided testing 002
    Given Checkout journey has root Page Cart and later repeated Page instances Confirmation A and Confirmation B
    When Checkout journey becomes the run's Flow
    Then the start selector lists every Page frame with its Page, lane, and stable frame identity
    And Cart is identified as a recommended root while later Pages remain available for a partial-path test
    And Confirmation A and Confirmation B remain distinct choices
    And Event occurrences cannot be chosen as the initial Page

  # Data layer Live Flow guided testing 003
  Scenario: Data layer Live Flow guided testing 003
    Given Cart is the selected start Page and no Assignment targets Cart
    When live-101 is confirmed as the start-step observation
    Then Manual Flow test validation runs without invoking the automatic assignment resolver
    And it uses Cart Flow Page-instance effective schema from its Shared Profiles, ordered Page Groups, Page, and instance override
    And the result records Checkout journey, Cart frame, live-101, effective schema revision, issues, and provenance
    And no Assignment, contributor, Flow, or observed-event payload is created or changed
    And any automatic result on live-101 remains separate and unchanged

  # Data layer Live Flow guided testing 004
  Scenario: Data layer Live Flow guided testing 004
    Given Cart page_view Event occurrence is the selected next step
    When occurrence validation is requested with live-102
    Then validation uses the occurrence effective schema combining the Cart Page-instance branch, page_view Event branch, and occurrence override
    And the result identifies the Event occurrence rather than only the reusable Event or containing Page
    And the same property issue presentation used by automatic validation appears in the feed and inspector
    And no automatic assignment winner is claimed

  # Data layer Live Flow guided testing 005
  Scenario Outline: Data layer Live Flow guided testing 005
    Given the current graph step has an outgoing <relationship_kind> relationship to <next_step>
    And the relationship has <label_state>
    When the current observed event has been matched and validated
    Then <next_step> is offered as a valid next step with <relationship_kind> and <display_name>
    When the operator confirms the offered target
    Then the Live feed offers matching observed events for that Page or Event step
    And unrelated graph nodes are disabled with No relationship from current step

    Examples:
      | relationship_kind | next_step                       | label_state         | display_name                                  |
      | expected_next     | Payment Page                    | no label            | Cart to Payment                              |
      | alternative       | Cart PayPal Event occurrence    | label PayPal route  | PayPal route                                 |
      | merge             | Confirmation Page               | no label            | Cart PayPal to Confirmation                  |

  # Data layer Live Flow guided testing 006
  Scenario Outline: Data layer Live Flow guided testing 006
    Given live-102 is the last matched event in the Flow test
    And matching is requested for <step_kind> step <step_name>
    When matching candidates are presented from the Live feed
    Then only unmatched events captured after live-102 are eligible
    And candidate guidance uses <matching_evidence> without selecting an event automatically
    And earlier, already matched, and incompatible rows remain visible with their ineligible reason
    When the operator confirms live-103
    Then live-103 is matched once to <step_name> and cannot be reused later in the same run

    Examples:
      | step_kind | step_name                 | matching_evidence                         |
      | Page      | Payment                   | observed Page context evidence            |
      | Event     | Payment add_payment_info  | Event identity and observation source     |

  # Data layer Live Flow guided testing 007
  Scenario: Data layer Live Flow guided testing 007
    Given live-103 fails the selected Payment step effective schema
    When Manual Flow test validation completes
    Then the usual validation issue actions offer the standard defect report builder
    And the report contains the observed payload, property issues, effective target and revision, provenance, Flow, selected step, matched path, and capture times
    And saving or copying the report behaves the same as for automatic schema validation
    And the failed step remains in run history while valid relationship-guided next steps remain selectable

  # Data layer Live Flow guided testing 008
  Scenario: Data layer Live Flow guided testing 008
    Given the operator has matched Cart, page_view, Payment, and add_payment_info along one valid relationship path
    When add_payment_info has no selected outgoing relationship and the operator completes the test
    Then the Live session stores an ordered run summary with each graph step, relationship, observed event, schema revision, validation status, and defect reference
    And the result is labelled Completed selected path rather than Flow passed
    And unchosen alternatives are identified as not tested
    And reopening the saved Live session restores the run summary without resuming capture or automatic matching
    And project Assignments, canonical contributors, and Checkout journey remain byte-identical
