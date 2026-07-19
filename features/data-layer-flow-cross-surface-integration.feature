Feature: Data layer Flow cross-surface integration

  Background:
    Given Shop project is open in Builder and side panel
    And both surfaces subscribe to the same canonical project revision

  # Data layer Flow cross-surface integration 001
  Scenario: Data layer Flow cross-surface integration 001
    Given side-panel Schema Library contains saved schema Purchase contract revision 4
    When the operator adopts Purchase contract into shared Event Purchase by human name
    Then one project-owned schema revision retains Purchase contract revision 4 as source lineage
    And the shared Event and every occurrence use that canonical project schema
    And later library changes require a reviewed synchronization rather than silently changing the project
    And no parallel executable schema copy is created

  # Data layer Flow cross-surface integration 002
  Scenario: Data layer Flow cross-surface integration 002
    Given Retail Purchase requirements are opened from the graph
    When the operator continues to the complete requirement editor
    Then Builder exposes the same nested properties, typed rules, conditions, examples, descriptions, severity, table customization, Spreadsheet output, and Rich table output as the side panel
    And saving from either surface produces one command against the same requirement layer and base revision
    And returning to the graph preserves the selected occurrence and field

  # Data layer Flow cross-surface integration 003
  Scenario: Data layer Flow cross-surface integration 003
    Given Retail Purchase Assignment references named Applicability Set Retail confirmation
    When either surface edits nested All, Any, and Not groups over observable Page, URL, source, Event, target, payload, environment, and explicit session fields
    Then both surfaces show the same query tree, human-readable summary, priority, matcher test, and overlap result
    And saving produces one revisioned Applicability command while the Assignment retains its stable reference
    And no copied condition tree is embedded in the Assignment

  # Data layer Flow cross-surface integration 004
  Scenario: Data layer Flow cross-surface integration 004
    Given the side panel shows captured validation issue enum at /ecommerce/currency for Retail Purchase
    When the operator chooses Open in Specification Flow
    Then Builder opens the same project, occurrence, Assignment, effective schema revision, issue path, and provenance
    When the operator corrects the Retail requirement and saves
    Then the side panel refreshes from the canonical change
    And the original captured result remains pinned to its recorded schema revision and is labelled Stale
    And rerunning validation creates a new result against the changed schema revision
    And returning restores the same captured Event and validation context

  # Data layer Flow cross-surface integration 005
  Scenario Outline: Data layer Flow cross-surface integration 005
    Given Builder and side panel opened project revision 24
    When <first_surface> saves <first_command> from revision 24 as revision 25
    And <second_surface> saves disjoint <second_command> from revision 24 as merged revision 26
    Then revision 26 contains both commands exactly once
    And both surfaces refresh to revision 26 with the same canonical values

    Examples:
      | first_surface | first_command                       | second_surface | second_command                    |
      | Builder       | Parallel Shipping to Payment        | side panel     | Purchase description Order done  |
      | side panel    | Purchase description Order done     | Builder        | Parallel Shipping to Payment     |

  # Data layer Flow cross-surface integration 006
  Scenario: Data layer Flow cross-surface integration 006
    Given Builder and side panel opened project revision 26
    When Builder changes Purchase currency to GBP or EUR and saves revision 27
    And stale side panel changes Purchase currency to USD from revision 26
    Then the side-panel command requires visible resolution before Save
    And canonical revision 27 retains GBP or EUR
    And cancelling the stale command retains the Parallel relationship and Purchase description after reload
    And neither surface writes a whole schema or project collection over the newer revision
