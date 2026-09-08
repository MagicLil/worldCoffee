<!-- ============================================================
     WorldCoffee 极简 Logo（线条版，更现代）
============================================================ -->
<template>
  <div
    class="inline-flex flex-col items-center justify-center select-none"
    :style="{ width: size + 'px' }"
  >
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      class="block"
      :style="{ width: size + 'px', height: size + 'px' }"
    >
      <defs>
        <linearGradient id="wc-mini-cup" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6D4C41" />
          <stop offset="100%" stop-color="#3E2723" />
        </linearGradient>
      </defs>

      <!-- === 极简圆形背景 === -->
      <circle
        v-if="withCircle"
        cx="50" cy="50" r="44"
        fill="#FAF7F5"
        stroke="#3E2723"
        stroke-width="1.2"
        opacity="0.95"
      />

      <!-- === 杯体（单线风格） === -->
      <path
        d="M28 36 L72 36 L68 74 Q66 80 50 80 Q34 80 32 74 Z"
        fill="url(#wc-mini-cup)"
        stroke="#2C1810"
        stroke-width="2"
        stroke-linejoin="round"
      />

      <!-- 杯口线 -->
      <path
        d="M28 36 Q50 41 72 36"
        fill="none"
        stroke="#2C1810"
        stroke-width="1.2"
        stroke-linecap="round"
      />

      <!-- 咖啡液面 -->
      <ellipse cx="50" cy="38.5" rx="22" ry="3" fill="#4E342E" />

      <!-- === 把手（线条感） === -->
      <path
        d="M72 42 Q85 44 85 58 Q85 72 72 72"
        fill="none"
        stroke="#2C1810"
        stroke-width="2.5"
        stroke-linecap="round"
      />

      <!-- === 热气（三条优雅弧线） === -->
      <path
        d="M42 30 Q38 24 42 18 Q46 12 42 6"
        fill="none"
        stroke="#8D6E63"
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.9"
      />
      <path
        d="M50 30 Q46 24 50 18 Q54 12 50 6"
        fill="none"
        stroke="#6D4C41"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path
        d="M58 30 Q54 24 58 18 Q62 12 58 6"
        fill="none"
        stroke="#8D6E63"
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.9"
      />

      <!-- === 底部阴影 === -->
      <ellipse cx="50" cy="82" rx="20" ry="2.5" fill="#2C1810" opacity="0.15" />
    </svg>

    <div v-if="variant === 'full'" class="mt-3 text-center leading-tight">
      <div class="font-bold" :style="textStyle">WORLD</div>
      <div class="font-medium" :style="{ ...textStyle, letterSpacing: '0.32em', color: '#3E2723', opacity: 0.9 }">COFFEE</div>
    </div>

    <div v-if="variant === 'mark'" class="mt-2 text-center">
      <div class="font-bold tracking-[0.2em]" :style="{ color: '#2C1810', fontSize: Math.max(size * 0.1, 11) + 'px' }">WORLDCOFFEE</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  size: { type: Number, default: 120 },
  // icon: 纯图标; full: 图标 + 双行文字; mark: 图标 + 一行小字
  variant: { type: String, default: 'icon' },
  // 是否加圆形描边背景
  withCircle: { type: Boolean, default: true }
})

const textStyle = computed(() => ({
  color: '#2C1810',
  fontSize: Math.max(props.size * 0.16, 14) + 'px',
  letterSpacing: '0.18em'
}))
</script>
