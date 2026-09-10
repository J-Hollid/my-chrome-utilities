# User-approved 2026-09-09: tealium-live.
# Tealium detection runtime 001 through 008; metadata follow-up approved 2026-09-10.
Feature: Tealium detection runtime

  Background:
    Given the built extension runs Tealium Live against controlled website fixtures
    And observations use the production page reader with external tracking requests blocked

  # Tealium detection runtime 001
  Scenario Outline: Tealium detection runtime 001
    Given the pinned real Tealium runtime is served unchanged using fixture <fixture>
    When the operator starts observation through Tealium Live
    Then the rendered inventory includes profile tealium.docs and UID 115
    And the actual runtime resource path is <path>
    And the registered tag is not reported as a successful send

    Examples:
      | fixture                  | path                                           |
      | custom publishing path   | /custom/utag.js?revision=original               |
      | first-party renamed file | /scripts/payload.js?revision=original           |

  # Tealium detection runtime 002
  Scenario: Tealium detection runtime 002
    Given the page has an early queue and a misleading tag-script filename
    When observation starts and the page later initializes its supported runtime
    Then actual rendered detection changes from Initializing to Detected
    And the next completed observation includes the late tag
    And the misleading file does not produce an invented tag row

  # Tealium detection runtime 003
  Scenario Outline: Tealium detection runtime 003
    Given executable tag fixture <fixture> is loaded in the selected page
    When the production reader completes an observation
    Then the rendered code state is <state>
    And fixture counters show zero observation-induced sends or tag loads

    Examples:
      | fixture                  | state           |
      | configured-only tag      | Configured      |
      | registered separate tag  | Code registered |
      | suppressed bundled tag   | Code registered |

  # Tealium detection runtime 004
  Scenario: Tealium detection runtime 004
    Given the website contains same-origin and cross-origin frames with equal tag UIDs
    And one cross-origin frame lacks an applicable access grant
    When the operator observes and then grants that frame origin
    Then frame access is exercised through Chrome rather than acceptance flags
    And Partial coverage changes only after a successful frame read
    And selecting each equal-UID row shows its own frame and profile
    And the selected website tab does not change

  # Tealium detection runtime 005
  Scenario: Tealium detection runtime 005
    Given one script request fails and another script registers tag code
    When browser request outcomes and rendered rows are inspected
    Then the failed request is not presented as successfully loaded or executed
    And the registered tag remains inspectable
    And requesting or loading a vendor resource is not triggered to complete the inventory

  # Tealium detection runtime 006
  Scenario: Tealium detection runtime 006
    Given the page has tracking-call counters, a consent sentinel, and a markup-like tag name
    And Data Layer is capturing from the same website
    When repeated Tealium observations update the installed view
    Then the tag name is visible text without executing markup
    And observation does not change tracking counters, consent state, or page configuration
    And Data Layer receives each controlled event once

  # Tealium detection runtime 007
  Scenario: Tealium detection runtime 007
    Given one frame has a recognized incompatible runtime and another has a supported runtime
    When the production reader inspects both frames
    Then the incompatible frame is reported as Unsupported runtime with incomplete coverage
    And supported-frame rows remain available
    And the diagnostic identifies the unsupported evidence without declaring an empty page inventory

  # Tealium detection runtime 008
  Scenario: Tealium detection runtime 008
    Given the pinned real runtime is served from a custom path without metadata access
    When the production reader observes it and the operator selects UID 115
    Then the installed inspector shows account tealium and profile docs
    And its publish identifier is 202504230113
    And its runtime key remains tealium.docs and its UID remains 115
    And unavailable metadata does not prevent source inspection
