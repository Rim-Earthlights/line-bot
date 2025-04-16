import * as line from '@line/bot-sdk';
import { EventHandler } from './manager/event.manager';
import { Clients } from '../types/client.type';

export class FollowHandler implements EventHandler {
  async command(event: line.FollowEvent, clients: Clients): Promise<void> {
    console.log('FollowHandler');
  }
}
