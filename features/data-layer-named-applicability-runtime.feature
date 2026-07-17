Feature: Data layer named applicability runtime

  Background:
    Given the built extension is running with production applicability editor, resolver, analyzer, persistence, and side-panel tester
    And Retail confirmation is linked to Checkout confirmation and Purchase

  # Data layer named applicability runtime 001
  Scenario: Data layer named applicability runtime 001
    When nested host, path, query, hash, event, payload, and flow-state conditions are saved through actual controls
    Then production storage retains the complete All, Any, and Not tree
    And reload renders the same plain-language summary and technical expression
    And actual resolution evaluates every retained predicate

  # Data layer named applicability runtime 002
  Scenario Outline: Data layer named applicability runtime 002
    Given the actual matcher field contains <entered_path>
    When production normalization and validation run
    Then the rendered field reports <field_result>
    And focus remains at the exact invalid segment when blocked

    Examples:
      | entered_path       | field_result                              |
      | funnel_id          | canonical /funnel_id and ready             |
      | ecommerce..value   | inline empty-segment error                  |

  # Data layer named applicability runtime 003
  Scenario: Data layer named applicability runtime 003
    Given three production applicability candidates include a winner, tie, shadowed matcher, and fallback across test contexts
    When current context, pasted context, and fixture tests run through production resolution callbacks
    Then the actual DOM renders all candidates and their predicate evidence
    And winner, tie, shadowed, fallback, and non-match states agree with resolver output
    And project storage remains byte-for-byte unchanged

  # Data layer named applicability runtime 004
  Scenario: Data layer named applicability runtime 004
    Given wildcard and regular-expression scopes overlap without identical configuration
    When production static analysis runs
    Then the rendered diagnostic identifies the intersecting scope and affected entities
    And its deep link opens the exact matcher field

  # Data layer named applicability runtime 005
  Scenario Outline: Data layer named applicability runtime 005
    Given the actual matcher surface is <surface>
    When nested logic and candidate testing are completed using only the keyboard
    Then computed layout has <layout_mode>, one scroll owner, contained focus, and no horizontal page overflow
    And result status is announced and does not depend on color

    Examples:
      | surface             | layout_mode                       |
      | 360 CSS px          | full-height side-panel sheet      |
      | full extension page | workspace with contextual inspector |

  # Data layer named applicability runtime 006
  Scenario: Data layer named applicability runtime 006
    Given production storage contains a durable route condition and nested matcher tree
    When the operator changes both through actual controls, selects Undo, and selects Redo
    Then production storage, rendered summary, and candidate evidence return to the exact prior matcher after Undo
    And they return to the complete edited matcher after Redo
    And no partial condition group is persisted between transactions
