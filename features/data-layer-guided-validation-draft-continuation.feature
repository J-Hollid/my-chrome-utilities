Feature: Data layer guided validation draft continuation

  Background:
    Given captured event pageview is selected in the Live event inspector

  # Data layer guided validation draft continuation 001
  Scenario: Data layer guided validation draft continuation 001
    Given pageview has no working-draft continuation context
    When event actions are displayed
    Then Create validation from this event is available
    And working-draft continuation actions are absent

  # Data layer guided validation draft continuation 002
  Scenario: Data layer guided validation draft continuation 002
    Given Product listing has a working draft based on revision 3 with 2 pending changes
    And Product listing is the selected working-draft continuation context
    When event actions are displayed
    Then one working-draft section identifies Product listing, revision 3, and 2 pending changes
    And it offers Add property from this event, Review draft, Publish revision, and Use a different schema
    And Create validation from this event is absent

  # Data layer guided validation draft continuation 003
  Scenario: Data layer guided validation draft continuation 003
    Given Product listing is the selected working-draft continuation context
    When the operator activates Add property from this event
    Then property selection opens with Adding to Product listing draft displayed
    When the operator selects page_name
    Then the schema destination stage is skipped
    And Product listing remains selected by stable schema identity
    And the requirement stage is displayed without opening a schema picker

  # Data layer guided validation draft continuation 004
  Scenario: Data layer guided validation draft continuation 004
    Given Product listing targets payload and has 1 enabled assignment compatible with pageview
    And Product listing is the selected working-draft continuation context
    When requirement and scope are displayed for Add property from this event
    Then validation target, assignment, domain, and path conditions are prefilled from Product listing
    And every prefilled value identifies its source
    And the operator can change each prefilled value before review

  # Data layer guided validation draft continuation 005
  Scenario Outline: Data layer guided validation draft continuation 005
    Given Product listing has <compatible_assignment_count> compatible assignments for pageview
    And Product listing is the selected working-draft continuation context
    When assignment resolution runs for Add property from this event
    Then assignment behavior is <assignment_behavior>
    And Product listing remains the schema destination
    And the schema destination stage is skipped

    Examples:
      | compatible_assignment_count | assignment_behavior                         |
      | 0                           | create a pending assignment from event defaults |
      | 2                           | require a choice between readable assignments |

  # Data layer guided validation draft continuation 006
  Scenario: Data layer guided validation draft continuation 006
    Given Product listing is the selected working-draft continuation context
    When the operator activates Use a different schema
    Then schema destination selection opens without changing the Product listing working draft
    When the operator cancels schema destination selection
    Then Product listing is restored as the continuation context
    When the operator selects Checkout instead
    Then Checkout becomes the named continuation context
    And the Product listing working draft remains unchanged

  # Data layer guided validation draft continuation 007
  Scenario: Data layer guided validation draft continuation 007
    Given Product listing and Checkout each have working drafts
    And Checkout was the most recently selected continuation context for pageview
    When event actions are displayed
    Then only the Checkout working-draft section is displayed
    And no unnamed draft action or full list of working drafts is displayed
    And Use a different schema is available to select Product listing explicitly

  # Data layer guided validation draft continuation 008
  Scenario Outline: Data layer guided validation draft continuation 008
    Given Product listing is the selected working-draft continuation context
    When the operator activates <draft_action>
    Then <destination> opens for Product listing
    And no other working draft is opened or published

    Examples:
      | draft_action     | destination                         |
      | Review draft     | the Product listing working draft   |
      | Publish revision | Product listing publication review  |

  # Data layer guided validation draft continuation 009
  Scenario: Data layer guided validation draft continuation 009
    Given Product listing is the selected working-draft continuation context
    When the side panel reloads and pageview is reopened
    Then Product listing remains the named continuation context
    And Add property from this event still skips schema destination selection
