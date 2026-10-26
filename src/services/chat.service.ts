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

/**
 * 返答待ちのメッセージ
 */
type PendingMessage = {
  user: line.Profile;
  replyToken: string;
  text?: string;
  image?: ChatCompletionContentPartImage;
};

export class ChatService {
  static CHAT_LIST = [] as Chat[];
  /**
   * 返答生成中のユーザーごとの未処理メッセージ
   * 生成中に届いたメッセージはここに溜め、生成完了後にまとめて1回で返答する
   */
  static QUEUES = new Map<string, PendingMessage[]>();
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
   * @param user ユーザー
   * @param replyToken リプライトークン
   * @param message メッセージ
   */
  async sendMessage(user: line.Profile, replyToken: string, message: string) {
    await this.enqueue({ user, replyToken, text: message });
  }

  /**
   * 画像からメッセージの返答を行う
   * @param user ユーザー
   * @param replyToken リプライトークン
   * @param base64Message 画像バッファ
   * @param contentType 画像のContent-Type
   */
  async sendBase64Message(user: line.Profile, replyToken: string, base64Message: Buffer, contentType: string) {
    let imageUrl: string;

    if (base64Message.length > 1 * 1024 * 1024) {
      const pictureService = new PictureService();
      // compressImage は data URL 形式で返す
      imageUrl = await pictureService.compressImage(base64Message, contentType, 1);
    } else {
      imageUrl = `data:${contentType};base64,${base64Message.toString('base64')}`;
    }

    const image: ChatCompletionContentPartImage = {
      type: 'image_url',
      image_url: { url: imageUrl },
    };

    await this.enqueue({ user, replyToken, image });
  }

  /**
   * メッセージをキューに積み、生成中でなければ返答処理を開始する
   * 生成中に届いたメッセージは、生成完了後にまとめて1回で返答する
   * @param message メッセージ
   */
  private async enqueue(message: PendingMessage) {
    const id = message.user.userId;
    const queue = ChatService.QUEUES.get(id);

    if (queue) {
      // 生成中なので溜めておく
      queue.push(message);
      return;
    }

    const pending = [message];
    ChatService.QUEUES.set(id, pending);

    try {
      while (pending.length > 0) {
        const batch = pending.splice(0);
        await this.reply(batch);
      }
    } finally {
      ChatService.QUEUES.delete(id);
    }
  }

  /**
   * 溜まったメッセージを1つにまとめて返答する
   * @param batch メッセージ
   */
  private async reply(batch: PendingMessage[]) {
    const last = batch[batch.length - 1];
    const chatList = this.initialize(last.user.userId);

    const systemContent = {
      user: { name: last.user.displayName, language: last.user.language },
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };

    const texts = batch.flatMap((m) => (m.text !== undefined ? [m.text] : []));
    const images = batch.flatMap((m) => (m.image ? [m.image] : []));
    const sendText = [JSON.stringify(systemContent), ...texts].join('\n');

    const sendContent: ChatCompletionUserMessageParam =
      images.length === 0
        ? { role: 'user', content: sendText }
        : {
            role: 'user',
            content: [{ type: 'text', text: sendText } as ChatCompletionContentPartText, ...images],
          };

    chatList.chat.push(sendContent);

    let replyText: string;
    try {
      const response = await chatList.litellm.chat.completions.create({
        model: chatList.model,
        messages: chatList.chat,
      });

      replyText = response.choices[0].message.content ?? '';
      chatList.chat.push({ role: 'assistant', content: replyText });
      chatList.timestamp = dayjs();
    } catch (err) {
      console.error(err);
      // 返答できなかった発言は履歴から外す
      chatList.chat.splice(chatList.chat.indexOf(sendContent), 1);
      replyText = 'エラーが発生しました。もう一度送ってください。';
    }

    await this.send(last.user.userId, last.replyToken, replyText);
  }

  /**
   * 返答を送信する
   * リプライトークンが期限切れなどで使えない場合はプッシュメッセージで送る
   * @param userId ユーザーID
   * @param replyToken リプライトークン
   * @param text 送信するテキスト
   */
  private async send(userId: string, replyToken: string, text: string) {
    const messages: line.messagingApi.Message[] = [{ type: 'text', text }];

    try {
      await this.client.replyMessage({ replyToken, messages });
    } catch (err) {
      console.error(err);
      await this.client.pushMessage({ to: userId, messages }).catch((e) => console.error(e));
    }
  }
}
