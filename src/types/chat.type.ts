import OpenAI from 'openai';
import dayjs from 'dayjs';
import { ChatCompletionMessageParam } from 'openai/resources';
import { LiteLLMModel } from '../config/config';

export type Chat = {
  id: string;
  litellm: OpenAI;
  model: LiteLLMModel;
  chat: ChatCompletionMessageParam[];
  isGroup: boolean;
  memory: boolean;
  timestamp: dayjs.Dayjs;
};
