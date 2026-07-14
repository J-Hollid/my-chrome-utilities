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
