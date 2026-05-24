import type { RegexRule } from '@neo-tavern/shared'

export interface SideBlock {
  name: string
  content: string
}

export interface DisplayBlock {
  type: 'narration' | 'dialogue'
  content: string
  speaker?: string
}

export interface SplitResult {
  mainContent: string
  promptContent: string
  displayContent: string
  displayBlocks: DisplayBlock[]
  sideBlocks: SideBlock[]
}

function buildDisplayBlocks(content: string, regex: RegExp): DisplayBlock[] {
  const blocks: DisplayBlock[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const r = new RegExp(regex.source, regex.flags)
  while ((match = r.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const narration = content.slice(lastIndex, match.index).trim()
      if (narration) blocks.push({ type: 'narration', content: narration })
    }
    blocks.push({ type: 'dialogue', speaker: match[1], content: match[2] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    const narration = content.slice(lastIndex).trim()
    if (narration) blocks.push({ type: 'narration', content: narration })
  }
  return blocks
}

export function applyRegexRules(content: string, rules: RegexRule[]): SplitResult {
  const enabled = rules.filter((r) => r.enabled)
  const sideBlocks: SideBlock[] = []
  let promptContent = content
  let displayBlocks: DisplayBlock[] = []

  for (const rule of enabled) {
    try {
      const regex = new RegExp(rule.pattern, 'gs')
      const matches = [...content.matchAll(regex)]
      if (matches.length === 0) continue

      const isDialogue = rule.name.startsWith('💬')

      if (isDialogue) {
        displayBlocks = buildDisplayBlocks(content, regex)
        if (rule.stripFromPrompt) {
          promptContent = promptContent.replace(regex, '')
        }
        continue
      }

      for (const match of matches) {
        let display = rule.displayTemplate
        for (let i = 1; i < match.length; i++) {
          display = display.replace(`$${i}`, match[i] || '')
        }
        sideBlocks.push({ name: rule.name, content: display })
      }

      if (rule.stripFromPrompt) {
        promptContent = promptContent.replace(regex, '')
      }
    } catch {
      continue
    }
  }

  promptContent = promptContent.trim()

  const displayContent = displayBlocks.length > 0
    ? displayBlocks.map((b) => b.type === 'dialogue' ? `**${b.speaker}：**${b.content}` : b.content).join('\n\n')
    : promptContent

  return {
    mainContent: content,
    promptContent,
    displayContent,
    displayBlocks,
    sideBlocks,
  }
}

export function stripPromptContent(content: string, rules: RegexRule[]): string {
  const enabled = rules.filter((r) => r.enabled && r.stripFromPrompt)
  let result = content
  for (const rule of enabled) {
    try {
      result = result.replace(new RegExp(rule.pattern, 'gs'), '')
    } catch {
      continue
    }
  }
  return result.trim()
}
