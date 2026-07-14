Feature: Data layer Live allowed-value expansion

  Background:
    Given captured event page_view is assigned to Otelo - Generic Pageview revision 2
    And property /page_type fails an Allowed values rule in the Live event inspector

  # Data layer Live allowed-value expansion 001
  Scenario Outline: Data layer Live allowed-value expansion 001
    Given the property evaluation has <evaluation_state>
    And its actual value is <actual_value>
    When property rule details are displayed
    Then Add this value to schema as an allowed value is <action_state>

    Examples:
      | evaluation_state                     | actual_value       | action_state |
      | failed Allowed values                | string product_test | available    |
      | passed Allowed values                | string product      | absent       |
      | Not applicable Allowed values        | missing             | absent       |
      | failed Exact value                   | string product_test | absent       |
      | failed Allowed values                | object value        | absent       |
      | failed Allowed values                | array value         | absent       |

  # Data layer Live allowed-value expansion 002
  Scenario: Data layer Live allowed-value expansion 002
    Given local rule Known page types revision 1 allows product and content
    And the failed actual value is product_test
    When the operator activates Add this value to schema as an allowed value
    Then a focused review identifies Otelo - Generic Pageview revision 2, /page_type, Known page types revision 1, product and content, and proposed value product_test
    And the review states that the published schema remains unchanged until its working draft is published
    When the operator confirms the addition
    Then the Otelo - Generic Pageview working draft allows product, content, and product_test in that order
    And Known page types retains its stable rule identity, condition, severity, message, and other configuration
    And no second rule, schema, working draft, or allowed value is created

  # Data layer Live allowed-value expansion 003
  Scenario: Data layer Live allowed-value expansion 003
    Given Otelo - Generic Pageview already has a working draft with unrelated pending changes
    When product_test is accepted into local rule Known page types
    Then the allowed-value change is appended to the same working draft
    And all prior pending changes retain their order and content
    And one new pending change identifies the property, rule, and added value
    And cancelling the review leaves the existing working draft unchanged

  # Data layer Live allowed-value expansion 004
  Scenario Outline: Data layer Live allowed-value expansion 004
    Given a typed Allowed values rule does not contain <observed_value>
    When the operator accepts <observed_value> from the Live event
    Then the draft stores <stored_value> as one exact allowed value
    And it remains distinguishable from <different_value>

    Examples:
      | observed_value          | stored_value            | different_value |
      | number 1                | number 1                | string 1        |
      | string 1                | string 1                | number 1        |
      | boolean false           | boolean false           | string false    |
      | null                    | null                    | missing         |
      | string New York, NY     | string New York, NY     | two values      |

  # Data layer Live allowed-value expansion 005
  Scenario: Data layer Live allowed-value expansion 005
    Given /page_type has two Allowed values rules with different stable identities
    And the displayed failure is attributed to Known page types revision 1
    When product_test is accepted from that failure
    Then only Known page types is widened
    And the other rule is unchanged and continues to evaluate independently
    And publication does not report the event as Valid if the other rule still fails
    And the action never creates an additional intersecting Allowed values rule as a substitute for widening the selected rule

  # Data layer Live allowed-value expansion 006
  Scenario: Data layer Live allowed-value expansion 006
    Given Known page types applies only when /site Equals consumer
    And page_view has site consumer and invalid page_type product_test
    When product_test is accepted from the conditional failure
    Then the working draft widens the consequence values without changing its condition
    And page_view with a nonmatching site remains Not applicable to the rule
    And no acceptance action is shown for a Not applicable evaluation

  # Data layer Live allowed-value expansion 007
  Scenario Outline: Data layer Live allowed-value expansion 007
    Given the failing Allowed values rule has <rule_origin>
    When the operator starts accepting the observed value
    Then the focused review offers <origin_choices>
    And no source rule or assigned schema is changed before the operator chooses and confirms a destination

    Examples:
      | rule_origin                  | origin_choices                                                        |
      | local to assigned schema     | update assigned schema working draft                                  |
      | reusable rule attachment     | revise reusable rule or create assigned-schema override               |
      | inherited from parent schema | edit parent working draft or create assigned-schema override          |

  # Data layer Live allowed-value expansion 008
  Scenario: Data layer Live allowed-value expansion 008
    Given Known page types is inherited from Generic parent
    When the operator chooses an assigned-schema override and confirms product_test
    Then the assigned schema working draft atomically replaces the inherited constraint at /page_type with a widened local rule
    And the parent schema and its child schemas remain unchanged
    And inherited and local rules do not both reject product_test after publication

  # Data layer Live allowed-value expansion 009
  Scenario: Data layer Live allowed-value expansion 009
    Given Known page types comes from reusable rule revision 3 pinned to the assigned schema
    When the operator chooses Revise reusable rule and confirms product_test
    Then reusable rule revision 4 is created without mutating revision 3
    And updating the assigned schema attachment is presented as an explicit pending draft change
    And other schemas pinned to revision 3 remain unchanged

  # Data layer Live allowed-value expansion 010
  Scenario: Data layer Live allowed-value expansion 010
    Given the event assignment is pinned to Otelo - Generic Pageview revision 2
    And product_test has been added to a later working draft
    When the quick-action review is displayed
    Then it warns that publishing a later schema revision will not change this event while the assignment remains pinned to revision 2
    And changing assignment version policy is a separate explicit action
    And the operator can still retain the allowed-value draft change

  # Data layer Live allowed-value expansion 011
  Scenario: Data layer Live allowed-value expansion 011
    Given product_test is present once in the targeted working-draft rule
    When the same captured failure attempts to add product_test again
    Then the review identifies that the value is already pending
    And confirmation creates no duplicate value or pending change
    And the operator can open the existing working draft

  # Data layer Live allowed-value expansion 012
  Scenario: Data layer Live allowed-value expansion 012
    Given product_test was added to the assigned schema working draft
    When the operator publishes that schema revision
    Then current Live events are revalidated without being recaptured
    And the targeted Allowed values failure and its quick action disappear when product_test now passes
    And feed, property, rule-revision, and defect-triage results use the published revision
    And the captured event payload and evidence remain unchanged

  # Data layer Live allowed-value expansion 013
  Scenario: Data layer Live allowed-value expansion 013
    Given the quick-action review was opened from /page_type rule details
    When the operator cancels, confirms, opens the working draft, or returns after publication
    Then navigation restores the same captured event and property disclosure when available
    And feed and inspector scroll position are preserved
    And keyboard focus returns to the originating action or its working-draft continuation

