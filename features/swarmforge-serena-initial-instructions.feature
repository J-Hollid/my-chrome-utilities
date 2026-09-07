# SwarmForge Serena initial instructions 001
# SwarmForge Serena initial instructions 002
# SwarmForge Serena initial instructions 003
Feature: SwarmForge Serena initial instructions

  Background:
    Given the optional read-only Serena setup uses the existing pinned installation

  # SwarmForge Serena initial instructions 001
  Scenario Outline: SwarmForge Serena initial instructions 001
    Given the receiving role is <role> in its assigned worktree
    When its effective Serena server and client settings are generated
    Then both tool filters permit initial_instructions and the existing symbol tools
    And a pinned MCP connection can initialize and list initial_instructions
    And initial_instructions succeeds before a scoped symbol query against authored code
    And the symbol result belongs to the assigned worktree
    And editing, shell, project switching, memories, and onboarding stay disabled

    Examples:
      | role       |
      | specifier  |
      | coder      |
      | refactorer |
      | architect  |

  # SwarmForge Serena initial instructions 002
  Scenario: SwarmForge Serena initial instructions 002
    Given an installed worktree has the old five-tool project and global configurations
    When the owned local configuration is refreshed twice
    Then the project, global, and client filters expose initial_instructions
    And both refreshes preserve the pinned installation and unrelated settings
    And no download, package installation, or busy-role restart occurs
    And the refreshed connection remains optional and read-only

  # SwarmForge Serena initial instructions 003
  Scenario Outline: SwarmForge Serena initial instructions 003
    Given the configured Serena connection has <condition>
    When the required instruction-to-symbol sequence is assessed
    Then the role reports the specific unavailable step without claiming usable tools
    And ordinary inspection continues with a short fallback reason
    And a successful server initialization alone cannot satisfy the regression

    Examples:
      | condition                                  |
      | initial_instructions missing from the server filter |
      | initial_instructions missing from the client filter |
      | an unavailable pinned server               |
