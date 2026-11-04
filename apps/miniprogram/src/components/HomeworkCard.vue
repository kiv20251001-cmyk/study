<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { Homework } from '@server-domain/types'
import { HOMEWORK_COLOR, HOMEWORK_DONE_COLOR } from '@/domain/homework'
import { useThemeStore } from '@/utils/wx-theme'
import { cardBackground, mix, tileBackground } from '@/utils/color'
import AppIcon from '@/components/AppIcon.vue'

const ACTION_WIDTH = 144

const props = withDefaults(defineProps<{
  homework: Homework
  /** 日期已过且没完成。 */
  missed?: boolean
  readonly?: boolean
  /** 同一时间只让一张卡片保持左滑展开。 */
  opened?: boolean
}>(), {
  missed: false,
  readonly: false,
  opened: false,
})

const emit = defineEmits<{
  open: []
  close: []
  edit: []
  toggle: []
}>()

const { isDark } = storeToRefs(useThemeStore())
const expanded = ref(false)
const dragging = ref(false)
const dragOffset = ref(0)
let startX = 0
let startY = 0
let base = 0
let direction: '' | 'x' | 'y' = ''

const offset = computed(() => (dragging.value ? dragOffset.value : props.opened ? -ACTION_WIDTH : 0))
const long = computed(() => props.homework.content.length > 60 || props.homework.content.split('\n').length > 3)

const look = computed(() => {
  const tint = props.homework.done ? HOMEWORK_DONE_COLOR : HOMEWORK_COLOR
  const dark = isDark.value
  return {
    card: {
      background: cardBackground(tint),
      boxShadow: dark
        ? `0 2px 6px rgba(0,0,0,.28), 0 18px 34px -18px rgba(0,0,0,.6), inset 0 1px 0 ${mix(tint, '#1c2230', 0.78)}`
        : `0 2px 5px rgba(25,31,58,.04), 0 18px 34px -16px ${mix(tint, '#191f3a', 0.58)}, inset 0 1px 0 rgba(255,255,255,.9)`,
      transform: `translateX(${offset.value}px)`,
      transition: dragging.value ? 'none' : 'transform .32s cubic-bezier(.32,.72,0,1)',
    },
    tile: {
      background: tileBackground(tint),
      boxShadow: dark
        ? '0 10px 20px -12px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.14)'
        : `0 10px 20px -10px ${mix(tint, '#191f3a', 0.3)}, inset 0 1px 0 rgba(255,255,255,.4)`,
    },
  }
})

const status = computed(() => {
  if (props.homework.done) return { text: '已完成', cls: 'done' }
  if (props.missed) return { text: '未完成', cls: 'missed' }
  return { text: '待完成', cls: 'pending' }
})

function touchStart(event: TouchEvent) {
  if (props.readonly) return
  const point = event.touches[0]
  startX = point.clientX
  startY = point.clientY
  base = props.opened ? -ACTION_WIDTH : 0
  direction = ''
}

function touchMove(event: TouchEvent) {
  if (props.readonly) return
  const point = event.touches[0]
  const dx = point.clientX - startX
  const dy = point.clientY - startY
  if (!direction) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    direction = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
  }
  if (direction !== 'x') return
  dragging.value = true
  dragOffset.value = Math.min(0, Math.max(-ACTION_WIDTH - 16, base + dx))
}

function touchEnd() {
  if (!dragging.value) return
  const open = dragOffset.value < -ACTION_WIDTH / 2
  dragging.value = false
  direction = ''
  if (open) emit('open')
  else emit('close')
}

function tapCard() {
  if (props.opened) {
    emit('close')
    return
  }
  if (long.value) expanded.value = !expanded.value
}
</script>

<template>
  <view class="hw" :class="{ readonly }">
    <view v-if="!readonly" class="hw-actions">
      <button hover-class="press-on" hover-stay-time="80" class="hw-action edit" @click="emit('edit')">
        <AppIcon name="edit" tone="white" :size="16" />
        <text>编辑</text>
      </button>
      <button hover-class="press-on" hover-stay-time="80" class="hw-action toggle" :class="{ undo: homework.done }" @click="emit('toggle')">
        <AppIcon :name="homework.done ? 'undo' : 'check'" tone="white" :size="16" />
        <text>{{ homework.done ? '未完成' : '完成' }}</text>
      </button>
    </view>
    <view
      class="hw-card"
      :class="{ done: homework.done }"
      :style="look.card"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
      @touchcancel="touchEnd"
      @click="tapCard"
    >
      <view class="hw-tile" :style="look.tile">
        <AppIcon name="homework" tone="white" :size="24" />
        <view v-if="homework.done" class="hw-tile-check">
          <AppIcon name="check" tone="white" :size="10" />
        </view>
      </view>
      <view class="hw-copy">
        <view class="hw-top">
          <text class="hw-subject">{{ homework.subject }}</text>
          <text class="hw-status" :class="status.cls">{{ status.text }}</text>
        </view>
        <text class="hw-content" :class="{ clamp: !expanded }">{{ homework.content }}</text>
        <text v-if="long" class="hw-more">{{ expanded ? '收起' : '展开全部' }}</text>
        <view v-if="homework.note" class="hw-note">
          <text class="hw-note-label">备注</text>
          <text class="hw-note-text">{{ homework.note }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.hw {
  position: relative;
  margin-bottom: 12px;
  overflow: hidden;
  border-radius: 22px;
}
.hw-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  width: 144px;
  gap: 8px;
  padding: 0 0 0 16px;
  box-sizing: border-box;
  align-items: stretch;
}
.hw-action {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 0;
  padding: 0;
  border-radius: 18px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
.hw-action::after { border: 0; }
.hw-action.edit { background: #8a93a8; }
.hw-action.toggle { background: #2fb57c; }
.hw-action.toggle.undo { background: #f0a43a; }
.hw-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 22px;
}
.hw-tile {
  position: relative;
  display: flex;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}
.hw-tile-check {
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--paper);
  border-radius: 50%;
  background: #2fb57c;
}
.hw-copy { min-width: 0; flex: 1; }
.hw-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.hw-subject {
  min-width: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hw-status { flex: 0 0 auto; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 750; }
.hw-status.pending { color: #6c63ff; background: rgba(108, 99, 255, 0.12); }
.hw-status.done { color: var(--paid); background: var(--paid-soft); }
.hw-status.missed { color: var(--unpaid); background: var(--unpaid-soft); }
.hw-content {
  display: block;
  margin-top: 7px;
  color: var(--ink);
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;
}
.hw-content.clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.hw-card.done .hw-content { color: var(--muted); }
.hw-more { display: block; margin-top: 4px; color: #6c63ff; font-size: 11px; font-weight: 700; }
.hw-note { display: flex; gap: 6px; margin-top: 9px; padding-top: 8px; border-top: 1px solid var(--line); font-size: 11px; }
.hw-note-label { flex: 0 0 auto; color: var(--faint); font-weight: 700; }
.hw-note-text { min-width: 0; color: var(--muted); line-height: 1.4; }
</style>
