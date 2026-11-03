/** 微信「我的模板」的模板 ID。留空时由云函数读取小程序后台已经选用的模板。 */
export const REMIND_TEMPLATE_ID = ''

/** 与后台字段顺序一致：计划名称、开始时间、地点、备注。后台若不是 thing1–4，留空模板 ID，让云函数按字段名识别。 */
export const REMIND_TEMPLATE_FIELDS = {
  title: 'thing1',
  time: 'thing2',
  location: 'thing3',
  note: 'thing4',
} as const

export interface RemindFields {
  title: string
  time: string
  location: string
  note: string
}

export interface RemindTemplate {
  id: string
  fields: RemindFields
}

const FIELD_LABELS: Record<keyof RemindFields, string[]> = {
  title: ['计划名称', '课程名称', '课程名'],
  time: ['开始时间', '上课时间'],
  location: ['地点', '上课地点'],
  note: ['备注', '温馨提示'],
}

/** 订阅消息 thing 最多约 20 个字，不能为空，也不能带换行。 */
export function clipThing(value: string, fallback: string) {
  const text = Array.from(value.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim())
  const clipped = text.slice(0, 20).join('').trim()
  return clipped || fallback
}

export function remindTimeText(date: string, startTime: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)}月${Number(day)}日 ${startTime}`
}

/** 从模板 content「计划名称:{{thing1.DATA}}」里认出四个字段的键名。 */
export function parseTemplateContent(content: string): RemindFields | null {
  const matches = [...content.matchAll(/([^:\n{：]+)[:：]\{\{(\w+)\.(?:DATA|data)\}\}/g)]
  if (!matches.length) return null
  const fields: Partial<RemindFields> = {}
  for (const [, rawLabel, key] of matches) {
    const label = rawLabel.trim()
    for (const slot of Object.keys(FIELD_LABELS) as (keyof RemindFields)[]) {
      if (FIELD_LABELS[slot].some((item) => label.includes(item))) fields[slot] = key
    }
  }
  if (fields.title && fields.time && fields.location && fields.note) return fields as RemindFields
  if (matches.length >= 4) {
    return {
      title: matches[0][2],
      time: matches[1][2],
      location: matches[2][2],
      note: matches[3][2],
    }
  }
  return null
}
