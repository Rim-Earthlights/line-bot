import * as line from '@line/bot-sdk';

export type Clients = {
  apiClient: line.messagingApi.MessagingApiClient;
  blobClient: line.messagingApi.MessagingApiBlobClient;
};
