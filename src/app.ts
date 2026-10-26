import * as line from '@line/bot-sdk';
import express from 'express';
import 'dotenv/config';
import { EventManager } from './handlers/manager/event.manager';
import { initJob } from './job/job';
import { CONFIG } from './config/config';
import { DedupService } from './services/dedup.service';

const channelSecret = CONFIG.LINE.CHANNEL_SECRET;
const channelAccessToken = CONFIG.LINE.CHANNEL_ACCESS_TOKEN;

if (!channelSecret || !channelAccessToken) {
  throw new Error('LINE_CHANNEL_SECRET or LINE_CHANNEL_ACCESS_TOKEN is not set');
}

const apiClient = new line.messagingApi.MessagingApiClient({
  channelAccessToken: channelAccessToken,
});

const blobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: channelAccessToken,
});

const middleware = line.middleware({
  channelSecret: channelSecret,
  channelAccessToken: channelAccessToken,
});

const eventHandlerManager = new EventManager({ apiClient, blobClient });

const app = express();

await initJob();

app.post('/webhook', middleware, (req, res) => {
  console.log(req.body.events[0]?.replyToken);
  // 返答生成を待つとLINE側でタイムアウトして再送されるため、先に応答する
  res.status(200).end();

  for (const event of req.body.events as line.WebhookEvent[]) {
    handleEvent(event).catch((err) => console.error(err));
  }
});

// event handler
async function handleEvent(event: line.WebhookEvent) {
  if (!(await DedupService.isFirstDelivery(event.webhookEventId))) {
    console.log(`duplicate event skipped: ${event.webhookEventId}`);
    return;
  }
  return eventHandlerManager.handleCommand(event);
}

app.listen(5000, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Server is running on port 5000');
});
