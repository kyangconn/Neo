export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  cacheHitTokens?: number
  cacheMissTokens?: number
}

export interface Message {
  id: string
  chatId: string
  role: MessageRole
  content: string
  reasoningContent?: string
  generateDuration?: number
  thinkingDuration?: number
  usage?: MessageUsage
  createdAt: string
}

export interface CreateMessageInput {
  chatId: string
  role: MessageRole
  content: string
  reasoningContent?: string
  generateDuration?: number
  thinkingDuration?: number
  usage?: MessageUsage
}
