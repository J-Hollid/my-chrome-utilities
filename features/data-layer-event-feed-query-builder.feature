# mutation-stamp: sha256=29ed7e85d1df1652bf5e9577cd77df96677186a44018ccd761c8b29c575235d8
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-13T18:49:33.643359196Z","feature_name":"Data layer event feed query builder","feature_path":"features/data-layer-event-feed-query-builder.feature","background_hash":"e4568838b94730a930845e29470edc01b8457b6bd9daf47ca723e29db76a6610","implementation_hash":"sha256:6fa9a3222c37bd8458e672adb48b4b3fb8cbc4a69f35dac2c91e8a1fb129446a","scenarios":[{"index":1,"name":"Data layer event feed query builder 002","scenario_hash":"b7aaf957beb94a7e707caf37e63d5be7cd12507a3bd70976476ee34f44ae5663","mutation_count":40,"result":{"Total":40,"Killed":40,"Survived":0,"Errors":0},"tested_at":"2026-07-13T14:18:05.987351514Z"},{"index":3,"name":"Data layer event feed query builder 004","scenario_hash":"e31648517aad934a45a6805b9cd40e767e29e6cc611f63abecfa120e93c219e3","mutation_count":5,"result":{"Total":5,"Killed":5,"Survived":0,"Errors":0},"tested_at":"2026-07-13T14:18:05.987351514Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer event feed query builder

  Background:
    Given a data layer testing session has captured events from multiple pathname visits
    And the Live event feed is displayed

  # Data layer event feed query builder 001
  Scenario: Data layer event feed query builder 001
    Given captured events differ by event name, source, adapter kind, pathname, and validation result
    When the operator activates Add filter
    Then one condition editor offers Field, Operator, and Value in that order
    And Event name, Source, Adapter kind, Pathname, Payload property, Validation state, Schema, Validation rule, Rule severity, and Affected property are available fields
    And individual observed payload paths are absent from the field list
    And an incomplete condition cannot be applied
    And the previous standalone validation-state filter is absent

  # Data layer event feed query builder 002
  Scenario Outline: Data layer event feed query builder 002
    Given captured events include one event matching <field> <operator> <value> and one event that does not match
    When the operator applies condition <field> <operator> <value>
    Then only the matching event is displayed in the feed
    And the active condition is shown as removable summary <summary>
    And the feed reports 1 of 2 events

    Examples:
      | field             | operator | value                    | summary                                          |
      | Event name        | is       | purchase                 | Event name is purchase                           |
      | Source            | is       | Adobe beacons            | Source is Adobe beacons                          |
      | Adapter kind      | is       | Adobe                    | Adapter kind is Adobe                            |
      | Pathname          | is       | /checkout                | Pathname is /checkout                            |
      | Payload · currency | is      | EUR                      | Payload · currency is EUR                        |
      | Validation state  | is       | Issues                   | Validation state is Issues                       |
      | Schema            | is       | Purchase event           | Schema is Purchase event                         |
      | Validation rule   | failed   | Page type allowed values | Validation rule Page type allowed values failed  |
      | Rule severity     | is       | warning                   | Rule severity is warning                         |
      | Affected property | is       | page_type                | Affected property is page_type                   |

  # Data layer event feed query builder 003
  Scenario: Data layer event feed query builder 003
    Given captured event names include page_view, product_view, and purchase
    When the operator selects Event name as the field
    Then distinct captured event names are available as searchable values
    And operators is, is not, contains, and does not contain are available
    And contains accepts a custom value not present in the captured event names

  # Data layer event feed query builder 004
  Scenario Outline: Data layer event feed query builder 004
    Given captured events include failed, warned, passed, and absent evaluations for rule Page type allowed values
    When Validation rule Page type allowed values is filtered by <outcome>
    Then only events satisfying rule criterion <outcome> are displayed

    Examples:
      | outcome       |
      | failed        |
      | warned        |
      | passed        |
      | was evaluated |
      | was not evaluated |

  # Data layer event feed query builder 005
  Scenario: Data layer event feed query builder 005
    Given captured values and configured validation metadata are available
    When the operator chooses a query field
    Then event names, sources, adapter kinds, and pathnames are suggested from the captured session
    And schemas, validation rules, severities, and affected properties are suggested from validation metadata
    And duplicate suggestions are shown once
    And Payload property opens a separate property-path selection stage

  # Data layer event feed query builder 006
  Scenario: Data layer event feed query builder 006
    Given active condition Event name is purchase
    When condition Validation state is Issues is applied
    Then only events matching both active conditions are displayed
    When purchase and checkout are selected within the Event name condition
    Then an event matches that condition when its name is purchase or checkout
    And the query summary distinguishes conditions matched by all from values matched by any

  # Data layer event feed query builder 007
  Scenario: Data layer event feed query builder 007
    Given multiple query conditions are active
    When one active condition is removed
    Then the remaining conditions are reapplied to the feed
    When the operator activates Clear all
    Then every captured event is visible again
    And the query builder returns to its compact empty state

  # Data layer event feed query builder 008
  Scenario: Data layer event feed query builder 008
    Given an active query has no matching captured events
    When the filtered feed is displayed
    Then it reports 0 of the total captured events
    And it explains that no events match the active filters
    And Clear all is available
    And it does not report that no events have been captured

  # Data layer event feed query builder 009
  Scenario: Data layer event feed query builder 009
    Given a query is active across the complete captured session
    When matching and nonmatching events are captured
    Then the matching event is added to the filtered feed
    And the nonmatching event does not appear in the filtered feed
    And event counts include the complete captured session rather than only the rendered window
    And pathname visit groups without matching events are absent

  # Data layer event feed query builder 010
  Scenario: Data layer event feed query builder 010
    Given query conditions and feed scroll position are active
    When the operator opens an event inspector and returns to the feed
    Then the query conditions remain active
    And the matching event count is unchanged
    And the previous feed scroll position is restored

  # Data layer event feed query builder 011
  Scenario: Data layer event feed query builder 011
    Given keyboard focus is on Add filter
    When the condition editor is opened and an Event name condition is applied
    Then focus moves through Field, Operator, Value, and Apply condition in that order
    And the applied condition has an accessible remove action
    And removing it returns focus to Add filter

  # Data layer event feed query builder 012
  Scenario: Data layer event feed query builder 012
    Given captured payloads contain currency, commerce.total, commerce.order.id, and user.status
    When the operator selects Payload property as the field
    Then a property-path stage replaces the operator and value controls
    And Search observed payload paths and Enter custom path are available
    And distinct observed paths are shown in a bounded scrollable result list
    And the top-level field choices are not repeated in the property-path stage
    When the operator searches observed payload paths for commerce
    Then commerce.total and commerce.order.id are displayed
    And currency and user.status are not displayed
    When the operator selects commerce.total
    Then selected field Payload · commerce.total is identified
    And the operator and value controls are displayed for commerce.total
    And observed values for commerce.total are suggested

  # Data layer event feed query builder 013
  Scenario: Data layer event feed query builder 013
    Given payload path commerce.coupon.code has not been observed
    When the operator chooses Enter custom path
    And enters commerce.coupon.code
    And activates Add property path
    Then selected field Payload · commerce.coupon.code is identified
    And operator and value controls are displayed without applying a condition
    And a blank custom path cannot be added
    When condition Payload · commerce.coupon.code is SUMMER is applied
    Then current events without that path do not match
    And a later captured event with commerce.coupon.code SUMMER matches

  # Data layer event feed query builder 014
  Scenario: Data layer event feed query builder 014
    Given the Payload property path stage is displayed
    When the operator activates Back to fields
    Then the field choices are displayed without an applied condition
    And keyboard focus returns to Payload property
    When the operator reopens the property-path stage
    Then keyboard focus moves to Search observed payload paths
    And each observed path result has its complete path as an accessible name
