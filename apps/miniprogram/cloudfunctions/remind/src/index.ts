import cloud from 'wx-server-sdk'
import { tickReminders } from '../../shared/remind'

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

export async function main(event: { Type?: string; TriggerName?: string }) {
  console.log('[remind] invoke', event?.Type || 'manual', event?.TriggerName || '')
  try {
    return { ok: true, ...(await tickReminders()) }
  } catch (error) {
    const message = error instanceof Error ? error.message : '提醒扫描失败'
    console.error('[remind]', message)
    return { ok: false, message }
  }
}
