import * as line from '@line/bot-sdk';
import { Chat } from '../types/chat.type';
import OpenAI from 'openai';
import dayjs from 'dayjs';
import { SYSTEM_PROMPT } from '../const/chat.const';
import {
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources';
import { PictureService } from './picture.service';
import { CONFIG } from '../config/config';

export class ChatService {
  static CHAT_LIST = [] as Chat[];
  private client: line.messagingApi.MessagingApiClient;

  constructor(client: line.messagingApi.MessagingApiClient) {
    this.client = client;
  }

  /**
   * チャットを初期化する
   * @param id チャットID
   * @returns チャット
   */
  private initialize(id: string): Chat {
    const chat = ChatService.CHAT_LIST.find((c) => c.id === id);
    if (chat) return chat;

    const newChat = {
      id,
      litellm: new OpenAI({
        baseURL: CONFIG.LITELLM.BASE_URL,
        apiKey: CONFIG.LITELLM.KEY,
      }),
      model: CONFIG.LITELLM.DEFAULT_MODEL,
      chat: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        } as ChatCompletionSystemMessageParam,
      ],
      isGroup: false,
      memory: false,
      timestamp: dayjs(),
    };

    ChatService.CHAT_LIST.push(newChat);
    return newChat;
  }

  /**
   * メッセージを送信する
   * @param userId ユーザーID
   * @param replyToken リプライトークン
   * @param message メッセージ
   */
  async sendMessage(user: line.Profile, replyToken: string, message: string) {
    const chatList = this.initialize(user.userId);

    const userName = user.displayName;
    const language = user.language;

    const systemContent = {
      user: { name: userName, language: language },
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };

    const sendContent = `${JSON.stringify(systemContent)}\n${message}`;

    chatList.chat.push({ role: 'user', content: sendContent });

    const response = await chatList.litellm.chat.completions.create({
      model: chatList.model,
      messages: chatList.chat,
    });

    chatList.chat.push({
      role: 'assistant',
      content: response.choices[0].message.content,
    });
    chatList.timestamp = dayjs();

    this.client.replyMessage({
      replyToken: replyToken,
      messages: [{ type: 'text', text: response.choices[0].message.content ?? '' }],
    });
  }

  /**
   * 画像からメッセージの返答を行う
   * @param userId ユーザーID
   * @param replyToken リプライトークン
   * @param base64Message メッセージ
   */
  async sendBase64Message(user: line.Profile, replyToken: string, base64Message: Buffer, contentType: string) {
    const chatList = this.initialize(user.userId);

    const userName = user.displayName;
    const language = user.language;

    let sendBase64Image: string;

    if (base64Message.length > 1 * 1024 * 1024) {
      const pictureService = new PictureService();
      const compressedImage = await pictureService.compressImage(base64Message, contentType, 1);
      sendBase64Image = compressedImage;
    } else {
      sendBase64Image = base64Message.toString('base64');
    }

    const systemContent = {
      user: { name: userName, language: language },
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };

    const sendText: ChatCompletionContentPartText = {
      type: 'text',
      text: `${JSON.stringify(systemContent)}`,
    };

    const sendImage: ChatCompletionContentPartImage = {
      type: 'image_url',
      image_url: { url: `data:${contentType};base64,${sendBase64Image}` },
    };

    const sendContent: ChatCompletionUserMessageParam = {
      role: 'user',
      content: [sendText, sendImage],
    };

    chatList.chat.push(sendContent);

    const response = await chatList.litellm.chat.completions.create({
      model: chatList.model,
      messages: chatList.chat,
    });

    chatList.chat.push({
      role: 'assistant',
      content: response.choices[0].message.content,
    });
    chatList.timestamp = dayjs();

    this.client.replyMessage({
      replyToken: replyToken,
      messages: [{ type: 'text', text: response.choices[0].message.content ?? '' }],
    });
  }
}
