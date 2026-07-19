Feature: Data layer layered schema constraints runtime

  Background:
    Given the built extension is running with the production project repository, shared schema editor, compiler, assignment resolver, and per-Event validator
    And Shop project contains Sitewide, Purchase, Checkout, Shipping, and Alternative shipping

  # Data layer layered schema constraints runtime 001
  Scenario: Data layer layered schema constraints runtime 001
    Given production Saved Schema Library contains Sitewide schema revision 4 with nested properties, rules, documentation, and examples
    When actual controls adopt Sitewide schema as Shared Profile Sitewide
    Then canonical project storage contains one project-owned Shared Profile with saved schema source identity, source revision, and adoption provenance
    And production Saved Schema Library bytes remain unchanged
    And Builder and side panel render the same structured property tree, search, filtering, nested object and array authoring, scalar types, required and forbidden controls, allowed values, regular expressions, ranges, cardinality, conditional rules, reusable rules, documentation, examples, and revision comparison
    And actual structured edits from either surface persist to the same canonical Shared Profile draft after reload
    And neither surface requires advanced JSON for complete authoring

  # Data layer layered schema constraints runtime 002
  Scenario: Data layer layered schema constraints runtime 002
    When actual controls open Schema constraints for Purchase, Checkout, Shipping, Alternative shipping, and its Purchase occurrence
    Then each rendered editor identifies the contributor by human name and scope
    And each separates inherited constraints, local contributions, effective results, superseded expectations, and blocking conflicts
    And the installed Add constraint control searches inherited paths before offering a new property
    And each stored contribution contains its target events, condition, enforcement policy, and stable contributor reference
    When actual controls switch to the compiled Alternative shipping Purchase property tree
    Then one read-only production property tree renders Shared Profile, Event, Page Group, Page, Flow Page-instance, and Event-occurrence provenance in specificity order

  # Data layer layered schema constraints runtime 003
  Scenario Outline: Data layer layered schema constraints runtime 003
    Given production Sitewide contributes <base contribution>
    When actual controls make Shipping contribute <specific contribution>
    Then the production compiler returns <outcome>
    And the rendered property result explains <explanation>

    Examples:
      | base contribution                 | specific contribution       | outcome | explanation                                      |
      | type string                       | type number                 | blocked | type cannot change                               |
      | allowed values 3a and 3b          | allowed value 3b            | ready   | allowed values narrow to 3b                      |
      | allowed values 3a and 3b          | allowed value 4             | blocked | 4 is outside the base allowed universe           |
      | required                          | optional                    | blocked | required cannot be silently relaxed              |
      | forbidden                         | permitted                   | blocked | a forbidden property cannot be re-enabled        |
      | string matching the base pattern  | a second compatible pattern | ready   | both patterns apply                               |
      | one conditional validation rule   | another conditional rule    | ready   | both conditions apply unless one names an override slot |

  # Data layer layered schema constraints runtime 004
  Scenario: Data layer layered schema constraints runtime 004
    Given production Sitewide defines funnel_step as an optional string allowed to be 1, 2, 3a, or 3b
    And Checkout contributes required funnel_step plus invariant funnel_name checkout
    And Shipping stores overridable expectation funnel_step equal to 3a
    When actual Alternative shipping controls replace that expectation with 3b
    Then the production effective schema fixes funnel_step to 3b while retaining every Checkout invariant
    And rendered provenance says Alternative shipping supersedes Shipping expectation 3a while inheriting Checkout and Sitewide invariants
    When actual controls lock Shipping expectation 3a as invariant
    Then production compilation blocks Alternative shipping value 3b at funnel_step
    And the installed conflict links to Shipping and Alternative shipping without silently choosing by precedence

  # Data layer layered schema constraints runtime 005
  Scenario: Data layer layered schema constraints runtime 005
    Given Checkout stores constraints targeting all Events, context Events, interaction Events, and Purchase only
    And Shipping stores a constraint targeting all Events on that Page
    And Alternative shipping stores a constraint targeting every contained Event occurrence
    And its Purchase occurrence stores one occurrence-only constraint
    When production effective schemas compile for the Page context Event, Purchase, and an unrelated interaction Event
    Then each compiled document contains exactly the contributions whose stored targets include it
    And the occurrence-only contribution appears only in Alternative shipping Purchase
    And rendered inclusion and exclusion evidence names contributor and target scope

  # Data layer layered schema constraints runtime 006
  Scenario: Data layer layered schema constraints runtime 006
    Given Alternative shipping is registered for matcher-driven production activation
    And its applicability is All of pathname matching /checkout/shipping, page_name equalling shipping, checkout_variant equalling alternative, and Event equalling Purchase
    When the installed matcher test receives one complete match and three observations each differing in one property
    Then exactly the complete match selects Alternative shipping Purchase
    And each rejected observation identifies its failed rendered predicate
    And production assignment evidence contains applicability inputs without inferred Flow sequence
    When an equal-priority production candidate also matches the complete observation
    Then automatic selection is blocked as ambiguous and renders both human candidate names
    When actual controls give one candidate higher priority and retest
    Then that candidate wins and assignment evidence retains the rejected match

  # Data layer layered schema constraints runtime 007
  Scenario: Data layer layered schema constraints runtime 007
    Given validating against Alternative shipping requires an explicit operator choice
    When actual validation controls select Alternative shipping Purchase by Flow, Page, and Event names
    Then the production validator uses that compiled effective schema without automatic applicability evaluation
    And unified evaluation records manual selection, stable compiled target identity, effective schema revision, issues, and provenance
    And rendered output claims no automatic assignment winner

  # Data layer layered schema constraints runtime 008
  Scenario: Data layer layered schema constraints runtime 008
    Given Alternative shipping is registered as non-executable specification content
    When actual controls generate its effective schema and developer export
    Then production compilation returns complete property and provenance detail while excluding that target from automatic and manual validation choices
    And rendered export states Alternative shipping branch, Shipping Page, Purchase Event, funnel_step equals 3b, inherited funnel_name equals checkout, and Documentation only not automatically validated
    And exported rows distinguish inherited constraints, local differences, conditions, and activation
    And production assignment indexes contain no documentation-only target or resulting ambiguity

  # Data layer layered schema constraints runtime 009
  Scenario: Data layer layered schema constraints runtime 009
    Given actual controls select a Page Group, Page frame, or Event occurrence on the installed Flow canvas
    When the contextual Inspector renders its Schema constraints summary
    Then it shows inherited, local, effective, conflict, and activation counts while the canvas remains mounted
    And one action opens the complete shared schema editor in the production main workspace at that contributor
    And returning to the Flow restores the selected canvas item and viewport
    And an actual consequential save names affected scopes, stale compiled targets, Draft status, and one Undo action

  # Data layer layered schema constraints runtime 010
  Scenario: Data layer layered schema constraints runtime 010
    Given production applicability selects Alternative shipping Purchase for an observed Event
    And its compiled schema requires funnel_step with fixed value 3b
    When the production validator receives otherwise valid Purchase observations containing funnel_step 3b and 3a
    Then the 3b result contains no issue for /funnel_step
    And the 3a result contains path /funnel_step, code EXPECTED_VALUE, severity error, expected 3b, actual 3a, and Alternative shipping provenance
    And both unified results contain the selected stable target and effective schema revision
    And neither installed result claims that an expected Flow sequence or occurrence completed
