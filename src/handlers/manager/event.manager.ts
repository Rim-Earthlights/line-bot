import * as line from '@line/bot-sdk';
import { FollowHandler } from '../follow.handler';
import { UnfollowHandler } from '../unfollow.handler';
import { MessageHandler } from '../message.handler';
import { Clients } from '../../types/client.type';

export interface EventHandler {
  command(event: line.WebhookEvent, clients: Clients): Promise<void>;
}

export class EventManager {
  private clients: Clients;
  private handlers: Map<string, EventHandler> = new Map();

  constructor({ apiClient, blobClient }: Clients) {
    this.clients = { apiClient, blobClient };

    this.handlers.set('follow', new FollowHandler());
    this.handlers.set('unfollow', new UnfollowHandler());
    this.handlers.set('message', new MessageHandler());
  }

  async handleCommand(event: line.WebhookEvent): Promise<void | null> {
    const handlers = this.handlers.get(event.type);
    if (!handlers) return Promise.resolve(null);

    await handlers.command(event, this.clients);
  }
}
