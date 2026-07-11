Feature: Data layer event feed summaries

  Background:
    Given a repository for project my-chrome-utilities
    And Event feed summaries contains this configuration
      | source id     | event name | priority paths                         |
      | event-history | pageview   | page_name, page_type, page_category    |
      | event-history | offer      | offer_action, offer_id                 |

  # Data layer event feed summaries 001
  Scenario: Data layer event feed summaries 001
    When Event feed summaries settings are displayed
    Then each entry is scoped to one observation source id and event name
    And each entry presents its property paths in priority order
    And summary paths can be added, reordered, edited, and removed without editing source code

  # Data layer event feed summaries 002
  Scenario Outline: Data layer event feed summaries 002
    Given the pageview entry has priority paths page_name, page_type
    When the operator performs configuration action <configuration_action>
    Then the pageview priority paths become <expected_paths>
    And the offer entry remains offer_action, offer_id
    And the changed configuration persists locally with data layer settings after the side panel reloads

    Examples:
      | configuration_action              | expected_paths                      |
      | add page_category last             | page_name, page_type, page_category |
      | move page_type before page_name    | page_type, page_name                |
      | edit page_name to content_name     | content_name, page_type             |
      | remove page_type                   | page_name                           |

  # Data layer event feed summaries 003
  Scenario Outline: Data layer event feed summaries 003
    Given <event_shape> event <event_name> from event-history has normalized payload <payload>
    When feed summary properties are resolved
    Then the summary displays <visible_summaries> in configured priority order
    And no more than 2 property-value pairs are displayed

    Examples:
      | event_shape | event_name | payload                                                            | visible_summaries                         |
      | tuple       | pageview   | page_name="", page_type="landing", page_category="Home"          | Page type=landing, Page category=Home     |
      | object      | offer      | offer_action="shown", offer_id=0, campaign="summer"               | Offer action=shown, Offer id=0            |

  # Data layer event feed summaries 004
  Scenario Outline: Data layer event feed summaries 004
    Given a configured property resolves to <resolved_value>
    When summary value usability is evaluated
    Then the resolved value is <usability>

    Examples:
      | resolved_value  | usability |
      | null            | unusable  |
      | undefined       | unusable  |
      | empty string    | unusable  |
      | empty array     | unusable  |
      | empty object    | unusable  |
      | numeric 0       | usable    |
      | boolean false   | usable    |
      | non-empty array | usable    |
      | non-empty object | usable   |

  # Data layer event feed summaries 005
  Scenario: Data layer event feed summaries 005
    Given every configured path for a captured event resolves to an unusable value
    When the event row is displayed
    Then the summary area is omitted
    And no empty summary placeholder is displayed
    And no unconfigured payload property is selected as a fallback

  # Data layer event feed summaries 006
  Scenario: Data layer event feed summaries 006
    Given configured path commerce.transaction_id resolves to order-42
    When the event row is displayed
    Then the visible summary label is Transaction id
    And the complete path commerce.transaction_id is available to assistive technology
    And event details identify commerce.transaction_id as the summary source

  # Data layer event feed summaries 007
  Scenario: Data layer event feed summaries 007
    Given event purchase at 10:03:00 from source Event history has validation Valid in pathname visit /checkout
    And visible summaries are Transaction id order-42 and Revenue 49.95
    When the event row is displayed
    Then the row shows purchase, 10:03:00, Event history, Valid, and the 2 visible summaries
    And the row is one keyboard-focusable control
    And its accessible name contains purchase, 10:03:00, Event history, /checkout, Valid, Transaction id order-42, and Revenue 49.95
