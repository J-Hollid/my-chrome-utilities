# mutation-stamp: sha256=62c76ca1980c9194dd8d59833922fcedc9d4728d87f8c792d5031c91fe4d7642
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-14T18:50:02.620006855Z","feature_name":"Data layer local rule promotion","feature_path":"features/data-layer-local-rule-promotion.feature","background_hash":"0ee8d3b24379dd0786c2c91906e38d252d8ef212fe3e891b59d907d069348bf8","implementation_hash":"unknown","scenarios":[{"index":0,"name":"Data layer local rule promotion 001","scenario_hash":"26946603230c0d6996f654f87b5f56c5fd56b9944b14946803d951199dd436e2","mutation_count":10,"result":{"Total":10,"Killed":10,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:38.968138198Z"},{"index":3,"name":"Data layer local rule promotion 004","scenario_hash":"aaab42af099a7c5d07bb7d9568a2be00af8ab42e7028fcade609d7a2f58d03c4","mutation_count":16,"result":{"Total":16,"Killed":16,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:38.968138198Z"},{"index":6,"name":"Data layer local rule promotion 007","scenario_hash":"7868bfcf348ce530812005af220191cbf58df3586aeac19c3fe9ecf171eeab86","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:38.968138198Z"},{"index":8,"name":"Data layer local rule promotion 009","scenario_hash":"3fb8fc8ce8fa93d38f56f363d57c61fedc4a978f297880a7876de6b501c63598","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-14T18:37:38.968138198Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer local rule promotion

  Background:
    Given Page view revision 3 has an open working draft in the schema editor
    And local rule Known page types is attached to /page_type in that working draft

  # Data layer local rule promotion 001
  Scenario Outline: Data layer local rule promotion 001
    Given the displayed rule has <rule_origin>
    When its attached-rule actions are displayed
    Then Promote to reusable rule is <action_state>

    Examples:
      | rule_origin                         | action_state |
      | local to the working draft          | available    |
      | reusable Rule Library attachment    | absent       |
      | active inherited rule               | absent       |
      | disabled inherited rule             | absent       |
      | historical published revision rule  | absent       |

  # Data layer local rule promotion 002
  Scenario: Data layer local rule promotion 002
    Given Known page types allows typed values product and content with severity warning
    And it has issue message Use a known page type and a condition on /site
    When the operator activates Promote to reusable rule
    Then a focused review identifies Page view working draft, /page_type, and local rule Known page types
    And it displays the operator, typed parameters, applicable type, severity, message, condition, and enabled state to be retained
    And Rule name is empty and required
    And Description and Examples are optional
    And no Rule Library entry or schema attachment changes before confirmation

  # Data layer local rule promotion 003
  Scenario: Data layer local rule promotion 003
    When the operator confirms promotion with name Approved page types
    Then Approved page types revision 1 receives a new stable reusable-rule identity in the Rule Library
    And its operator, typed parameters, applicable type, severity, message, condition, enabled state, description, and examples match the reviewed promotion
    And the selected local attachment is replaced at /page_type by one attachment pinned to Approved page types revision 1
    And the attachment retains its position among the property's rules
    And one pending change records the source local identity and destination reusable identity
    And Page view revision 3 remains published and unchanged
    And no duplicate local or reusable attachment evaluates at /page_type

  # Data layer local rule promotion 004
  Scenario Outline: Data layer local rule promotion 004
    Given the selected local rule has <configuration>
    When it is promoted and the working draft validation preview refreshes
    Then <accepted_value> has result Passed before and after promotion
    And <rejected_value> has result <rejected_result> before and after promotion

    Examples:
      | configuration                                          | accepted_value | rejected_value | rejected_result |
      | typed Allowed values containing number 1               | number 1       | string 1       | Failed          |
      | Numeric range from 0 through 100                       | number 50      | number 101     | Failed          |
      | Required applying only when /page_type Equals product  | string SKU-1   | missing value  | Failed          |
      | disabled Regular expression beginning with SKU-        | string OTHER   | string OTHER   | Not applicable  |

  # Data layer local rule promotion 005
  Scenario: Data layer local rule promotion 005
    Given Approved page types revision 2 has the same validation definition and applicable type as Known page types
    When the promotion review opens
    Then Approved page types revision 2 is offered as an existing equivalent reusable rule
    And using the existing rule is the recommended action
    When the operator chooses Use existing reusable rule
    Then no reusable rule or revision is created
    And the local attachment is replaced at /page_type by one attachment pinned to Approved page types revision 2

  # Data layer local rule promotion 006
  Scenario: Data layer local rule promotion 006
    Given an equivalent reusable rule is offered
    When the operator chooses Create a separate reusable rule with unique name Consumer page types
    Then a duplicate-definition warning remains visible for confirmation
    When the operator confirms the warning
    Then Consumer page types revision 1 is created and attached once
    And the existing equivalent reusable rule remains unchanged

  # Data layer local rule promotion 007
  Scenario Outline: Data layer local rule promotion 007
    Given the Rule Library contains differently defined rule Approved page types
    And the operator entered <candidate_name>
    When promotion validation runs
    Then confirmation is <confirmation_state>
    And assistance is <assistance>

    Examples:
      | candidate_name       | confirmation_state | assistance                                      |
      | blank                | blocked            | Enter a reusable rule name                      |
      | Approved page types  | blocked            | Open or use the existing differently defined rule |
      | Consumer page types  | available          | Review and confirm promotion                    |

  # Data layer local rule promotion 008
  Scenario: Data layer local rule promotion 008
    Given /page_type has two local rules named Known page types with different stable identities
    And the operator opened promotion from the second rule
    When Consumer page types revision 1 is created
    Then only the second local identity is replaced
    And the first local rule remains unchanged and evaluates independently
    And display names are not used to choose the source attachment

  # Data layer local rule promotion 009
  Scenario Outline: Data layer local rule promotion 009
    Given promotion review is open with valid metadata
    When promotion completes by <completion_event>
    Then schema state is <schema_outcome>
    And Rule Library state is <library_outcome>

    Examples:
      | completion_event                    | schema_outcome                         | library_outcome                         |
      | the operator cancels                | the local attachment remains unchanged | no reusable rule is created             |
      | saving the reusable rule fails      | the local attachment remains unchanged | no partial reusable rule remains        |
      | saving the schema draft fails       | the local attachment remains unchanged | no partial reusable rule remains        |
      | confirmation succeeds               | one reusable attachment replaces local | one reusable revision is saved          |

  # Data layer local rule promotion 010
  Scenario: Data layer local rule promotion 010
    Given Approved page types revision 1 replaced the local rule in the working draft
    When the operator publishes Page view revision 4
    Then new validation uses Approved page types revision 1 at /page_type
    And Page view revision 3 and its historical validation evidence retain the former local rule identity
    And other schemas do not acquire the reusable rule without an explicit attachment

  # Data layer local rule promotion 011
  Scenario: Data layer local rule promotion 011
    Given promotion review was opened from Known page types at /page_type
    When the operator cancels, uses an existing rule, or creates a reusable rule
    Then the schema editor restores /page_type and its attached-rule disclosure
    And scroll position is preserved
    And keyboard focus returns to the originating action or the replacement reusable attachment
