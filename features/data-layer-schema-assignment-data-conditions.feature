# mutation-stamp: sha256=d76b3b0003eb4c14992c1c192104ed6fb0e2d8dbfa4d46316ca875d554926dd4
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T10:54:08.705479561Z","feature_name":"Data layer schema assignment data conditions","feature_path":"features/data-layer-schema-assignment-data-conditions.feature","background_hash":"8454364fd65eeca67f709c5c0313bcdadc5c3f082ff7707344a9acf9d13f74ee","implementation_hash":"d7379854c194fe12500194b627adba06aa84f489d85b2466d461f71da67ecfe5","scenarios":[{"index":1,"name":"Data layer schema assignment data conditions 002","scenario_hash":"fc8bb4eef1ce662655ce054de507ae06d1847e5b3e7f76baa028c179c3beb24b","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:08.705479561Z"},{"index":2,"name":"Data layer schema assignment data conditions 003","scenario_hash":"291a2d2a83e3ff774bf320a0b99b79eaa6a5bfb4e7bdf04e452cd9d1932f7aca","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:08.705479561Z"},{"index":3,"name":"Data layer schema assignment data conditions 004","scenario_hash":"ad318326caeee6d6fdcf9af054c1ceca7b8e87188ea12472bbfbbc4fb44d1e0b","mutation_count":44,"result":{"Total":44,"Killed":44,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:08.705479561Z"},{"index":4,"name":"Data layer schema assignment data conditions 005","scenario_hash":"336676597fcc67b242d1cf229365bb01a0820a4c13440dade29ed250eba53c83","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:08.705479561Z"},{"index":7,"name":"Data layer schema assignment data conditions 008","scenario_hash":"626519d43ce14916efb29615572693cb997bd1ab36473c8f8b47f300b004c06a","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:08.705479561Z"},{"index":9,"name":"Data layer schema assignment data conditions 010","scenario_hash":"719062d2abbd66ec671da181243077f599aecbdaa7f9319020ba964a93ef0562","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:08.705479561Z"},{"index":10,"name":"Data layer schema assignment data conditions 011","scenario_hash":"5596a276856e8a45a9a6aebb20c6741f8ee2069337bb71b34d460246a0591c7a","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T10:54:08.705479561Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema assignment data conditions

  Background:
    Given Legacy generic event and Current generic event are published schemas
    And each has an enabled assignment for event-history event generic_event
    And Legacy generic event uses camelCase properties while Current generic event uses snake_case properties

  # Data layer schema assignment data conditions 001
  Scenario: Data layer schema assignment data conditions 001
    When the operator creates or edits an assignment
    Then Data layer conditions are available alongside source, event name, target, URL conditions, priority, schema, version policy, and enabled state
    And the operator can choose payload or raw input as the condition target
    And condition target defaults to the assignment validation target
    And one All or Any group can contain typed property predicates
    And no condition group means the assignment is unrestricted by event data
    And a present group with no predicates cannot be saved

  # Data layer schema assignment data conditions 002
  Scenario Outline: Data layer schema assignment data conditions 002
    Given Legacy assignment matches Any Exists /errorType, /siteStructure, or /siteArea
    And Current assignment matches Any Exists /error_type, /page_levels, or /site_section
    When generic_event contains <property_family>
    Then selected assignment is <selected_assignment>
    And validation schema is <selected_schema>

    Examples:
      | property_family                                | selected_assignment | selected_schema        |
      | errorType                                      | Legacy assignment   | Legacy generic event   |
      | siteStructure and siteArea                     | Legacy assignment   | Legacy generic event   |
      | error_type                                     | Current assignment  | Current generic event  |
      | page_levels and site_section                   | Current assignment  | Current generic event  |
      | none of the configured discriminator properties | no assignment      | no schema              |

  # Data layer schema assignment data conditions 003
  Scenario Outline: Data layer schema assignment data conditions 003
    Given predicate results are <first_result> and <second_result>
    When assignment group operator is <group_operator>
    Then data condition result is <condition_result>

    Examples:
      | first_result | second_result | group_operator | condition_result |
      | match        | match         | All            | match            |
      | match        | no match      | All            | no match         |
      | match        | no match      | Any            | match            |
      | no match     | no match      | Any            | no match         |

  # Data layer schema assignment data conditions 004
  Scenario Outline: Data layer schema assignment data conditions 004
    Given assignment predicate uses <operator> with <configured_value>
    When observed property state is <observed_state>
    Then predicate result is <predicate_result>

    Examples:
      | operator          | configured_value        | observed_state               | predicate_result |
      | Exists            | none                    | string legacy                | match            |
      | Exists            | none                    | missing                      | no match         |
      | Does not exist    | none                    | missing                      | match            |
      | Does not exist    | none                    | null present                 | no match         |
      | Equals            | string legacy           | string legacy                | match            |
      | Equals            | number 1                | string 1                     | no match         |
      | Does not equal    | string current          | string legacy                | match            |
      | Is one of         | strings legacy,current  | string current               | match            |
      | Matches pattern   | ^legacy-                | string legacy-page           | match            |
      | Is at least       | number 10               | number 12                    | match            |
      | Is less than      | number 10               | missing                      | no match         |

  # Data layer schema assignment data conditions 005
  Scenario Outline: Data layer schema assignment data conditions 005
    Given predicate path is <property_path>
    And captured payload is <payload_shape>
    When the assignment predicate is evaluated
    Then path result is <path_result>

    Examples:
      | property_path       | payload_shape                                  | path_result                          |
      | /context/siteArea   | context object with siteArea legacy            | one existing string legacy           |
      | /products/*/type    | two products with types legacy and current     | two concrete values in capture order |
      | /products/*/type    | empty products array                           | no concrete value                    |
      | /a~1b               | property a/b exists                            | one existing property a/b            |
      | /tilde~0name        | property tilde~name exists                     | one existing property tilde~name     |

  # Data layer schema assignment data conditions 006
  Scenario: Data layer schema assignment data conditions 006
    Given wildcard predicate /products/*/type Equals legacy is evaluated
    When one of several concrete product types equals legacy
    Then the predicate matches
    When wildcard predicate /products/*/type Does not exist is evaluated
    Then it matches only when no concrete product type exists
    And wildcard evaluation does not flatten arrays or change captured data

  # Data layer schema assignment data conditions 007
  Scenario: Data layer schema assignment data conditions 007
    Given assignment candidates have source, event-name, URL, and data conditions
    When automatic assignment resolves
    Then all configured source, event-name, URL, and data gates must match before priority is considered
    And the one matching candidate with highest numeric priority is selected
    And condition specificity, schema order, edit time, and array order do not override priority
    And an unrestricted lower-priority assignment can act as fallback when specialized data conditions do not match

  # Data layer schema assignment data conditions 008
  Scenario Outline: Data layer schema assignment data conditions 008
    Given both Legacy and Current assignments match an event containing both property families
    When their priorities are <priority_relationship>
    Then resolution outcome is <resolution_outcome>
    And diagnostic outcome is <diagnostic_outcome>

    Examples:
      | priority_relationship         | resolution_outcome              | diagnostic_outcome                         |
      | Legacy higher than Current    | Legacy assignment selected      | both matches and priority decision retained |
      | Current higher than Legacy    | Current assignment selected     | both matches and priority decision retained |
      | equal highest priority        | no schema selected              | Assignment error identifies both matches    |

  # Data layer schema assignment data conditions 009
  Scenario: Data layer schema assignment data conditions 009
    Given no assignment is selected for a captured event
    When assignment diagnostics are reviewed
    Then each candidate identifies source, event-name, domain, pathname, and data-condition results
    And every predicate identifies path, operator, configured typed value, observed existence or value, and match result
    And a selected assignment record retains the same evaluated-condition evidence
    And failed assignment predicates do not appear as validation issues

  # Data layer schema assignment data conditions 010
  Scenario Outline: Data layer schema assignment data conditions 010
    Given an assignment validates payload but its condition target is <condition_target>
    And payload property /variant is current while raw-input property /variant is legacy
    When /variant Equals legacy is evaluated
    Then assignment data result is <data_result>

    Examples:
      | condition_target | data_result |
      | payload          | no match    |
      | raw input        | match       |

  # Data layer schema assignment data conditions 011
  Scenario Outline: Data layer schema assignment data conditions 011
    Given assignment condition configuration has <invalid_state>
    When the operator attempts to save it
    Then saving is blocked with <assistance>

    Examples:
      | invalid_state                         | assistance                                  |
      | empty condition group                 | Add at least one condition                  |
      | blank property path                   | Choose a condition property                 |
      | comparison missing                    | Enter a comparison value                    |
      | number operator on string property    | Choose an operator compatible with string   |
      | invalid regular expression            | Correct the regular expression              |
      | invalid canonical property path       | Correct the condition property path         |

  # Data layer schema assignment data conditions 012
  Scenario: Data layer schema assignment data conditions 012
    Given the operator chooses Create assignment from a captured legacy event
    When Data layer conditions are added
    Then captured paths, detected types, observed values, and compatible operators are suggested
    And choosing /errorType Exists creates a reviewed draft predicate
    And no condition or assignment becomes active before save and ordinary assignment review
    And a property not declared by the selected schema may be used with a warning rather than an invented declaration

  # Data layer schema assignment data conditions 013
  Scenario: Data layer schema assignment data conditions 013
    Given an assignment contains data conditions
    When it is duplicated, disabled, enabled, exported, imported, persisted, revised, pinned, or set to follow latest
    Then its condition target, group operator, typed predicates, priority, and diagnostics remain associated with that assignment
    And the Assignments subview displays a readable condition target, All or Any operator, and predicate summary
    And duplicate and import do not share mutable predicate state
    And version policy continues to control the selected schema revision after assignment matching

  # Data layer schema assignment data conditions 014
  Scenario: Data layer schema assignment data conditions 014
    Given an archived generic_event was captured with legacy payload, raw input, and page URL
    And the active browser page now contains current properties
    When the archived event is automatically or manually revalidated
    Then assignment conditions use only the archived event data and captured URL
    And the active page, current target, and later event data are ignored
    And validation records the exact assignment and schema revision selected during revalidation

  # Data layer schema assignment data conditions 015
  Scenario: Data layer schema assignment data conditions 015
    Given captured payload, raw input, schemas, assignments, and condition evidence have been recorded
    When assignments are matched, diagnosed, displayed, persisted, or revalidated
    Then none of those source records is mutated
    And a nonmatching assignment remains a routing decision rather than a schema validation failure
