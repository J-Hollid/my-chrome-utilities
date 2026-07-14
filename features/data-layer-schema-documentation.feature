Feature: Data layer schema documentation

  Background:
    Given the Schema Library contains schema Product detail

  # Data layer schema documentation 001
  Scenario: Data layer schema documentation 001
    Given Product detail has current revision 3 and no working draft
    When the operator adds schema description Product detail commerce event
    And documents /oOrder/aProducts/*/product_id with display name Product identifier and description Stable identifier used by fulfilment
    Then one working draft is created from revision 3
    And its documentation mapping contains the schema description and 1 property entry
    And the property entry is owned by Product detail and keyed by canonical path /oOrder/aProducts/*/product_id
    And the underlying property name, path, value type, and validation rules are unchanged
    And revision 3 remains current until the draft is published

  # Data layer schema documentation 002
  Scenario: Data layer schema documentation 002
    Given the Product detail working draft documents /page_type
    When the operator activates Edit documentation again for /page_type
    Then the existing display name and description are edited instead of creating another entry
    And the mapping contains at most 1 local entry for canonical path /page_type
    When both documentation fields are cleared and removal is confirmed
    Then the /page_type documentation entry is removed
    And the /page_type schema property and its validation rules remain present

  # Data layer schema documentation 003
  Scenario: Data layer schema documentation 003
    Given assigned Product detail revision 3 has a schema description and documentation for /page_type
    And a captured event contains page_type product_detail
    When the event is opened in the Live inspector
    Then Product detail revision 3 is identified as the documentation source
    And the schema description is available with the event information
    And the page_type row retains raw name page_type and complete path /page_type
    And its mapped display name and description are available beside the observed value and validation status
    And property search matches raw name, mapped display name, or mapped description
    And documentation remains available whether validation passes or fails
    And presenting documentation does not change the payload or validation result

  # Data layer schema documentation 004
  Scenario Outline: Data layer schema documentation 004
    Given a documented property information control is displayed
    When the operator uses <interaction>
    Then the description becomes available through <presentation>
    And the same description is available to assistive technology
    And the property row remains in its existing tree position

    Examples:
      | interaction       | presentation                         |
      | pointer hover     | a non-blocking information preview   |
      | keyboard focus    | a non-blocking information preview   |
      | click or Enter    | persistent additional information    |

  # Data layer schema documentation 005
  Scenario Outline: Data layer schema documentation 005
    Given Product detail revision 3 has documentation mapping path <mapping_path>
    And the captured event presents <event_property>
    When effective property documentation is resolved
    Then the property documentation result is <documentation_result>

    Examples:
      | mapping_path                   | event_property                              | documentation_result                       |
      | /page_type                     | observed /page_type                         | mapped information on /page_type           |
      | /oOrder/aProducts/*/product_id | observed /oOrder/aProducts/0/product_id     | wildcard information on the concrete item  |
      | /oOrder/order_id               | missing expected /oOrder/order_id           | mapped information on the synthetic row    |
      | no matching path               | observed /currency                          | no empty documentation control             |

  # Data layer schema documentation 006
  Scenario: Data layer schema documentation 006
    Given Generic commerce revision 2 documents /currency
    And Product detail inherits Generic commerce revision 2
    When effective documentation is displayed in the Product detail working draft
    Then /currency documentation identifies Generic commerce revision 2 as its origin
    When the operator creates a local /currency documentation override
    Then exactly 1 effective /currency entry uses the Product detail override
    And Generic commerce revision 2 is unchanged
    When the operator restores inherited documentation
    Then the Generic commerce entry becomes effective again without duplication

  # Data layer schema documentation 007
  Scenario: Data layer schema documentation 007
    Given Product detail revision 3 describes /page_type as Legacy page classification
    And its working draft changes that description to Current page classification
    When the working draft is published as revision 4
    Then revision 4 owns Current page classification
    And historical revision 3 retains Legacy page classification
    And events pinned to revision 3 display Legacy page classification
    And events resolved to revision 4 display Current page classification

  # Data layer schema documentation 008
  Scenario: Data layer schema documentation 008
    Given an event was saved with Product detail revision 3
    And Product detail revision 4 later becomes current
    When the saved event is reopened
    Then documentation is resolved from recorded revision 3
    When the operator explicitly revalidates the event with revision 4
    Then documentation is resolved from revision 4 with the new validation result
    And the originally recorded schema revision remains identifiable

  # Data layer schema documentation 009
  Scenario: Data layer schema documentation 009
    Given Product detail contains schema and property documentation across current, historical, inherited, and working-draft definitions
    When Product detail is duplicated and the complete Schema Library is exported, imported, and reloaded
    Then the duplicate owns an independent copy of the effective documentation without mutating Product detail
    And export, import, and reload preserve each mapping's owner, canonical paths, content, revision association, and inheritance provenance
    And imported descriptions are treated as text rather than executable markup
    And a Schema Library created before documentation mappings existed remains usable with no empty documentation controls

  # Data layer schema documentation 010
  Scenario: Data layer schema documentation 010
    Given /oOrder/aProducts/*/product_id has documentation and validation rules
    When the operator confirms removal of that schema property
    Then the removal review identifies its documentation entry
    And the property, attached rules, and documentation entry are removed together from the working draft
    When the operator activates Undo property removal
    Then the property, attached rules, and documentation entry are restored together
