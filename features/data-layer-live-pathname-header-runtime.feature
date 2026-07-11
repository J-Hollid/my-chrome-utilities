Feature: Data layer Live pathname header runtime completion

  Background:
    Given the built extension Live feed is running in a browser at 360 CSS px
    And pageview summary priority is page_name, page_type, page_category

  # Data layer Live pathname header runtime completion 001
  Scenario: Data layer Live pathname header runtime completion 001
    Given rendered pathname visits have these identities
      | visit      | pathname  | latest capture time | event count |
      | products-2 | /products | 10:04:00            | 1           |
      | checkout-1 | /checkout | 10:03:00            | 2           |
      | products-1 | /products | 10:01:00            | 2           |
    When the rendered visit-header elements are inspected
    Then every header visibly contains its pathname
    And every header visibly contains its latest capture time in a field labelled Latest
    And every header visibly contains its event count in a field labelled Events
    And no header consists of pathname text alone

  # Data layer Live pathname header runtime completion 002
  Scenario: Data layer Live pathname header runtime completion 002
    Given products-2 and products-1 are non-contiguous visits to /products
    When their rendered visit sections and headings are inspected
    Then products-2 and products-1 are separate visit-section elements
    And each section is associated with its own heading
    And each heading's accessible name contains /products, its latest capture time, and its event count
    And the different latest times and event counts distinguish the 2 accessible names

  # Data layer Live pathname header runtime completion 003
  Scenario: Data layer Live pathname header runtime completion 003
    Given a pathname visit header contains long pathname /products/field-notebook, latest time 10:04:00, and event count 12
    When its header and event-row rectangles are measured
    Then pathname, Latest, 10:04:00, Events, and 12 remain readable within the header rectangle
    And the header fields wrap without horizontal document scrolling or clipping
    And /products/field-notebook appears once in the visit header
    And the pathname is not visibly repeated in each event row

  # Data layer Live pathname header runtime completion 004
  Scenario: Data layer Live pathname header runtime completion 004
    Given these events were captured in chronological order
      | event id | pathname  | capture time | page_name    | page_type | page_category |
      | event-1  | /products | 10:00:00     | Products     | listing   | catalog       |
      | event-2  | /products | 10:01:00     | Products     | detail    | product       |
      | event-3  | /checkout | 10:02:00     | Checkout     | form      | conversion    |
      | event-4  | /products | 10:03:00     | empty string | detail    | product       |
    When completed visit headers and event rows are rendered
    Then visit sections remain headed by event-4, event-3, and event-2 in that order
    And event-2 remains before event-1 within their contiguous visit
    And event-4 displays Page type detail and Page category product in priority order
    And event-4 displays no third summary property

  # Data layer Live pathname header runtime completion 005
  Scenario: Data layer Live pathname header runtime completion 005
    When the automated pathname-header browser test is inspected
    Then it queries every rendered visit header rather than only the visit data model
    And it asserts visible pathname, labelled latest capture time, labelled event count, and accessible name
    And it asserts separate rendered sections for repeated pathname visits
    And it asserts 360 CSS px header bounds and absence of pathname text from event rows
    And it retains reverse-chronology and configured-summary assertions
