Feature: Data layer Flow cross-surface integration runtime

  Background:
    Given the built extension is running with installed Builder, side panel, and production project persistence
    And both installed surfaces have Shop project open

  # Data layer Flow cross-surface integration runtime 001
  Scenario: Data layer Flow cross-surface integration runtime 001
    Given production Schema Library contains Purchase contract revision 4
    When actual controls adopt it into shared Event Purchase
    Then production project storage contains one canonical adopted schema with source lineage
    And Builder and side panel render the same nested properties, rules, examples, table configuration, and Used by occurrences
    When an explicit synchronization is reviewed and saved
    Then only reviewed changes enter one new project revision

  # Data layer Flow cross-surface integration runtime 002
  Scenario: Data layer Flow cross-surface integration runtime 002
    When actual controls open Retail Purchase requirements and Assignment on both surfaces
    Then both render the same rich requirement capabilities and nested Applicability query tree
    When Builder saves Purchase description Order done from revision 24 as revision 25
    Then side panel subscription renders Order done at revision 25
    When side panel saves matcher route channel retail from revision 25 as revision 26
    Then Builder subscription renders that matcher at revision 26
    And no reduced schema table, embedded Assignment query copy, or whole-collection replacement participates

  # Data layer Flow cross-surface integration runtime 003
  Scenario: Data layer Flow cross-surface integration runtime 003
    Given production side panel renders captured Purchase issue enum at /ecommerce/currency
    When actual Open in Specification Flow navigation is invoked
    Then Builder opens the same project, occurrence, Assignment, schema revision, path, issue, and provenance
    When the requirement is changed through actual Builder controls
    Then side panel subscription refreshes the same canonical entity
    And the original result remains pinned to its recorded schema revision and displays Stale
    And an explicit rerun creates a new result for the changed schema revision
    And Back restores the captured Purchase selection and scroll context

  # Data layer Flow cross-surface integration runtime 004
  Scenario Outline: Data layer Flow cross-surface integration runtime 004
    Given Builder and side panel start at production project revision 24
    When actual <first_surface> saves <first_command> from revision 24 as revision 25
    And actual <second_surface> saves disjoint <second_command> from revision 24 as merged revision 26
    Then production revision 26 and both renderers contain both commands exactly once after reload

    Examples:
      | first_surface | first_command                       | second_surface | second_command                    |
      | Builder       | Parallel Shipping to Payment        | side panel     | Purchase description Order done  |
      | side panel    | Purchase description Order done     | Builder        | Parallel Shipping to Payment     |

  # Data layer Flow cross-surface integration runtime 005
  Scenario: Data layer Flow cross-surface integration runtime 005
    Given Builder and side panel start at production project revision 26
    When actual Builder saves Purchase currency GBP or EUR as revision 27
    And actual stale side panel submits Purchase currency USD from revision 26
    Then production conflict UI prevents silent overwrite
    And production revision 27 retains GBP or EUR, the Parallel relationship, and Purchase description Order done after reload
    And the newer Assignment and validation-result context remain intact
