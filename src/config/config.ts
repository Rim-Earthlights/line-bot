export enum LiteLLMModel {
  GPT_4_1 = 'openai-gpt-41',
  GPT_4_1_MINI = 'openai-gpt-41-mini',
  GPT_4_1_NANO = 'openai-gpt-41-nano',
  GPT_4O = 'openai-gpt-4o',
  GPT_4O_MINI = 'openai-gpt-4o-mini',
  GPT_45_PREVIEW = 'openai-gpt-45-preview',
  GPT_O1 = 'openai-gpt-o1',
  GPT_O3_MINI = 'openai-gpt-o3-mini',
  ANTHROPIC_CLAUDE_3_5_SONNET = 'anthropic-sonnet-35',
  ANTHROPIC_CLAUDE_3_5_HAIKU = 'anthropic-haiku-35',
  ANTHROPIC_CLAUDE_3_7_SONNET = 'anthropic-sonnet-37',
  ANTHROPIC_CLAUDE_3_7_SONNET_REASON = 'anthropic-sonnet-37-reasoning',
}

export const CONFIG = {
  LITELLM: {
    BASE_URL: process.env.LITELLM_BASE_URL,
    ORG: process.env.LITELLM_ORG,
    PROJECT: process.env.LITELLM_PROJECT,
    KEY: process.env.LITELLM_KEY,
    // default model
    DEFAULT_MODEL: LiteLLMModel.GPT_4_1_NANO,
  },
  LINE: {
    CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  },
} as const;
