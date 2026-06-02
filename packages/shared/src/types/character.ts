export interface Character {
  id: string
  name: string
  hidden?: boolean
  avatar?: string
  description: string
  personality: string
  scenario: string
  firstMessage: string
  exampleDialogues?: string
  tags?: string[]
  regexPresetId?: string
  worldbookId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCharacterInput {
  id?: string
  name: string
  hidden?: boolean
  avatar?: string
  description: string
  personality: string
  scenario: string
  firstMessage: string
  exampleDialogues?: string
  tags?: string[]
  regexPresetId?: string
  worldbookId?: string
}

export interface UpdateCharacterInput {
  name?: string
  hidden?: boolean
  avatar?: string
  description?: string
  personality?: string
  scenario?: string
  firstMessage?: string
  exampleDialogues?: string
  tags?: string[]
  regexPresetId?: string
  worldbookId?: string
}
