import { describe, expect, it } from 'vitest'
import { WorldbookContributor, getWorldbookEntryInsertPosition } from '../worldbook-contributor'
import type { Character, Message, WorldbookEntry } from '@neo-tavern/shared'

const character: Character = {
  id: 'char-1',
  name: 'Alice',
  description: 'A test character',
  personality: 'Curious',
  scenario: 'Testing world books',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const recentMessages: Message[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    role: 'assistant',
    content: 'The silver key is on the desk.',
    createdAt: '2024-01-01T00:01:00Z',
  },
]

function makeEntry(patch: Partial<WorldbookEntry>): WorldbookEntry {
  return {
    id: patch.id ?? 'entry-1',
    worldbookId: 'worldbook-1',
    title: patch.title ?? 'Entry',
    keys: patch.keys ?? '',
    content: patch.content ?? 'Lore content',
    priority: patch.priority ?? 10,
    type: patch.type ?? 'trigger',
    triggerMode: patch.triggerMode ?? 'or',
    position: patch.position,
    depth: patch.depth,
    role: patch.role,
    enabled: patch.enabled ?? true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

describe('WorldbookContributor', () => {
  it('keeps always entries at their configured position', async () => {
    const entry = makeEntry({
      id: 'always-1',
      title: 'Always lore',
      type: 'always',
      position: 'beforeHistory',
    })
    const contributor = new WorldbookContributor()
    contributor.setEntries([entry])

    const blocks = await contributor.contribute({
      character,
      recentMessages,
      userInput: 'Hello',
    })

    expect(blocks).toHaveLength(1)
    expect(blocks[0].position).toBe('beforeHistory')
    expect(getWorldbookEntryInsertPosition({ ...entry, position: 'atDepth' })).toBe('atDepth')
  })

  it('places triggered keyword entries after history regardless of configured position', async () => {
    const entry = makeEntry({
      id: 'trigger-1',
      title: 'Key lore',
      type: 'trigger',
      keys: 'silver key',
      position: 'beforeHistory',
    })
    const contributor = new WorldbookContributor()
    contributor.setEntries([entry])

    const blocks = await contributor.contribute({
      character,
      recentMessages,
      userInput: 'I pick up the silver key.',
    })

    expect(blocks).toHaveLength(1)
    expect(blocks[0].position).toBe('afterHistory')
    expect(getWorldbookEntryInsertPosition({ ...entry, position: 'atDepth' })).toBe('afterHistory')
  })
})
