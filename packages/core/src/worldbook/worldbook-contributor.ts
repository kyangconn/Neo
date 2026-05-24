import type { ContextContributor, ContextInput, ContextBlock } from '@neo-tavern/shared'
import type { WorldbookEntry } from '@neo-tavern/shared'

function extractKeywords(keys: string): string[] {
  return keys
    .split(/[,;，；]/)
    .map((k) => k.trim())
    .filter(Boolean)
}

function matchKeywords(text: string, keywords: string[], mode: 'and' | 'or'): boolean {
  if (keywords.length === 0) return false
  const lower = text.toLowerCase()
  if (mode === 'or') {
    return keywords.some((kw) => lower.includes(kw.toLowerCase()))
  }
  return keywords.every((kw) => lower.includes(kw.toLowerCase()))
}

export function resolveWorldbookEntries(
  entries: WorldbookEntry[],
  userInput: string,
  recentText: string,
): { matched: WorldbookEntry[] } {
  const enabled = entries.filter((e) => e.enabled)
  const alwaysEntries = enabled.filter((e) => e.type === 'always')
  const triggerEntries = enabled.filter((e) => e.type === 'trigger')

  const scanText = (userInput + '\n' + recentText).slice(0, 8000)

  const matchedTriggers = triggerEntries.filter((e) => {
    const keywords = extractKeywords(e.keys)
    if (keywords.length === 0) return false
    return matchKeywords(scanText, keywords, e.triggerMode)
  })

  const all = [...alwaysEntries, ...matchedTriggers].sort(
    (a, b) => b.priority - a.priority
  )

  return { matched: all }
}

export class WorldbookContributor implements ContextContributor {
  id = 'worldbook'
  name = 'Worldbook'

  private entries: WorldbookEntry[] = []

  setEntries(entries: WorldbookEntry[]) {
    this.entries = entries
  }

  async contribute(input: ContextInput): Promise<ContextBlock[]> {
    const recentText = input.recentMessages.map((m) => m.content).join('\n')
    const { matched } = resolveWorldbookEntries(this.entries, input.userInput, recentText)

    return matched.map((e) => ({
      id: e.id,
      source: 'worldbook' as const,
      title: e.title,
      content: e.content,
      priority: e.priority,
    }))
  }
}
