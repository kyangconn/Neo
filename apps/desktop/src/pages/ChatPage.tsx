import { useCallback, useState } from "react";
import { cn } from "@neo-tavern/ui";
import { ChoiceInputPanel } from "@/components/ChoiceInputPanel";
import type { AgenticGameState } from "@/features/agentic-play/agentic-play";
import type { Message } from "@neo-tavern/shared";
import { useSettingsStore } from "@/features/settings/settings.store";
import { toast } from "@/utils/toast";
import {
  ChatSidebar,
  ChatRightPanel,
  ChatInputArea,
  useBranchNavigation,
  useSavepointManager,
  getGenerationStatus,
  getChatDraftKey,
  type PendingSendItem,
} from "@/pages/chat";
import { MessageList } from "@/pages/chat/MessageList";
import {
  ImagePromptDialog,
  PromptDialog,
  SaveDialog,
  LoadDialog,
  TokenDialog,
  DeleteMessageDialog,
  ThinkingDialog,
} from "@/pages/chat/dialogs";
import { useChatSession } from "@/pages/chat/hooks/useChatSession";
import { useChatMessages } from "@/pages/chat/hooks/useChatMessages";
import { useChatScroll } from "@/pages/chat/hooks/useChatScroll";
import { useChatCost } from "@/pages/chat/hooks/useChatCost";
import { useChatImages } from "@/pages/chat/hooks/useChatImages";
import { useNormalChat } from "@/pages/chat/hooks/useNormalChat";
import { useAgenticChat } from "@/pages/chat/hooks/useAgenticChat";
import { useSecondaryUsage } from "@/pages/chat/hooks/useSecondaryUsage";
import type { TokenUsageView } from "@/pages/chat/types";

/**
 * Thin orchestrator for the chat page. All concerns are delegated to hooks:
 * session (`useChatSession`), message rendering (`useChatMessages`), scroll
 * (`useChatScroll`), cost (`useChatCost`), images (`useChatImages`), the
 * normal send/preview/queue flow (`useNormalChat`), and agentic-play
 * (`useAgenticChat`).
 *
 * The mode difference (normal vs agentic) only surfaces in which footer is
 * rendered — no `if (agenticPlayEnabled)` ternaries are scattered through the
 * message list.
 */
export function ChatPage() {
  const session = useChatSession();
  const {
    characters,
    currentChat,
    messages,
    loading,
    messagesHydrated,
    chatError,
    character,
    characterId,
    navigate,
    addMessage,
    updateMessage,
    patchMessage,
    deleteMessages,
    lastDiceResult,
    input,
    setInput,
    fontSize,
    chatListCollapsed,
    setChatListCollapsed,
    chatRecords,
    handleSelectCharacterChat,
    handleFontSizeChange,
    clearError,
  } = session;

  const branch = useBranchNavigation(currentChat?.id);
  const imageGeneration = useSettingsStore((s) => s.imageGeneration);
  const regexPresets = useSettingsStore((s) => s.regexPresets);
  const activeRegexPresetId = useSettingsStore((s) => s.activeRegexPresetId);
  const personaName = useSettingsStore((s) => s.personaName);

  // ── Derived: active regex rules (React Compiler auto-memoises) ──
  const activeRegexRules = (() => {
    const rules: (typeof regexPresets)[0]["rules"] = [];
    for (const p of regexPresets) {
      if (p.isGlobal) rules.push(...p.rules.filter((r) => r.enabled));
    }
    if (activeRegexPresetId) {
      const preset = regexPresets.find((p) => p.id === activeRegexPresetId);
      if (preset) rules.push(...preset.rules.filter((r) => r.enabled));
    }
    const seen = new Set<string>();
    return rules.filter((r) => {
      if (seen.has(r.pattern)) return false;
      seen.add(r.pattern);
      return true;
    });
  })();

  // ── Agentic state lifted here to break the normal↔agentic cycle ──
  const [agenticPlayEnabled, setAgenticPlayEnabled] = useState(false);
  const [agenticGameState, setAgenticGameState] = useState<AgenticGameState | null>(null);
  const [dismissedAgenticChoiceMessageId, setDismissedAgenticChoiceMessageId] = useState<string | null>(null);

  // ── Chat UI-only state ──
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenUsageView, setTokenUsageView] = useState<TokenUsageView>("main");
  const [deleteMsgTarget, setDeleteMsgTarget] = useState<Message | null>(null);
  const [thinkingMsg, setThinkingMsg] = useState<Message | null>(null);

  // ── Normal chat: send / continue / abort / preview / queue ──
  const normal = useNormalChat({
    session,
    visibleMessages: branch.visibleMessages,
    visibleMessagesLength: branch.visibleMessages.length,
    agenticPlayEnabled,
    agenticGameState,
    setAgenticGameState,
  });

  const isGeneratingCurrentChat = normal.sending && !!currentChat?.id && normal.sendingChatId === currentChat.id;

  // ── Agentic chat: opening prompt, choice submit, dice ──
  const lastAssistantId = (() => {
    for (let i = branch.visibleMessages.length - 1; i >= 0; i--) {
      if (branch.visibleMessages[i].role === "assistant") return branch.visibleMessages[i].id;
    }
    return null;
  })();

  // ── Message rendering + active agentic choice block ──
  const { renderedMessages, activeAgenticChoiceBlock } = useChatMessages({
    visibleMessages: branch.visibleMessages,
    activeRegexRules,
    agenticPlayEnabled,
    lastAssistantId,
    isGeneratingCurrentChat,
    streamingMessageId: normal.streamingMessageId,
    dismissedAgenticChoiceMessageId,
  });

  // ── Agentic lifecycle (needs submitContent from normal) ──
  const agentic = useAgenticChat({
    agenticPlayEnabled,
    setAgenticPlayEnabled,
    setAgenticGameState,
    dismissedAgenticChoiceMessageId,
    setDismissedAgenticChoiceMessageId,
    submitContent: normal.submitContent,
    sending: normal.sending,
    character,
    currentChat,
    loading,
    messagesHydrated,
    visibleMessagesLength: branch.visibleMessages.length,
    isGeneratingCurrentChat,
    lastAssistantId,
    activeAgenticChoice: activeAgenticChoiceBlock,
  });

  // ── Scroll ──
  const { messagesContainerRef, chatBottomRef, handleChatScroll } = useChatScroll({
    renderedMessages,
    visibleMessages: branch.visibleMessages,
    visibleMessagesLength: branch.visibleMessages.length,
    currentChatId: currentChat?.id,
    activeLeafId: branch.activeLeafId,
    sending: normal.sending,
    sendingChatId: normal.sendingChatId,
    streamingMessageId: normal.streamingMessageId,
    loading,
    fontSize,
    chatListCollapsed,
  });

  // ── Images ──
  const getLatestMessage = useCallback(
    (messageId: string) =>
      branch.visibleMessages.find((m) => m.id === messageId) ?? messages.find((m) => m.id === messageId) ?? null,
    [branch.visibleMessages, messages],
  );
  const images = useChatImages({
    currentChat,
    character,
    messages,
    getLatestMessage,
    patchMessage,
  });

  // ── Cost ──
  const { secondaryUsageRecords } = useSecondaryUsage({
    currentChatId: currentChat?.id,
    tokenDialogOpen,
    tokenUsageView,
    messages,
  });
  const cost = useChatCost({ messages, secondaryUsageRecords, tokenUsageView });

  // ── Savepoint ──
  const savepoint = useSavepointManager(currentChat, isGeneratingCurrentChat);

  // ── Misc derived values ──
  const hasStreamingMessage =
    isGeneratingCurrentChat && !!normal.streamingMessageId && messages.some((m) => m.id === normal.streamingMessageId);
  const generationStatus = getGenerationStatus(normal.generationPhase);

  // ── Interaction handlers ──
  const handleCopy = useCallback(async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast("error", "Failed to copy");
    }
  }, []);

  const handleDeleteMessage = useCallback(async () => {
    if (!deleteMsgTarget) return;
    try {
      const ids = [deleteMsgTarget.id];
      if (deleteMsgTarget.role === "user") {
        const idx = messages.findIndex((m) => m.id === deleteMsgTarget.id);
        const next = idx >= 0 ? messages[idx + 1] : undefined;
        if (next?.role === "assistant") ids.push(next.id);
      }
      await deleteMessages(ids);
      setDeleteMsgTarget(null);
      toast("info", ids.length > 1 ? "Messages deleted" : "Message deleted");
    } catch {
      toast("error", "Failed to delete");
    }
  }, [deleteMsgTarget, deleteMessages, messages]);

  const saveEdit = useCallback(
    async (content: string) => {
      if (!editingMsgId || !content.trim()) return;
      try {
        await updateMessage(editingMsgId, content.trim());
        setEditingMsgId(null);
        toast("success", "Message updated");
      } catch {
        toast("error", "Failed to update");
      }
    },
    [editingMsgId, updateMessage],
  );

  const onCancelPending = useCallback(
    (queueIndex: number) => {
      normal.setPendingSendQueue((queue) => queue.filter((_, index) => index !== queueIndex));
    },
    [normal],
  );

  // ── Layout classes ──
  const chatLayoutColumns = chatListCollapsed
    ? "lg:grid-cols-[48px_minmax(0,1fr)] xl:grid-cols-[48px_minmax(0,1fr)_320px]"
    : "lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_320px]";
  const chatContentWidthClass = chatListCollapsed ? "max-w-6xl" : "max-w-4xl";
  const userBubbleWidthClass = chatListCollapsed ? "max-w-[min(88%,60rem)]" : "max-w-[min(82%,48rem)]";
  const firstMessageWidthClass = chatListCollapsed ? "max-w-[min(82%,54rem)]" : "max-w-[75%]";

  return (
    <div className="flex h-full flex-col" style={{ "--chat-font-size": fontSize + "px" } as React.CSSProperties}>
      <div
        className={cn(
          "grid flex-1 grid-cols-1 gap-3 overflow-hidden p-4 transition-[grid-template-columns] duration-200",
          chatLayoutColumns,
        )}
      >
        <ChatSidebar
          chats={chatRecords}
          characters={characters}
          currentChatId={currentChat?.id}
          collapsed={chatListCollapsed}
          onBack={() => navigate("/")}
          onSelectChat={handleSelectCharacterChat}
          onToggleCollapsed={() => setChatListCollapsed((value) => !value)}
        />

        <section className="chat-grid-cell bg-background flex flex-col rounded-lg border">
          <MessageList
            scrollContainerRef={messagesContainerRef}
            bottomSentinelRef={chatBottomRef}
            onScroll={handleChatScroll}
            loading={loading}
            visibleMessagesLength={branch.visibleMessages.length}
            isGeneratingCurrentChat={isGeneratingCurrentChat}
            hasStreamingMessage={hasStreamingMessage}
            character={character}
            personaName={personaName}
            renderedMessages={renderedMessages}
            generationStatus={generationStatus}
            fontSize={fontSize}
            chatContentWidthClass={chatContentWidthClass}
            userBubbleWidthClass={userBubbleWidthClass}
            firstMessageWidthClass={firstMessageWidthClass}
            copiedId={copiedId}
            editingMsgId={editingMsgId}
            imageGenerationBusy={images.imageGenerationBusy}
            imageGenerationEnabled={imageGeneration.enabled}
            imageGenerationMode={imageGeneration.mode}
            onCopy={handleCopy}
            onStartEdit={(msg) => setEditingMsgId(msg.id)}
            onCancelEdit={() => setEditingMsgId(null)}
            onSaveEdit={saveEdit}
            onShowPromptDialog={normal.showPromptDialog}
            onViewReasoning={(msg) => setThinkingMsg(msg)}
            onGenerateImages={(msg) => void images.handleGenerateMessageImages(msg)}
            onRegenerate={() => void normal.regenerate()}
            onDelete={(msg) => setDeleteMsgTarget(msg)}
            onSetInput={setInput}
            onDeleteImage={(...args) => void images.handleDeleteImage(...args)}
            onEditImagePrompt={images.openImagePromptEditor}
            onRegenerateImage={(...args) => void images.handleRegenerateImage(...args)}
            canRegenerate={!normal.sending}
          />

          {activeAgenticChoiceBlock && activeAgenticChoiceBlock.panelChoices.length > 0 ? (
            <div className="bg-card shrink-0 border-t p-4">
              <div className={cn("mx-auto w-full min-w-0", chatContentWidthClass)}>
                <ChoiceInputPanel
                  key={activeAgenticChoiceBlock.rendered.msg.id}
                  title={character ? `你要在 ${character.name} 的场景里采取什么行动？` : "你下一步要怎么做？"}
                  choices={activeAgenticChoiceBlock.panelChoices}
                  disabled={!currentChat || isGeneratingCurrentChat}
                  onSubmit={agentic.handleAgenticChoiceSubmit}
                  onCancel={() => setDismissedAgenticChoiceMessageId(activeAgenticChoiceBlock.rendered.msg.id)}
                />
              </div>
            </div>
          ) : (
            <ChatInputArea
              displayError={normal.sendError || chatError}
              onDismissError={() => {
                normal.clearSendError();
                clearError();
              }}
              pendingSendCount={normal.pendingSendCount}
              hasChat={!!currentChat}
              pendingSendQueue={normal.pendingSendQueue as PendingSendItem[]}
              currentChatId={currentChat?.id}
              onCancelPending={onCancelPending}
              fontSize={fontSize}
              onFontSizeChange={handleFontSizeChange}
              previewOpen={normal.previewOpen}
              onTogglePreview={() => {
                const nextOpen = !normal.previewOpen;
                normal.setPreviewOpen(nextOpen);
                if (nextOpen) normal.updatePreview(input.trim());
              }}
              onContinue={normal.handleContinue}
              messagesLength={branch.visibleMessages.length}
              input={input}
              onInputChange={normal.handleInputChange}
              onKeyDown={normal.handleKeyDown}
              placeholder={
                character
                  ? agenticPlayEnabled
                    ? `Action in ${character.name}'s scene...`
                    : `Message ${character.name}...`
                  : "Type a message..."
              }
              onSend={normal.handleSend}
              isSending={normal.sending}
              onAbort={normal.abort}
              onSave={() => savepoint.setSaveDialogOpen(true)}
              onLoad={savepoint.openLoadDialog}
              isGenerating={isGeneratingCurrentChat}
              previewText={normal.previewText}
              wide={chatListCollapsed}
            />
          )}
        </section>

        <div className="hidden xl:contents">
          <ChatRightPanel
            messagesCount={branch.visibleMessages.length}
            usageMessagesCount={cost.usageMessages.length}
            totalPrompt={cost.totalPrompt}
            totalCompletion={cost.totalCompletion}
            cacheRate={cost.cacheRate}
            contextUsageDisplay={cost.contextUsageDisplay}
            contextUsagePercent={cost.contextUsagePercent}
            contextUsageBarTone={cost.contextUsageBarTone}
            onTokenDialogOpen={() => setTokenDialogOpen(true)}
            agenticPlayEnabled={agenticPlayEnabled}
            agenticGameState={agenticGameState}
            isGeneratingCurrentChat={isGeneratingCurrentChat}
            lastDiceResult={lastDiceResult}
            hasBranches={branch.hasBranches}
            branchSummaries={branch.branchSummaries}
            onSwitchBranch={branch.switchBranch}
          />
        </div>
      </div>

      <ImagePromptDialog
        open={!!images.imagePromptEditTarget}
        onOpenChange={(open) => {
          if (!open) images.closeImagePromptEditor();
        }}
        draft={images.imagePromptDraft}
        onDraftChange={images.setImagePromptDraft}
        onCancel={images.closeImagePromptEditor}
        onSave={() => {
          void images.saveImagePromptEdit(false);
        }}
        onSaveAndRegenerate={() => {
          void images.saveImagePromptEdit(true);
        }}
      />

      <PromptDialog
        open={normal.promptDialogOpen}
        onOpenChange={normal.setPromptDialogOpen}
        previewText={normal.previewText}
      />

      <SaveDialog
        open={savepoint.saveDialogOpen}
        onOpenChange={(v) => {
          if (!v) savepoint.closeSaveDialog();
        }}
        savepointName={savepoint.savepointName}
        onSavepointNameChange={savepoint.setSavepointName}
        onCancel={savepoint.closeSaveDialog}
        onSave={savepoint.handleCreateSavepoint}
        isSaving={savepoint.savingSavepoint}
        hasCurrentChat={!!currentChat}
      />

      <LoadDialog
        open={savepoint.loadDialogOpen}
        onOpenChange={savepoint.setLoadDialogOpen}
        savepoints={savepoint.savepoints}
        isLoading={savepoint.loadingSavepoints}
        restoringSavepointId={savepoint.restoringSavepointId}
        importingSavepointId={savepoint.importingSavepointId}
        isGenerating={isGeneratingCurrentChat}
        onRestore={savepoint.handleRestoreSavepoint}
        onImportAsBranch={savepoint.handleImportSavepointAsBranch}
        onDelete={savepoint.handleDeleteSavepoint}
        onRefresh={savepoint.refreshSavepoints}
      />

      <TokenDialog
        open={tokenDialogOpen}
        onOpenChange={setTokenDialogOpen}
        tokenUsageView={tokenUsageView}
        onTokenUsageViewChange={setTokenUsageView}
        rows={cost.tokenDialogRows}
        totals={cost.tokenDialogTotals}
        secondaryUsageRecordsCount={secondaryUsageRecords.length}
        contextUsageTitle={cost.contextUsageTitle}
        contextUsageTone={cost.contextUsageTone}
        contextUsageDisplay={cost.contextUsageDisplay}
      />

      <DeleteMessageDialog
        open={!!deleteMsgTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteMsgTarget(null);
        }}
        onDelete={handleDeleteMessage}
      />

      <ThinkingDialog
        open={!!thinkingMsg}
        onOpenChange={(v) => {
          if (!v) setThinkingMsg(null);
        }}
        reasoningContent={thinkingMsg?.reasoningContent}
      />
    </div>
  );
}
