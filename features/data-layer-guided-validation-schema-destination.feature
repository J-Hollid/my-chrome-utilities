# mutation-stamp: sha256=1eb5599b66dc345bea47e1bd40074fcddbaac71794d33270db49b2d800cbc12d
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T00:19:56.525736911Z","feature_name":"Data layer guided validation schema destination","feature_path":"features/data-layer-guided-validation-schema-destination.feature","background_hash":"1c705ecd88577ad7fefbe938884b2096cc91984b491d5830e380dc34b7c353f3","implementation_hash":"sha256:2ef87cbac0e0958c0095bf2132023cc7912d3d57c09a0a259d0e63a9d8dac1f9","scenarios":[{"index":2,"name":"Data layer guided validation schema destination 003","scenario_hash":"6f795d7e02619149ed2430e48bf852e4f021a5b24b223b9b9bac79b0b4e1706e","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-14T00:19:56.525736911Z"},{"index":4,"name":"Data layer guided validation schema destination 005","scenario_hash":"3ec83f46365ff1029e3e045543cb2d3906a7d60e23096df6fedf6cf65bfca9d9","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T22:35:48.740788306Z"},{"index":3,"name":"Data layer guided validation schema destination 004","scenario_hash":"5abd91dd324a8ea2ae4d3ced70b2967e53b675bf42bfa20ec037dc2c92b0d29d","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-13T21:05:40.189716615Z"},{"index":1,"name":"Data layer guided validation schema destination 002","scenario_hash":"74a67f7b0ad4a8f9b2e15ea3646452d6ffe51da37fcc5106b6fc109cfa9c23fa","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-12T21:45:00.277335245Z"},{"index":7,"name":"Data layer guided validation schema destination 008","scenario_hash":"fb7a43ef76840a7466a8b89512d96cc3de3d0ddc7fc3e445f3f3466e96618ea0","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-12T21:45:00.277335245Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer guided validation schema destination

  Background:
    Given Add validation started from payload property page_type

  # Data layer guided validation schema destination 001
  Scenario: Data layer guided validation schema destination 001
    Given no working-draft continuation context is selected
    When the guided validation flow opens
    Then the schema destination stage is displayed before requirement and scope
    And the operator can choose Create a new schema or Add to an existing schema
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
    When available schemas are displayed in the schema-picker dialog for payload property page_type with expected type String
    Then schema <schema_name> has availability <availability>
    And its compatibility explanation is <explanation>

    Examples:
      | schema_name          | schema_target | property_state | availability | explanation                              |
      | Existing pageview    | payload       | absent         | selectable   | page_type will be added                   |
      | Product listing      | payload       | String         | selectable   | page_type accepts String rules            |
      | Numeric page types   | payload       | Number         | unavailable  | page_type expects Number                  |
      | Raw pageview         | raw input     | absent         | unavailable  | schema validates raw input, not payload   |

  # Data layer guided validation schema destination 004
  Scenario Outline: Data layer guided validation schema destination 004
    Given the destination targets existing Product listing version 3
    And the draft defines an allowed-values rule for page_type
    And assignment coverage for the captured event is <assignment_coverage>
    When the validation review is displayed
    Then it identifies page_type as the rule attachment path
    And it states that the rule will be added to the Product listing working draft based on version 3
    And Product listing version 3 remains current until the working draft is published
    And no Product listing version 4 exists before publication
    And assignment action is <assignment_action>

    Examples:
      | assignment_coverage                                  | assignment_action                              |
      | an enabled published assignment covers the event     | reuse the covering assignment                  |
      | an enabled working-draft assignment covers the event | reuse the covering pending assignment          |
      | no enabled published or pending assignment covers it | add the reviewed assignment as a pending change |

  # Data layer guided validation schema destination 005
  Scenario Outline: Data layer guided validation schema destination 005
    Given the review has destination <schema_destination>
    When the operator activates Add validation to draft and persistence completes
    Then the review and guided validation flow close
    And the originating Live event inspector is restored
    And a visible status confirms <saved_result>
    And keyboard focus returns to Add validation for page_type

    Examples:
      | schema_destination          | saved_result                                      |
      | new Signal Shop pageview    | draft Signal Shop pageview was created            |
      | existing Product listing v3 | validation was added to Product listing draft     |

  # Data layer guided validation schema destination 006
  Scenario: Data layer guided validation schema destination 006
    Given a saveable draft is at its final stage
    When persistence returns an error
    Then the review remains open with the entered draft intact
    And a specific error explains how to recover
    And no partial schema, rule, assignment, or revision is persisted

  # Data layer guided validation schema destination 007
  Scenario: Data layer guided validation schema destination 007
    Given the destination choice has accepted Generic pageview version 4
    And one enabled assignment covers the captured event
    When the requirement stage is displayed
    Then page_type expected type is prefilled from Generic pageview version 4
    And validation target is prefilled from the schema
    And event source, event name, domain, and path conditions are prefilled from the compatible assignment
    And every prefilled value identifies Generic pageview version 4 or its assignment as its source
    And the operator can change each prefilled value before review

  # Data layer guided validation schema destination 008
  Scenario Outline: Data layer guided validation schema destination 008
    Given the selected schema has assignment state <assignment_state>
    When assignment coverage is evaluated for the captured event
    Then assignment configuration is <configuration_visibility>
    And assignment action is <assignment_action>
    And property-rule creation is <continuation_result>

    Examples:
      | assignment_state                                            | configuration_visibility | assignment_action                              | continuation_result                 |
      | no assignments                                               | displayed                | add a reviewed pending assignment              | allowed after assignment review     |
      | one enabled assignment covers source, event, target, and URL | not displayed            | reuse the covering assignment                  | allowed without assignment review   |
      | two enabled assignments cover the captured event             | not displayed            | reuse existing schema coverage                 | allowed without assignment selection |
      | source, event, and target match but URL conditions do not     | displayed                | add a reviewed pending assignment              | allowed after assignment review     |
      | only a disabled assignment covers the captured event          | displayed                | add a reviewed pending assignment              | allowed after assignment review     |

  # Data layer guided validation schema destination 009
  Scenario: Data layer guided validation schema destination 009
    Given the operator has changed a schema-derived scope value
    When a different schema destination or assignment is selected
    Then the changed value is not silently overwritten
    And a review identifies each value that would be replaced
    And the operator can keep current values or accept the new schema-derived values
