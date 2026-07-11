Feature: Data layer schema inheritance

  Background:
    Given Generic page view version 4 is a saved Payload schema
    And Order confirmation version 2 is a saved Payload schema extending Generic page view version 4

  # Data layer schema inheritance 001
  Scenario: Data layer schema inheritance 001
    When Order confirmation is opened in the schema editor
    Then its parent field identifies Generic page view version 4
    And rules are grouped as active inherited, disabled inherited, explicitly re-enabled, and local
    And each inherited rule offers Inherit, Enabled in this schema, and Disabled in this schema override states
    And every inherited rule identifies its originating schema and version
    And editing Order confirmation cannot mutate Generic page view

  # Data layer schema inheritance 002
  Scenario: Data layer schema inheritance 002
    Given Generic page view requires page_name and allows page_type page, product, or checkout
    When effective rules for Order confirmation are previewed
    Then both inherited rules are active unless Order confirmation overrides their state
    And local Order confirmation rules are evaluated with the effective inherited rules
    And validation issues retain the rule's originating schema identity

  # Data layer schema inheritance 003
  Scenario: Data layer schema inheritance 003
    Given inherited rule Allowed page types is active in Order confirmation
    When the operator disables it for Order confirmation
    Then the inherited rule remains visible with state Disabled in this schema
    And it is excluded from Order confirmation validation
    And Generic page view and sibling schemas continue using the rule
    And the exception appears in Order confirmation revision review

  # Data layer schema inheritance 004
  Scenario: Data layer schema inheritance 004
    Given an ancestor disabled inherited rule Page name required
    When the operator explicitly re-enables it in Order confirmation
    Then the effective state is Enabled in this schema
    And validation evaluates the rule for Order confirmation
    And the inherited disable and local re-enable remain visible in rule provenance

  # Data layer schema inheritance 005
  Scenario: Data layer schema inheritance 005
    Given inherited rule Only declared properties are allowed prevents confirmation_token
    When the operator disables that inherited general rule
    And adds a local Only declared properties rule including confirmation_token
    Then confirmation_token is allowed without weakening Generic page view
    And revision review shows the inherited disable and local replacement separately

  # Data layer schema inheritance 006
  Scenario Outline: Data layer schema inheritance 006
    Given Order confirmation attempts parent relationship <parent_relationship>
    When inheritance validation runs
    Then saving is blocked with reason <blocked_reason>

    Examples:
      | parent_relationship                            | blocked_reason                                      |
      | Order confirmation extends itself              | A schema cannot inherit from itself                 |
      | Generic page view extends Order confirmation   | Schema inheritance cannot contain a cycle           |
      | Payload schema extends Raw input schema        | Parent and child validation targets must match      |

  # Data layer schema inheritance 007
  Scenario: Data layer schema inheritance 007
    Given Generic page view version 5 adds, changes, and removes inherited rules
    When the operator requests updating Order confirmation from parent version 4 to 5
    Then an update review identifies new, changed, removed, disabled, re-enabled, and obsolete-exception rules
    And Order confirmation remains pinned to version 4 before confirmation
    When the operator confirms the parent update
    Then Order confirmation becomes a dirty draft using parent version 5
    And saving the relationship creates a new Order confirmation revision

  # Data layer schema inheritance 008
  Scenario: Data layer schema inheritance 008
    Given an inherited rule and local rule impose contradictory constraints on page_type
    When effective-rule conflict detection runs
    Then the schema draft identifies both rules and their origins
    And saving is blocked until a rule is disabled, removed, or corrected
    And the editor does not resolve the conflict by rule order

  # Data layer schema inheritance 009
  Scenario: Data layer schema inheritance 009
    Given Generic page view version 4 has a child and grandchild schema
    When schema hierarchy is displayed
    Then each schema has at most 1 direct parent
    And inheritance depth, parent version, children, and effective-rule count are visible
    And multiple-parent inheritance is unavailable
