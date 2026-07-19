# mutation-stamp: sha256=2c7c366761966241ff048e71e890f3a815b8955cfb7c6ce79c963ed2a42796f0
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-18T12:33:43.275593697Z","feature_name":"Data layer named applicability","feature_path":"features/data-layer-named-applicability.feature","background_hash":"befba8efefdd72ed67aa9bd73bc5ff36e720d8019a2e5cf6ba41df55561bfe54","implementation_hash":"sha256:2fd7714f2aa3c7161a4e1c38bb1455cf7a1ba71a23cac2babedf2e22ffa830c2","scenarios":[{"index":2,"name":"Data layer named applicability 003","scenario_hash":"2f96670f96ba54c6cd578427fb76e27d8434cf03d9dff93999c0e9e1bcb1ae24","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:02.208449455Z"},{"index":3,"name":"Data layer named applicability 004","scenario_hash":"381af7e1dfe2d96586f13b776c15740ff5cc4c48cef36cc1817aacbd43822cc1","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:02.208449455Z"},{"index":5,"name":"Data layer named applicability 006","scenario_hash":"935d87e5993cbd2221f5e124a659d3ee6a5dd0271085dfef7a9b53d31b223e19","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:02.208449455Z"},{"index":7,"name":"Data layer named applicability 008","scenario_hash":"881469cef232ef4fc6a8e8172728668e84713e2f2a55fad85e3cf1d93d51aee2","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-18T01:03:02.208449455Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer named applicability

  Background:
    Given Shop data specification contains page Checkout confirmation and event Purchase
    And named applicability set Retail confirmation is being edited

  # Data layer named applicability 001
  Scenario: Data layer named applicability 001
    When matcher conditions are authored
    Then host supports exact, glob, and regular-expression matching
    And path supports exact, glob, regular expression, and named route templates
    And query, hash, SPA route variables, source, event, payload, raw input, flow state, and session variables are available
    And conditions compose in nested All, Any, and Not groups
    And include, exclude, and fallback behavior are explicit

  # Data layer named applicability 002
  Scenario: Data layer named applicability 002
    Given Retail confirmation matches purchase on shop.example.test/checkout/confirmation when current flow is Retail
    When its summary is displayed
    Then the plain-language summary states that complete applicability before its technical expression
    And named reusable condition sets and referenced entities are visible
    And Where used lists every page, event, profile, and flow step that references it

  # Data layer named applicability 003
  Scenario Outline: Data layer named applicability 003
    Given a payload condition path contains <entered_path>
    When inline matcher validation runs
    Then the field contains <field_value>
    And assistance is <assistance>
    And matcher save is <save_state>

    Examples:
      | entered_path       | field_value       | assistance                              | save_state |
      | funnel_id          | /funnel_id        | Normalized to canonical path /funnel_id | available  |
      | ecommerce..value   | ecommerce..value  | Remove the empty path segment at ..     | blocked    |
      | /items/*/sku       | /items/*/sku      | Wildcard applies to each items entry    | available  |

  # Data layer named applicability 004
  Scenario Outline: Data layer named applicability 004
    Given matcher test input is <test_input>
    When Retail confirmation is tested
    Then the result identifies <result_evidence>
    And no project state changes

    Examples:
      | test_input              | result_evidence                                      |
      | current page and event  | each matching and failing predicate                  |
      | pasted URL and event    | normalized context and predicate reasons             |
      | saved fixture           | expected and actual applicability                    |

  # Data layer named applicability 005
  Scenario: Data layer named applicability 005
    Given Retail confirmation, Trade confirmation, and Sitewide fallback are candidates
    When routing analysis evaluates one context
    Then every candidate shows predicate evidence, priority or specificity, and match state
    And the winner, ties, shadowed candidates, and fallback are explicit
    And row order and last-edit time never resolve a tie

  # Data layer named applicability 006
  Scenario Outline: Data layer named applicability 006
    Given applicability sets contain <overlap_kind>
    When static overlap analysis runs
    Then diagnostic outcome is <diagnostic>

    Examples:
      | overlap_kind                         | diagnostic                                      |
      | equal exact purchase contexts        | blocking tie                                    |
      | broader checkout glob over exact URL | exact winner and shadowed-glob warning          |
      | intersecting regular expressions     | overlap requiring fixture or operator resolution |
      | explicit fallback plus exact match   | exact winner and non-conflicting fallback       |

  # Data layer named applicability 007
  Scenario: Data layer named applicability 007
    Given a nested matcher has unsaved valid and invalid conditions
    When the operator cancels or matcher persistence fails
    Then the stored applicability set remains unchanged
    And no partial condition group remains
    And reopening restores the last durable draft with errors linked to their fields

  # Data layer named applicability 008
  Scenario Outline: Data layer named applicability 008
    Given matcher testing starts from <surface>
    When the operator builds nested logic and runs a test using only the keyboard
    Then focus follows visible group order and returns to the invoking control
    And result evidence is announced once without relying on color
    And <surface_outcome>

    Examples:
      | surface               | surface_outcome                                      |
      | 360 CSS px side panel | a full-height matcher sheet has one scroll owner     |
      | full-page workspace   | matcher, candidates, and inspector remain available |

  # Data layer named applicability 009
  Scenario: Data layer named applicability 009
    Given the durable matcher contains a route condition and a nested All group
    When the operator changes the route and adds a nested Not group in one matcher transaction
    Then one Undo restores the prior route and complete condition tree
    And one Redo reapplies the route and complete condition tree
    And candidate analysis always reflects the currently rendered transaction state

  # Data layer named applicability 010
  Scenario: Data layer named applicability 010
    Given Checkout confirmation Page and Purchase Event are shared by Retail and Trade
    When the operator saves either entity without contextual Applicability
    Then no Applicability Set is selected or invented
    And both entities remain available to every Flow and Assignment until explicitly scoped

  # Data layer named applicability 011
  Scenario Outline: Data layer named applicability 011
    Given a predicate requires a <reference_kind> reference
    When the operator selects <human_name>
    Then the selector continues to display <human_name> after Save and reload
    And the matcher persists and evaluates the selected stable reference
    Examples:
      | reference_kind | human_name |
      | Flow | Retail checkout |
      | Flow step | Retail confirmation |
      | Page | Checkout confirmation |
      | Event | Purchase |
      | Profile | Retail confirmation requirements |

  # Data layer named applicability 012
  Scenario Outline: Data layer named applicability 012
    Given the matcher editor offers <operator>
    When the operator tests the matcher before Save
    Then the production matcher returns predicate evidence for <matching_value>
    And static overlap analysis reports every equal-priority intersecting Applicability Set
    Examples:
      | operator | matching_value |
      | equals | purchase |
      | not equals | product_view |
      | exists | /ecommerce |
      | contains | checkout |
      | glob | /checkout/* |
      | regular expression | ^/checkout/confirmation$ |
