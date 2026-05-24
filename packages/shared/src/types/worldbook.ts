export type WorldbookEntryType = 'always' | 'trigger'
export type TriggerMode = 'and' | 'or'

export interface WorldbookEntry {
  id: string
  worldbookId: string
  title: string
  keys: string
  content: string
  priority: number
  /** 常驻 (always) = 始终注入；触发 (trigger) = 关键词命中才注入 */
  type: WorldbookEntryType
  /** 蓝灯(and) = 全部关键词命中才触发；绿灯(or) = 任意关键词命中即触发 */
  triggerMode: TriggerMode
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Worldbook {
  id: string
  name: string
  description: string
  entries: WorldbookEntry[]
  createdAt: string
  updatedAt: string
}

export interface CreateWorldbookInput {
  name: string
  description: string
}

export interface UpdateWorldbookInput {
  name?: string
  description?: string
}

export interface CreateWorldbookEntryInput {
  title: string
  keys: string
  content: string
  priority: number
  type: WorldbookEntryType
  triggerMode: TriggerMode
  enabled: boolean
}

export interface UpdateWorldbookEntryInput {
  title?: string
  keys?: string
  content?: string
  priority?: number
  type?: WorldbookEntryType
  triggerMode?: TriggerMode
  enabled?: boolean
}
