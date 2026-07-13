Feature: Data layer defect report reproduction step composer

  Background:
    Given a defect report has numbered pathname step 1 Visit /products and step 2 Visit /checkout

  # Data layer defect report reproduction step composer 001
  Scenario: Data layer defect report reproduction step composer 001
    When the operator selects the /products pathname segment
    Then one contextual Add step to /products action is available
    And unselected pathname segments do not repeat step-template controls
    When the operator activates Add step to /products
    Then Click component, Log in as user, Scroll, and Custom step are available
    And no step is added before a template is completed and submitted

  # Data layer defect report reproduction step composer 002
  Scenario Outline: Data layer defect report reproduction step composer 002
    Given Click component is selected for the /products segment
    When component name <component_name> is entered with <component_details>
    Then the step preview is <step_text>
    And component name and description use business-readable text without requiring a DOM locator

    Examples:
      | component_name | component_details                | step_text                              |
      | Checkout       | description sticky footer button | Click Checkout — sticky footer button  |
      | Product card   | no description                   | Click Product card                     |

  # Data layer defect report reproduction step composer 003
  Scenario: Data layer defect report reproduction step composer 003
    Given Log in as user is selected for the /products segment
    When user or persona returning customer is entered
    Then the step preview is Log in as returning customer
    And the composer does not require a saved persona
    And password, token, and other authentication-secret fields are absent

  # Data layer defect report reproduction step composer 004
  Scenario Outline: Data layer defect report reproduction step composer 004
    Given Scroll is selected for the /products segment
    When scroll target <scroll_target> is selected or entered
    Then the step preview is <step_text>

    Examples:
      | scroll_target              | step_text                                 |
      | bottom of the page         | Scroll to the bottom of the page          |
      | top of the page            | Scroll to the top of the page             |
      | component Order summary    | Scroll to Order summary                   |
      | custom middle of results   | Scroll to the middle of results           |

  # Data layer defect report reproduction step composer 005
  Scenario: Data layer defect report reproduction step composer 005
    Given Custom step is selected for the /products segment
    When custom text Apply the free delivery filter is entered
    Then the step preview is Apply the free delivery filter
    And submission is unavailable when custom text is blank

  # Data layer defect report reproduction step composer 006
  Scenario: Data layer defect report reproduction step composer 006
    Given Click Checkout — sticky footer button is previewed for the /products segment
    When the operator activates Add step
    Then the numbered reproduction steps are
      | number | step_text                              |
      | 1      | Visit /products                        |
      | 2      | Click Checkout — sticky footer button  |
      | 3      | Visit /checkout                        |
    And pathname anchors remain in captured order
    And Adjust and Remove are available for the added step

  # Data layer defect report reproduction step composer 007
  Scenario: Data layer defect report reproduction step composer 007
    Given step 2 is Click Checkout — sticky footer button
    When the operator activates Adjust for step 2
    Then Click component fields reopen with Checkout and sticky footer button
    When the description is changed to primary checkout action and changes are saved
    Then step 2 is Click Checkout — primary checkout action
    And no additional reproduction step is created

  # Data layer defect report reproduction step composer 008
  Scenario: Data layer defect report reproduction step composer 008
    Given step 2 is Click Checkout — sticky footer button
    When the operator activates Remove for step 2
    Then Visit /products and Visit /checkout remain as numbered steps 1 and 2
    And the captured pathname skeleton remains unchanged

  # Data layer defect report reproduction step composer 009
  Scenario: Data layer defect report reproduction step composer 009
    Given Scroll to the bottom of the page and Click Checkout belong to the /products segment
    When Scroll to the bottom of the page is moved before Click Checkout
    Then both manual steps remain between Visit /products and Visit /checkout
    And reproduction step numbers reflect their displayed order
    And moving a step across a pathname anchor requires choosing another pathname segment

  # Data layer defect report reproduction step composer 010
  Scenario: Data layer defect report reproduction step composer 010
    Given a new Click component step is being composed for /products
    When the operator activates Cancel
    Then the numbered reproduction steps remain unchanged
    And focus returns to Add step to /products

  # Data layer defect report reproduction step composer 011
  Scenario: Data layer defect report reproduction step composer 011
    Given manual steps have been added between numbered pathname anchors
    When the final defect report preview and Jira Cloud representation are produced
    Then pathname and manual steps appear in the same numbered order
    And template configuration fields are not included in the report
