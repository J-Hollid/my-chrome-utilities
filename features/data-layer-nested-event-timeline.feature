# mutation-stamp: sha256=377f511736f0bec6a5c683e56955ec2c489b0716287478b4ae61acea0d9cb00c
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-09T20:35:42.683334426Z","feature_name":"Data layer nested event timeline","feature_path":"features/data-layer-nested-event-timeline.feature","background_hash":"1ed406330c33164448b1b64f5e6411da604de2b6e19e02c7feda7ced47da0b2d","implementation_hash":"sha256:9397f0894d98a67955ee9b37613cc11fcc080c41999a213a6748fee1c007c554","scenarios":[{"index":0,"name":"Data layer nested event timeline 001","scenario_hash":"a92fe0adfd38696fb4f84434261f80b2014c4e3b373f6966873edc9f564212b3","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-09T20:35:31.833610645Z"},{"index":1,"name":"Data layer nested event timeline 002","scenario_hash":"40c085d3ae7cf0bae1bf2d699ffbc86a3d9864d5caefc12fc98b898fe554ad11","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-09T20:35:31.833610645Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer nested event timeline

  Background:
    Given a repository for project <project_name>
    And the project skeleton is inspected
    And package metadata identifies the project as <project_name>
    And a data layer testing session is active

  # Data layer nested event timeline 001
  Scenario Outline: Data layer nested event timeline 001
    Given captured pageloads <first_page_url> and <second_page_url> contain observed events <first_page_events> and <second_page_events> from <history_path>
    When the side panel renders the nested data layer timeline
    Then pageloads <first_page_url> and <second_page_url> are top-level items in capture order
    And observed events <first_page_events> and <second_page_events> are second-level items under their pageloads with observer path <history_path>
    And the nested timeline uses the canonical pageload order
    And the nested timeline uses canonical observed event groups
    And nested observed events use the canonical observer path

    Examples:
      | project_name         | history_path  | first_page_url                 | second_page_url                  | first_page_events | second_page_events   |
      | my-chrome-utilities | event.history | https://www.example.com/       | https://www.example.com/prodpage | pageview, scroll  | pageview, add to cart |

  # Data layer nested event timeline 002
  Scenario Outline: Data layer nested event timeline 002
    Given observed event <event_name> carries raw payload <payload_properties>
    When the side panel displays nested event details
    Then payload properties <payload_properties> are third-level items under observed event <event_name>
    And payload properties match the canonical <event_name> payload
    And scalar payload values are displayed as quoted values

    Examples:
      | project_name         | event_name  | payload_properties                                                      |
      | my-chrome-utilities | pageview    | page_name: "example page_name", page_type: "homepage", propertyx: "example property" |
      | my-chrome-utilities | scroll      | scroll_percentage: "75"                                                |
      | my-chrome-utilities | add to cart | product_name: "example product"                                        |
