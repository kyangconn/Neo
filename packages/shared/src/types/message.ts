export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  cacheHitTokens?: number
  cacheMissTokens?: number
  costCny?: number
  costCurrency?: 'CNY'
  costInputCacheHitCny?: number
  costInputCacheMissCny?: number
  costOutputCny?: number
  costModel?: string
  costPricingName?: string
  debugRound?: number
  debugAttempt?: number
  debugTrigger?: 'send' | 'continue' | 'regenerate' | 'retry'
  debugBaseTrigger?: 'send' | 'continue' | 'regenerate'
  debugPromptFolder?: string
  debugPromptFilename?: string
  debugPromptPath?: string
}

export interface MessageImage {
  id: string
  prompt: string
  status: 'generating' | 'done' | 'error' | 'deleted'
  src?: string
  error?: string
  createdAt: string
  updatedAt?: string
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
  images?: MessageImage[]
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
  images?: MessageImage[]
}
