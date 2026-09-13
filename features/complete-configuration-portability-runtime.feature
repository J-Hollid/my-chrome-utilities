# Complete configuration portability runtime 001 through 003
Feature: Complete configuration portability runtime

  Background:
    Given the built extension uses production storage, archive handlers, and import controls

  # Complete configuration portability runtime 001
  Scenario: Complete configuration portability runtime 001
    Given one profile contains the complete configuration fixture and another profile is empty
    When native pointer input exports complete configuration from the source profile
    And the recipient selects that exact file through quick setup
    And native keyboard input confirms Set up from configuration once
    Then every included domain and asset matches the source under the declared identity mapping
    And the imported images and Excel templates work after reload
    And all dialogs have visible controls and leave the extension responsive

  # Complete configuration portability runtime 002
  Scenario Outline: Complete configuration portability runtime 002
    Given the project contains <assets>
    When the operator exports it through <surface>
    And imports that exact archive through the other project surface
    Then the project and all referenced asset bodies work after reload
    And the file picker accepts the generated archive

    Examples:
      | assets                       | surface              |
      | images without Excel bodies  | Specification Studio |
      | images and Excel bodies      | Projects             |

  # Complete configuration portability runtime 003
  Scenario Outline: Complete configuration portability runtime 003
    Given a valid complete archive and a recipient with existing configuration
    When <interruption> occurs before configuration commit
    Then the prior configuration remains usable after extension restart
    And no imported project or library subset appears as a completed setup

    Examples:
      | interruption                 |
      | the operator cancels staging |
      | durable storage rejects commit |
