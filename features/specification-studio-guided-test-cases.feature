# mutation-stamp: sha256=70eef78fa0d0aca7343b1058f73192cd20bd0d4247ca83cf2c9aaa064ac80ebf
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-31T10:25:10.973265139Z","feature_name":"Specification Studio guided test cases","feature_path":"features/specification-studio-guided-test-cases.feature","background_hash":"8924f150da2fe5771a78d83b0b985937340b67679c0b045225a71571b6d65ea3","implementation_hash":"871de6e22e-architect","scenarios":[{"index":1,"name":"Specification Studio guided test cases 002","scenario_hash":"f19845f5778112528f3a55c7d162753e113efe0413d49864b1b4822426593f76","mutation_count":8,"result":{"Total":8,"Killed":8,"Survived":0,"Errors":0},"tested_at":"2026-07-31T10:13:14.085564675Z"},{"index":3,"name":"Specification Studio guided test cases 004","scenario_hash":"5fc13e0d55140222309075ca963fc2255830c2ef37b4453fff44db1008469479","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-31T10:13:14.085564675Z"},{"index":6,"name":"Specification Studio guided test cases 007","scenario_hash":"b25953a427d4b0bef3ac25bb4388a322beb4c88d20a99eb97c15fc784f9eb555","mutation_count":18,"result":{"Total":18,"Killed":18,"Survived":0,"Errors":0},"tested_at":"2026-07-31T10:13:14.085564675Z"},{"index":11,"name":"Specification Studio guided test cases 012","scenario_hash":"2f5c2de621ea22cc777a6d6a483aee5bc66d9d16d622c4ff64ac9043bb902b70","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-31T10:13:14.085564675Z"},{"index":13,"name":"Specification Studio guided test cases 014","scenario_hash":"012f660f8a0884acb5c0f78a3b34805adddd79e15ef6698b6ff28723ed9681c0","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-31T10:13:14.085564675Z"}]}
# acceptance-mutation-manifest-end

Feature: Specification Studio guided test cases

  Background:
    Given an operator is authoring a Specification Project with Pages, Events, Assignments, and effective schemas
    And the side panel contains saved Event Library templates and captured Live validations
    And test-case assurance is advisory

  # Specification Studio guided test cases 001
  Scenario: Specification Studio guided test cases 001
    When the operator opens the project navigation
    Then Test cases replaces Fixtures as the visible collection name
    And a Test case is explained as saved input plus reviewed expectations rerunnable against the current Draft
    And Fixture mode, Context, Ordered observations, Payload, Expected winner, and Release policy are not presented as unrelated top-level fields

  # Specification Studio guided test cases 002
  Scenario Outline: Specification Studio guided test cases 002
    When the operator starts a new <test_type>
    Then the editor explains <purpose>
    And it requires <scope>
    And it runs <evaluation>

    Examples:
      | test_type             | purpose                                                      | scope                       | evaluation                                      |
      | Page context test     | prove applicable Page Groups and Page validation              | one named Page              | Page applicability and effective Page schema    |
      | Event validation test | prove routing and validation for one observed Event            | one named Event and optional Page | production Assignment and schema evaluation |

  # Specification Studio guided test cases 003
  Scenario: Specification Studio guided test cases 003
    Given Flows remain documentary
    When the operator reviews available Test case types
    Then Journey test is identified as unavailable until executable Flow behavior is approved
    And no multi-observation editor, Flow execution result, or inferred journey assurance is offered

  # Specification Studio guided test cases 004
  Scenario Outline: Specification Studio guided test cases 004
    Given the operator starts from <source>
    When the Test case draft opens
    Then source input copies <copied_input>
    And source identity and revision are retained as provenance
    And later source edits cannot silently change the Test case

    Examples:
      | source                         | copied_input                                                                  |
      | manual creation                | a schema-assisted empty input                                                 |
      | saved Event Library template   | its saved Event identity, destination, typed payload, and schema attachment   |
      | captured Live validation       | its observed Event, context, payload, evaluation identity, and proposed assertions |

  # Specification Studio guided test cases 005
  Scenario: Specification Studio guided test cases 005
    Given the side panel Event Library contains saved template Purchase confirmation
    When the operator chooses Create Test case
    Then a project destination is requested when more than one project is available
    And matching named project Events and input-guidance schemas are offered for review
    And confirming the mapping creates one Event validation Test case and opens it in Specification Studio
    And an unavailable Event or schema produces a direct create, adopt, or select repair instead of a guessed mapping
    And the Event Library template remains unchanged

  # Specification Studio guided test cases 006
  Scenario: Specification Studio guided test cases 006
    Given the selected scope has one effective input-guidance schema
    When the input builder opens
    Then its property tree is derived from that exact schema revision
    And each property identifies its path, type, required state, constraints, description, example, and origin when available
    And required properties are present while declared optional properties can be added by name
    And the operator never needs to write a complete freeform JSON document to discover valid fields or values

  # Specification Studio guided test cases 007
  Scenario Outline: Specification Studio guided test cases 007
    Given a schema-assisted Test case property has <property_shape>
    When the operator edits that property
    Then the builder provides <control>
    And the stored value retains <json_type>
    And invalid input is explained at that property before Save and run

    Examples:
      | property_shape                    | control                                             | json_type |
      | allowed strings retail and trade  | typed retail and trade choices                      | string    |
      | bounded number                    | numeric input with visible minimum and maximum      | number    |
      | boolean                           | labelled true and false choice                      | boolean   |
      | nested object                     | expandable child-property group                     | object    |
      | array of products                 | add, remove, reorder, and edit item controls         | array     |
      | nullable value                    | explicit null or typed-value choice                  | null or declared value type |

  # Specification Studio guided test cases 008
  Scenario: Specification Studio guided test cases 008
    Given effective constraints depend on values elsewhere in the Test case input
    When the operator changes a discriminator
    Then conditional required fields, permitted values, and explanations refresh from the same effective schema
    And already entered values remain visible
    And values made invalid are identified without being silently deleted or coerced
    And undeclared properties can be added only when the effective schema permits them
    And any permitted undeclared property uses guided name, value-type, and typed-value controls

  # Specification Studio guided test cases 009
  Scenario: Specification Studio guided test cases 009
    Given an Event validation scope has multiple plausible effective schemas
    When input assistance is requested
    Then each eligible schema is offered by human-readable contributor, Event, applicability, and revision context
    And an Event Library attachment or captured Assignment can be proposed without being silently accepted
    And choosing an input-guidance schema changes only authoring assistance
    And production evaluation still determines the actual Assignment and effective schema from Test case input
    And the expected Assignment is reviewed separately from both choices

  # Specification Studio guided test cases 010
  Scenario: Specification Studio guided test cases 010
    Given no eligible input-guidance schema can describe the selected scope
    When the operator reaches the input step
    Then the builder identifies the missing Event, Assignment, contributor, or schema relationship
    And offers a direct route to create, adopt, select, or repair it
    And does not replace missing guidance with an unexplained JSON textarea
    And returning after repair preserves the Test case name, type, source, and scope

  # Specification Studio guided test cases 011
  Scenario: Specification Studio guided test cases 011
    Given the operator has changed a visible Test case input
    When Save and run is requested
    Then the exact visible structured input is saved in one Draft command before evaluation
    And the selected explicit Test case type chooses the evaluator
    And a Page reference cannot redirect an Event validation Test case into Page context evaluation
    And a save or compilation failure runs nothing and preserves the editable draft with a repair

  # Specification Studio guided test cases 012
  Scenario Outline: Specification Studio guided test cases 012
    Given a <test_type> has produced an actual result
    When the operator reviews expectations
    Then structured controls offer <assertions>
    And Use actual as expected requires an explicit operator action
    And at least one reviewed assertion is required before the Test case is Ready

    Examples:
      | test_type             | assertions                                                                  |
      | Page context test     | applicable Page Groups, validation outcome, and issue paths and codes       |
      | Event validation test | winning Assignment or no Assignment, validation outcome, and issue paths and codes |

  # Specification Studio guided test cases 013
  Scenario: Specification Studio guided test cases 013
    Given an Event validation Test case expects a required-property issue
    When production evaluation reports that issue
    Then Observed outcome is Invalid
    And Test comparison is Matched
    And the expected issue path and code are shown beside the actual issue
    And a negative validation outcome is never mislabeled as a failed Test case when it matches reviewed expectations

  # Specification Studio guided test cases 014
  Scenario Outline: Specification Studio guided test cases 014
    Given a Test case has <condition>
    When its status is calculated
    Then status is <status>
    And status guidance is <operator_guidance>

    Examples:
      | condition                                      | status     | operator_guidance                                      |
      | no input or no reviewed assertion              | Blocked    | the first incomplete guided control is opened          |
      | actual values equal every reviewed expectation | Matched    | actual and expected evidence is retained                |
      | one actual value differs                       | Mismatched | each field-level difference and repair target is shown  |
      | its recorded evaluator revision is superseded  | Stale      | rerun is offered without discarding prior evidence      |

  # Specification Studio guided test cases 015
  Scenario: Specification Studio guided test cases 015
    Given the project contains Blocked, Mismatched, Stale, or no Test cases
    When preflight and publication review run
    Then every Test case finding appears under Warnings
    And canonical or effective-schema validation remains the only source of Test-case-adjacent blockers
    And publication never depends on a per-Test-case required or optional release policy
    And advisory evidence cannot be presented as proof that publication is blocked

  # Specification Studio guided test cases 016
  Scenario: Specification Studio guided test cases 016
    Given a guided Test case is edited at desktop width, 360 CSS pixels, or 200 percent browser zoom
    When the operator completes source, scope, input, run, expectation, and review using only the keyboard
    Then the current step, completion state, constraint help, validation message, and primary action remain visible
    And nested property and typed-choice controls have programmatic names, descriptions, and error associations
    And focus moves to the first incomplete or invalid control after an unsuccessful action
    And no required workflow depends on horizontal page scrolling, raw identifiers, pointer input, or color alone
