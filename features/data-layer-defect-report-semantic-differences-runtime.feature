# mutation-stamp: sha256=a153ab3392cbfc71f0d2f3417498696958fd2477b1de2ae3fe9f7db156b038cd
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T07:58:01.455794998Z","feature_name":"Data layer defect report semantic differences runtime","feature_path":"features/data-layer-defect-report-semantic-differences-runtime.feature","background_hash":"8335e67e20743727bed22c7de256bf1679962b5cc06d6c7c0933b9d13245de17","implementation_hash":"sha256:ea08c96a6d40b4f43ab73df098ffb2bc506aaec8eda08b65665c2bbe914c3421","scenarios":[{"index":2,"name":"Data layer defect report semantic differences runtime 003","scenario_hash":"8e2a22e94b34617482677e8311848353ca7fba5febfd2c39991cc4a7e597089e","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T07:58:01.455794998Z"},{"index":3,"name":"Data layer defect report semantic differences runtime 004","scenario_hash":"f22266aaec55ac596bfb7ba656bf946b52bb174790aa133097d5f58c6ca785db","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T07:58:01.455794998Z"},{"index":4,"name":"Data layer defect report semantic differences runtime 005","scenario_hash":"9d60bc46826d1cf70cb36189ad9cfa6d32f295457c51f91a2ebb1e52389fd350","mutation_count":4,"result":{"Total":4,"Killed":4,"Survived":0,"Errors":0},"tested_at":"2026-07-15T07:58:01.455794998Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report semantic differences runtime

  Background:
    Given the built extension side panel is running with production validation, defect reporting, Jira export, and Defect Library persistence
    And a production error event has undeclared /action and /code and missing required /error_action and /error_code
    And production Expected result removes the undeclared properties and adds the required properties

  # Data layer defect report semantic differences runtime 001
  Scenario: Data layer defect report semantic differences runtime 001
    When the operator activates the actual Create defect report action
    Then each production Actual difference retains its validation issue id, pointer, violation, and observed presence or absence
    And each production Expected difference retains its issue id, pointer, and add, replace, remove, or none operation
    And the rendered model does not derive semantic text from marker color alone

  # Data layer defect report semantic differences runtime 002
  Scenario: Data layer defect report semantic differences runtime 002
    When the actual Final report preview is rendered
    Then /action and /code are described as undeclared properties present in the actual payload
    And /error_action and /error_code are described as required properties missing from the actual payload
    And the corresponding Expected lines describe two removals and two additions
    And invalid actual value and corrected expected value are absent for those eight classified lines

  # Data layer defect report semantic differences runtime 003
  Scenario Outline: Data layer defect report semantic differences runtime 003
    Given production validation supplies <violation> at <pointer>
    When the production Actual-difference renderer receives the violation
    Then the rendered description is <description>

    Examples:
      | pointer         | violation            | description                                              |
      | /action         | Undeclared property   | undeclared property is present in the actual payload     |
      | /error_action   | Required value        | required property is missing from the actual payload     |
      | /page_type      | Value is not allowed  | actual value is not allowed                              |
      | /transaction_id | Type mismatch         | actual value has the wrong type                          |
      | /reference      | Value is not exact    | actual value does not equal the required value            |

  # Data layer defect report semantic differences runtime 004
  Scenario Outline: Data layer defect report semantic differences runtime 004
    Given a production correction uses <operation> at <pointer>
    When the production Expected-difference renderer receives the correction
    Then the rendered result is <description>

    Examples:
      | pointer       | operation | description                                  |
      | /action       | remove    | was removed from the expected payload        |
      | /error_action | add       | was added to the expected payload             |
      | /page_type    | replace   | was replaced in the expected payload          |
      | /coupon       | none      | no Expected difference line is rendered       |

  # Data layer defect report semantic differences runtime 005
  Scenario Outline: Data layer defect report semantic differences runtime 005
    Given production validation and correction use canonical pointer <pointer>
    When rich HTML and plain text differences are rendered
    Then both display <pointer> exactly once for that issue and operation
    And both retain their distinct semantic descriptions

    Examples:
      | pointer            |
      | /commerce/currency |
      | /products/0/name   |
      | /a~1b              |
      | /tilde~0name       |

  # Data layer defect report semantic differences runtime 006
  Scenario: Data layer defect report semantic differences runtime 006
    Given the production builder has multiple selected issues including two violations at one pointer
    When actual controls deselect, reselect, and correct those issues across rerenders
    Then the DOM contains one Actual line per selected issue and one Expected line per non-none correction
    And issue identity, semantic description, and deterministic order survive every rerender
    And an unresolved Required value issue has no fabricated add correction
    And focus and report scroll remain associated with the operated control

  # Data layer defect report semantic differences runtime 007
  Scenario: Data layer defect report semantic differences runtime 007
    Given production validation supplies unfamiliar violation Value violates partner contract
    When the production Actual-difference renderer receives the violation
    Then rich HTML and plain text contain validation failed: Value violates partner contract
    And neither output invents undeclared, missing, value, or type semantics

  # Data layer defect report semantic differences runtime 008
  Scenario: Data layer defect report semantic differences runtime 008
    Given the production report contains semantic Actual and Expected differences
    When Copy for Jira Cloud, plain-text fallback, Save defect, reopen, and recopy are exercised through actual controls
    Then preview, rich clipboard, plain clipboard, persisted report, reopened preview, and recopied output retain identical semantic lines
    And all retain pointers, issue identities, operations, validation evidence, and actual-versus-expected grouping
    And none falls back to generic text for a recognized violation or operation

  # Data layer defect report semantic differences runtime 009
  Scenario: Data layer defect report semantic differences runtime 009
    Given a production-compatible legacy saved defect has no violation identity for one Actual difference
    When it is reopened and copied through actual Defect Library controls
    Then rendered and copied output uses a neutral validation failed description
    And no specific violation is inferred from its pointer, captured value, correction, marker, or color
    And the legacy record remains unchanged until an explicit operator save

  # Data layer defect report semantic differences runtime 010
  Scenario: Data layer defect report semantic differences runtime 010
    Given the actual defect builder is 320 CSS pixels wide with all eight regression lines visible
    When the operator reviews, copies, saves, and reopens the report using keyboard controls
    Then every semantic difference remains readable and reachable without horizontal page scrolling
    And pointer, marker, Actual or Expected grouping, and meaning remain identifiable without color
    And runtime coverage enters through production validation and the Live Create defect report action and exercises the actual difference model, preview, rich and plain export, persistence, reopening, and legacy fallback rather than source-string inspection
