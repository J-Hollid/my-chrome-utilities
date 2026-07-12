Feature: Data layer guided validation schema destination

  Background:
    Given a guided validation draft defines an allowed-values rule for property page_type

  # Data layer guided validation schema destination 001
  Scenario: Data layer guided validation schema destination 001
    When the schema destination stage is displayed
    Then the operator can choose Create a new schema or Add to an existing schema
    And no schema destination is selected without operator input
    And persistence remains unchanged before a destination is reviewed

  # Data layer guided validation schema destination 002
  Scenario Outline: Data layer guided validation schema destination 002
    Given Create a new schema is chosen
    When schema name <schema_name> is entered
    Then continuation result is <continuation_result>
    And schema-name assistance states <assistance>

    Examples:
      | schema_name          | continuation_result | assistance                                      |
      | Signal Shop pageview | allowed             | New schema Signal Shop pageview will be created |
      | blank                | blocked             | Enter a name for the new schema                 |
      | Existing pageview    | blocked             | Choose the existing schema or enter another name |

  # Data layer guided validation schema destination 003
  Scenario Outline: Data layer guided validation schema destination 003
    Given Add to an existing schema is chosen
    And schema <schema_name> has target <schema_target> and page_type state <property_state>
    When available schemas are displayed for payload property page_type with expected type String
    Then schema <schema_name> has availability <availability>
    And its compatibility explanation is <explanation>

    Examples:
      | schema_name          | schema_target | property_state | availability | explanation                              |
      | Generic pageview     | payload       | absent         | selectable   | page_type will be added                   |
      | Product listing      | payload       | String         | selectable   | page_type accepts String rules            |
      | Numeric page types   | payload       | Number         | unavailable  | page_type expects Number                  |
      | Raw pageview         | raw input     | absent         | unavailable  | schema validates raw input, not payload   |

  # Data layer guided validation schema destination 004
  Scenario Outline: Data layer guided validation schema destination 004
    Given existing schema Product listing version 3 is selected
    And matching assignment state is <assignment_state>
    When the validation review is displayed
    Then it identifies page_type as the rule attachment path
    And it states that Product listing version 4 will be created while version 3 remains unchanged
    And assignment action is <assignment_action>

    Examples:
      | assignment_state   | assignment_action                         |
      | matching exists    | reuse the matching enabled assignment     |
      | matching absent    | create the reviewed enabled assignment    |

  # Data layer guided validation schema destination 005
  Scenario Outline: Data layer guided validation schema destination 005
    Given the review has destination <schema_destination>
    When the operator activates Save validation and persistence completes
    Then the review and guided validation flow close
    And the originating Live event inspector is restored
    And a visible status confirms <saved_result>
    And keyboard focus returns to Create validation from this event

    Examples:
      | schema_destination          | saved_result                                      |
      | new Signal Shop pageview    | schema Signal Shop pageview was created           |
      | existing Product listing v3 | validation was added to Product listing version 4 |

  # Data layer guided validation schema destination 006
  Scenario: Data layer guided validation schema destination 006
    Given a saveable draft is at its final stage
    When persistence returns an error
    Then the review remains open with the entered draft intact
    And a specific error explains how to recover
    And no partial schema, rule, assignment, or revision is persisted
