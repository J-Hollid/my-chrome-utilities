Feature: Data layer temporal flow authoring runtime

  Background:
    Given the built extension is running with production flow editor, temporal evaluator, persistence, and validation systems
    And Retail checkout and Trade checkout share Purchase at /checkout/confirmation

  # Data layer temporal flow authoring runtime 001
  Scenario: Data layer temporal flow authoring runtime 001
    When Product, optional Upsell, Checkout, and Confirmation are authored through the actual structured editor
    Then production storage retains order, occurrence bounds, branch, join, transitions, page, event, and profile references
    And reload renders the same accessible step sequence
    And no canvas interaction is required

  # Data layer temporal flow authoring runtime 002
  Scenario Outline: Data layer temporal flow authoring runtime 002
    Given production prior-step state identifies <flow_name>
    And the final purchase event has no funnel marker
    When the production temporal evaluator receives /checkout/confirmation
    Then selected step is <selected_step>
    And effective overlay is <effective_overlay>

    Examples:
      | flow_name        | selected_step        | effective_overlay                         |
      | Retail checkout  | Retail confirmation  | Retail confirmation without Trade account |
      | Trade checkout   | Trade confirmation   | Trade account and Purchase order           |

  # Data layer temporal flow authoring runtime 003
  Scenario: Data layer temporal flow authoring runtime 003
    Given two production flow instances match the same final event equally
    When temporal resolution runs
    Then no step is selected automatically
    And the actual side panel renders both candidates and ambiguity evidence
    And row order, last update, and arbitrary profile precedence do not break the tie

  # Data layer temporal flow authoring runtime 004
  Scenario: Data layer temporal flow authoring runtime 004
    Given a tab-scoped instance has matched Product and Checkout
    When same-tab navigation, extension reload, crash recovery, explicit exit, and timeout are exercised
    Then production flow state survives navigation, reload, and recovery
    And explicit exit and timeout close the instance
    And other tabs do not acquire that flow state

  # Data layer temporal flow authoring runtime 005
  Scenario: Data layer temporal flow authoring runtime 005
    Given a structured flow draft has unsaved-to-release branch and transition edits
    When keyboard authoring, Undo, Redo, reload, and side-panel deep linking are exercised
    Then production draft bytes, rendered order, selected step, focus, and scroll restore correctly
    And Undo and Redo each move the complete branch-and-transition transaction
    And the side panel opens the same flow and step in the full workspace

  # Data layer temporal flow authoring runtime 006
  Scenario: Data layer temporal flow authoring runtime 006
    Given temporal validation is disabled in the production environment settings
    When actual flow, coverage, and side-panel inspection surfaces render
    Then each surface labels the flow Organizational only
    And no DOM status or accessibility announcement claims a current step, successful traversal, passed transition, or validated journey
    And the stored authored flow remains available for documentation export
