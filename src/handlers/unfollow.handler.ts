import * as line from '@line/bot-sdk';
import { EventHandler } from './manager/event.manager';
import { Clients } from '../types/client.type';

export class UnfollowHandler implements EventHandler {
  async command(event: line.UnfollowEvent, clients: Clients): Promise<void> {
    console.log('UnfollowHandler');
  }
}
