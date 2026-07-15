Feature: Data layer defect report undeclared property removal

  Background:
    Given Generic pageview revision 4 allows only declared properties
    And captured pageview contains declared page_type product_detail and undeclared debug true
    And validation reports Undeclared property at /debug

  # Data layer defect report undeclared property removal 001
  Scenario: Data layer defect report undeclared property removal 001
    When the operator starts a defect report from pageview
    Then the report issue retains message Undeclared property, expected declared property, and pointer /debug
    And Remove undeclared property is selected automatically
    And no replacement value, generic constraint, or custom response is offered for /debug
    And the removal is attributed to the schema's declared-property policy

  # Data layer defect report undeclared property removal 002
  Scenario: Data layer defect report undeclared property removal 002
    When Expected result is generated
    Then its payload is {"page_type":"product_detail"}
    And property debug and value true are absent
    And surrounding declared properties retain their values and order
    And the captured pageview payload remains {"page_type":"product_detail","debug":true}

  # Data layer defect report undeclared property removal 003
  Scenario Outline: Data layer defect report undeclared property removal 003
    Given an Undeclared property issue identifies <pointer>
    And the actual payload contains <payload_shape>
    When its automatic expected correction is applied
    Then <removed_content> is absent from the expected payload
    And <retained_content> is retained unchanged

    Examples:
      | pointer                  | payload_shape                                      | removed_content             | retained_content             |
      | /debug                   | debug object with nested trace and page_type       | complete debug subtree      | page_type                    |
      | /commerce/debug          | commerce with currency and debug                   | commerce.debug              | commerce.currency            |
      | /products/0/debug        | products item 1 with id and debug                  | debug from products item 1  | products item 1 id           |
      | /a~1b                    | properties a/b and page_type                       | property a/b                | page_type                    |
      | /tilde~0name             | properties tilde~name and page_type                | property tilde~name         | page_type                    |

  # Data layer defect report undeclared property removal 004
  Scenario: Data layer defect report undeclared property removal 004
    Given validation reports undeclared properties /debug, /commerce/internal, and /products/0/test
    When the selected issues are applied to Expected result
    Then all three exact properties are removed once
    And declared siblings and array items remain unchanged
    And correction order follows issue order without changing payload property order

  # Data layer defect report undeclared property removal 005
  Scenario: Data layer defect report undeclared property removal 005
    Given overlapping legacy issues identify undeclared parent /debug and descendant /debug/trace
    When Expected result corrections are normalized
    Then the parent subtree is removed once
    And no second removal error or phantom descendant is produced
    And both issue identities remain available as validation evidence

  # Data layer defect report undeclared property removal 006
  Scenario Outline: Data layer defect report undeclared property removal 006
    Given the /debug issue has <selection_state>
    When Expected result refreshes
    Then debug is <expected_presence>
    And correction state is <correction_state>

    Examples:
      | selection_state             | expected_presence | correction_state                         |
      | selected when builder opens | absent            | removal applied automatically             |
      | deselected by the operator  | present           | removal excluded from the report          |
      | selected again              | absent            | one removal restored                      |

  # Data layer defect report undeclared property removal 007
  Scenario: Data layer defect report undeclared property removal 007
    Given /debug is undeclared and /page_type has disallowed value internal
    When /debug is removed and /page_type is corrected to product_detail
    Then Expected result contains page_type product_detail and no debug property
    And one remove correction and one replace correction are retained independently
    And changing the page_type response does not restore debug

  # Data layer defect report undeclared property removal 008
  Scenario: Data layer defect report undeclared property removal 008
    When Actual result, Expected result, and Differences are presented
    Then Actual result contains debug true and identifies /debug as invalid
    And Expected result omits debug rather than displaying a placeholder or null value
    And Differences states /debug was removed from the expected payload
    And the removal is identifiable without relying on color or an inline expected-property highlight

  # Data layer defect report undeclared property removal 009
  Scenario: Data layer defect report undeclared property removal 009
    Given the corrected report is complete
    When live preview, Jira rich text, Jira plain text, saved defect, reopened preview, and recopied output are compared
    Then every Expected result contains the same payload without debug
    And none contains debug as an expected JSON property
    And every representation retains the removal difference and validation evidence

  # Data layer defect report undeclared property removal 010
  Scenario: Data layer defect report undeclared property removal 010
    Given the event has been revalidated against a schema revision that now declares debug
    When a new defect report is started from the refreshed event
    Then no Undeclared property issue or automatic removal is created for /debug
    And historical saved reports retain the removal associated with their original schema revision

  # Data layer defect report undeclared property removal 011
  Scenario: Data layer defect report undeclared property removal 011
    Given the actual payload and validation evidence have been recorded
    When undeclared-property choices are selected, deselected, previewed, copied, or saved
    Then the captured event, validation result, and assigned schema remain byte-for-byte unchanged
    And only the report's expected payload and correction model change

