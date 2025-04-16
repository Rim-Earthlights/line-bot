import * as line from '@line/bot-sdk';
import express from 'express';
import 'dotenv/config';
import { EventManager } from './handlers/manager/event.manager';
import { initJob } from './job/job';
import { CONFIG } from './config/config';

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
  console.log(req.body.events[0].replyToken);
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event: line.WebhookEvent) {
  return eventHandlerManager.handleCommand(event);
}

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
