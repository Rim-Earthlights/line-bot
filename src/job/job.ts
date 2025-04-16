import dayjs from 'dayjs';
import * as cron from 'node-cron';
import { ChatService } from '../services/chat.service.js';

export async function initJob() {
  /**
   * 1分毎に実行されるタスク
   */
  cron.schedule('* * * * *', async () => {
    ChatService.CHAT_LIST.map(async (c) => {
      if (c.timestamp.isBefore(dayjs().subtract(30, 'minute')) && !c.memory) {
        ChatService.CHAT_LIST = ChatService.CHAT_LIST.filter((g) => g.id !== c.id);
      }
    });
  });
}
