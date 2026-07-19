# mutation-stamp: sha256=d84a721b6a995b8a5025c50d740386d5797d2627b2631d0d2d951662a761230d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T12:42:30.190550972Z","feature_name":"Data layer guided assignment coverage runtime","feature_path":"features/data-layer-guided-assignment-coverage-runtime.feature","background_hash":"97494f7f7850bc3f0883b7cd1d8cf10b0a82386834d7fcfcf9b57470c7dfd6bf","implementation_hash":"sha256:eb9911e46c4103ed1d7cef2591909f69124a550ea12e59c1143976294dc424b8","scenarios":[{"index":0,"name":"Data layer guided assignment coverage runtime 001","scenario_hash":"49ea2574e3acb6a7bd05e55e708b62f8eebf967a72822a80f0ca8e37fdbb994a","mutation_count":7,"result":{"Total":7,"Killed":7,"Survived":0,"Errors":0},"tested_at":"2026-07-14T12:38:59.418086051Z"},{"index":1,"name":"Data layer guided assignment coverage runtime 002","scenario_hash":"78d3118a45362d2294a61f30759c5c4a35b77ec290c66c279fb148a8ece00ea1","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-14T12:38:59.418086051Z"},{"index":2,"name":"Data layer guided assignment coverage runtime 003","scenario_hash":"c75433a82365e2d36528b2fc5f7afb3ec8878c464a57b82a9fef738fdcbf816a","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-14T12:38:59.418086051Z"},{"index":3,"name":"Data layer guided assignment coverage runtime 004","scenario_hash":"ee390c1873de06a24bf904408bd95c2e74efe582009f97a1d56ec1d03cf5b42c","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-14T12:38:59.418086051Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer guided assignment coverage runtime

  Background:
    Given the built extension side panel is running with production guided validation and Schema Library persistence
    And captured event <event_name> from source <source_id> at <page_url> is open in the Live event inspector
    And assignment coverage uses enabled source, event, validation target, domain, pathname, and path conditions

  # Data layer guided assignment coverage runtime 001
  Scenario Outline: Data layer guided assignment coverage runtime 001
    Given no schema or assignment exists for <schema_name>
    When Add validation for <first_property> creates schema draft <schema_name>
    And the operator reviews and saves assignment <assignment_name> with the <first_property> rule
    Then the working draft contains <assignment_name> exactly once
    When Add validation saves rules for <later_properties> to the same working draft
    Then assignment configuration and assignment selection are not displayed
    And the working draft contains rules for <first_property> and <later_properties>
    And <assignment_name> remains the only assignment without changed identity or conditions

    Examples:
      | event_name     | source_id     | page_url                              | schema_name     | first_property | later_properties | assignment_name       |
      | order_complete | event-history | https://shop.example/orders/confirmed | Order completed | order_id       | currency, value  | confirmed orders      |

  # Data layer guided assignment coverage runtime 002
  Scenario Outline: Data layer guided assignment coverage runtime 002
    Given published schema <schema_name> has enabled assignment <assignment_name> covering <page_url> through <domain_condition> and <path_condition>
    When Add validation for <property_name> selects <schema_name>
    Then assignment configuration and assignment selection are not displayed
    And saving adds only the <property_name> rule to the schema working draft
    And assignment <assignment_name> retains its identity, conditions, priority, and version policy

    Examples:
      | event_name     | source_id     | page_url                              | schema_name     | assignment_name  | domain_condition | path_condition | property_name |
      | order_complete | event-history | https://shop.example/orders/confirmed | Order completed | shop order pages | *.example         | /orders/*      | order_id      |

  # Data layer guided assignment coverage runtime 003
  Scenario Outline: Data layer guided assignment coverage runtime 003
    Given schema <schema_name> has enabled assignment <existing_assignment> whose URL conditions do not cover <page_url>
    When Add validation for <property_name> selects <schema_name>
    Then new assignment configuration is displayed with captured source, event, target, domain, and pathname as editable defaults
    And no new assignment exists before the operator reviews and confirms it
    When assignment <new_assignment> and the <property_name> rule are saved
    Then <new_assignment> is added once as a pending schema assignment
    When Add validation saves a rule for <later_property> from the same event context
    Then assignment configuration and assignment selection are not displayed
    And <new_assignment> is reused from the working draft without creating another assignment

    Examples:
      | event_name     | source_id     | page_url                              | schema_name     | existing_assignment | property_name | later_property | new_assignment   |
      | order_complete | event-history | https://shop.example/orders/confirmed | Order completed | product pages       | order_id      | currency       | confirmed orders |

  # Data layer guided assignment coverage runtime 004
  Scenario Outline: Data layer guided assignment coverage runtime 004
    Given schema <schema_name> has <covering_assignment_count> enabled assignments that cover the captured event
    When Add validation for <property_name> continues in its working draft
    Then assignment configuration and assignment selection are not displayed
    And the property-rule flow can proceed to review and save
    And saving adds the <property_name> rule without changing assignment count <covering_assignment_count>
    And no duplicate assignment identity is created

    Examples:
      | event_name     | source_id     | page_url                              | schema_name     | covering_assignment_count | property_name |
      | order_complete | event-history | https://shop.example/orders/confirmed | Order completed | 2                         | currency      |
