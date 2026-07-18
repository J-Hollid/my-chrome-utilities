# mutation-stamp: sha256=481056354e590d7592b607baf4a863815a9fda57bfa25aa82e867815b3cd1a4f
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:44.154288671Z","feature_name":"Data layer truthful assignment lifecycle","feature_path":"features/data-layer-truthful-assignment-lifecycle.feature","background_hash":"bdbf8591a65a393d9ca24d758d61fcf277fcf7c44a839a30d75141f4b0550cc3","implementation_hash":"sha256:4bd34d604c47b39de99a1f30b09f496f3821179d7496272852a130b789f1b3fc","scenarios":[{"index":0,"name":"Data layer truthful assignment lifecycle 001","scenario_hash":"0fd839c4251b356eeeb768d7206deef31cef33c8d6f80b8f26bead5f79deea86","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:18.691621484Z"},{"index":2,"name":"Data layer truthful assignment lifecycle 003","scenario_hash":"69b16bf26867941e33ce582aac54c4b5b5cef9b35305d0285f537cee2a3ec1da","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:18.691621484Z"},{"index":4,"name":"Data layer truthful assignment lifecycle 005","scenario_hash":"5ac1a2fe7e3af09658af0908b493b128e6a5b7aa6344614e84cf0d06e7bc283c","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:18.691621484Z"}]}
# acceptance-mutation-manifest-end

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

  # Data layer truthful assignment lifecycle 008
  Scenario: Data layer truthful assignment lifecycle 008
    Given two named assignment rows are visible and schema-owned legacy assignment rows also exist
    When assignment compilation runs
    Then the 2 visible rows are the same 2 canonical records supplied to the compiler
    And each rendered field equals its compiled schema, event, applicability, priority, and version policy
    And no legacy row contributes a count, candidate, or Save target

  # Data layer truthful assignment lifecycle 009
  Scenario: Data layer truthful assignment lifecycle 009
    Given the operator selects Retail confirmation schema, Purchase, and Retail purchase context by name
    When the assignment is saved and reopened
    Then the same names are displayed and stable references are persisted
    And candidate preview explains the winning and rejected assignments before Save
    And the impact summary names the Production behavior and evidence made stale
