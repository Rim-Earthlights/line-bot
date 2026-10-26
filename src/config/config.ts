export enum LiteLLMModel {
  GPT_5_CHAT_LATEST = 'gpt-5-chat-latest',
  GPT_5_6_SOL = 'gpt-5.6-sol',
  GPT_5_6_TERRA = 'gpt-5.6-terra',
  GPT_5_6_LUNA = 'gpt-5.6-luna',
  ANTHROPIC_CLAUDE_FABLE_5_1 = 'claude-fable-5-1',
  ANTHROPIC_CLAUDE_OPUS_5_5 = 'claude-opus-5-5',
  ANTHROPIC_CLAUDE_SONNET_5_5 = 'claude-sonnet-5-5',
  ANTHROPIC_CLAUDE_HAIKU_5_5 = 'claude-haiku-5-5',
  XAI_GROK_4_7 = 'xai/grok-4.7',
  FUGU = 'fugu',
  FUGU_ULTRA = 'fugu-ultra',
  GEMMA_4_26B_A4B = 'Gemma4-26B-A4B-QAT-Uncensored-HauhauCS-Balanced-Q4_K_M',
  LFM_2_5_24B_A2B = 'LFM2.5-24B-A2B',
}

export const CONFIG = {
  LITELLM: {
    BASE_URL: process.env.LITELLM_BASE_URL,
    ORG: process.env.LITELLM_ORG,
    PROJECT: process.env.LITELLM_PROJECT,
    KEY: process.env.LITELLM_KEY,
    // default model
    DEFAULT_MODEL: LiteLLMModel.ANTHROPIC_CLAUDE_HAIKU_5_5,
  },
  VALKEY: {
    URL: process.env.VALKEY_URL,
  },
  LINE: {
    CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  },
} as const;
