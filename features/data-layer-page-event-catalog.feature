Feature: Data layer page and event catalog

  Background:
    Given Shop data specification is open in Specification Builder

  # Data layer page and event catalog 001
  Scenario Outline: Data layer page and event catalog 001
    Given no captured traffic exists
    When the operator creates <entity_kind> named <entity_name>
    Then it receives one stable project identity
    And it is searchable and independently documentable
    And creation does not require a schema assignment or captured event

    Examples:
      | entity_kind      | entity_name              |
      | page definition  | Checkout confirmation    |
      | page group       | Checkout pages           |
      | event definition | Purchase                  |

  # Data layer page and event catalog 002
  Scenario: Data layer page and event catalog 002
    Given page Checkout confirmation references applicability Checkout confirmation routes
    And event Purchase references source event-history, name purchase, and target payload
    When their definitions are inspected
    Then page identity, route context, expected events, and profiles are separate from event semantics and profiles
    And both reference named applicability rather than anonymous assignment fields
    And neither definition owns a copied requirement profile

  # Data layer page and event catalog 003
  Scenario: Data layer page and event catalog 003
    Given page group Checkout pages contains Cart, Checkout details, and Checkout confirmation
    When Shared checkout context is linked to the page group
    Then every member composes the group profile through one stable reference
    And page-specific profiles and applicability remain distinct
    And Where used identifies the page group relationship from either direction

  # Data layer page and event catalog 004
  Scenario: Data layer page and event catalog 004
    Given Purchase is used by Retail and Trade flow steps, fixtures, and one release
    When the operator requests to delete Purchase
    Then deletion review identifies every dependant
    And unresolved flow, fixture, or release references block deletion
    And replacing the event reference updates all selected draft dependants atomically

  # Data layer page and event catalog 005
  Scenario: Data layer page and event catalog 005
    Given legacy schemas and assignments describe page_view and purchase contexts
    When the compatibility project is migrated
    Then named page and event candidates preserve source, event, target, URL, schema, and version behavior
    And ambiguous legacy contexts remain explicit migration issues
    And validation remains available through the compatibility path before migration is committed

  # Data layer page and event catalog 006
  Scenario: Data layer page and event catalog 006
    Given pages and events have unequal profiles, applicability, issue counts, and usage
    When their catalog rows are navigated with the keyboard
    Then each compact row identifies kind, name, applicability, profiles, issues, and usage without punctuation-concatenated prose
    And editing controls appear only for the selected row
    And focus, selection, and status are conveyed without color alone
