export interface ParsedCharacterCard {
  name: string
  description: string
  personality: string
  scenario: string
  firstMessage: string
  exampleDialogues: string
  creatorNotes: string
  tags: string[]
  regexScripts: Array<{
    scriptName: string
    findRegex: string
    replaceString: string
    disabled: boolean
    markdownOnly: boolean
    promptOnly: boolean
  }>
  worldbookName: string
  worldbookEntries: Array<{
    title: string
    keys: string
    content: string
    always: boolean
    triggerMode: 'and' | 'or'
    priority: number
    enabled: boolean
  }>
}

function readPngTextChunks(buf: ArrayBuffer): { keyword: string; value: string }[] {
  const view = new DataView(buf)
  const chunks: { keyword: string; value: string }[] = []
  let offset = 8
  while (offset < buf.byteLength - 8) {
    const len = view.getUint32(offset)
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7),
    )
    if (type === 'tEXt') {
      const data = new Uint8Array(buf.slice(offset + 8, offset + 8 + len))
      const nullIdx = data.indexOf(0)
      const keyword = new TextDecoder().decode(data.slice(0, nullIdx))
      const value = new TextDecoder().decode(data.slice(nullIdx + 1))
      chunks.push({ keyword, value })
    }
    offset += 12 + len
  }
  return chunks
}

function base64ToUtf8(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

function decodeCharacterJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    return JSON.parse(base64ToUtf8(text))
  }
}

export function parseJsonCharacterCard(text: string): ParsedCharacterCard | null {
  let json: any
  try { json = JSON.parse(text) } catch { return null }
  return extractCardData(json)
}

export function parsePngCharacterCard(buf: ArrayBuffer): ParsedCharacterCard | null {
  const chunks = readPngTextChunks(buf)
  const charaChunk = chunks.find((c) => c.keyword === 'chara' || c.keyword === 'ccv3')
  if (!charaChunk) return null

  let json: any
  try { json = decodeCharacterJson(charaChunk.value) } catch { return null }
  return extractCardData(json)
}

function extractCardData(json: any): ParsedCharacterCard {
  const data = json.data || json
  const extensions = data.extensions || {}
  const book = data.character_book || {}

  const charName = data.name || json.name || 'Untitled'
  const personality = data.personality || json.personality || ''

  const wbEntries = (book.entries || []).map((e: any) => ({
    title: e.comment || e.key?.[0] || 'Entry',
    keys: (e.keys || []).join(','),
    content: e.content || '',
    always: e.constant === true && !e.selective,
    triggerMode: (e.selectiveLogic === 0 ? 'or' : 'and') as 'and' | 'or',
    priority: 100 - (e.insertion_order || 0),
    enabled: e.enabled !== false,
  }))

  return {
    name: charName,
    description: data.description || json.description || '',
    personality,
    scenario: data.scenario || json.scenario || '',
    firstMessage: data.first_mes || json.first_mes || data.firstMessage || 'Hello',
    exampleDialogues: data.mes_example || json.mes_example || data.exampleDialogues || '',
    creatorNotes: data.creator_notes || json.creator_notes || '',
    tags: data.tags || json.tags || [],
    regexScripts: extensions.regex_scripts || data.regex_scripts || [],
    worldbookName: (typeof extensions.world === 'string' ? extensions.world : '') || book.name || '',
    worldbookEntries: wbEntries,
  }
}
