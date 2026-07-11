Feature: Data layer schema validation workflow

  Background:
    Given schema assignment resolution and Schema Library persistence are available

  # Data layer schema validation workflow 001
  Scenario Outline: Data layer schema validation workflow 001
    Given matching schema <schema_name> version <schema_version> targets <validation_target>
    When event <event_name> is captured with automatic validation enabled
    Then validation evaluates <validation_target> without mutating the event
    And the event records schema <schema_name> version <schema_version>, assignment, target, validation time, and result

    Examples:
      | schema_name            | schema_version | validation_target | event_name |
      | Generic page view      | 4              | payload           | page_view  |
      | Event history envelope | 2              | raw input         | purchase   |

  # Data layer schema validation workflow 002
  Scenario Outline: Data layer schema validation workflow 002
    Given validation produces <error_count> errors and <warning_count> warnings
    When validation state is displayed
    Then state is <validation_state>
    And visible text rather than color alone identifies the state
    And error and warning counts remain separately available

    Examples:
      | error_count | warning_count | validation_state |
      | 0           | 0             | Valid            |
      | 0           | 2             | 2 warnings       |
      | 2           | 1             | 2 issues         |

  # Data layer schema validation workflow 003
  Scenario: Data layer schema validation workflow 003
    Given validation found page_type internal, missing order_id, and forbidden property debug
    When validation details are opened
    Then each issue presents property path, rule name and version, message, expected constraint, actual value, severity, schema origin, and schema location
    And selecting an issue reveals complete values without losing list position
    And inherited issues identify their parent schema while local exceptions remain distinguishable

  # Data layer schema validation workflow 004
  Scenario: Data layer schema validation workflow 004
    Given captured event event-7 has no matching automatic assignment or manual attachment
    When validation availability is displayed
    Then state is Not checked
    And Select schema is available from the event inspector
    And the event is not described as valid or invalid

  # Data layer schema validation workflow 005
  Scenario: Data layer schema validation workflow 005
    Given template Order confirmation has an attached schema version and editable draft
    When identity, destination, or payload draft changes
    Then validation refreshes against the effective schema without saving
    And property issues appear beside affected nested property paths
    And the editor summary identifies schema version, assignment source, and issue counts
    And validation never mutates or discards the draft

  # Data layer schema validation workflow 006
  Scenario: Data layer schema validation workflow 006
    Given a valid JSON template draft has schema errors or warnings
    When Save revision or Push draft review opens
    Then decision data identifies schema, exact version, and validation state
    And the review lists current schema issues separately from draft-change differences
    And the operator may explicitly continue despite schema issues
    And invalid JSON remains a blocking editor error

  # Data layer schema validation workflow 007
  Scenario: Data layer schema validation workflow 007
    Given saved session Checkout journey records event-7 validation against Generic page view version 4
    And Generic page view version 5 is now available
    When the operator reviews the saved session
    Then its original validation result remains pinned to version 4
    When the operator explicitly requests revalidation with version 5
    Then a separate validation record compares version 4 and version 5 results
    And the historical result is not overwritten

  # Data layer schema validation workflow 008
  Scenario: Data layer schema validation workflow 008
    Given effective schema rules contain enabled, disabled inherited, re-enabled, and local rules
    When validation runs
    Then only effective enabled rules execute
    And disabled inherited rules remain visible in schema explanation but produce no issue
    And rule execution order does not change the validation result

  # Data layer schema validation workflow 009
  Scenario: Data layer schema validation workflow 009
    Given Live and Library contain Valid, Warnings, Issues, Not checked, and Assignment error states
    When the operator filters or reviews validation summaries
    Then each state can be filtered independently
    And summary counts use the same state definitions in Live, Library, Sessions, and Schemas
    And selecting a count reveals the events or templates contributing to it

  # Data layer schema validation workflow 010
  Scenario: Data layer schema validation workflow 010
    When the automated schema workflow browser suite is inspected
    Then it creates, edits, versions, reloads, exports, and imports schemas through interface actions
    And it attaches property, nested, general, reusable, inherited, disabled, and re-enabled rules
    And it resolves generic and pathname-specific assignments by priority
    And it validates actual Live events and Library drafts through rendered schema controls
    And it does not substitute direct model calls for the end-to-end workflows
