Feature: Data layer nested event timeline

  Background:
    Given a repository for project <project_name>
    And a data layer testing session is active

  # Data layer nested event timeline 001
  Scenario Outline: Data layer nested event timeline 001
    Given captured pageloads <first_page_url> and <second_page_url> contain observed events <first_page_events> and <second_page_events> from <history_path>
    When the side panel renders the nested data layer timeline
    Then pageloads <first_page_url> and <second_page_url> are top-level items in capture order
    And observed events <first_page_events> and <second_page_events> are second-level items under their pageloads with observer path <history_path>

    Examples:
      | project_name         | history_path  | first_page_url                 | second_page_url                  | first_page_events | second_page_events   |
      | my-chrome-utilities | event.history | https://www.example.com/       | https://www.example.com/prodpage | pageview, scroll  | pageview, add to cart |

  # Data layer nested event timeline 002
  Scenario Outline: Data layer nested event timeline 002
    Given observed event <event_name> carries raw payload <payload_properties>
    When the side panel displays nested event details
    Then payload properties <payload_properties> are third-level items under observed event <event_name>
    And scalar payload values are displayed as quoted values

    Examples:
      | project_name         | event_name  | payload_properties                                                      |
      | my-chrome-utilities | pageview    | page_name: "example page_name", page_type: "homepage", propertyx: "example property" |
      | my-chrome-utilities | scroll      | scroll_percentage: "75"                                                |
      | my-chrome-utilities | add to cart | product_name: "example product"                                        |
