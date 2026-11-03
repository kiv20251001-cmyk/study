import cloud from 'wx-server-sdk'
import { tickReminders } from '../../shared/remind'

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

export async function main(event: { Type?: string; TriggerName?: string }) {
  if (event?.Type !== 'timer' && !event?.TriggerName) {
    return { ok: false, message: 'remind 只由定时触发器调用' }
  }
  try {
    return { ok: true, ...(await tickReminders()) }
  } catch (error) {
    const message = error instanceof Error ? error.message : '提醒扫描失败'
    console.error('[remind]', message)
    return { ok: false, message }
  }
}
