# Design

How Messages works and why it is an extension. It began as the tower fork's decision `tower-messages`, bundled in the
fork's `extensions/messages`, and moved here so the tower's core carries no messaging of its own.

## The problem

Claude's workers reach each other with Claude Code's own `SendMessage`, which reaches no opencode session, and
opencode has no messages between workers of its own. A crew mixing runtimes, as the lab's do (roles on another model
family through opencode), couldn't talk: `tower submit` typed into a composer, refused while the worker was busy or
its composer held text, signed by nothing but its text, and needed a session id.

## Why an extension

The tower's extensions can do everything it needs: a plugin for each runtime (`runtimes.<runtime>.plugins`), a verb
with a CLI word, a session fact, and a launch contributor for the brief. So it is one (the tower's principle:
extension before core), and the core keeps no messages of its own.

## How

- **An inbox per running worker.** The runtime's plugin listens on `<root>/inbox/<session id>.sock`
  ([`inboxPath`](../inbox.ts), from the hooks socket's directory in the session, the board's `config` in the server;
  [`listenInbox`](../inbox.ts)). opencode's plugin listens in its own process; Claude's runs
  [`claude/listen.ts`](../claude/listen.ts) with node (Claude's mods API listens on no socket), which prints each
  message for the module to submit with `$.prompt.submit`. Neither refuses a busy worker: Claude takes the prompt in a
  turn of its own once the running one ends, opencode queues it on the conversation. The socket is no stored state: a
  listener gone leaves a file nothing answers on, which the next replaces.
- **The verb.** `messages/send {to, text}` (`tower x messages send <CALLSIGN>`, the text on stdin), from a worker
  only, finds the receiver by callsign (the sender's floor first), wraps the text in an envelope naming the sender
  ([`towerMessage`](../inbox.ts), `<tower-message from="CALLSIGN">`), hands it to the receiver's inbox with the
  conversation its card last entered ([`Letter`, `deliver`](../inbox.ts)), then logs `sent {to, text}` in the
  sender's log (`tower.x.messages.sent`). It refuses a pair both on Claude Code (their own SendMessage connects them,
  and a refusal Claude meant, the worker gone or a hook's policy, stands), a worker not running, a floor where it is
  off, and a worker with no inbox (`unavailable`, naming `tower submit`).
- **opencode's SendMessage.** Its plugin ([`opencode/index.js`](../opencode/index.js)) adds a `SendMessage` tool,
  `{to, message}` as Claude's, which runs the verb. Its inbox queues each message with `ctx.session.prompt` on the
  conversation the letter names: the plugin runs in opencode's server process, apart from the TUI that opens a resumed
  conversation with `-s`, so it can't tell that one itself, while the tower's card holds it from the host's resume
  fact. The launch contributor ([`server.ts`](../server.ts)) adds a line to an opencode worker's brief naming the tool,
  after the core's line saying the runtime has no messaging of its own.
- **Claude's SendMessage, through the tower.** Claude's module
  ([`claude/hooks/register.js`](../claude/hooks/register.js)) lets Claude's own SendMessage go first. For a name no
  Claude session carries, the tool answers its own refusal whatever a `session.send` hook returns, so the module's
  `tool.call` hook replaces a refused call's result when `to` is a callsign: the verb's answer, or both refusals, in
  the tool's shape. Claude's peer protocol and its files are never touched.
- **The `tower` command.** Both plugins run `tower x messages send` from the PATH the tower started the session with,
  which `npm run setup` in the tower fills with `npm link`. Bundled, they named the tower mod's own `bin/tower` beside
  them; out of the tower's checkout there is no such path to name.
- **An idle opencode worker loses its inbox unless the user's config says otherwise.** opencode unloads a directory's
  plugins after an hour with no session running, and the inbox with them, until its next prompt. The tower's launch
  leaves `experimental.location_idle_timeout` to the user's own `opencode.json`, so the [README](../README.md) asks
  for `false` there; without it, a message to a worker idle that long is refused `unavailable`, and its next prompt
  brings the inbox back.

## Not here

No read lists the messages: the receiver's log keeps the envelope in its prompt, and the sender's the `sent` fact, for
any later reading (the lab derives its counts from conversations).

## Alternatives considered

- **Core, as the fork first had it** (`POST /message`, an inbox in the mod, `tower.message`). It grows the core and
  conflicts with every upstream sync; extensions now reach every surface it needs.
- **Bundled in the fork.** It kept the fork's tree apart from upstream's for a capability any tower can add by path,
  as the lab and compute are.
- **`tower submit` for the delivery.** Refused while the worker asks something or its composer holds text, and read
  as the user's turn.
- **A `session.send` hook for Claude's fallback.** Tried first: the tower delivered, but Claude's tool still told the
  model the name was unreachable, its refusal of an unknown name standing after the hooks.
- **The opencode plugin tracking its own main conversation.** A resume's conversation is opened by the TUI process and
  raises nothing until it runs, so a message sent to a freshly resumed worker had nowhere to go.

## Impact

Workers on Claude and opencode message each other alike by callsign, signed, waiting for the receiver to be free. A
worker that started before the extension was on its floor has no inbox until resumed.
