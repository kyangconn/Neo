import type { BuildPromptInput, BuiltPrompt, GenerateMessage, ContextBlock } from '@neo-tavern/shared'

const DEFAULT_SYSTEM_RULES = [
  'You are roleplaying as the selected character.',
  'Stay consistent with the character profile and scenario.',
  'Do not speak or act for the user unless explicitly requested.',
  'Keep the conversation coherent with recent messages.',
  'Follow applicable safety rules and avoid disallowed content.',
].join('\n')

const DIALOGUE_FORMAT_RULES = [
  '',
  'Formatting for dialogue:',
  'When a character speaks dialogue, prefix each spoken line with their name and a colon, like:',
  'Name: "their spoken words"',
  'Put each dialogue line on its own line, separate from narration.',
  'Only use this format for actual spoken words. Narration and internal thoughts stay as normal text.',
].join('\n')

function estTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function trimMessagesByTokens(messages: { role: string; content: string }[], maxTokens: number): { role: string; content: string }[] {
  if (messages.length === 0) return []
  if (maxTokens <= 0) return [...messages]
  let total = 0
  const kept: (typeof messages) = []
  for (let i = messages.length - 1; i >= 0; i--) {
    const tokens = Math.ceil(messages[i].content.length / 4)
    if (total + tokens > maxTokens && kept.length > 0) break
    kept.unshift(messages[i])
    total += tokens
  }
  return kept
}

export function buildChatPrompt(input: BuildPromptInput): BuiltPrompt {
  const messages: GenerateMessage[] = []
  const uname = input.userName || 'User'

  const safeReplace = (s: string) => s.replace(/\{\{user\}\}/gi, uname)

  const systemRules = input.systemRules ?? DEFAULT_SYSTEM_RULES
  const characterBlock = safeReplace([
    `Character Name: ${input.character.name}`,
    `Description: ${input.character.description}`,
    `Personality: ${input.character.personality}`,
    `Scenario: ${input.character.scenario}`,
    input.character.exampleDialogues
      ? `Example Dialogues:\n${input.character.exampleDialogues}`
      : '',
  ].filter(Boolean).join('\n\n'))

  const sortedPresetItems = (input.presetItems ?? [])
    .slice()
    .sort((a, b) => a.injectionOrder - b.injectionOrder)

  const hasSystemPreset = sortedPresetItems.some(p => p.role === 'system')

  const sortedContextBlocks = [...(input.contextBlocks ?? [])].sort(
    (a, b) => b.priority - a.priority
  )

  if (!hasSystemPreset) {
    messages.push({
      role: 'system',
      content: safeReplace(systemRules + DIALOGUE_FORMAT_RULES),
    })
  }

  let appendedDialogueRules = false

  for (const item of sortedPresetItems) {
    if (item.role === 'system' && !appendedDialogueRules) {
      appendedDialogueRules = true
      messages.push({
        role: 'system',
        content: safeReplace(item.content + DIALOGUE_FORMAT_RULES),
      })
      continue
    }
    messages.push({ role: item.role, content: safeReplace(item.content) })
  }

  if (hasSystemPreset && !appendedDialogueRules) {
    appendedDialogueRules = true
    messages.push({
      role: 'system',
      content: safeReplace(DIALOGUE_FORMAT_RULES.trim()),
    })
  }

  messages.push({ role: 'system', content: characterBlock })

  if (input.userPersona) {
    messages.push({ role: 'system', content: safeReplace(`User Persona:\n${input.userPersona}`) })
  }

  const userInputMsg: GenerateMessage = { role: 'user', content: input.userInput }

  const maxTokens = input.maxTotalTokens && input.maxTotalTokens > 0 ? input.maxTotalTokens : 0
  if (maxTokens > 0) {
    let overhead = estTokens(DIALOGUE_FORMAT_RULES)
    if (!hasSystemPreset) overhead += estTokens(safeReplace(systemRules))
    for (const item of sortedPresetItems) overhead += estTokens(safeReplace(item.content))
    overhead += estTokens(characterBlock)
    if (input.userPersona) overhead += estTokens(safeReplace(`User Persona:\n${input.userPersona}`))
    overhead += estTokens(input.userInput)

    const historyBudget = maxTokens - overhead - 100
    const trimmed = historyBudget > 0
      ? trimMessagesByTokens(input.recentMessages, historyBudget)
      : input.recentMessages.slice(-2)

    for (const message of trimmed) {
      messages.push({ role: message.role as 'user' | 'assistant' | 'system', content: message.content })
    }
  } else {
    for (const message of input.recentMessages) {
      messages.push({ role: message.role as 'user' | 'assistant' | 'system', content: message.content })
    }
  }

  for (const block of sortedContextBlocks) {
    messages.push({ role: 'system', content: safeReplace(`[${block.source}] ${block.title}\n${block.content}`) })
  }

  messages.push({ role: 'system', content: 'REMINDER: Use Name: "dialogue" format for all spoken lines.' })

  messages.push({
    role: 'user',
    content: userInputMsg.content + '\n\n[Reasoning Effort: Absolute maximum with no shortcuts permitted.\nYou MUST be very thorough in your thinking and comprehensively decompose the problem to resolve the root cause, rigorously stress-testing your logic against all potential paths, edge cases, and adversarial scenarios.\nExplicitly write out your entire deliberation process, documenting every intermediate step, considered alternative, and rejected hypothesis to ensure absolutely no assumption is left unchecked.]',
  })

  const previewText = messages
    .map((message) => `## ${message.role}\n${message.content}`)
    .join('\n\n---\n\n')

  const tokenEstimate = estimateTokens(messages)

  return {
    messages,
    previewText,
    tokenEstimate,
    includedContextBlocks: sortedContextBlocks,
  }
}

export function estimateTokens(messages: GenerateMessage[]): number {
  const text = messages.map((m) => m.content).join('\n')
  return Math.ceil(text.length / 4)
}

export { DEFAULT_SYSTEM_RULES, DIALOGUE_FORMAT_RULES }
