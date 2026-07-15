# mutation-stamp: sha256=82c00bd1e512e3e14127030e6272d123a8135caf227c3b8bad79baae43754dd7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-15T09:53:57.615519722Z","feature_name":"Data layer schema property copy","feature_path":"features/data-layer-schema-property-copy.feature","background_hash":"f535149164881a0f287e9b3505e34047b552b3bdd8096edae7eab2021ada73b1","implementation_hash":"sha256:1446528cd95c26733b0afd9710f3fc0cd3df3ad652b60b6640b2546035b8bf0a","scenarios":[{"index":3,"name":"Data layer schema property copy 004","scenario_hash":"f8d76a188795932064c8dcd944e88c7ccc58238c42d62a362e3369e592bd7acd","mutation_count":3,"result":{"Total":3,"Killed":3,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:53:57.615519722Z"},{"index":6,"name":"Data layer schema property copy 007","scenario_hash":"67cc064cc966fd6fa205d4aae8d1c6a96b2adc4b905c89602f126f474e1c56b3","mutation_count":12,"result":{"Total":12,"Killed":12,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:53:57.615519722Z"},{"index":7,"name":"Data layer schema property copy 008","scenario_hash":"58d014d52c2d993f798e9c6cbefe126104d8c1988ff787e0315de9f7f592c48f","mutation_count":24,"result":{"Total":24,"Killed":24,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:53:57.615519722Z"},{"index":10,"name":"Data layer schema property copy 011","scenario_hash":"c3aebe3f79b94916127462555e9b2c9306ac02bd91cd80f21718f1392862df44","mutation_count":9,"result":{"Total":9,"Killed":9,"Survived":0,"Errors":0},"tested_at":"2026-07-15T09:53:57.615519722Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer schema property copy

  Background:
    Given Generic pageview revision 7 contains documented properties with local, reusable, and conditional validation rules
    And Generic in-page event revision 3 is a distinct destination schema
    And neither schema has been published with pending copy changes

  # Data layer schema property copy 001
  Scenario: Data layer schema property copy 001
    Given the operator is reviewing /error_message in Generic pageview
    When Copy to another schema is activated
    Then available destination schemas exclude the same source revision
    And Generic in-page event can be selected
    And a copy review identifies source revision, destination revision, selected path, property definitions, required relationships, rules, conditions, dependencies, documentation, and conflicts
    And nothing changes before the operator confirms the review

  # Data layer schema property copy 002
  Scenario: Data layer schema property copy 002
    Given /commerce is an object containing currency, total, and products descendants
    And descendants contain nested objects and array items
    When /commerce is copied to Generic in-page event
    Then the complete /commerce subtree is copied once
    And object properties, array item definitions, types, constraints, required relationships, order, and documentation are preserved
    And rules targeting /commerce or any descendant are included in the review
    And no source sibling outside /commerce is copied unless required by a copied condition

  # Data layer schema property copy 003
  Scenario: Data layer schema property copy 003
    Given source path /context/user/id is selected
    And Generic in-page event has no /context path
    When the copy is confirmed
    Then structural ancestors /context and /context/user are created
    And only selected child /context/user/id is copied beneath them
    And each created ancestor preserves its source object or array type and required relationship
    And unrelated source siblings are absent

  # Data layer schema property copy 004
  Scenario Outline: Data layer schema property copy 004
    Given selected source path is <selected_path>
    When its nested structure is copied
    Then destination property path is <selected_path>
    And copied rule path is <selected_path>

    Examples:
      | selected_path     |
      | /products         |
      | /products/*/id    |
      | /a~1b/tilde~0name |

  # Data layer schema property copy 005
  Scenario: Data layer schema property copy 005
    Given /error_message is conditionally required when /error_action exists
    And /error_type has allowed values business and technical
    When the shared error properties are copied
    Then required, allowed-values, exact-value, and other property rules retain typed parameters, severity, message, enabled state, and condition groups
    And the conditional rule still targets /error_message and predicates still reference canonical /error_action
    And copying does not flatten conditional rules into unconditional validation
    And rule order remains deterministic

  # Data layer schema property copy 006
  Scenario: Data layer schema property copy 006
    Given selected /error_message has a copied rule whose predicate references sibling /error_action
    And /error_action has a rule conditioned by /error_type
    When dependency closure is reviewed
    Then /error_action and /error_type definitions, ancestor paths, property-scoped rules, conditions, and documentation are included as dependencies
    And each dependency states which copied condition requires it
    And repeated and cyclic dependencies appear once
    And excluding a dependency also excludes dependent rules or blocks confirmation until the plan is valid

  # Data layer schema property copy 007
  Scenario Outline: Data layer schema property copy 007
    Given included rule has <source_ownership>
    When the copy plan is applied
    Then destination ownership is <destination_ownership>
    And later source edits have <later_edit_effect>

    Examples:
      | source_ownership                         | destination_ownership                                      | later_edit_effect                         |
      | source-owned local rule                  | independent local copy with new identity and source provenance | no automatic destination change       |
      | reusable rule attachment                 | attachment to the same reusable rule identity              | reusable revisions follow attachment policy |
      | inherited rule not otherwise shared      | local snapshot identifying inherited origin                | no automatic destination change           |
      | inherited reusable rule already effective in destination | existing effective attachment without a local duplicate | one effective shared rule remains      |

  # Data layer schema property copy 008
  Scenario Outline: Data layer schema property copy 008
    Given destination contains <existing_state>
    When the copy plan is reviewed
    Then review outcome is <review_outcome>
    And confirmation behavior is <confirmation_behavior>

    Examples:
      | existing_state                                | review_outcome                                  | confirmation_behavior                                 |
      | no selected path                              | clean addition                                  | enabled                                               |
      | identical property and rule                   | reuse with no duplicate                         | enabled                                               |
      | compatible parent with missing child          | merge missing child                             | enabled                                               |
      | same path with different property type        | property conflict                               | choose keep destination, replace from source, or cancel |
      | ancestor with incompatible non-container type | blocked structural conflict                     | disabled until destination structure changes          |
      | same local rule semantics with different id   | semantic duplicate reused                       | enabled                                               |
      | same rule identity with different configuration | rule conflict                                 | choose one configuration or cancel                     |
      | different documentation at the same path      | documentation conflict                          | choose destination text, source text, or cancel        |

  # Data layer schema property copy 009
  Scenario: Data layer schema property copy 009
    Given replacing a destination subtree would remove destination-owned descendants, rules, conditions, or documentation
    When Replace from source is selected
    Then the review lists every destination item that will be replaced or removed
    And a separate destructive confirmation is required
    And cancelling either confirmation leaves the destination unchanged
    And source content is never changed by destination conflict resolution

  # Data layer schema property copy 010
  Scenario: Data layer schema property copy 010
    Given the copy review has no unresolved conflicts or dependencies
    When the operator confirms Copy to Generic in-page event
    Then one atomic change is written to the destination working draft
    And the pending change identifies copied source schema revision and selected property path
    And the destination current published revision remains unchanged
    And Undo restores the exact pre-copy document, rules, conditions, documentation, and pending changes
    And the copied result is not published automatically

  # Data layer schema property copy 011
  Scenario Outline: Data layer schema property copy 011
    Given the operator copies from <source_view>
    When the review identifies its source snapshot
    Then copied configuration comes from <copied_snapshot>
    And source label is <source_label>

    Examples:
      | source_view                         | copied_snapshot                    | source_label                         |
      | current published revision 7        | immutable revision 7               | Generic pageview revision 7          |
      | visible working draft based on 7    | current visible working draft      | Generic pageview working draft based on 7 |
      | historical revision 5               | immutable revision 5               | Generic pageview revision 5          |

  # Data layer schema property copy 012
  Scenario: Data layer schema property copy 012
    Given a property copy has been applied to Generic in-page event
    When the source property, local rule, condition, or documentation is later edited
    Then copied destination-owned configuration does not change
    And reusable attachments change only under their existing revision policy
    And repeating the same copy produces a review of differences rather than silent synchronization
    And property copy is distinguishable from schema inheritance and reusable-rule ownership

  # Data layer schema property copy 013
  Scenario: Data layer schema property copy 013
    Given copied error properties and rules are present in the destination working draft
    When destination draft validation and review are performed
    Then copied properties appear once in the schema tree at canonical paths
    And copied rules evaluate with the same applicable and not-applicable conditions as the source snapshot for equivalent payloads
    And destination-specific assignments and schema-level documentation are unchanged
    And publishing remains subject to the ordinary working-draft review
