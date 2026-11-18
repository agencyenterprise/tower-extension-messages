# Changelog

What changed in each release of Messages, newest first. A version is `extension.json`'s `version`, `major.minor` as
the tower reads it, and each is tagged `v<version>`, the tag's message carrying its section below. How to cut one:
[the release skill](.claude/skills/release/SKILL.md).

## [Unreleased]

## [1.0] - 2026-11-18

### Added
- Messages as a repository of its own, imported from the tower fork's bundled `extensions/messages`: `messages/send`
  (`tower x messages send <CALLSIGN>`), the `sent` fact, opencode's `SendMessage` tool and inbox, and Claude's inbox
  and SendMessage through the tower.
- Its plugins run the `tower` command from the session's PATH, since they no longer live in the tower's checkout.

[Unreleased]: https://github.com/agencyenterprise/tower-extension-messages/compare/v1.0...HEAD
[1.0]: https://github.com/agencyenterprise/tower-extension-messages/releases/tag/v1.0
