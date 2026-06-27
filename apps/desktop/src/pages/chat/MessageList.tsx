import type { RefObject } from "react";
import {
  Brain,
  Copy,
  Pencil,
  ScrollText,
  RotateCcw,
  CheckCheck,
  Trash2,
  Image as ImageIcon,
  Bot,
  User as UserIcon,
  CircleDashed,
  ChevronRight,
} from "lucide-react";
import { Button, Card, CardContent, cn } from "@neo-tavern/ui";
import type { DisplayBlock } from "@neo-tavern/core";
import type { Character, Message } from "@neo-tavern/shared";
import {
  ImageDisplayBlockView,
  SideBlockView,
  TemplateDisplayBlockView,
  MessageEditBox,
  ChatActivityTimeline,
  Avatar,
  replaceUserPlaceholders,
  getGenerationStatus,
} from "@/pages/chat";

type GenerationStatus = ReturnType<typeof getGenerationStatus>;
import type { RenderedMessage } from "./types";

export interface MessageListProps {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  bottomSentinelRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  loading: boolean;
  visibleMessagesLength: number;
  isGeneratingCurrentChat: boolean;
  /** When generating but no streaming message is visible yet, show the spinner row. */
  hasStreamingMessage: boolean;
  character: Character | null | undefined;
  personaName: string;
  renderedMessages: RenderedMessage[];
  generationStatus: GenerationStatus;
  fontSize: number;
  chatContentWidthClass: string;
  userBubbleWidthClass: string;
  firstMessageWidthClass: string;
  // ── interaction handlers ──
  copiedId: string | null;
  editingMsgId: string | null;
  imageGenerationBusy: Record<string, boolean>;
  imageGenerationEnabled: boolean;
  imageGenerationMode: string;
  onCopy: (content: string, msgId: string) => void;
  onStartEdit: (msg: Message) => void;
  onCancelEdit: () => void;
  onSaveEdit: (content: string) => Promise<void>;
  onShowPromptDialog: () => void;
  onViewReasoning: (msg: Message) => void;
  onGenerateImages: (msg: Message) => void;
  onRegenerate: () => void;
  onDelete: (msg: Message) => void;
  onSetInput: (value: string) => void;
  onDeleteImage: (messageId: string, imageIndex: number, fallbackPrompt: string) => void;
  onEditImagePrompt: (msg: Message, imageIndex: number, fallbackPrompt: string) => void;
  onRegenerateImage: (messageId: string, imageIndex: number, fallbackPrompt: string) => void;
  canRegenerate: boolean;
}

/**
 * Renders the scrollable message list: empty state, each rendered message
 * (user bubble / assistant card with display blocks, side blocks, image
 * blocks), and the streaming-pending spinner row.
 *
 * Extracted verbatim from ChatPage (Phase 1 UI split) — the parent owns all
 * state and handlers; this component is presentational. The two refs come from
 * `useChatScroll` so the parent stays in charge of scroll behaviour.
 */
export function MessageList({
  scrollContainerRef,
  bottomSentinelRef,
  onScroll,
  loading,
  visibleMessagesLength,
  isGeneratingCurrentChat,
  hasStreamingMessage,
  character,
  personaName,
  renderedMessages,
  generationStatus,
  fontSize,
  chatContentWidthClass,
  userBubbleWidthClass,
  firstMessageWidthClass,
  copiedId,
  editingMsgId,
  imageGenerationBusy,
  imageGenerationEnabled,
  imageGenerationMode,
  onCopy,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onShowPromptDialog,
  onViewReasoning,
  onGenerateImages,
  onRegenerate,
  onDelete,
  onSetInput,
  onDeleteImage,
  onEditImagePrompt,
  onRegenerateImage,
  canRegenerate,
}: MessageListProps) {
  return (
    <div
      ref={scrollContainerRef}
      onScroll={onScroll}
      className="border-border/40 bg-background/50 mx-3 my-2 flex-1 overflow-y-auto rounded-xl border p-5"
      style={{ overflowAnchor: "none" }}
    >
      {loading && <p className="text-muted-foreground text-center text-sm">Loading...</p>}
      {!loading && visibleMessagesLength === 0 && !isGeneratingCurrentChat && (
        <div className={cn(chatContentWidthClass, "mx-auto")}>
          {character ? (
            <div>
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <Avatar name={character.name} src={character.avatar} />
                <span className="text-muted-foreground text-xs font-medium">{character.name}</span>
              </div>
              <div className="flex gap-3">
                <div className={cn(firstMessageWidthClass, "min-w-0")}>
                  <Card>
                    <CardContent className="p-3">
                      <p className="whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
                        {replaceUserPlaceholders(
                          character.firstMessage || `Start a conversation with ${character.name}`,
                          personaName,
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground mt-8 text-center text-sm">Select a character to start chatting</p>
          )}
        </div>
      )}
      <div className={cn(chatContentWidthClass, "mx-auto")} style={{ overflowAnchor: "none" }}>
        {renderedMessages.map((item) => {
          const { msg, isUser, isFinalAi, split, displayContent, isStreamingAi, hasDisplayContent } = item;
          const aiName = character?.name ?? "AI";
          let imageBlockIndex = 0;
          const isMessageImageBusy =
            !!imageGenerationBusy[msg.id] || !!msg.images?.some((image) => image.status === "generating");

          return (
            <div key={msg.id} style={{ overflowAnchor: "none" }}>
              {isUser ? (
                <div className="flex min-w-0 justify-end gap-3 pb-5">
                  <div className={cn("min-w-0 overflow-hidden", userBubbleWidthClass)}>
                    <div className="mb-1.5 flex items-center justify-end gap-1 opacity-0 transition-opacity hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground h-6 w-6"
                        title="Copy"
                        onClick={() => onCopy(msg.content, msg.id)}
                      >
                        {copiedId === msg.id ? (
                          <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-6 w-6"
                        title="Delete"
                        onClick={() => onDelete(msg)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="bg-primary text-primary-foreground rounded-lg border p-4">
                      {editingMsgId === msg.id ? (
                        <MessageEditBox
                          initialContent={msg.content}
                          fontSize={fontSize}
                          onCancel={onCancelEdit}
                          onSave={onSaveEdit}
                        />
                      ) : (
                        <p
                          className="leading-relaxed wrap-break-word whitespace-pre-wrap"
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {displayContent}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 justify-start gap-3 pb-5">
                  <div className="bg-primary text-primary-foreground mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className={cn("group w-full min-w-0 overflow-hidden py-1", chatContentWidthClass)}>
                    <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                      <span className="text-muted-foreground min-w-0 truncate text-xs font-medium">{aiName}</span>
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-6 w-6"
                          title="Copy"
                          onClick={() => onCopy(msg.content, msg.id)}
                        >
                          {copiedId === msg.id ? (
                            <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-6 w-6"
                          title="Edit"
                          onClick={() => onStartEdit(msg)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-6 w-6"
                          title="View full prompt"
                          onClick={onShowPromptDialog}
                        >
                          <ScrollText className="h-3.5 w-3.5" />
                        </Button>
                        {msg.reasoningContent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground h-6 w-6 hover:text-purple-400"
                            title="查看创作过程"
                            onClick={() => onViewReasoning(msg)}
                          >
                            <Brain className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {imageGenerationEnabled &&
                          imageGenerationMode === "manual" &&
                          hasDisplayContent &&
                          !isStreamingAi && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground h-6 w-6"
                              title={isMessageImageBusy ? "图片生成中" : "生成图片"}
                              onClick={() => onGenerateImages(msg)}
                              disabled={isMessageImageBusy}
                            >
                              <ImageIcon className={cn("h-3.5 w-3.5", isMessageImageBusy && "animate-pulse")} />
                            </Button>
                          )}
                        {isFinalAi && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground h-6 w-6"
                            title="Regenerate"
                            onClick={onRegenerate}
                            disabled={!canRegenerate}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-6 w-6"
                          title="Delete"
                          onClick={() => onDelete(msg)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <ChatActivityTimeline message={msg} active={isStreamingAi} generationStatus={generationStatus} />

                    {editingMsgId === msg.id ? (
                      <MessageEditBox
                        initialContent={msg.content}
                        fontSize={fontSize}
                        onCancel={onCancelEdit}
                        onSave={onSaveEdit}
                      />
                    ) : split?.displayBlocks && split.displayBlocks.length > 0 && hasDisplayContent ? (
                      <div className="space-y-2">
                        {split.displayBlocks.map((block: DisplayBlock, bi: number) =>
                          block.type === "image" ? (
                            (() => {
                              const currentImageIndex = imageBlockIndex++;
                              return (
                                <ImageDisplayBlockView
                                  key={bi}
                                  prompt={block.content}
                                  image={msg.images?.[currentImageIndex]}
                                  fontSize={fontSize}
                                  onDelete={() => void onDeleteImage(msg.id, currentImageIndex, block.content)}
                                  onEditPrompt={() => onEditImagePrompt(msg, currentImageIndex, block.content)}
                                  onRegenerate={() => void onRegenerateImage(msg.id, currentImageIndex, block.content)}
                                />
                              );
                            })()
                          ) : block.type === "template" ? (
                            <TemplateDisplayBlockView key={bi} block={block} fontSize={fontSize} />
                          ) : block.type === "dialogue" ? (
                            <div key={bi} className="bg-accent/40 relative mt-3 rounded-md border p-3 first:mt-0">
                              <span className="bg-primary text-primary-foreground absolute -top-2.5 left-3 rounded px-2 py-0.5 text-[10px] font-semibold">
                                {block.speaker}
                              </span>
                              <p
                                className="pt-0.5 wrap-break-word whitespace-pre-wrap"
                                style={{ fontSize: `${fontSize}px` }}
                              >
                                {block.content}
                              </p>
                            </div>
                          ) : (
                            <p
                              key={bi}
                              className="leading-relaxed wrap-break-word whitespace-pre-wrap"
                              style={{ fontSize: `${fontSize}px` }}
                            >
                              {block.content}
                            </p>
                          ),
                        )}
                      </div>
                    ) : isStreamingAi && !hasDisplayContent ? (
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-sm">{generationStatus.detail}</p>
                        <div className="flex gap-1" aria-label={generationStatus.label}>
                          <span className="bg-primary/50 h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
                          <span className="bg-primary/50 h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
                          <span className="bg-primary/50 h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
                        </div>
                      </div>
                    ) : (
                      <p
                        className="leading-relaxed wrap-break-word whitespace-pre-wrap"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {displayContent}
                      </p>
                    )}

                    {split?.sideBlocks.map((side, si) => (
                      <div key={si} style={{ fontSize: `${fontSize}px` }}>
                        <SideBlockView side={side} fontSize={fontSize} onAction={onSetInput} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isGeneratingCurrentChat && !hasStreamingMessage && (
          <div className="flex min-w-0 justify-start gap-3 pb-5">
            <div className="bg-primary text-primary-foreground mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <Bot className="h-4 w-4" />
            </div>
            <div className={cn("w-full min-w-0 py-1", chatContentWidthClass)}>
              <div className="border-border/80 mb-3 min-w-0 border-l">
                <div className="relative pb-3">
                  <span className="bg-background text-primary absolute top-1 left-0 flex h-3 w-3 items-center justify-center rounded-full">
                    <CircleDashed className="h-3.5 w-3.5 animate-spin" />
                  </span>
                  <div className="flex min-w-0 items-center gap-1 overflow-hidden text-sm font-medium">
                    <Brain className="h-3.5 w-3.5 shrink-0" />
                    <span className="shrink-0">正在思考</span>
                    <span className="text-muted-foreground min-w-0 truncate">· {generationStatus.detail}</span>
                    <ChevronRight className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                  </div>
                </div>
              </div>
              <div className="flex gap-1" aria-label={generationStatus.label}>
                <span className="bg-primary/50 h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
                <span className="bg-primary/50 h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
                <span className="bg-primary/50 h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomSentinelRef} aria-hidden="true" />
      </div>
    </div>
  );
}
