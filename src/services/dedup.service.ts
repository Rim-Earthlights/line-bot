import { Valkey } from 'iovalkey';
import { CONFIG } from '../config/config';

/**
 * Webhookイベントの重複を検知する
 * LINEの再送で同じイベントが届いたときに二重に返答しないようにする
 */
export class DedupService {
  private static client: Valkey | null = null;
  // 処理済みイベントIDを保持する秒数
  private static readonly TTL_SECONDS = 60 * 60;

  private static getClient(): Valkey | null {
    if (!CONFIG.VALKEY.URL) return null;
    if (!DedupService.client) {
      DedupService.client = new Valkey(CONFIG.VALKEY.URL, {
        // 接続できないときに返答が長く止まらないよう、早めに失敗させる
        connectTimeout: 1000,
        maxRetriesPerRequest: 1,
      });
      DedupService.client.on('error', (err) => console.error('Valkey error:', err.message));
    }
    return DedupService.client;
  }

  /**
   * 初めて届いたイベントかどうか
   * Valkeyが使えない場合は返答を止めないよう true を返す
   * @param webhookEventId WebhookイベントID
   */
  static async isFirstDelivery(webhookEventId: string): Promise<boolean> {
    const client = DedupService.getClient();
    if (!client) return true;

    try {
      const result = await client.set(`line-bot:event:${webhookEventId}`, '1', 'EX', DedupService.TTL_SECONDS, 'NX');
      return result === 'OK';
    } catch (err) {
      console.error(err);
      return true;
    }
  }
}
