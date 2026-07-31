Feature: Specification Studio guided test cases runtime

  Background:
    Given the built extension is running with production Specification Studio, durable project storage, and project evaluation
    And the built side panel is running with the production Event Library and Live validation records
    And production Test case assurance is advisory

  # Specification Studio guided test cases runtime 001
  Scenario: Specification Studio guided test cases runtime 001
    When the actual project navigation and selected evidence workspace render
    Then visible collection text is Test cases rather than Fixtures
    And visible guidance defines a Test case as saved input plus reviewed expectations rerunnable against the current Draft
    And no separate raw Fixture mode, Context, Ordered observations, Payload, Expected winner, or Release policy editor is rendered

  # Specification Studio guided test cases runtime 002
  Scenario Outline: Specification Studio guided test cases runtime 002
    When the operator creates production <test_type> through its actual control
    Then rendered guidance states <purpose>
    And creation requires <scope>
    And Save and run invokes <evaluation>

    Examples:
      | test_type             | purpose                                         | scope                            | evaluation                                      |
      | Page context test     | Page Group applicability and Page validation    | one production Page              | production Page effective-schema evaluation     |
      | Event validation test | Assignment routing and Event validation          | one production Event and optional Page | production Assignment and schema evaluation |

  # Specification Studio guided test cases runtime 003
  Scenario: Specification Studio guided test cases runtime 003
    Given production Flows expose documentary behavior only
    When actual Test case type choices render
    Then no Journey test creation control is enabled
    And the explanation identifies executable Flow behavior as unavailable
    And no production multi-observation control or Flow result is synthesized

  # Specification Studio guided test cases runtime 004
  Scenario Outline: Specification Studio guided test cases runtime 004
    Given the operator enters through production <source>
    When the destination Test case draft is inspected
    Then persisted source input contains <copied_input>
    And persisted provenance identifies the exact source and revision
    And editing the source afterward leaves Test case bytes unchanged

    Examples:
      | source                         | copied_input                                                                  |
      | manual creation                | one empty schema-assisted input model                                         |
      | saved Event Library template   | saved Event identity, destination, typed payload, and schema attachment       |
      | captured Live validation       | observed Event, context, payload, evaluation identity, and proposed assertions |

  # Specification Studio guided test cases runtime 005
  Scenario: Specification Studio guided test cases runtime 005
    Given the production Event Library stores Purchase confirmation with an attached schema and typed payload
    And two production Specification Projects are available
    When the operator activates Create Test case on that Library row
    Then the side panel renders project, matching Event, and input-guidance schema review controls
    And confirmation writes one Event validation Test case to only the chosen project
    And Specification Studio opens that stable Test case route
    And missing mappings expose actual create, adopt, or select repair controls rather than guessed identities
    And repository inspection finds the Event Library template unchanged

  # Specification Studio guided test cases runtime 006
  Scenario: Specification Studio guided test cases runtime 006
    Given the selected production scope resolves one effective input-guidance schema
    When the actual input builder renders
    Then its controls correspond to the schema revision's complete property tree
    And visible or accessible metadata exposes each property's path, type, required state, constraints, description, example, and origin when present
    And every required property has a rendered input while declared optional properties are available through an add control
    And completing the primary workflow requires no whole-document JSON textarea

  # Specification Studio guided test cases runtime 007
  Scenario Outline: Specification Studio guided test cases runtime 007
    Given the production input schema contains <property_shape>
    When the actual property control stores <entered_value>
    Then persisted Test case input contains <stored_value>
    And runtime type inspection reports <json_type>
    And an incompatible value blocks Save and run at that control

    Examples:
      | property_shape                   | entered_value          | stored_value           | json_type |
      | allowed strings retail and trade | trade                  | trade                  | string    |
      | number from 1 through 10         | 7                      | 7                      | number    |
      | boolean                          | false                  | false                  | boolean   |
      | nested order object              | order id A-1           | nested order id A-1    | object    |
      | array of product objects         | product ids 1 and 2    | two ordered products   | array     |
      | nullable campaign                | null                   | null                   | null      |

  # Specification Studio guided test cases runtime 008
  Scenario: Specification Studio guided test cases runtime 008
    Given production conditional constraints depend on input market
    And one object permits additional properties while another is closed
    When the operator changes market and adds properties through actual controls
    Then conditional required controls, choices, and explanations refresh from the effective schema
    And existing values remain in the rendered and persisted draft
    And newly invalid values receive associated validation messages without coercion or deletion
    And only the open object offers guided property-name, value-type, and typed-value controls
    And the closed object offers no undeclared-property path

  # Specification Studio guided test cases runtime 009
  Scenario: Specification Studio guided test cases runtime 009
    Given a production Event has Retail and Trade effective-schema candidates
    And an Event Library attachment proposes Retail
    When the operator reviews and selects Retail for input guidance
    Then rendered assistance identifies Retail contributor, Event, applicability, and revision
    And the persisted selection is marked as authoring guidance rather than expected or actual outcome
    When production input satisfies Trade applicability and Save and run executes
    Then the actual evaluator can select Trade
    And expected Assignment remains a separate reviewed control

  # Specification Studio guided test cases runtime 010
  Scenario: Specification Studio guided test cases runtime 010
    Given the selected production Event has no eligible input-guidance schema
    When the actual input step opens
    Then guidance identifies the exact missing Event, Assignment, contributor, or schema relationship
    And its repair control routes to the corresponding production workspace
    And no unexplained JSON textarea is present
    When the relationship is repaired and the operator returns
    Then the prior Test case name, type, source, and scope are restored

  # Specification Studio guided test cases runtime 011
  Scenario: Specification Studio guided test cases runtime 011
    Given the operator changes a rendered Test case property without a prior save
    When the actual Save and run control is activated
    Then the durable command stores that exact visible structured input before evaluator invocation
    And the explicit persisted Test case type selects the production evaluator
    And adding a Page to an Event validation Test case does not invoke Page context evaluation
    When durable save or compilation is faulted
    Then evaluator invocation count is zero and the unsaved editable input plus direct repair remain available

  # Specification Studio guided test cases runtime 012
  Scenario Outline: Specification Studio guided test cases runtime 012
    Given a production <test_type> has one actual result
    When rendered expectation controls are inspected
    Then they offer <assertions>
    And no expectation is committed until an explicit selection or Use actual as expected action
    And Ready remains unavailable until at least one assertion is durably reviewed

    Examples:
      | test_type             | assertions                                                                  |
      | Page context test     | applicable Page Groups, validation outcome, and issue paths and codes       |
      | Event validation test | winning Assignment or no Assignment, validation outcome, and issue paths and codes |

  # Specification Studio guided test cases runtime 013
  Scenario: Specification Studio guided test cases runtime 013
    Given a production Event validation Test case expects Required at /order_id
    When actual evaluation reports Required at /order_id
    Then rendered Observed outcome is Invalid
    And rendered Test comparison is Matched
    And expected and actual issue code and path are paired
    And no failed-Test styling, status, or announcement is derived only from the Invalid observed outcome

  # Specification Studio guided test cases runtime 014
  Scenario Outline: Specification Studio guided test cases runtime 014
    Given a production Test case has <condition>
    When actual status derivation and rendering run
    Then persisted and rendered status is <status>
    And rendered status evidence is <runtime_evidence>

    Examples:
      | condition                                      | status     | runtime_evidence                                          |
      | no input or no reviewed assertion              | Blocked    | focus reaches the first incomplete guided control          |
      | actual values equal every reviewed expectation | Matched    | actual and expected result bytes are retained               |
      | one actual value differs                       | Mismatched | a field-level difference links to its repair control        |
      | recorded evaluator revision is superseded      | Stale      | rerun is enabled and prior result bytes remain visible      |

  # Specification Studio guided test cases runtime 015
  Scenario: Specification Studio guided test cases runtime 015
    Given production project evidence contains Blocked, Mismatched, and Stale Test cases
    When actual preflight and publication review controls run
    Then every corresponding diagnostic is rendered in Warnings
    And Test case diagnostics contribute zero to the blocking count
    And publication controls remain enabled when canonical and effective schemas have no validation blocker
    And no persisted per-Test-case release policy is read to change that result

  # Specification Studio guided test cases runtime 016
  Scenario: Specification Studio guided test cases runtime 016
    Given the production guided Test case workflow is rendered at desktop width, 360 CSS pixels, and 200 percent browser zoom
    When source, scope, input, run, expectation, and review are completed using actual keyboard controls
    Then current-step, completion, constraint, validation, and primary-action elements remain visible
    And accessibility inspection resolves names, descriptions, and error associations for nested properties and typed choices
    And unsuccessful actions focus the first incomplete or invalid control
    And measured horizontal document overflow is zero
    And the workflow exposes no required raw identifier, pointer-only action, or color-only state
