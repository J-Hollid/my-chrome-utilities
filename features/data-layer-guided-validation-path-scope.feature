# mutation-stamp: sha256=ec37b2cc6b0790055b922befa7ba02600a2789e3a1af12f78001b84bdfd6fdb7
# acceptance-mutation-manifest-begin
# {"version":1,"tested_at":"2026-07-12T20:15:26.710767479Z","feature_name":"Data layer guided validation path scope","feature_path":"features/data-layer-guided-validation-path-scope.feature","background_hash":"8c9c54ab49f99634678e1ab6f9ee97c7b013d31a9a6d91add240d16702eb057f","implementation_hash":"sha256:guided-validation-architect-v3","scenarios":[{"index":5,"name":"Data layer guided validation path scope 006","scenario_hash":"a98255f87e2b8777aa2413c811a26f8b6091aef5426fd1be4ad2828fa959288f","mutation_count":6,"result":{"Total":6,"Killed":6,"Survived":0,"Errors":0},"tested_at":"2026-07-12T20:15:26.710767479Z"},{"index":2,"name":"Data layer guided validation path scope 003","scenario_hash":"86246f8f1504c6a4a9c4abaebd6fd1c3340079e8241e8b8f86f54b04e87d48bc","mutation_count":20,"result":{"Total":20,"Killed":20,"Survived":0,"Errors":0},"tested_at":"2026-07-12T20:13:22.522686925Z"}]}
# acceptance-mutation-manifest-end

Feature: Data layer guided validation path scope

  Background:
    Given a guided validation draft is open for pageview from http://127.0.0.1:4173/

  # Data layer guided validation path scope 001
  Scenario: Data layer guided validation path scope 001
    When event scope is displayed
    Then the operator can choose This domain on all paths, Only the current path, Selected paths or patterns, or Every domain and path
    And This domain on all paths is selected by default
    And domain 127.0.0.1, event pageview, captured source, and payload target are prefilled
    And the operator is not asked to type any

  # Data layer guided validation path scope 002
  Scenario: Data layer guided validation path scope 002
    Given Selected paths or patterns is chosen
    When the path condition builder opens
    Then the current pathname / is offered as an Exact path condition
    And each condition has a match type, expression, match result, and Remove condition action
    And Add another path condition adds one separately labelled condition
    And the scope states that the assignment matches when any condition matches

  # Data layer guided validation path scope 003
  Scenario Outline: Data layer guided validation path scope 003
    Given one <match_type> condition has expression <expression>
    When pathname <pathname> is tested
    Then pathname <pathname> is a <condition_result> for that condition

    Examples:
      | match_type         | expression               | pathname                     | condition_result |
      | Exact path         | /products                 | /products                    | match            |
      | Exact path         | /products                 | /products/field-notebook     | no match         |
      | Path pattern       | /products/*               | /products/field-notebook     | match            |
      | Regular expression | ^/products/[a-z-]+$       | /products/field-notebook     | match            |
      | Regular expression | ^/products/[a-z-]+$       | /shop/products/field-notebook | no match        |

  # Data layer guided validation path scope 004
  Scenario: Data layer guided validation path scope 004
    Given path conditions are Exact path / and Path pattern /products/*
    When pathname /products/field-notebook is tested
    Then the combined condition result is match
    And the matching Path pattern condition is identified
    And the Exact path condition is not required to match

  # Data layer guided validation path scope 005
  Scenario: Data layer guided validation path scope 005
    Given a Regular expression condition is being edited
    When its expression is malformed
    Then the condition identifies the syntax error and cannot be saved
    And a valid expression is tested against the current pathname without leaving the form
    And Test another path accepts a pathname and reports whether the entire pathname matches

  # Data layer guided validation path scope 006
  Scenario Outline: Data layer guided validation path scope 006
    Given Exact path condition /products is saved
    When captured URL <captured_url> is evaluated
    Then pathname used for matching is <matched_pathname>
    And the saved condition returns <condition_result>

    Examples:
      | captured_url                                      | matched_pathname            | condition_result |
      | https://127.0.0.1/products?sort=price#details     | /products                   | match            |
      | https://127.0.0.1/products/field-notebook?x=1     | /products/field-notebook    | no match         |
