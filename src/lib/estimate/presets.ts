export type MessagePreset = {
  id: string;
  label: string;
  description: string;
  avgInputTokensPerMessage: number;
  avgOutputTokensPerMessage: number;
};

export const messagePresets: MessagePreset[] = [
  {
    id: "chat-support",
    label: "Chat support",
    description: "Short back-and-forth, modest context, concise answers.",
    avgInputTokensPerMessage: 220,
    avgOutputTokensPerMessage: 140
  },
  {
    id: "rag-qa",
    label: "RAG Q&A",
    description: "User question + retrieved passages + grounded answer.",
    avgInputTokensPerMessage: 900,
    avgOutputTokensPerMessage: 240
  },
  {
    id: "agentic-tools",
    label: "Agentic tool use",
    description: "Longer context + tool calls + structured outputs.",
    avgInputTokensPerMessage: 1800,
    avgOutputTokensPerMessage: 700
  },
  {
    id: "code-review",
    label: "Code review",
    description: "Patch-sized inputs + detailed suggestions and diffs.",
    avgInputTokensPerMessage: 2400,
    avgOutputTokensPerMessage: 900
  }
];

