# mutation-stamp: sha256=d71c82a590e66467394bda6a5b638140fe576a7fbf02a760f632eb38b3226495
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T01:03:53.697276115Z","feature_name":"Data layer truthful assignment lifecycle runtime","feature_path":"features/data-layer-truthful-assignment-lifecycle-runtime.feature","background_hash":"42250919095f3104bd74fb76493367fe068744e376ce26c44c4a94994492ab02","implementation_hash":"sha256:9b1c7a7c3fa85a0fb0f217ebf663a7f40a50d4f8882edc7234ede6366d5d15f4","scenarios":[{"index":0,"name":"Data layer truthful assignment lifecycle runtime 001","scenario_hash":"79d6d021667243f78fe44ceb1b46a1d0d815dbec85dd4bd90882629010f34af4","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:53.697276115Z"},{"index":3,"name":"Data layer truthful assignment lifecycle runtime 004","scenario_hash":"4734495beb7c05e179794716306077f777ff6ef32755da254ca4f460fea191c5","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:53.697276115Z"}]}
# acceptance-mutation-manifest-end

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
