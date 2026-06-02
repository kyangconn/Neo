import { describe, expect, it } from 'vitest'
import { applyRegexRules, stripPromptContent } from '../index'
import type { RegexRule } from '@neo-tavern/shared'

const baseRule = {
  id: 'rule',
  presetId: 'preset',
  stripFromPrompt: false,
  enabled: true,
  createdAt: '2024-01-01T00:00:00Z',
}

const innerThoughtRule: RegexRule = {
  ...baseRule,
  id: 'inner',
  name: '💭 Inner Thoughts',
  pattern: '<details><summary>内心-([^<]+)</summary>([\\s\\S]*?)</details>',
  displayTemplate: '<details class="neo-thoughts" open><summary>💭 $1</summary>$2</details>',
}

describe('applyRegexRules', () => {
  it('keeps inner thoughts at their original display position', () => {
    const result = applyRegexRules([
      '第一段。',
      '<details><summary>内心-露娜</summary>她把书页按平。</details>',
      '第二段。',
    ].join('\n'), [innerThoughtRule])

    expect(result.sideBlocks).toHaveLength(0)
    expect(result.displayBlocks.map((block) => block.type)).toEqual(['narration', 'template', 'narration'])
    expect(result.displayBlocks[0].content).toBe('第一段。')
    expect(result.displayBlocks[1].content).toContain('class="neo-thoughts"')
    expect(result.displayBlocks[1].content).toContain('💭 露娜')
    expect(result.displayBlocks[2].content).toBe('第二段。')
  })

  it('does not turn summary blocks into inline thoughts', () => {
    const summaryRule: RegexRule = {
      ...baseRule,
      id: 'summary',
      name: '📋 Summary',
      pattern: '(?<!<details>)\\s*<summary>([\\s\\S]*?)</summary>',
      displayTemplate: '<details class="neo-summary"><summary>剧情摘要</summary>$1</details>',
    }

    const result = applyRegexRules('正文。\n<summary>摘要内容</summary>', [summaryRule])

    expect(result.displayContent).toBe('正文。')
    expect(result.sideBlocks).toHaveLength(1)
    expect(result.sideBlocks[0].content).toContain('neo-summary')
  })

  it('turns image markers into inline image display blocks', () => {
    const result = applyRegexRules('门打开了。\n[image]cinematic library, moonlight[/image]\n她走进房间。', [])

    expect(result.sideBlocks).toHaveLength(0)
    expect(result.displayBlocks.map((block) => block.type)).toEqual(['narration', 'image', 'narration'])
    expect(result.displayBlocks[1].content).toBe('cinematic library, moonlight')
    expect(result.promptContent).toBe('门打开了。\n\n她走进房间。')
  })

  it('strips image markers from prompt history even without custom rules', () => {
    const result = stripPromptContent('正文前。\n[image]cinematic library, moonlight[/image]\n正文后。', [])

    expect(result).toBe('正文前。\n\n正文后。')
  })
})
