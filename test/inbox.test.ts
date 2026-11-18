import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'
import { deliver, inboxPath, type Letter, listenInbox, towerMessage } from '../inbox.ts'

const root = mkdtempSync(path.join(tmpdir(), 'messages-'))
after(() => rmSync(root, { recursive: true, force: true }))

test('a message is wrapped in an envelope naming its sender', () => {
  assert.equal(towerMessage('VERA-08', 'done: see a1b2c3'), '<tower-message from="VERA-08">\ndone: see a1b2c3\n</tower-message>')
})

test('an inbox is the session’s socket under the system root', () => {
  assert.equal(inboxPath('/home/u/.tower', 's1'), '/home/u/.tower/inbox/s1.sock')
})

test('a letter delivered reaches the listener, with its conversation', async () => {
  const socket = inboxPath(root, 'taken')
  const taken: Letter[] = []
  const stop = await listenInbox(socket, async (letter) => void taken.push(letter))
  try {
    assert.deepEqual(await deliver(socket, { text: 'hi', conversation: 'c1' }), { t: 'ok' })
    assert.deepEqual(taken, [{ text: 'hi', conversation: 'c1' }])
  } finally {
    stop()
  }
})

test('a runtime that refuses a letter says why', async () => {
  const socket = inboxPath(root, 'refusing')
  const stop = await listenInbox(socket, async () => {
    throw new Error('it has no conversation yet')
  })
  try {
    assert.deepEqual(await deliver(socket, { text: 'hi' }), { t: 'refused', message: 'it has no conversation yet' })
  } finally {
    stop()
  }
})

test('an inbox nothing listens on is not listening', async () => {
  assert.deepEqual(await deliver(inboxPath(root, 'gone'), { text: 'hi' }), { t: 'not_listening' })
})

test('a second listener on a live inbox is refused, and one left by a listener gone is replaced', async () => {
  const socket = inboxPath(root, 'twice')
  const stop = await listenInbox(socket, async () => {})
  await assert.rejects(listenInbox(socket, async () => {}), /already listens/)
  stop()
  writeFileSync(socket, '')
  const again = await listenInbox(socket, async () => {})
  assert.deepEqual(await deliver(socket, { text: 'hi' }), { t: 'ok' })
  again()
})
