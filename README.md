# Messages

Workers message each other by callsign across runtimes: the tower carries what Claude Code's own `SendMessage` can't,
to or from a worker on opencode. It is an extension of [the tower](https://github.com/RegiByte/the-tower): read the
tower's [guide to extending it](https://github.com/RegiByte/the-tower/blob/main/docs/extending.md) for the terms below
(verbs, facts, launch contributors, runtime plugins). [docs/design.md](docs/design.md) says how it works and why.

## What it adds

- **On Claude Code:** `SendMessage` as always, `to` a callsign. A send Claude can't deliver itself (to a worker on
  opencode) goes through the tower.
- **On opencode:** a `SendMessage` tool, `{to, message}`, as Claude Code's, and a line in the worker's brief naming it.
- **From a shell:** `tower x messages send <CALLSIGN> <<'EOF'` … `EOF` (the verb `messages/send {to, text}`).
- **The fact `sent {to, text}`** in the sender's log, for whoever reads it later (the lab counts a crew's talk from
  it and from the conversations).

The receiver takes a message as a prompt, `<tower-message from="CALLSIGN">…</tower-message>`, once it is free. Two
workers both on Claude Code message each other with SendMessage alone; the tower refuses to carry theirs.

## Add it

It needs the tower 2.0 or later, Node 24, and the `tower` command on the PATH the tower starts its sessions with
(`npm run setup` in the tower links it there with `npm link`): its plugins run `tower x messages send`. It has no
runtime dependencies.

```sh
git clone git@github.com:agencyenterprise/tower-extension-messages.git
```

Then name its folder in the tower's config (`~/.tower/config.json`):

```json
{
  "extensions": {
    "messages": { "path": "/Users/you/code/tower-extension-messages" }
  }
}
```

`tower config check` checks the edit, and `tower extensions` lists it once the tower has read it. A worker started
before it was on its floor has no inbox until it is resumed: `tower submit` types into its composer meanwhile.

### opencode workers left idle

opencode unloads a directory's plugins after an hour with no session running, and loads them back only with the next
prompt. Its inbox goes with them, so a message to an opencode worker idle that long is refused until someone prompts
it. The tower leaves this setting to you: to keep idle workers reachable, set it in your opencode config
(`~/.config/opencode/opencode.json`, or a project's `opencode.json`):

```json
{ "experimental": { "location_idle_timeout": false } }
```

A worker started before the change takes it at its next start or resume.

## For other extensions

An extension whose workers message each other from a shell, or across runtimes, wants it:

```json
{ "wants": { "messages": "1.0" } }
```

It starts without it; `tower x messages send` is then refused as an unknown extension.

## Which version you run

`tower extensions` says it: **Messages 1.0**. The version is `extension.json`'s `version`, `major.minor` as the tower
reads it. A major breaks what other extensions want of it (a name in `contract.json` removed, renamed or changed in
meaning); every other release is a minor. Releases are tagged `v<version>`, and [CHANGELOG.md](CHANGELOG.md) says
what each one changed. To update: `git pull` in your clone, then `tower extensions restart messages`. Workers already
running keep the plugin they started with until they are resumed.

## Working on it

```sh
npm install
npm run types       # tower types .: the library's declarations for this tower, in .tower/ (git-ignored)
npm run typecheck   # the server, the inbox and Claude's listener
npm test            # node --test over the inbox
npm run check       # tower extensions check .
```

Try a change on a tower checkout's sandbox (`npm run sandbox -- up` there), never on your real tower first: name this
folder in the sandbox's config, then message between two workers there with `npm run -s sandbox -- run …`. After a
change to the manifest's names, `tower extensions freeze .` rewrites `contract.json`. Each change adds its line under
`## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md); releasing is [the release skill](.claude/skills/release/SKILL.md)'s.
