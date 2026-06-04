export type AgenticActionOption = {
  id: string;
  label: string;
  action: string;
  probability?: number;
  description?: string;
};

function stripMarkdownFormatting(value: string) {
  return value
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/[`*_]+/g, "")
    .trim();
}

function parseProbability(value: string): number | undefined {
  const match = value.match(/(?:成功率|成功概率|概率)\s*[：: ]\s*(\d{1,3})\s*%?/);
  if (!match) return undefined;
  return Math.min(100, Math.max(0, Number.parseInt(match[1], 10)));
}

function cleanActionText(value: string) {
  return value
    .replace(/[（(]?\s*(?:成功率|成功概率|概率)\s*[：: ]\s*\d{1,3}\s*%?\s*[）)]?/g, "")
    .replace(/^[）)]?\s*[-—–:：]+\s*/, "")
    .replace(/^[（(]\s*/, "")
    .replace(/\s*[）)]$/g, "")
    .replace(/\s+[-—–]\s*$/, "")
    .replace(/[。.!！；;]+$/g, "")
    .trim();
}

function parseAgenticOptionLine(line: string, index: number): AgenticActionOption | null {
  const trimmed = stripMarkdownFormatting(line);
  const match = trimmed.match(/^(?:选项\s*)?(?:\d+|[A-Ea-e])[.、):：]\s*(.+)$/);
  const successFirstMatch = trimmed.match(
    /^[（(]?\s*(?:成功率|成功概率|概率)\s*[：: ]\s*\d{1,3}\s*%?\s*(?:[）)]\s*)?(?:[-—–]+\s*)?(.*)$/u,
  );
  if (!match && !successFirstMatch) return null;

  const body = (match?.[1] ?? trimmed).trim();
  if (!body || /自定义行动|自由行动|自己输入|玩家也可以/.test(body)) return null;

  const probability = parseProbability(body);
  const successFirstAction = successFirstMatch?.[1] ? cleanActionText(successFirstMatch[1]) : "";
  const action = successFirstAction || cleanActionText(body);
  if (!action) return null;

  return {
    id: `agentic-option-${index}-${action.slice(0, 24)}`,
    label: action,
    action,
    probability,
  };
}

export function extractAgenticOptions(content: string): { content: string; options: AgenticActionOption[] } {
  const lines = content.split(/\r?\n/);
  const options: AgenticActionOption[] = [];
  const removeLineIndexes = new Set<number>();
  let inChoiceSection = false;
  let choiceHeaderIndex: number | null = null;

  lines.forEach((line, index) => {
    const normalized = stripMarkdownFormatting(line).replace(/^#+\s*/, "");
    if (/^(你可以选择|可选行动|行动选项|选择|下一步|玩家选项)/.test(normalized)) {
      inChoiceSection = true;
      choiceHeaderIndex = index;
      removeLineIndexes.add(index);
      return;
    }

    if (inChoiceSection && /^#{1,6}\s+/.test(line.trim())) {
      inChoiceSection = false;
    }

    const parsed = parseAgenticOptionLine(line, options.length);
    if (parsed && (inChoiceSection || /成功率|成功概率/.test(line))) {
      options.push(parsed);
      removeLineIndexes.add(index);
      return;
    }

    if (inChoiceSection && /自定义行动|自由行动|自己输入|玩家也可以/.test(line)) {
      removeLineIndexes.add(index);
    }
  });

  removeLineIndexes.forEach((index) => {
    const previousIndex = index - 1;
    if (/^\s*[-*_]{3,}\s*$/.test(lines[previousIndex] ?? "")) {
      removeLineIndexes.add(previousIndex);
    }
  });

  if (options.length < 2) {
    removeLineIndexes.clear();
    options.length = 0;
  }

  if (options.length === 0) return { content, options };

  const nextContent = lines
    .filter((_, index) => !removeLineIndexes.has(index))
    .join("\n")
    .replace(/(?:^|\n)\s*[-*_]{3,}\s*$/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    content: nextContent,
    options: options.slice(0, 5),
  };
}
