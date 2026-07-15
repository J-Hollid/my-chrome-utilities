# mutation-stamp: sha256=6b46a66fe491c3a94a1165015adae97f5598d55e7e4938a4b42cde2a2eb52331
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T01:32:04.616968115Z","feature_name":"Data layer defect report undeclared property removal runtime","feature_path":"features/data-layer-defect-report-undeclared-property-removal-runtime.feature","background_hash":"f97c847edecf3d580ab404b6e26c3e38b2cd20dfc89a79a2eb25b2d19644db8e","implementation_hash":"sha256:71d34b28559c8942f57144f10832310dc51302cf71bde17c8696cc7d1fcdb612","scenarios":[{"index":2,"name":"Data layer defect report undeclared property removal runtime 003","scenario_hash":"96cbd6b39c9f1d9b6da0c54c07059db76a46c8d16b8bda6dc16800c676a48f3b","mutation_count":15,"result":{"Total":15,"Killed":15,"Survived":0,"Errors":0},"tested_at":"2026-07-15T01:32:04.616968115Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer defect report undeclared property removal runtime

  Background:
    Given the built extension side panel is running with production Live validation, defect reporting, Jira export, and Defect Library persistence
    And production Generic pageview revision 4 has additionalProperties false and declares /page_type
    And an actual Live pageview payload is {"page_type":"product_detail","debug":true}
    And production validation reports Undeclared property at /debug

  # Data layer defect report undeclared property removal runtime 001
  Scenario: Data layer defect report undeclared property removal runtime 001
    When the operator activates the actual Create defect report action
    Then the production defect issue retains Undeclared property as its violation identity
    And the /debug expected-result controls show Remove undeclared property selected
    And no generic, schema-value, or custom-value response can retain /debug
    And production Expected result immediately omits debug before another operator action

  # Data layer defect report undeclared property removal runtime 002
  Scenario: Data layer defect report undeclared property removal runtime 002
    Given the production captured payload JSON and validation result are recorded
    When the actual Final report preview is rendered
    Then Actual result contains and identifies /debug with value true
    And Expected result contains one structured payload equal to {"page_type":"product_detail"}
    And no expected JSON line, placeholder, null, or inline annotation represents debug
    And the recorded captured payload and validation result are unchanged

  # Data layer defect report undeclared property removal runtime 003
  Scenario Outline: Data layer defect report undeclared property removal runtime 003
    Given the background Live pageview is replaced by <payload>
    And production validation is replaced by one Undeclared property issue at <pointer>
    When the actual report correction is generated
    Then production expected payload equals <expected_payload>
    And exactly one remove correction targets <pointer>

    Examples:
      | pointer             | payload                                                    | expected_payload                             |
      | /debug              | {"page_type":"product","debug":{"trace":true}}        | {"page_type":"product"}                   |
      | /commerce/debug     | {"commerce":{"currency":"EUR","debug":true}}          | {"commerce":{"currency":"EUR"}}         |
      | /products/0/debug   | {"products":[{"id":1,"debug":true},{"id":2}]}          | {"products":[{"id":1},{"id":2}]}        |
      | /a~1b               | {"a/b":true,"page_type":"product"}                      | {"page_type":"product"}                   |
      | /tilde~0name        | {"tilde~name":true,"page_type":"product"}               | {"page_type":"product"}                   |

  # Data layer defect report undeclared property removal runtime 004
  Scenario: Data layer defect report undeclared property removal runtime 004
    Given the actual report has selected undeclared issues /debug and /commerce/internal
    When /debug is deselected, selected again, and the report rerenders after each input
    Then debug is respectively restored, removed, and represented by one correction
    And commerce.internal remains removed throughout
    And no rerender mutates the actual payload or duplicates a removal

  # Data layer defect report undeclared property removal runtime 005
  Scenario: Data layer defect report undeclared property removal runtime 005
    Given production issues require removing /debug and replacing /page_type with product_detail
    When the operator chooses the schema-provided page_type value
    Then production expected payload applies both structural removal and value replacement
    And its correction model contains one remove and one replace with their original issue identities
    And rendered Differences identifies both canonical pointers and distinct operations

  # Data layer defect report undeclared property removal runtime 006
  Scenario: Data layer defect report undeclared property removal runtime 006
    Given the production corrected report omits /debug
    When Copy for Jira Cloud, Save defect, reopen, and recopy are performed through actual controls
    Then rich preview, rich clipboard, plain clipboard, saved record, reopened preview, and recopied output all omit debug from Expected result
    And each retains Actual result debug true, the removal difference, schema revision, rule, severity, and pointer evidence
    And saved internal correction operation is remove rather than replace with null or missing text

  # Data layer defect report undeclared property removal runtime 007
  Scenario: Data layer defect report undeclared property removal runtime 007
    Given production validation is refreshed to a revision that declares /debug
    When the actual Live event and report entry actions rerender
    Then /debug no longer produces an Undeclared property report issue or automatic removal
    And an already saved defect keeps its original revision-4 evidence and corrected expected payload

  # Data layer defect report undeclared property removal runtime 008
  Scenario: Data layer defect report undeclared property removal runtime 008
    Given the actual defect builder is 320 CSS pixels wide with several selected undeclared issues
    When the operator reviews, deselects, reselects, copies, saves, and reopens the report using keyboard controls
    Then removal controls and differences remain readable and reachable without horizontal page scrolling
    And focus and report scroll are restored after rerenders and navigation
    And runtime coverage enters through production validation and the actual Live Create defect report action and exercises issue conversion, default selection, JSON-pointer removal, preview, export, persistence, reopening, and revalidation rather than source-string inspection
