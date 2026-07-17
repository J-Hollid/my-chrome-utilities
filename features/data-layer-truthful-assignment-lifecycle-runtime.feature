Feature: Data layer truthful assignment lifecycle runtime

  Background:
    Given the built extension is running with production assignment editor, resolver, persistence, and schema publication systems
    And the actual Assignments DOM is displayed

  # Data layer truthful assignment lifecycle runtime 001
  Scenario Outline: Data layer truthful assignment lifecycle runtime 001
    Given production storage contains assignments <stored_rows>
    When the operator enters search query <query> through the actual DOM
    Then rendered assignment names are <rendered_rows>
    And rendered count is <count>
    And rendered empty state is <empty_state>

    Examples:
      | stored_rows             | query    | rendered_rows  | count | empty_state |
      | none                    | retail   | none           | 0     | visible     |
      | Retail, Trade, Sitewide | retail   | Retail         | 1     | absent      |
      | Retail, Trade, Sitewide | purchase | Retail, Trade  | 2     | absent      |

  # Data layer truthful assignment lifecycle runtime 002
  Scenario: Data layer truthful assignment lifecycle runtime 002
    When two same-schema same-event assignments are created through rendered controls
    Then production storage contains two unequal stable IDs
    And a pinned assignment contains and renders its actual pinned revision
    And reload preserves both identities and version policies

  # Data layer truthful assignment lifecycle runtime 003
  Scenario: Data layer truthful assignment lifecycle runtime 003
    Given a stored assignment contains nested structured path conditions and unrelated matcher fields
    When the operator edits only priority and saves through the actual DOM
    Then production draft storage changes only priority
    And published storage remains byte-for-byte unchanged before release
    And serialization and reload preserve the structured conditions

  # Data layer truthful assignment lifecycle runtime 004
  Scenario Outline: Data layer truthful assignment lifecycle runtime 004
    Given the actual condition-path field contains <entered_path>
    When rendered field validation runs
    Then the field and inline assistance report <field_outcome>
    And keyboard focus remains at the exact failing segment when save is blocked

    Examples:
      | entered_path      | field_outcome                                      |
      | funnel_id         | canonical /funnel_id and ready                     |
      | ecommerce..value  | empty segment error and actionable correction      |

  # Data layer truthful assignment lifecycle runtime 005
  Scenario: Data layer truthful assignment lifecycle runtime 005
    Given production storage contains two equal highest-priority matches
    When resolution, search, conflict repair, and reload run through production callbacks
    Then the actual DOM derives count, rows, empty state, and conflict from one filtered collection
    And no blank placeholder assignment is rendered or resolved
