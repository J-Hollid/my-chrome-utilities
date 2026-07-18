Feature: Data layer effective requirement coverage correction

  Background:
    Given coverage is computed from the compiled project and current fixture evidence

  # Data layer effective requirement coverage correction 001
  Scenario: Data layer effective requirement coverage correction 001
    Given Retail and Trade release contexts are compiled
    When the coverage matrix opens
    Then its coordinates are Page, Event, Flow step, and Effective requirement
    And a named entity without route, event identity, step reference, or effective requirement is not marked Covered

  # Data layer effective requirement coverage correction 002
  Scenario: Data layer effective requirement coverage correction 002
    Given the Retail confirmation cell for /ecommerce/value is covered
    When the operator inspects it
    Then the cell names its applicability winner, origin profile, compiled schema revision, proving fixture, and release scope

  # Data layer effective requirement coverage correction 003
  Scenario: Data layer effective requirement coverage correction 003
    Given the Trade confirmation context has no fixture proving /account_id
    When coverage is computed
    Then the exact Trade Page, Purchase Event, Confirmation step, and /account_id cell is Missing
    And the gap is a release blocker under the configured policy

  # Data layer effective requirement coverage correction 004
  Scenario: Data layer effective requirement coverage correction 004
    Given an optional Upsell step has an intentionally untested requirement
    When an authorized operator records a waiver with reason and scope
    Then the cell is Waived rather than Covered
    And waiver author, reason, expiry, affected release, and impact remain visible

  # Data layer effective requirement coverage correction 005
  Scenario: Data layer effective requirement coverage correction 005
    Given a Missing or Ambiguous coverage cell is visible
    When the operator opens it
    Then the exact editable Page, Event, Flow step, Applicability, Profile, or Fixture field is reached within 2 actions
    And returning restores the matrix pivot, filter, selection, and scroll position

  # Data layer effective requirement coverage correction 006
  Scenario: Data layer effective requirement coverage correction 006
    Given a Profile or Applicability Set changes
    When coverage recomputes
    Then every affected cell is marked Stale until production fixture evidence reruns
    And unrelated cells retain their evidence revisions

  # Data layer effective requirement coverage correction 007
  Scenario: Data layer effective requirement coverage correction 007
    Given the matrix has 500 requirements and 50 flows
    When the operator pivots, filters, and scrolls beyond the first 40 rows
    Then every matching cell remains reachable through real windowing
    And bounded rendering does not omit off-screen coverage data
