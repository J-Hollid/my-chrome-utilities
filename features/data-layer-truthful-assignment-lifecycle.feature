Feature: Data layer truthful assignment lifecycle

  Background:
    Given Sitewide page context revision 2 and Purchase revision 3 are published
    And the Assignments view is displayed

  # Data layer truthful assignment lifecycle 001
  Scenario Outline: Data layer truthful assignment lifecycle 001
    Given assignments contain <saved_assignments>
    When the operator searches for <query>
    Then the visible rows are <visible_rows>
    And the displayed count is <visible_count>
    And the empty state is <empty_state>
    And conflict state is derived only from the visible saved assignments

    Examples:
      | saved_assignments          | query    | visible_rows        | visible_count | empty_state |
      | none                       | purchase | none                | 0             | visible     |
      | Retail, Trade, Sitewide    | retail   | Retail              | 1             | absent      |
      | Retail, Trade, Sitewide    | purchase | Retail, Trade       | 2             | absent      |
      | Retail, Trade, Sitewide    | missing  | none                | 0             | visible     |

  # Data layer truthful assignment lifecycle 002
  Scenario: Data layer truthful assignment lifecycle 002
    Given Retail and Trade target the same schema and event with different applicability
    When both assignments are saved
    Then each receives a stable unique identity independent of schema and event text
    And editing names, matchers, priorities, or schema references does not change either identity
    And duplicate creates a third unique identity

  # Data layer truthful assignment lifecycle 003
  Scenario Outline: Data layer truthful assignment lifecycle 003
    Given an assignment selects Purchase revision 3 with version policy <version_policy>
    When the assignment is saved and reopened
    Then its displayed schema reference is <schema_reference>
    And the actual resolved revision is recorded with validation evidence

    Examples:
      | version_policy | schema_reference          |
      | pinned         | Purchase revision 3       |
      | follow latest  | Purchase latest revision  |

  # Data layer truthful assignment lifecycle 004
  Scenario: Data layer truthful assignment lifecycle 004
    Given Retail has nested All, Any, and Not path conditions and unedited URL and event fields
    When the operator changes its priority in the assignment editor
    Then the working draft retains every structured condition and unedited field
    And the current published assignment remains unchanged before project publication
    And canceling restores the complete pre-edit assignment

  # Data layer truthful assignment lifecycle 005
  Scenario Outline: Data layer truthful assignment lifecycle 005
    Given the operator enters condition path <entered_path>
    When field validation runs
    Then the field contains <normalized_path>
    And assistance is <assistance>
    And save availability is <save_state>

    Examples:
      | entered_path       | normalized_path | assistance                              | save_state |
      | funnel_id          | /funnel_id      | Normalized to canonical path /funnel_id | available  |
      | ecommerce..value   | ecommerce..value | Remove the empty path segment at ..     | blocked    |

  # Data layer truthful assignment lifecycle 006
  Scenario: Data layer truthful assignment lifecycle 006
    Given Retail and Trade are equal-priority candidates for the same context
    When assignment resolution is displayed
    Then the count, rows, and conflict identify exactly Retail and Trade
    And no winner is selected by row order or last edit
    And resolving the conflict updates rows, count, empty state, and conflict state together

  # Data layer truthful assignment lifecycle 007
  Scenario: Data layer truthful assignment lifecycle 007
    Given legacy storage contains blank publication-created placeholders and valid assignments
    When assignment compatibility migration runs
    Then placeholders with no operator-authored routing data are excluded from active assignments
    And valid assignments retain stable references and behavior
    And cleanup review distinguishes removed placeholders from retained assignments
