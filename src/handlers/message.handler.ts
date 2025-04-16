import * as line from '@line/bot-sdk';
import { EventHandler } from './manager/event.manager';
import { ChatService } from '../services/chat.service';
import { Clients } from '../types/client.type';
import { fileTypeFromBuffer } from 'file-type';

export class MessageHandler implements EventHandler {
  async command(event: line.MessageEvent, clients: Clients): Promise<void> {
    console.log('MessageHandler');
    const chatService = new ChatService(clients.apiClient);

    switch (event.message.type) {
      case 'text': {
        const userId = event.source.userId;

        if (!userId) {
          clients.apiClient.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: 'ユーザーIDが取得できませんでした。' }],
          });
          return;
        }
        const profile = await clients.apiClient.getProfile(userId);
        await chatService.sendMessage(profile, event.replyToken, event.message.text);
        break;
      }
      case 'image': {
        const userId = event.source.userId;

        if (!userId) {
          clients.apiClient.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: 'ユーザーIDが取得できませんでした。' }],
          });
          return;
        }

        const profile = await clients.apiClient.getProfile(userId);

        const messageContentStream = await clients.blobClient.getMessageContent(event.message.id);
        const chunks = [];
        for await (const chunk of messageContentStream) {
          chunks.push(chunk);
        }

        const messageContentBuffer = Buffer.concat(chunks);

        const fileType = await fileTypeFromBuffer(messageContentBuffer);
        console.log(fileType);

        await chatService.sendBase64Message(profile, event.replyToken, messageContentBuffer, fileType?.mime ?? '');
        break;
      }
      default: {
        clients.apiClient.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: event.message.type }],
        });
        break;
      }
    }
  }
}
